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
    const [unreadCounts, setUnreadCounts] = useState({});


    useEffect(() => {

        if (!socket) return;

        const handleNewMessage = (message) => {

            if (!selectedChat || message.senderId !== selectedChat._id) {

                setUnreadCounts(prev => ({
                    ...prev,
                    [message.senderId]:
                    (prev[message.senderId] || 0) + 1
                }));

                return;
            }

            setMessages(prev => {

                if (prev.some(m => m._id === message._id)) {
                    return prev;
                }

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
                    msg._id === messageId
                        ? { ...msg, delivered:true }
                        : msg
                )
            );

        };

        socket.on("messageDelivered", handleDelivered);

        return () =>
            socket.off("messageDelivered", handleDelivered);

    }, [socket]);


    useEffect(() => {

        if (!socket) return;

        const handleSeen = ({ messageId }) => {

            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, seen:true }
                        : msg
                )
            );

        };

        socket.on("messageSeen", handleSeen);

        return () =>
            socket.off("messageSeen", handleSeen);

    }, [socket]);


    // realtime reactions
    useEffect(() => {

        if (!socket) return;

        const handleReactionUpdate = (updatedMessage) => {

            setMessages(prev =>
                prev.map(msg =>
                    msg._id === updatedMessage._id
                        ? updatedMessage
                        : msg
                )
            );

        };

        socket.on(
            "messageReactionUpdated",
            handleReactionUpdate
        );

        return () =>
            socket.off(
                "messageReactionUpdated",
                handleReactionUpdate
            );

    }, [socket]);

    useEffect(()=>{

        if(!socket) return;

        const handleEdited=
            (updatedMessage)=>{

            setMessages(prev=>

                prev.map(msg=>

                    msg._id===
                    updatedMessage._id

                    ? updatedMessage

                    : msg

                )

            );

        };

        socket.on(
            "messageEdited",
            handleEdited
        );

        return()=>{

            socket.off(
                "messageEdited",
                handleEdited
            );

        };

    },[socket]);

    useEffect(()=>{

    if(!socket) return;

    const handlePin=
    updatedMessage=>{

        setMessages(prev=>

            prev.map(msg=>

                msg._id===
                updatedMessage._id

                ? updatedMessage

                : msg

            )

        );

    };

    socket.on(
        "messagePinned",
        handlePin
    );

    return()=>{

        socket.off(
            "messagePinned",
            handlePin
        );

    };

},[socket]);


    useEffect(() => {

        if (!socket) return;

        const loadUnread = async () => {

            try {

                const { data } =
                    await axiosInstance.get("/messages/unread");

                setUnreadCounts(data.counts || {});

            } catch (error) {

                console.log(error);

            }

        };

        loadUnread();

        socket.on("connect", loadUnread);

        return () =>
            socket.off("connect", loadUnread);

    }, [socket]);

    useEffect(()=>{

    if(!socket) return;

    const handleDelete = (data)=>{

        if(data.type==="deleteForEveryone"){

            setMessages(prev=>
                prev.map(msg=>
                    msg._id===data.message._id
                    ? data.message
                    : msg
                )
            );

        }


       if(data.type==="deleteForMe"){

            setMessages(prev=>
                prev.filter(
                    msg=>
                    msg._id !== data.messageId
                )
            );

        }

    };

    socket.on(
        "messageDeleted",
        handleDelete
    );

    return()=>{

        socket.off(
            "messageDeleted",
            handleDelete
        );

    };

},[socket]);


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
            setUnreadCounts
        }}>
            {children}
        </ChatContext.Provider>
    );
}