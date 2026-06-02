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
    setSelectedChat,
    addTypingUser,
    removeTypingUser
} from "../redux/features/chatSlice";

export default function useListenMessages() {
    const { socket } = useContext(SocketContext);
    const dispatch = useDispatch();
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    const user = useSelector((state) => state.auth.user);
    const lastMessageId = useRef(null);
    
    const chatRef = useRef(selectedChat);
    const userRef = useRef(user);

    useEffect(() => { chatRef.current = selectedChat; }, [selectedChat]);
    useEffect(() => { userRef.current = user; }, [user]);

    useEffect(() => {
        if (!socket || !userRef.current) return;
        
        const handleNewMessage = (newMessage) => {
            if (newMessage.communityId) return;
            if (lastMessageId.current === newMessage._id) return;
            lastMessageId.current = newMessage._id;

            const senderIdString = typeof newMessage.senderId === 'object' ? newMessage.senderId._id : newMessage.senderId;
            
            if (chatRef.current && chatRef.current._id === senderIdString) {
                dispatch(addMessage(newMessage));
            } else {
                dispatch(incrementUnreadCount(senderIdString));                
                
                const isGlobalMuted = userRef.current.globalNotificationsMuted === true;
                const isChatMuted = userRef.current.mutedChats?.includes(senderIdString);
                
                if (!isGlobalMuted && !isChatMuted) {
                    const senderObj = typeof newMessage.senderId === 'object' ? newMessage.senderId : null;
                    const displayName = senderObj?.fullName || newMessage.senderName || "New Message";
                    const displayPic = senderObj?.profilePic || newMessage.senderPic || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

                    const handleToastClick = (toastId) => {
                        toast.dismiss(toastId);
                        dispatch(setSelectedChat({ _id: senderIdString, fullName: displayName, profilePic: displayPic }));
                    };

                    toast.custom((t) => (
                        <div onClick={() => handleToastClick(t.id)} className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors`}>
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5 relative">
                                        <img className="h-10 w-10 rounded-full object-cover bg-slate-100 dark:bg-slate-700" src={displayPic} alt="profile" />
                                    </div>
                                    <div className="ml-3 flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{displayName}</p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">{newMessage.text || "Sent an attachment"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ), { duration: 5000, position: 'top-center' });
                }
            }
        };

        const handleNewCommunityMessage = (newMessage) => {
            if (lastMessageId.current === newMessage._id) return;
            lastMessageId.current = newMessage._id;

            const communityObj = typeof newMessage.communityId === 'object' ? newMessage.communityId : null;
            const commIdString = communityObj ? communityObj._id : newMessage.communityId;
            
            // Use the ref here!
            if (chatRef.current && chatRef.current.isGroup && chatRef.current._id === commIdString) {
                dispatch(addMessage(newMessage));
            } else {
                dispatch(incrementUnreadCount(commIdString)); 

                const isGlobalMuted = userRef.current.globalNotificationsMuted === true;
                const isChatMuted = userRef.current.mutedChats?.includes(commIdString);

                if (!isGlobalMuted && !isChatMuted) {
                    const senderName = newMessage.senderId?.fullName || "A member";
                    const commName = communityObj?.name || "Community";
                    const commAvatar = communityObj?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(commName)}`;

                    const handleToastClick = (toastId) => {
                        toast.dismiss(toastId);
                        dispatch(setSelectedChat({ _id: commIdString, fullName: commName, profilePic: commAvatar, isGroup: true }));
                    };

                    toast.custom((t) => (
                        <div onClick={() => handleToastClick(t.id)} className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors`}>
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5 relative">
                                        <img className="h-10 w-10 rounded-full object-cover bg-slate-100 dark:bg-slate-700" src={commAvatar} alt="community" />
                                        <span className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                                            {senderName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="ml-3 flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{commName}</p>
                                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate">
                                            <span className="font-semibold text-indigo-500">{senderName}:</span> {newMessage.text || "Sent an attachment"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ), { duration: 5000, position: 'top-center' });
                }
            }
        };

        const handleReaction = (message) => dispatch(updateMessageReaction(message));
        const handleDeleted = (messageId) => dispatch(markMessageDeletedForAll(messageId));
        const handleSeen = ({ messageId }) => dispatch(updateMessageStatus({ id: messageId, status: 'seen' }));
        const handleTypingStart = ({ userId }) => dispatch(addTypingUser(userId));
        const handleTypingStop = ({ userId }) => dispatch(removeTypingUser(userId));
        const handleDelivered = ({ messageId }) => dispatch(updateMessageStatus({ id: messageId, status: 'delivered' }));

        socket.on("newMessage", handleNewMessage);
        socket.on("newCommunityMessage", handleNewCommunityMessage);
        socket.on("messageReaction", handleReaction);
        socket.on("messageDeletedForAll", handleDeleted);
        socket.on("messageSeen", handleSeen); 
        socket.on("typing:start", handleTypingStart);
        socket.on("typing:stop", handleTypingStop);
        socket.on("messageDelivered", handleDelivered);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("newCommunityMessage", handleNewCommunityMessage);
            socket.off("messageReaction", handleReaction);
            socket.off("messageDeletedForAll", handleDeleted);
            socket.off("messageSeen", handleSeen);
            socket.off("typing:start", handleTypingStart);
            socket.off("typing:stop", handleTypingStop);
            socket.off("messageDelivered", handleDelivered);
        };
    }, [socket, dispatch]); 
}