import { useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../services/axios";
import { SocketContext } from "../context/SocketContext";
import {
    addMessage,
    setReplyMessage,
    removeMessage
} from "../redux/features/chatSlice";
import toast from "react-hot-toast";

export default function useSendMessage() {
    const dispatch = useDispatch();
    const { socket } = useContext(SocketContext);

    const selectedChat = useSelector(
        (state) => state.chat.selectedChat
    );

    const replyMessage = useSelector(
        (state) => state.chat.replyMessage
    );

    const user = useSelector(
        (state) => state.auth.user
    );

    const [loading, setLoading] = useState(false);

    const sendMessage = async (
        text = "",
        files = [],
        audioBlob = null
    ) => {
        const trimmedText = text?.trim() || "";

        if (
            !trimmedText &&
            files.length === 0 &&
            !audioBlob
        ) {
            return;
        }

        const tempId = `temp-${Date.now()}`;

        const isTextOnly =
            files.length === 0 &&
            !audioBlob;

        try {
            setLoading(true);

            // ========================
            // OPTIMISTIC MESSAGE
            // ========================
            if (isTextOnly) {
                const optimisticMessage = {
                    _id: tempId,
                    text: trimmedText,
                    senderId: user,
                    createdAt: new Date().toISOString(),
                    delivered: false,
                    seen: false,
                    edited: false,
                    reactions: [],
                    images: [],
                    documents: [],
                    audio: "",
                    replyTo: replyMessage
                        ? {
                              _id: replyMessage._id,
                              text: replyMessage.text
                          }
                        : null
                };

                dispatch(addMessage(optimisticMessage));
            }

            // ========================
            // FORM DATA
            // ========================
            const formData = new FormData();

            if (trimmedText) {
                formData.append("text", trimmedText);
            }

            if (replyMessage) {
                formData.append(
                    "replyTo",
                    replyMessage._id
                );
            }

            if (audioBlob) {
                formData.append(
                    "files",
                    new File(
                        [audioBlob],
                        "voice.webm",
                        {
                            type: "audio/webm"
                        }
                    )
                );
            }

            files.forEach((file) => {
                formData.append("files", file);
            });

            // ========================
            // API CALL
            // ========================
            const { data } =
                await axiosInstance.post(
                    `/messages/send/${selectedChat._id}`,
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );

            const actualMessage =
                data.message || data;

            // Remove optimistic msg
            if (isTextOnly) {
                dispatch(removeMessage(tempId));
            }

            dispatch(addMessage(actualMessage));

            // Clear reply state
            dispatch(setReplyMessage(null));

            // Optional socket emit
            if (socket) {
                socket.emit(
                    "sendMessage",
                    actualMessage
                );
            }

            return actualMessage;

        } catch (err) {
            console.error(
                "Failed to send message:",
                err
            );

            if (isTextOnly) {
                dispatch(removeMessage(tempId));
            }

            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return {
        sendMessage,
        loading
    };
}