import { Server } from "socket.io";
import MessageModel from "../models/MessageModel.js";
import UserModel from "../models/UserModel.js";

const userSocketMap = new Map();
let io;

const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [];

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: allowedOrigins.length > 0 ? allowedOrigins : "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", async (socket) => {
        const userId = socket.handshake.query.userId;
        
        if (userId) {
            userSocketMap.set(userId, socket.id);
        }

        io.emit("onlineUsers", Array.from(userSocketMap.keys()));
        socket.broadcast.emit("userCameOnline", { userId });

        if (userId) {
            try {                
                const undeliveredMessages = await MessageModel.find({
                    receiverId: userId,
                    delivered: false
                }).populate("senderId", "blockedUsers").populate("receiverId", "blockedUsers");

                const messageIdsToUpdate = [];

                for (const msg of undeliveredMessages) {
                    const sender = msg.senderId;
                    const receiver = msg.receiverId;

                    if (!sender || !receiver) continue;

                    const blocked = sender.blockedUsers?.includes(receiver._id) || receiver.blockedUsers?.includes(sender._id);
                    if (blocked) continue;

                    messageIdsToUpdate.push(msg._id);

                    const senderSocket = userSocketMap.get(sender._id.toString());
                    if (senderSocket) {
                        io.to(senderSocket).emit("messageDelivered", { messageId: msg._id });
                    }
                }

                if (messageIdsToUpdate.length > 0) {
                    await MessageModel.updateMany(
                        { _id: { $in: messageIdsToUpdate } },
                        { $set: { delivered: true } }
                    );
                }
            } catch (err) {
                console.error("Socket Connection Undelivered Messages Error:", err);
            }
        }
        
        socket.on("call:initiate", async(data) => {
            const caller = await UserModel.findById(userId);
            const receiver = await UserModel.findById(data.to);

            if (!receiver) return;

            const blocked = caller.blockedUsers?.includes(receiver._id) || receiver.blockedUsers?.includes(caller._id);
            if (blocked) return;

            const receiverSocketId = userSocketMap.get(data.to);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call:incoming", {
                    from: userId,
                    type: data.type,
                    peerId: data.peerId,
                    callerName: data.callerName,
                    callerPic: data.callerPic
                });
            }
        });
        
        socket.on("call:accepted", (data) => {
            const callerSocketId = userSocketMap.get(data.to);
            if (callerSocketId) io.to(callerSocketId).emit("call:accepted");
        });

        socket.on("call:ended", ({ to }) => {
            const receiverSocketId = userSocketMap.get(to);
            if (receiverSocketId) io.to(receiverSocketId).emit("call:ended");
        });

        socket.on("sendMessage", async(message) => {
            try {
                const senderIdStr = typeof message.senderId === 'object' ? message.senderId._id.toString() : message.senderId.toString();
                const sender = await UserModel.findById(senderIdStr);
                
                if (!sender) return;                
                
                if (message.communityId) {
                    const CommunityModel = (await import("../models/CommunityModel.js")).default;
                    const commIdStr = typeof message.communityId === 'object' ? message.communityId._id.toString() : message.communityId.toString();
                    const community = await CommunityModel.findById(commIdStr);
                    
                    if (!community) return;
                    community.members.forEach(memberId => {
                        if (memberId.toString() !== senderIdStr) {
                            const memberSocketId = userSocketMap.get(memberId.toString());
                            if (memberSocketId) {
                                io.to(memberSocketId).emit("newCommunityMessage", message);
                                io.to(memberSocketId).emit("community:message", { communityId: commIdStr });
                            }
                        }
                    });
                    return;
                }

                const receiverIdStr = typeof message.receiverId === 'object' ? message.receiverId._id.toString() : message.receiverId.toString();
                const receiver = await UserModel.findById(receiverIdStr);
                
                if (!receiver) return;

                const blocked = sender.blockedUsers?.includes(receiver._id) || receiver.blockedUsers?.includes(sender._id);
                if (blocked) return;

                const receiverSocketId = userSocketMap.get(receiverIdStr);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newMessage", message);
                }
            } catch (err) {
                console.error("Socket sendMessage Error:", err);
            }
        });

        socket.on("typing:start", ({ receiverId, userId }) => {
            const receiverSocket = userSocketMap.get(receiverId);
            if (receiverSocket) io.to(receiverSocket).emit("typing:start", { userId });
        });

        socket.on("typing:stop", ({ receiverId, userId }) => {
            const receiverSocket = userSocketMap.get(receiverId);
            if (receiverSocket) io.to(receiverSocket).emit("typing:stop", { userId });
        });

        socket.on("messageReaction", ({ receiverId, message }) => {
            const receiverSocketId = userSocketMap.get(receiverId);
            if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", message);
        });

        socket.on("messageSeen", async ({ messageId, senderId }) => {
            try {
                const msg = await MessageModel.findById(messageId);
                if (!msg) return;

                if (msg.receiverId) {
                    const msgReceiverStr = typeof msg.receiverId === 'object' ? msg.receiverId._id.toString() : msg.receiverId.toString();
                    const msgSenderStr = typeof msg.senderId === 'object' ? msg.senderId._id.toString() : msg.senderId.toString();

                    const sender = await UserModel.findById(msgSenderStr);
                    const receiver = await UserModel.findById(msgReceiverStr);

                    if (receiver && sender) {
                        const blocked = sender.blockedUsers?.includes(receiver._id) || receiver.blockedUsers?.includes(sender._id);
                        if (blocked) return;
                    }
                }

                await MessageModel.findByIdAndUpdate(messageId, { seen: true });

                const senderSocket = userSocketMap.get(senderId);
                if (senderSocket) io.to(senderSocket).emit("messageSeen", { messageId });
            } catch (error) {
                console.error("Socket messageSeen Error:", error);
            }
        });

        socket.on("disconnect", async () => {
            if (userId) {
                userSocketMap.delete(userId);
                io.emit("onlineUsers", Array.from(userSocketMap.keys()));

                const lastSeenTime = new Date();
                await UserModel.findByIdAndUpdate(userId, { lastSeen: lastSeenTime });
                io.emit("userWentOffline", { userId, lastSeen: lastSeenTime });
            }
        });
    });
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io has not been initialized!");
    return io;
};

export { io, userSocketMap };