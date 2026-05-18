import { createContext, useState, useEffect, useContext } from "react";
import { SocketContext } from "./SocketContext";
import axiosInstance from "../services/axios";

export const ChatContext = createContext();

export default function ChatProvider({ children }) {
    const { socket } = useContext(SocketContext);

    const [selectedChat, setSelectedChat] = useState(null);
    const [replyMessage,setReplyMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});

    // incoming messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {

            if (
                !selectedChat ||
                message.senderId !== selectedChat._id
            ) {

                setUnreadCounts(prev => ({
                    ...prev,
                    [message.senderId]:
                    (prev[message.senderId] || 0) + 1
                }));

                return;
            }

            setMessages(prev => {
                if (
                    prev.some(
                        m=>m._id===message._id
                    )
                ){
                    return prev;
                }

                return [...prev,message];

            });


            // RECEIVED = delivered
            socket.emit(
                "messageDelivered",
                {
                    messageId:message._id,
                    senderId:message.senderId
                }
            );


            // if chat open → seen
            socket.emit(
                "messageSeen",
                {
                    messageId:message._id,
                    senderId:message.senderId
                }
            );      

        };

        socket.on(
            "newMessage",
            handleNewMessage
        );

        return () => {

            socket.off(
                "newMessage",
                handleNewMessage
            );

        };

    },[socket,selectedChat]);


    // typing
    useEffect(() => {

        if (!socket) return;

        const handleTypingStart =
        ({userId}) => {

            setTypingUsers(prev =>
                [...new Set([
                    ...prev,
                    userId
                ])]
            );

        };

        const handleTypingStop =
        ({userId}) => {

            setTypingUsers(prev =>
                prev.filter(
                    id=>id!==userId
                )
            );

        };

        socket.on(
            "typing:start",
            handleTypingStart
        );

        socket.on(
            "typing:stop",
            handleTypingStop
        );

        return ()=>{

            socket.off(
                "typing:start",
                handleTypingStart
            );

            socket.off(
                "typing:stop",
                handleTypingStop
            );

        };

    },[socket]);


    // delivered
    useEffect(()=>{

        if(!socket) return;

        const handleDelivered=
        ({messageId})=>{

            setMessages(prev=>
                prev.map(msg=>

                msg._id===messageId

                ?{
                    ...msg,
                    delivered:true
                }

                :msg
            )
            );

        };

        socket.on(
            "messageDelivered",
            handleDelivered
        );

        return ()=>{

            socket.off(
                "messageDelivered",
                handleDelivered
            );

        };

    },[socket]);


    // seen
    useEffect(()=>{
        if(!socket) return;

        const handleSeen=
        ({messageId})=>{

            setMessages(prev=>

                prev.map(msg=>

                msg._id===messageId

                ?{
                    ...msg,
                    seen:true
                }

                :msg

            )

            );

        };

        socket.on(
            "messageSeen",
            handleSeen
        );

        return ()=>{

            socket.off(
                "messageSeen",
                handleSeen
            );

        };

    },[socket]);

    // realtime reactions
useEffect(()=>{

if(!socket) return;

const handleReaction=
(updatedMessage)=>{

setMessages(prev=>

prev.map(msg=>

msg._id===
updatedMessage._id

?updatedMessage

:msg

)

);

};

socket.on(
"messageReaction",
handleReaction
);

return()=>{

socket.off(
"messageReaction",
handleReaction
);

};

},[socket]);

  useEffect(() => {

    if(!socket) return;

    const loadUnread = async()=>{

        try{

            const {data}=
            await axiosInstance.get(
                "/messages/unread"
            );

            console.log(
                "Unread:",
                data.counts
            );

            setUnreadCounts(
                data.counts || {}
            );

        }
        catch(error){

            console.log(
                "Unread load error:",
                error
            );

        }

    };

    // initial load
    loadUnread();

    // whenever socket reconnects
    socket.on(
        "connect",
        loadUnread
    );

    return ()=>{

        socket.off(
            "connect",
            loadUnread
        );

    };

},[socket]);

    return (

        <ChatContext.Provider
            value={{

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