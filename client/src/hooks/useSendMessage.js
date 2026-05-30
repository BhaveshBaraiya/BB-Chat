import { useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../services/axios";
import { SocketContext } from "../context/SocketContext";
import { addMessage, setReplyMessage, removeMessage } from "../redux/features/chatSlice";
import toast from "react-hot-toast";

export default function useSendMessage() {
    const dispatch = useDispatch();
    const { socket } = useContext(SocketContext);
    
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    const replyMessage = useSelector((state) => state.chat.replyMessage);

    const user = useSelector((state) => state.auth.user); 
    
    const [loading, setLoading] = useState(false);

    const sendMessage = async (text, files = [], audioBlob) => {
        if (!text.trim() && files.length === 0 && !audioBlob) return;
        
        const tempId = `temp-${Date.now()}`;
        const isTextOnly = files.length === 0 && !audioBlob;

        try {
            setLoading(true);
            
            if (isTextOnly) {
                const optimisticMessage = {
                    _id: tempId,
                    text: text,
                    senderId: user, 
                    createdAt: new Date().toISOString(),
                    delivered: false,
                    seen: false,
                    replyTo: replyMessage ? { text: replyMessage.text } : null,
                };
                                
                dispatch(addMessage(optimisticMessage));
                dispatch(setReplyMessage(null));
            }

            const formData = new FormData();
            if (text.trim()) formData.append("text", text);
            if (replyMessage) formData.append("replyTo", replyMessage._id);
            if (audioBlob) formData.append("files", new File([audioBlob], "voice.webm", { type: "audio/webm" }));
            files.forEach(file => formData.append("files", file));

            const { data } = await axiosInstance.post(
                `/messages/send/${selectedChat._id}`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (isTextOnly) {
                dispatch(removeMessage(tempId));
            }

            dispatch(addMessage(data.message));
            
            if (socket) {
                socket.emit("sendMessage", data.message);
            }
            
            if (!isTextOnly) {
                dispatch(setReplyMessage(null));
            }

        } catch (err) {
            console.error("Failed to send message:", err);
            if (isTextOnly) dispatch(removeMessage(tempId));
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading };
}