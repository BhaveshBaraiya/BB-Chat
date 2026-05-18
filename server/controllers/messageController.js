import MessageModel from "../models/MessageModel.js";
import mongoose from "mongoose";
import {
    io,
    userSocketMap
} from "../socket/socket.js";

export const getMessages = async (req, res) => {
    try {

        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await MessageModel.find({
            $or: [

                {
                    senderId: myId,
                    receiverId: userToChatId
                },

                {
                    senderId: userToChatId,
                    receiverId: myId
                }

            ],

            deletedFor: {
                $ne: myId
            }

        })
            .populate(
                "replyTo"
            );

        res.status(200).json({
            success: true,
            messages
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

export const sendMessage = async (req, res) => {
    try {
        const files = req.files || [];
        const images = [];
        const documents = [];
        const audio = files.find(file => file.mimetype.startsWith("audio"));
            const audioPath = audio ? `/uploads/${audio.filename}`: "";

        // Distribute files based on their mimetype
        files.forEach(file => {
            if (file.mimetype.startsWith("image")) {
                images.push(`/uploads/${file.filename}`);
            } else {
                documents.push({
                    fileUrl: `/uploads/${file.filename}`,
                    fileName: file.originalname,
                    fileSize: (file.size / 1024).toFixed(1) + " KB"
                });
            }
        });

        const { text, replyTo } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        const receiverSocketId = userSocketMap.get(receiverId.toString());

       const newMessage = await MessageModel.create({

        senderId,
        receiverId,

        text,

        images,
        documents,

        audio:audioPath,

        replyTo:
        replyTo||null,

        delivered:
        !!receiverSocketId,

        seen:false

        });
        // Populate the reply target text to send back to frontend
        const populatedMessage = await MessageModel
            .findById(newMessage._id)
            .populate("replyTo", "text senderId");

        // Fire real-time event if receiver is connected
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", populatedMessage);
        }

        res.status(201).json({
            success: true,
            message: populatedMessage
        });

    } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getUnreadCounts = async (req, res) => {

    try {

        const myId =
            new mongoose.Types.ObjectId(
                req.user._id
            );

        const unread =
            await MessageModel.aggregate([

                {
                    $match: {
                        receiverId: myId,
                        seen: false
                    }
                },

                {
                    $group: {
                        _id: "$senderId",
                        count: {
                            $sum: 1
                        }
                    }
                }

            ]);

        const counts = {};

        unread.forEach(item => {

            counts[
                item._id.toString()
            ] = item.count;

        });

        res.status(200).json({

            success: true,
            counts

        });

    }

    catch (error) {

        console.log(
            "Unread Error:",
            error
        );

        res.status(500).json({

            success: false,
            message: error.message

        });

    }

};

export const reactToMessage = async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        const userId = req.user._id;

        const message = await MessageModel.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        const existingReaction = message.reactions.find(
            reaction =>
                reaction.userId.toString() ===
                userId.toString()
        );

        if (existingReaction) {
            existingReaction.emoji = emoji;
        } else {
            message.reactions.push({
                userId,
                emoji
            });
        }

        await message.save();

        const updatedMessage =
            await MessageModel.findById(messageId);

        // receiver socket
        const receiverSocketId =
            userSocketMap.get(
                message.receiverId.toString()
            );

        // sender socket
        const senderSocketId =
            userSocketMap.get(
                message.senderId.toString()
            );

        // emit to both users
        [receiverSocketId, senderSocketId]
            .forEach(socketId => {

                if (socketId) {

                    io.to(socketId).emit(
                        "messageReactionUpdated",
                        updatedMessage
                    );

                }

            });

        res.status(200).json({
            success: true,
            message: updatedMessage
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

export const deleteForMe = async (req, res) => {

    try {

        const message =
            await MessageModel.findByIdAndUpdate(
                req.params.id,
                {
                    $addToSet: {
                        deletedFor: req.user._id
                    }
                },
                { new: true }
            );

        const receiverSocketId =
            userSocketMap.get(
                message.receiverId.toString()
            );

        const senderSocketId =
            userSocketMap.get(
                message.senderId.toString()
            );

        [receiverSocketId, senderSocketId]
            .forEach(socketId => {

                if (socketId) {

                    io.to(socketId).emit(
                        "messageDeleted",
                        {
                            type: "deleteForMe",
                            messageId: message._id,
                            deletedFor: message.deletedFor
                        }
                    );

                }

            });

        res.json({
            success: true
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

export const deleteForEveryone = async (req, res) => {

    try {

        const message =
            await MessageModel.findByIdAndUpdate(
                req.params.id,
                {
                    isDeletedForEveryone: true,
                    text: ""
                },
                { new: true }
            );

        const receiverSocketId =
            userSocketMap.get(
                message.receiverId.toString()
            );

        const senderSocketId =
            userSocketMap.get(
                message.senderId.toString()
            );

        [receiverSocketId, senderSocketId]
            .forEach(socketId => {

                if (socketId) {

                    io.to(socketId).emit(
                        "messageDeleted",
                        {
                            type: "deleteForEveryone",
                            message
                        }
                    );

                }

            });

        res.json({
            success: true
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

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

        const receiverSocketId = userSocketMap.get(message.receiverId.toString());

        const senderSocketId = userSocketMap.get(message.senderId.toString());

        [receiverSocketId, senderSocketId].forEach(socketId => {
            if (socketId) {
                io.to(socketId).emit("messageEdited", message);
            }
        });

        res.status(200).json({ success: true, message });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const togglePinMessage = async (req, res) => {
    try {
        const message = await MessageModel.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false
            });
        }

        message.pinned = !message.pinned;
        message.pinnedBy = message.pinned ? req.user._id : null;

        await message.save();

        const receiverSocketId =
            userSocketMap.get(
                message.receiverId.toString()
            );

        const senderSocketId =
            userSocketMap.get(
                message.senderId.toString()
            );

        [receiverSocketId, senderSocketId].forEach(socketId => {
            if (socketId) {
                io.to(socketId)
                    .emit("messagePinned", message);
            }
        });

        res.json({ success: true, message });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};