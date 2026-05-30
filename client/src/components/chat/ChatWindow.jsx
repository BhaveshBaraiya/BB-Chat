import { useContext, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiPhone, FiVideo, FiMoreVertical, FiSmile, FiPaperclip, FiSend, FiMic, FiSquare, FiX, FiPause, FiPlay, FiMessageSquare, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";

import axiosInstance from "../../services/axios";
import toast from "react-hot-toast";

import { SocketContext } from "../../context/SocketContext";
import { CallContext } from "../../context/CallContext";
import { setSelectedChat, clearUnreadCount, setMessages } from "../../redux/features/chatSlice";
import { updateUser } from "../../redux/features/authSlice";
import useMessages from "../../hooks/useMessages";
import useSendMessage from "../../hooks/useSendMessage";
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ReplyPreview from "./ReplyPreview";

export default function ChatWindow() {
    const dispatch = useDispatch();
    const typingTimeoutRef = useRef(null);
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    const typingUsers = useSelector((state) => state.chat.typingUsers);    
    const user = useSelector((state) => state.auth.user);

    const { socket, onlineUsers, lastSeenMap } = useContext(SocketContext);
    const { initiateCall } = useContext(CallContext);

    const { messages, loading } = useMessages();
    const { sendMessage } = useSendMessage();

    const [text, setText] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showEmoji, setShowEmoji] = useState(false);
    const [search, setSearch] = useState("");
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const isChatMuted = user?.mutedChats?.includes(selectedChat?._id);

    const [lightboxData, setLightboxData] = useState({
        isOpen: false,
        images: [],
        currentIndex: 0
    });

    const iBlocked = user?.blockedUsers?.includes(selectedChat?._id);
    const blockedMe = selectedChat?.blockedUsers?.includes(user?._id);
    const isBlocked = iBlocked || blockedMe;

    const {
        isRecording, isPaused, recordingTime, audioBlob, audioUrl,
        startRecording, pauseRecording, resumeRecording, stopRecording,
        cancelRecording, discardAudio
    } = useAudioRecorder();

    const formatAudioTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleMuteChat = async () => {
        setShowMenu(false);
        const action = isChatMuted ? "unmute" : "mute";

        try {
            await axiosInstance.post(`/users/${action}-chat`, { userId: selectedChat._id });

            let updatedMutedChats;
            if (isChatMuted) {
                updatedMutedChats = user.mutedChats.filter(id => id !== selectedChat._id);
            } else {
                updatedMutedChats = [...(user.mutedChats || []), selectedChat._id];
            }

            dispatch(updateUser({ mutedChats: updatedMutedChats }));
            toast.success(isChatMuted ? `Unmuted notifications for ${selectedChat.fullName} 🔔` : `Muted notifications for ${selectedChat.fullName} 🔕`);

        } catch (error) {
            toast.error("Failed to update mute settings");
        }
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        setLightboxData(prev => ({ ...prev, currentIndex: (prev.currentIndex + 1) % prev.images.length }));
    };

    const handlePrevImage = (e) => {
        e.stopPropagation();
        setLightboxData(prev => ({ ...prev, currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length }));
    };

    const closeLightbox = () => {
        setLightboxData({ isOpen: false, images: [], currentIndex: 0 });
    };

    const handleInitiateCall = (type) => {
        if (iBlocked) {
            toast.error("You cannot call a blocked user");
            return;
        }
        
        sendMessage(type === "video" ? "📹 Started a video call" : "📞 Started a voice call");
        
        initiateCall(
            selectedChat._id, 
            selectedChat.fullName, 
            selectedChat.profilePic, 
            type
        );
    };

    const MoreOptionsMenu = ({ onClose, onClearChat, onDeleteUser, onBlockUser, onSearch, onMute, isMuted }) => (
        <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onClose(); }} onTouchStart={(e) => { e.stopPropagation(); onClose(); }}></div>
            <div className="absolute top-16 right-4 sm:right-6 bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 rounded-xl py-2 w-56 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { onClearChat?.(); onClose(); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors">Clear Chat</button>
                <button onClick={() => { onSearch?.(); onClose(); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors">Search Messages</button>
                <button onClick={() => { onDeleteUser?.(); onClose(); }} className="w-full px-4 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 text-sm font-medium transition-colors">Delete User</button>
                <button onClick={() => { onMute?.(); onClose(); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors">
                    {isMuted ? "Unmute Notifications" : "Mute Notifications"}
                </button>
                {!blockedMe && (
                    <button onClick={() => { onBlockUser?.(); onClose(); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors">
                        {iBlocked ? "Unblock User" : "Block User"}
                    </button>
                )}
            </div>
        </>
    );

    const messagesEndRef = useRef(null);
    const emojiRef = useRef(null);

    const formatLastSeen = (dateString) => {
        if (!dateString) return "Offline";
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.abs(now - date) / 36e5;
        if (diffInHours < 24 && date.getDate() === now.getDate()) {
            return `Last seen today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return `Last seen ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const isTargetStatusVisible = selectedChat?.showOnlineStatus !== false;
    const isOnline = !blockedMe && isTargetStatusVisible && onlineUsers.includes(selectedChat?._id);
    const userLastSeen = lastSeenMap?.[selectedChat?._id] || selectedChat?.lastSeen;

    const displayStatus = iBlocked
        ? "Blocked"
        : isOnline
            ? "Online"
            : (isTargetStatusVisible && userLastSeen ? formatLastSeen(userLastSeen) : "Offline");

    const filteredMessages = messages.filter(msg => msg.text?.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
        }
    }, [messages]);

    useEffect(() => {
        if (!socket || !selectedChat || !user) return;
        const handleUserOnline = ({ userId }) => {
            if (userId !== selectedChat._id) return;
            const updatedMessages = messages.map(msg => msg.senderId === user?._id && !msg.delivered ? { ...msg, delivered: true } : msg);
            dispatch(setMessages(updatedMessages));
        };
        socket.on("userCameOnline", handleUserOnline);
        return () => socket.off("userCameOnline", handleUserOnline);
    }, [socket, selectedChat, user, dispatch, messages]);

    useEffect(() => {
        if (!socket || !selectedChat) return;
        const unseenMessages = messages.filter(msg => msg.senderId === selectedChat._id && !msg.seen);
        if (!unseenMessages.length) return;
        unseenMessages.forEach(msg => socket.emit("messageSeen", { messageId: msg._id, senderId: msg.senderId }));
        const updatedMessages = messages.map(msg => msg.senderId === selectedChat._id && !msg.seen ? { ...msg, seen: true, delivered: true } : msg);
        dispatch(setMessages(updatedMessages));
    }, [messages, selectedChat, socket, dispatch]);

    useEffect(() => {
        if (!selectedChat) return;
        dispatch(clearUnreadCount(selectedChat._id));
    }, [selectedChat, dispatch]);

    useEffect(() => {
        const handleClick = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleTyping = (e) => {
        setText(e.target.value);
        if (!socket || !selectedChat || iBlocked) return;
        socket.emit("typing:start", { receiverId: selectedChat._id, userId: user._id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing:stop", { receiverId: selectedChat._id, userId: user._id });
        }, 2000);
    };

    const handleSend = () => {
        if (iBlocked) {
            toast.error("You cannot send messages to a blocked user");
            return;
        }
        if (!text.trim() && selectedFiles.length === 0 && !audioBlob) return;
        sendMessage(text, selectedFiles, audioBlob);
        setSelectedFiles([]);
        setText("");
        discardAudio();
    };

    if (!selectedChat) {
        return (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-none bg-repeat">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                        <FiMessageSquare className="text-indigo-500 dark:text-indigo-400 translate-y-0.5" size={32} />
                    </div>
                </div>
                <div className="text-center px-4">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Your Messages</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Select a conversation from the sidebar to start chatting.</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const handleClearChat = () => {
        setShowMenu(false);
        toast((t) => (
            <div className="flex flex-col gap-3 w-full">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Clear all messages? This cannot be undone.</p>
                <div className="flex gap-2 mt-1">
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await axiosInstance.delete(`/messages/clear/${selectedChat._id}`);
                            dispatch(setMessages([]));
                            toast.success("Chat cleared");
                        } catch (error) {
                            toast.error("Failed to clear chat");
                        }
                    }} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">Yes, clear</button>
                    <button onClick={() => toast.dismiss(t.id)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition">Cancel</button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const handleDeleteUser = () => {
        setShowMenu(false);
        toast((t) => (
            <div className="flex flex-col gap-3 w-full">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Delete {selectedChat.fullName} from your list? This clears your chat history and unfriends them.
                </p>
                <div className="flex gap-2 mt-1">
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            // 1. Unfriend and clear chat
                            await axiosInstance.post("/friends/unfriend", { targetId: selectedChat._id }).catch(() => {});
                            await axiosInstance.delete(`/messages/clear/${selectedChat._id}`).catch(() => {});
                            
                            // 2. Clear Redux state
                            dispatch(setMessages([]));
                            
                            // 3. ONLY remove from YOUR local list by dispatching the event
                            window.dispatchEvent(new CustomEvent("removeUserFromList", { detail: selectedChat._id }));
                            
                            dispatch(setSelectedChat(null));
                            toast.success("User deleted from your list");
                        } catch (error) {
                            toast.error("Failed to delete user");
                        }
                    }} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">Yes, delete</button>
                    <button onClick={() => toast.dismiss(t.id)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition">Cancel</button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const handleBlockUser = () => {
        setShowMenu(false);
        const action = isBlocked ? "unblock" : "block";
        toast((t) => (
            <div className="flex flex-col gap-3 w-full">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{isBlocked ? "Unblock" : "Block"} {selectedChat.fullName}?</p>
                <div className="flex gap-2 mt-1">
                    <button onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await axiosInstance.post(`/users/${action}`, { userId: selectedChat._id });
                            let updatedBlockedUsers = isBlocked ? user.blockedUsers.filter(id => id !== selectedChat._id) : [...(user.blockedUsers || []), selectedChat._id];
                            dispatch(updateUser({ blockedUsers: updatedBlockedUsers }));
                            toast.success(`User ${action}ed`);
                        } catch (error) {
                            toast.error(`Failed to ${action} user`);
                        }
                    }} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">Yes, {action}</button>
                    <button onClick={() => toast.dismiss(t.id)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition">Cancel</button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    return (
        <div
            key={selectedChat?._id}
            className="h-full flex flex-col w-full bg-slate-50 dark:bg-slate-900 relative animate-in slide-in-from-right-4 fade-in duration-200"
        >
            {/* HEADER */}
            <div className="h-[70px] sm:h-[69px] bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-4 sm:px-6 flex justify-between items-center z-10 relative shrink-0 shadow-sm">
                {showSearchBar ? (
                    <div className="flex items-center gap-3 w-full">
                        <button onClick={() => { setShowSearchBar(false); setSearch(""); }} className="text-slate-700 dark:text-slate-300 shrink-0"><FiArrowLeft size={22} /></button>
                        <div className="flex-1 relative">
                            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages..." className="w-full bg-slate-100 dark:bg-slate-700 border-none px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-800 dark:text-slate-200 dark:placeholder-slate-400" />
                            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><FiX size={16} /></button>}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-3 items-center overflow-hidden">
                            <button onClick={() => dispatch(setSelectedChat(null))} className="lg:hidden cursor-pointer dark:text-slate-200"><FiArrowLeft size={22} /></button>
                            <img src={blockedMe || !selectedChat.profilePic ? `https://ui-avatars.com/api/?name=${selectedChat.fullName}` : `${selectedChat.profilePic}?t=${Date.now()}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" alt="profile" />
                            <div className="truncate">
                                <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                                    {selectedChat.fullName}
                                    {isChatMuted && <span className="ml-2 text-slate-400 dark:text-slate-500 text-xs" title="Muted">🔕</span>}
                                </h2>
                                <p className={`text-xs ${isOnline ? "text-green-500" : "text-slate-400"}`}>
                                    {displayStatus}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3 text-slate-600 dark:text-slate-200 items-center">
                            <button onClick={() => handleInitiateCall("audio")} className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition"><FiPhone size={18} /></button>
                            <button onClick={() => handleInitiateCall("video")} className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition"><FiVideo size={18} /></button>
                            <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition"><FiMoreVertical size={18} /></button>
                            {showMenu && <MoreOptionsMenu onClose={() => setShowMenu(false)} onClearChat={handleClearChat} onDeleteUser={handleDeleteUser} onBlockUser={handleBlockUser} onSearch={() => { setShowSearchBar(true); setShowMenu(false); }} onMute={handleMuteChat} isMuted={isChatMuted} />}
                        </div>
                    </>
                )}
            </div>

            {/* MESSAGES OR SKELETON */}
            <div className="flex-1 overflow-y-auto relative bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 bg-repeat relative" style={{
                backgroundImage: `url('/assets/theme-bg.jpg')`,
            }}>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                <div className="space-y-2">
                    {filteredMessages.map((message, index) => {
                        const currentDate = new Date(message.createdAt).toDateString();
                        const previousDate = index > 0 ? new Date(filteredMessages[index - 1].createdAt).toDateString() : null;
                        return (
                            <div key={message._id} className="px-2">
                                {currentDate !== previousDate && (
                                    <div className="text-center my-4">
                                        <span className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full text-xs text-slate-600 dark:text-slate-300 shadow-sm">{currentDate}</span>
                                    </div>
                                )}
                                <MessageBubble
                                    messageObj={message}
                                    message={message.text}
                                    own={(message.senderId?._id || message.senderId)?.toString() === user._id.toString()}
                                    time={new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    delivered={iBlocked && (message.senderId?._id || message.senderId)?.toString() === user._id.toString() ? false : message.delivered}
                                    seen={iBlocked && (message.senderId?._id || message.senderId)?.toString() === user._id.toString() ? false : message.seen}
                                    onImageClick={(images, clickedIndex) => {
                                        setLightboxData({ isOpen: true, images: images, currentIndex: clickedIndex });
                                    }}
                                />
                            </div>
                        );
                    })}
                    {typingUsers.includes(selectedChat._id) && !iBlocked && <TypingIndicator />}
                    <div ref={messagesEndRef} className="h-4" /> 
                </div>
                )}
            </div>

            {/* INPUT AREA */}
            <div className="bg-white dark:bg-slate-800 border-t dark:border-slate-700 px-4 py-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {iBlocked ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-3 text-sm">You have blocked this user. Unblock them to send a message.</div>
                ) : (
                    <>
                        <ReplyPreview />
                        {selectedFiles.length > 0 && (
                            <div className="flex gap-3 mb-4 overflow-x-auto">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                        <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><FiX size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {audioBlob && audioUrl && (
                            <div className="flex items-center gap-3 mb-4 bg-slate-100 dark:bg-slate-700 p-2 rounded-xl w-max">
                                <audio src={audioUrl} controls className="h-10 dark:invert-[0.9]" />
                                <button onClick={discardAudio} className="bg-black/50 text-white rounded-full p-1"><FiX size={14} /></button>
                            </div>
                        )}

                        <div className="bg-slate-100 dark:bg-slate-700 rounded-full px-4 h-[50px] sm:h-[58px] flex items-center gap-3">
                            <div ref={emojiRef} className="relative">
                                <button onClick={() => setShowEmoji(!showEmoji)} className="text-slate-500 dark:text-slate-300"><FiSmile size={20} /></button>
                                {showEmoji && <div className="absolute bottom-14 left-0 z-50"><EmojiPicker onEmojiClick={(e) => setText((p) => p + e.emoji)} theme="auto" /></div>}
                            </div>
                            <label className="cursor-pointer text-slate-500 dark:text-slate-300"><input hidden multiple type="file" onChange={(e) => setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)])} /><FiPaperclip size={20} /></label>
                            {isRecording ? (
                                <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/30 rounded-full px-4 py-1.5">
                                    <div className="flex items-center gap-3 text-red-500">
                                        <div className={`w-2.5 h-2.5 rounded-full bg-red-500 ${isPaused ? '' : 'animate-pulse'}`}></div>
                                        <span className="font-mono text-sm w-10">{formatAudioTime(recordingTime)}</span>
                                        <button onClick={() => isPaused ? resumeRecording() : pauseRecording()}>{isPaused ? <FiPlay /> : <FiPause />}</button>
                                    </div>
                                    <button onClick={cancelRecording} className="text-red-400"><FiX size={18} /></button>
                                </div>
                            ) : (
                                <input value={text} onChange={handleTyping} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder="Type a message..." className="flex-1 bg-transparent outline-none text-sm sm:text-base text-slate-700 dark:text-slate-200 dark:placeholder-slate-400" disabled={!!audioBlob} />
                            )}
                            <button onClick={text.trim() || selectedFiles.length > 0 || audioBlob ? handleSend : (isRecording ? stopRecording : startRecording)} className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-indigo-500 text-white"}`}>
                                {text.trim() || selectedFiles.length > 0 || audioBlob ? <FiSend size={18} /> : (isRecording ? <FiSquare size={16} /> : <FiMic size={18} />)}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* THE LIGHTBOX OVERLAY */}
            {lightboxData.isOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200" onClick={closeLightbox}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition bg-black/20 hover:bg-black/40 rounded-full z-50" onClick={closeLightbox}>
                        <FiX size={28} />
                    </button>
                    {lightboxData.images.length > 1 && (
                        <>
                            <button className="absolute left-4 sm:left-10 text-white/70 hover:text-white p-3 transition bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md z-50" onClick={handlePrevImage}>
                                <FiChevronLeft size={32} />
                            </button>
                            <button className="absolute right-4 sm:right-10 text-white/70 hover:text-white p-3 transition bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md z-50" onClick={handleNextImage}>
                                <FiChevronRight size={32} />
                            </button>
                        </>
                    )}
                    <img src={lightboxData.images[lightboxData.currentIndex]} alt="lightbox view" className="max-w-[90vw] max-h-[85vh] object-contain select-none relative z-40" onClick={(e) => e.stopPropagation()} />
                    {lightboxData.images.length > 1 && (
                        <div className="absolute bottom-8 bg-black/50 text-white/90 font-medium px-4 py-1.5 rounded-full text-sm tracking-wide z-50">
                            {lightboxData.currentIndex + 1} / {lightboxData.images.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}