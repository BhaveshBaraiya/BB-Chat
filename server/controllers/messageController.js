import MessageModel from "../models/MessageModel.js";
import mongoose from "mongoose";
import { getIO, userSocketMap } from "../socket/socket.js";
import UserModel from "../models/UserModel.js";
import CommunityModel from "../models/CommunityModel.js";

export const getMessages = async (req, res) => {
    try {
        const { id: targetId } = req.params;
        const myId = req.user._id;        
        const community = await CommunityModel.findById(targetId);    
                
        const limit = parseInt(req.query.limit) || 50; 
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        let messages;
        if (community) {
            messages = await MessageModel.find({ communityId: targetId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("replyTo")
                .populate("senderId", "fullName profilePic")
                .lean();
        } else {
            messages = await MessageModel.find({
                $or: [
                    { senderId: myId, receiverId: targetId },
                    { senderId: targetId, receiverId: myId }
                ],
                deletedFor: { $ne: myId }
            })
            .sort({ createdAt: -1 })
            .skip(skip) // <-- ADD THIS
            .limit(limit)
            .populate("replyTo")
            .populate("senderId", "fullName profilePic")
            .lean();
        }

        res.status(200).json({ success: true, messages: messages.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, replyTo } = req.body;
        const { id: receiverOrCommunityId } = req.params;
        const senderId = req.user._id;

        const community = await CommunityModel.findById(receiverOrCommunityId);

        // =========================
        // FILE PROCESSING
        // =========================
        const images = [];
        const documents = [];
        let audio = "";

        if (req.files?.files) {
            req.files.files.forEach(file => {
                if (file.mimetype.startsWith("image")) {
                    images.push(file.path);
                } else if (
                    file.mimetype.startsWith("audio") ||
                    file.originalname === "voice.webm" ||
                    file.mimetype === "video/webm"
                ) {
                    audio = file.path;
                } else {
                    documents.push({
                        fileUrl: file.path,
                        fileName: file.originalname,
                        fileSize: `${(file.size / 1024).toFixed(1)} KB`
                    });
                }
            });
        }

        // =========================
        // COMMUNITY MESSAGE
        // =========================
        if (community) {
            const newMessage = await MessageModel.create({
                senderId,
                communityId: community._id,
                text: text || "",
                images,
                documents,
                audio,
                replyTo: replyTo || null,
                delivered: true
            });

            // OPTIMIZATION: Populate in memory instead of double-fetching from DB
            await newMessage.populate([
                { path: "senderId", select: "fullName profilePic" },
                { path: "replyTo" },
                { path: "communityId", select: "name avatar" }
            ]);

            community.lastMessage = newMessage._id;
            await community.save();

            const io = getIO();

            community.members.forEach(memberId => {
                if (memberId.toString() !== senderId.toString()) {
                    const socketId = userSocketMap.get(memberId.toString());
                    if (socketId) {
                        io.to(socketId).emit("newCommunityMessage", newMessage);
                        io.to(socketId).emit("community:message", { communityId: community._id });
                    }
                }
            });

            return res.status(201).json({ success: true, message: newMessage });
        }

        // =========================
        // PRIVATE MESSAGE
        // =========================
        const receiverSocketId = userSocketMap.get(receiverOrCommunityId.toString());

        const newMessage = await MessageModel.create({
            senderId,
            receiverId: receiverOrCommunityId,
            text: text || "",
            images,
            documents,
            audio,
            replyTo: replyTo || null,
            delivered: !!receiverSocketId
        });

        // OPTIMIZATION: Populate in memory instead of double-fetching
        await newMessage.populate([
            { path: "senderId", select: "fullName profilePic" },
            { path: "replyTo" }
        ]);

        if (receiverSocketId) {
            getIO().to(receiverSocketId).emit("newMessage", newMessage);
            
            const senderSocketId = userSocketMap.get(senderId.toString());
            if (senderSocketId) {
                getIO().to(senderSocketId).emit("messageDelivered", { messageId: newMessage._id });
            }
        }

        return res.status(201).json({ success: true, message: newMessage });

    } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const toggleMuteChat = async (req, res) => {
    try {
        const { userId } = req.body;
        const myId = req.user._id;
    
        const action = req.path.includes('unmute') ? 'unmute' : 'mute';

        const update = action === 'mute'
            ? { $addToSet: { mutedChats: userId } }
            : { $pull: { mutedChats: userId } };

        const updatedUser = await UserModel.findByIdAndUpdate(
            myId, 
            update, 
            { new: true }
        );

        res.status(200).json({ success: true, mutedChats: updatedUser.mutedChats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateNotificationSettings = async (req, res) => {
    try {
        const { muted } = req.body;
        const myId = req.user._id;

        const updatedUser = await UserModel.findByIdAndUpdate(
            myId, 
            { globalNotificationsMuted: muted }, 
            { new: true }
        );

        res.status(200).json({ success: true, globalNotificationsMuted: updatedUser.globalNotificationsMuted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUnreadCounts = async (req, res) => {
    try {
        const myId = new mongoose.Types.ObjectId(req.user._id);

        const unread = await MessageModel.aggregate([
            {
                $match: {
                    receiverId: myId,
                    seen: false
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const counts = {};
        unread.forEach(item => {
            counts[item._id.toString()] = item.count;
        });

        res.status(200).json({ success: true, counts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const reactToMessage = async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        const userId = req.user._id;

        const message = await MessageModel.findById(messageId);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        const existingReaction = message.reactions.find(
            reaction => reaction.userId.toString() === userId.toString()
        );

        if (existingReaction) {
            existingReaction.emoji = emoji;
        } else {
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        const updatedMessage = await MessageModel.findById(messageId);

        const receiverSocketId = userSocketMap.get(message.receiverId?.toString());
        const senderSocketId = userSocketMap.get(message.senderId?.toString());

        const io = getIO();

        [receiverSocketId, senderSocketId].forEach(socketId => {
                if (socketId) {
                    io.to(socketId).emit("messageReactionUpdated", updatedMessage);
                }
            });

        res.status(200).json({ success: true, message: updatedMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteForMe = async (req, res) => {
    try {
        const message = await MessageModel.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { deletedFor: req.user._id } },
            { new: true }
        );

        const receiverSocketId = userSocketMap.get(message.receiverId?.toString());
        const senderSocketId = userSocketMap.get(message.senderId?.toString());

        const io = getIO();

        [receiverSocketId, senderSocketId].forEach(socketId => {
            if (socketId) {
                io.to(socketId).emit("messageDeleted", {
                    type: "deleteForMe",
                    messageId: message._id,
                    deletedFor: message.deletedFor
                });
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteForEveryone = async (req, res) => {
    try {
        const message = await MessageModel.findByIdAndUpdate(
            req.params.id,
            {
                isDeletedForEveryone: true,
                text: ""
            },
            { new: true }
        );

        const receiverSocketId = userSocketMap.get(message.receiverId?.toString());
        const senderSocketId = userSocketMap.get(message.senderId?.toString());

        const io = getIO();

        [receiverSocketId, senderSocketId].forEach(socketId => {
            if (socketId) {
                io.to(socketId).emit("messageDeleted", {
                    type: "deleteForEveryone",
                    message
                });
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const message = await MessageModel.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        message.text = text;
        message.edited = true;
        await message.save();

        const receiverSocketId = userSocketMap.get(message.receiverId?.toString());
        const senderSocketId = userSocketMap.get(message.senderId?.toString());

        const io = getIO();

        [receiverSocketId, senderSocketId].forEach(socketId => {
            if (socketId) {
                io.to(socketId).emit("messageEdited", message);
            }
        });

        res.status(200).json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const togglePinMessage = async (req, res) => {
    try {
        const message = await MessageModel.findById(req.params.id);

        if (!message) return res.status(404).json({ success: false });

        message.pinned = !message.pinned;
        message.pinnedBy = message.pinned ? req.user._id : null;
        await message.save();

        const receiverSocketId = userSocketMap.get(message.receiverId?.toString());
        const senderSocketId = userSocketMap.get(message.senderId?.toString());

        const io = getIO();

        [receiverSocketId, senderSocketId].forEach(socketId => {
            if (socketId) {
                io.to(socketId).emit("messagePinned", message);
            }
        });

        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const clearChat = async (req, res) => {
    try {
        const myId = req.user._id;
        const otherUserId = req.params.userId;
        
        await MessageModel.deleteMany({
            $or: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId }
            ]
        });

        res.status(200).json({ message: "Chat cleared successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}