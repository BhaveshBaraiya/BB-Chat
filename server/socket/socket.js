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

            const undeliveredMessages = await MessageModel.find({
                receiverId: userId,
                delivered: false
            });

            for (const msg of undeliveredMessages) {

                const sender = await UserModel.findById(msg.senderId);
                const receiver = await UserModel.findById(msg.receiverId);

                // CHECK BLOCK STATUS
                const blocked =
                    sender.blockedUsers?.includes(receiver._id) ||
                    receiver.blockedUsers?.includes(sender._id);

                if (blocked) {
                    continue;
                }

                msg.delivered = true;
                await msg.save();

                const senderSocket = userSocketMap.get(msg.senderId.toString());
                if (senderSocket) {
                    io.to(senderSocket).emit("messageDelivered", {
                        messageId: msg._id
                    });
                }
            }
        }
        
        // --- Call Feature ---
        socket.on("call:initiate", async(data) => {
            const caller = await UserModel.findById(userId);
            const receiver = await UserModel.findById(data.to);

            const blocked =
                caller.blockedUsers?.includes(receiver._id) ||
                receiver.blockedUsers?.includes(caller._id);

            if (blocked) return;
            const receiverSocketId = userSocketMap.get(data.to);
            if(receiverSocketId){
                io.to(receiverSocketId).emit("call:incoming",{
                    from:userId,
                    type:data.type,
                    peerId:data.peerId,
                    callerName:data.callerName,
                    callerPic:data.callerPic
                });
            }
        });
        
        socket.on("call:accepted", (data) => {
            const callerSocketId = userSocketMap.get(data.to);
            if (callerSocketId) io.to(callerSocketId).emit("call:accepted");
        });

        socket.on("call:ended", ({ to }) => {
            const receiverSocketId = userSocketMap.get(to);
            if(receiverSocketId){
                io.to(receiverSocketId).emit("call:ended");
            }
        });

        socket.on("sendMessage", async(message) => {
            const sender = await UserModel.findById(message.senderId);
            const receiver = await UserModel.findById(message.receiverId);
            const blocked = sender.blockedUsers?.includes(receiver._id) || receiver.blockedUsers?.includes(sender._id);

            if (blocked) {
                return;
            }
            const receiverSocketId = userSocketMap.get(message.receiverId);
            
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", message);
            }
        });

        // --- Chat Events ---
        socket.on("typing:start", async({ receiverId, userId }) => {
            const sender = await UserModel.findById(userId);
            const receiver = await UserModel.findById(receiverId);
            const blocked = sender.blockedUsers?.includes(receiver._id) || receiver.blockedUsers?.includes(sender._id);

            if (blocked) return;
            const receiverSocket = userSocketMap.get(receiverId);
            if (receiverSocket) io.to(receiverSocket).emit("typing:start", { userId });
        });

        socket.on("typing:stop", async({ receiverId, userId }) => {
            const sender = await UserModel.findById(userId);
            const receiver = await UserModel.findById(receiverId);
            const blocked = sender.blockedUsers?.includes(receiver._id) || receiver.blockedUsers?.includes(sender._id);

            if (blocked) return;
            const receiverSocket = userSocketMap.get(receiverId);
            if (receiverSocket) io.to(receiverSocket).emit("typing:stop", { userId });
        });

        socket.on("messageReaction", ({ receiverId, message }) => {
            const receiverSocketId = userSocketMap.get(receiverId);
            if (receiverSocketId) io.to(receiverSocketId).emit("messageReaction", message);
        });

        socket.on("messageSeen", async ({ messageId, senderId }) => {
            const msg = await MessageModel.findById(messageId);
            const sender = await UserModel.findById(msg.senderId);
            const receiver = await UserModel.findById(msg.receiverId);

            const blocked =
                sender.blockedUsers?.includes(receiver._id) ||
                receiver.blockedUsers?.includes(sender._id);

            if (blocked) return;
            await MessageModel.findByIdAndUpdate(messageId, { seen: true });
            const senderSocket = userSocketMap.get(senderId);
            if (senderSocket) io.to(senderSocket).emit("messageSeen", { messageId });
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
    if (!io) {
        throw new Error("Socket.io has not been initialized!");
    }
    return io;
};

export { io, userSocketMap };