import { useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../services/axios";
import { SocketContext } from "../context/SocketContext";
import { addMessage, setReplyMessage } from "../redux/features/chatSlice";

export default function useSendMessage() {
    const dispatch = useDispatch();
    const { socket } = useContext(SocketContext);
    
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    const replyMessage = useSelector((state) => state.chat.replyMessage);
    
    const [loading, setLoading] = useState(false);

    const sendMessage = async (text, files = [], audioBlob) => {
        if (!text.trim() && files.length === 0 && !audioBlob) return;

        try {
            setLoading(true);
            const formData = new FormData();
            
            if (text.trim()) {
                formData.append("text", text);
            }

            if (replyMessage) {
                formData.append("replyTo", replyMessage._id);
            }

            if (audioBlob) {
                formData.append("files", new File([audioBlob], "voice.webm", { type: "audio/webm" }));
            }

            files.forEach(file => formData.append("files", file));

            const { data } = await axiosInstance.post(
                `/messages/send/${selectedChat._id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            // 1. Add it to our own screen instantly (Redux)
            dispatch(addMessage(data.message));
            
            // 2. Send it to the backend so the other person gets it (Socket.io)
            if (socket) {
                socket.emit("sendMessage", data.message);
            }
            
            // 3. Clear the reply state if there was one
            dispatch(setReplyMessage(null));

        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            setLoading(false);
        }
    };

    // THIS IS THE CRITICAL LINE FIXING YOUR ERROR:
    // It must return an object with curly braces so ChatWindow can destructure { sendMessage }
    return { sendMessage, loading };
}