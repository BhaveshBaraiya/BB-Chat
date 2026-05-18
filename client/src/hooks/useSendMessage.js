import { useContext, useState } from "react";
import axiosInstance from "../services/axios";
import { ChatContext } from "../context/ChatContext";
import { SocketContext } from "../context/SocketContext";

export default function useSendMessage() {
    const { selectedChat, setMessages, replyMessage, setReplyMessage } = useContext(ChatContext);
    const { socket } = useContext(SocketContext);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (text, files = [], audioBlob) => {
        if (!text.trim() && files.length === 0 && !audioBlob) return;

        try {
            setLoading(true);
            const formData = new FormData();

            formData.append("text", text);

            if (replyMessage) {
                formData.append("replyTo", replyMessage._id);
            }

            // FIX: Append the audio to "files" instead of "audio" so Multer accepts it
            if (audioBlob) {
                formData.append(
                    "files",
                    new File([audioBlob], "voice.webm", { type: "audio/webm" })
                );
            }

            // Append images/documents
            files.forEach(file => {
                formData.append("files", file);
            });

            const { data } = await axiosInstance.post(
                `/messages/send/${selectedChat._id}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" }
                }
            );

            setMessages(prev => [...prev, data.message]);
            socket.emit("sendMessage", data.message);
            setReplyMessage(null);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        sendMessage,
        loading
    };
}