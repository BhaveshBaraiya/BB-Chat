import { Server } from "socket.io";
import MessageModel from "../models/MessageModel.js";

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

        // Notify others that user came online
        socket.broadcast.emit("userCameOnline", userId);

        // Convert old undelivered messages
        if (userId) {
            await MessageModel.updateMany(
                { receiverId: userId, delivered: false },
                { delivered: true }
            );

            // Notify senders about newly delivered messages
            const newlyDelivered = await MessageModel.find({
                receiverId: userId,
                delivered: true,
                seen: false
            });

            newlyDelivered.forEach(msg => {
                const senderSocket = userSocketMap.get(msg.senderId.toString());
                if (senderSocket) {
                    io.to(senderSocket).emit("messageDelivered", { messageId: msg._id });
                }
            });
        }

        // --- Call Feature ---
        socket.on("call:initiate",(data)=>{
        const receiverSocketId=userSocketMap.get(data.to);
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

        // ==========================================
        // ADDED: The missing Message Router
        // ==========================================
        socket.on("sendMessage", (message) => {
            const receiverSocketId = userSocketMap.get(message.receiverId);
            
            // If the receiver is currently online, send the message to their socket
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", message);
            }
        });

        // --- Chat Events ---
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
            await MessageModel.findByIdAndUpdate(messageId, { seen: true });
            const senderSocket = userSocketMap.get(senderId);
            if (senderSocket) io.to(senderSocket).emit("messageSeen", { messageId });
        });

        socket.on("disconnect", () => {
            if (userId) {
                userSocketMap.delete(userId);
                io.emit("onlineUsers", Array.from(userSocketMap.keys()));
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