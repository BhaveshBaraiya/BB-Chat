import { useEffect, useContext, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SocketContext } from "../context/SocketContext";
import { 
    addMessage, 
    incrementUnreadCount, 
    updateMessageStatus,
    updateMessageReaction,
    markMessageDeletedForAll
} from "../redux/features/chatSlice";

export default function useListenMessages() {
    const { socket } = useContext(SocketContext);
    const dispatch = useDispatch();
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    const lastMessageId = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            if (lastMessageId.current === newMessage._id) return;
            lastMessageId.current = newMessage._id;

            if (selectedChat && selectedChat._id === newMessage.senderId) {
                dispatch(addMessage(newMessage));
                socket.emit("messageSeen", { messageId: newMessage._id, senderId: newMessage.senderId });
            } else {
                dispatch(incrementUnreadCount(newMessage.senderId));
            }
        };

        const handleReaction = (message) => dispatch(updateMessageReaction(message));
        const handleDeleted = (messageId) => dispatch(markMessageDeletedForAll(messageId));
        const handleSeen = ({ messageId }) => dispatch(updateMessageStatus({ id: messageId, status: 'seen' }));

        socket.on("newMessage", handleNewMessage);
        socket.on("messageReaction", handleReaction);
        socket.on("messageDeletedForAll", handleDeleted);
        socket.on("messageSeen", handleSeen); 

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messageReaction", handleReaction);
            socket.off("messageDeletedForAll", handleDeleted);
            socket.off("messageSeen", handleSeen);
        };
    }, [socket, dispatch, selectedChat]);
}