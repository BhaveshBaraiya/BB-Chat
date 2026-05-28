import { useEffect, useContext, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SocketContext } from "../context/SocketContext";
import toast from "react-hot-toast";
import { 
    addMessage, 
    incrementUnreadCount, 
    updateMessageStatus,
    updateMessageReaction,
    markMessageDeletedForAll,
    setSelectedChat
} from "../redux/features/chatSlice";

export default function useListenMessages() {
    const { socket } = useContext(SocketContext);
    const dispatch = useDispatch();
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    
    const user = useSelector((state) => state.auth.user);
    
    const lastMessageId = useRef(null);

    useEffect(() => {
        if (!socket || !user) return;

        const handleNewMessage = (newMessage) => {
            if (lastMessageId.current === newMessage._id) return;
            lastMessageId.current = newMessage._id;

            const senderIdString = typeof newMessage.senderId === 'object' ? newMessage.senderId._id : newMessage.senderId;

            if (selectedChat && selectedChat._id === senderIdString) {
                dispatch(addMessage(newMessage));
                socket.emit("messageSeen", { messageId: newMessage._id, senderId: senderIdString });
            } else {
                dispatch(incrementUnreadCount(senderIdString));

                // --- PRODUCTION MUTE CHECK: Check Redux state instead of localStorage ---
                const isGlobalMuted = user.globalNotificationsMuted === true;
                const isChatMuted = user.mutedChats?.includes(senderIdString);
                
                if (!isGlobalMuted && !isChatMuted) {
                    const senderObj = typeof newMessage.senderId === 'object' ? newMessage.senderId : null;
                    const displayName = senderObj?.fullName || newMessage.senderName || "New Message";
                    const displayPic = senderObj?.profilePic || newMessage.senderPic || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

                    const handleToastClick = (toastId) => {
                        toast.dismiss(toastId);
                        dispatch(setSelectedChat({
                            _id: senderIdString,
                            fullName: displayName,
                            profilePic: displayPic
                        }));
                    };

                    toast.custom((t) => (
                        <div
                            className={`${
                                t.visible ? 'animate-enter' : 'animate-leave'
                            } max-w-sm w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors`}
                            onClick={() => handleToastClick(t.id)} 
                        >
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5 relative">
                                        <img
                                            className="h-10 w-10 rounded-full object-cover bg-slate-100 dark:bg-slate-700"
                                            src={displayPic}
                                            alt={displayName}
                                        />
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                        </span>
                                    </div>
                                    <div className="ml-3 flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                            {displayName}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">
                                            {newMessage.text || (newMessage.images?.length > 0 ? "📷 Sent an image" : "Sent an attachment")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-l border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        toast.dismiss(t.id);
                                    }}
                                    className="w-full border border-transparent p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none transition-colors"
                                    title="Dismiss"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ), { duration: 5000, position: 'top-center' });
                }
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
    }, [socket, dispatch, selectedChat, user]);
}