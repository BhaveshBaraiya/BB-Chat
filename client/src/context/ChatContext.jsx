import { createContext, useState, useEffect, useContext } from "react";
import { SocketContext } from "./SocketContext";
import axiosInstance from "../services/axios";

export const ChatContext = createContext();

export default function ChatProvider({ children }) {
    const { socket } = useContext(SocketContext);

    const [selectedChat, setSelectedChat] = useState(null);
    const [replyMessage, setReplyMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [forwardMessageData, setForwardMessageData] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    const updateChatUser = (updatedUser) => {
        setSelectedChat(prev =>
            prev && prev._id === updatedUser._id
                ? {
                    ...prev,
                    fullName: updatedUser.fullName || prev.fullName,
                    bio: updatedUser.bio || prev.bio,
                    profilePic: updatedUser.profilePic || prev.profilePic
                }
                : prev
        );
    };

    const createOrOpenChat = async (user) => {
        try {
            const { data } = await axiosInstance.post(
                "/conversations/create",
                { receiverId: user._id }
            );
            setSelectedChat(data);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleProfileUpdate = (updatedUser) => {
            updateChatUser(updatedUser);
        };

        socket.on("profile:updated", handleProfileUpdate);
        return () => socket.off("profile:updated", handleProfileUpdate);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            if (!selectedChat || message.senderId !== selectedChat._id) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [message.senderId]: (prev[message.senderId] || 0) + 1
                }));
                return;
            }

            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });

            socket.emit("messageDelivered", {
                messageId: message._id,
                senderId: message.senderId
            });

            socket.emit("messageSeen", {
                messageId: message._id,
                senderId: message.senderId
            });
        };

        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage", handleNewMessage);
    }, [socket, selectedChat]);

    useEffect(() => {
        if (!socket) return;

        const handleTypingStart = ({ userId }) => {
            setTypingUsers(prev => [...new Set([...prev, userId])]);
        };

        const handleTypingStop = ({ userId }) => {
            setTypingUsers(prev => prev.filter(id => id !== userId));
        };

        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);

        return () => {
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleDelivered = ({ messageId }) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageId ? { ...msg, delivered: true } : msg
                )
            );
        };

        socket.on("messageDelivered", handleDelivered);
        return () => socket.off("messageDelivered", handleDelivered);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleSeen = ({ messageId }) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageId ? { ...msg, seen: true } : msg
                )
            );
        };

        socket.on("messageSeen", handleSeen);
        return () => socket.off("messageSeen", handleSeen);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on("messageReactionUpdated", (updatedMessage) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === updatedMessage._id ? updatedMessage : msg
                )
            );
        });
    }, [socket]);

    return (
        <ChatContext.Provider value={{
            selectedChat,
            setSelectedChat,
            replyMessage,
            setReplyMessage,
            messages,
            setMessages,
            typingUsers,
            setTypingUsers,
            unreadCounts,
            setUnreadCounts,
            forwardMessageData,
            setForwardMessageData,
            createOrOpenChat,
            updateChatUser
        }}>
            {children}
        </ChatContext.Provider>
    );
}