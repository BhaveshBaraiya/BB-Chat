import { useContext, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiPhone, FiVideo, FiMoreVertical, FiSmile, FiPaperclip, FiSend, FiMic, FiSquare, FiX, FiPause, FiPlay } from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";

import { SocketContext } from "../../context/SocketContext";
import { CallContext } from "../../context/CallContext";
import { setSelectedChat, clearUnreadCount, setMessages } from "../../redux/features/chatSlice";
import { setCallState } from "../../redux/features/callSlice";

import useMessages from "../../hooks/useMessages";
import useSendMessage from "../../hooks/useSendMessage";
import { useAudioRecorder } from '../../hooks/useAudioRecorder'; 
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ReplyPreview from "./ReplyPreview";

export default function ChatWindow() {
    const dispatch = useDispatch();
    
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    const typingUsers = useSelector((state) => state.chat.typingUsers);
    const call = useSelector((state) => state.call);
    const user = useSelector((state) => state.auth.user);
    
    const { socket, onlineUsers } = useContext(SocketContext);
    const { myVideo, userVideo, peerRef, connectionRef } = useContext(CallContext);
    
    const { messages } = useMessages();
    const { sendMessage } = useSendMessage();
    
    const [text, setText] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showEmoji, setShowEmoji] = useState(false);
    const [search, setSearch] = useState("");
    const [showMenu, setShowMenu] = useState(false);

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

    const initiateCall = async(type) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === "video",
                audio: true
            });

            dispatch(setCallState({
                active: true,
                type,
                stream,
                from: selectedChat._id,
                remoteName: selectedChat.fullName,
                remotePic: selectedChat.profilePic
            }));

            sendMessage(type === "video" ? "📹 Started a video call" : "📞 Started a voice call");

            socket.emit("call:initiate", {
                to: selectedChat._id,
                type,
                peerId: peerRef.current.id,
                callerName: user.fullName,
                callerPic: user.profilePic
            });

            const outgoingCall = peerRef.current.call(selectedChat.peerId, stream);
            outgoingCall.on("stream", (remoteStream) => {
                if (userVideo?.current) userVideo.current.srcObject = remoteStream;
            });
            connectionRef.current = outgoingCall;
        } catch (err) {
            console.log(err);
        }
    };

    const MoreOptionsMenu = ({ onClose, onClearChat, onBlockUser }) => (
        <div className="absolute top-16 right-6 bg-white shadow-xl border border-slate-100 rounded-xl py-2 w-48 z-50">
            <button onClick={onClearChat} className="w-full px-4 py-2 text-left hover:bg-slate-50 text-red-500 text-sm">Clear Chat</button>
            <button onClick={onBlockUser} className="w-full px-4 py-2 text-left hover:bg-slate-50 text-slate-700 text-sm">Block User</button>
            <button onClick={onClose} className="w-full px-4 py-2 text-left hover:bg-slate-50 text-slate-700 text-sm">Close</button>
        </div>
    );

    const messagesEndRef = useRef(null);
    const emojiRef = useRef(null);
    const isOnline = onlineUsers.includes(selectedChat?._id);
    const filteredMessages = messages.filter(msg => msg.text?.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    useEffect(() => {
        if (!socket || !selectedChat || !user) return;
        const handleUserOnline = (onlineUserId) => {
            if (onlineUserId !== selectedChat._id) return;
            const updatedMessages = messages.map(msg => 
                msg.senderId === user?._id && !msg.delivered ? { ...msg, delivered: true } : msg
            );
            dispatch(setMessages(updatedMessages));
        };
        socket.on("userCameOnline", handleUserOnline);
        return () => socket.off("userCameOnline", handleUserOnline);
    }, [socket, selectedChat, user, messages, dispatch]); 

    useEffect(() => {
        if (!socket || !selectedChat) return;
        const unseenMessages = messages.filter(msg => msg.senderId === selectedChat._id && !msg.seen);
        if (!unseenMessages.length) return;
        unseenMessages.forEach(msg => socket.emit("messageSeen", { messageId: msg._id, senderId: msg.senderId }));
        const updatedMessages = messages.map(msg => 
            msg.senderId === selectedChat._id && !msg.seen ? { ...msg, seen: true, delivered: true } : msg
        );
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

    useEffect(() => {
        if(call.stream && myVideo.current) { myVideo.current.srcObject = call.stream; }
    }, [call.stream, myVideo]);

    const handleSend = () => {
        if (!text.trim() && selectedFiles.length === 0 && !audioBlob) return;
        sendMessage(text, selectedFiles, audioBlob);
        setSelectedFiles([]);
        setText("");
        discardAudio();
    };

    if (!selectedChat) {
        return (
            <div className="flex-1 hidden md:flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-700">Select a conversation</h2>
                    <p className="text-slate-500 mt-2">Start chatting 🚀</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="h-[100dvh] flex flex-col w-full bg-slate-50">
            {/* HEADER */}
            <div className="h-[70px] sm:h-[80px] bg-white border-b px-4 sm:px-6 flex justify-between items-center z-10 relative">
                <div className="flex gap-3 items-center overflow-hidden">
                    <button onClick={() => dispatch(setSelectedChat(null))} className="md:hidden">
                        <FiArrowLeft size={22} />
                    </button>
                    <img src={selectedChat.profilePic ? `${selectedChat.profilePic}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${selectedChat.fullName}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" alt="profile" />
                    <div className="truncate">
                        <h2 className="font-semibold text-slate-800 text-sm sm:text-base">{selectedChat.fullName}</h2>
                        <p className={`text-xs ${isOnline ? "text-green-500" : "text-slate-400"}`}>{isOnline ? "Online" : "Offline"}</p>
                    </div>
                </div>

                <div className="flex gap-2 sm:gap-3 text-slate-600">
                    <button onClick={() => initiateCall('audio')} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"><FiPhone size={18} /></button>
                    <button onClick={() => initiateCall('video')} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"><FiVideo size={18} /></button>
                    <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"><FiMoreVertical size={18} /></button>
                    {showMenu && <MoreOptionsMenu onClose={() => setShowMenu(false)} />}
                </div>
            </div>
            
            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-slate-50">
                <div className="space-y-2">
                    {filteredMessages.map((message, index) => {
                        const currentDate = new Date(message.createdAt).toDateString();
                        const previousDate = index > 0 ? new Date(filteredMessages[index - 1].createdAt).toDateString() : null;
                        return (
                            <div key={message._id}>
                                {currentDate !== previousDate && (
                                    <div className="text-center my-4">
                                        <span className="bg-slate-200 px-3 py-1 rounded-full text-xs text-slate-600">{currentDate}</span>
                                    </div>
                                )}
                                <MessageBubble
                                    messageObj={message}
                                    message={message.text}
                                    own={(message.senderId?._id || message.senderId)?.toString() === user._id.toString()}
                                    time={new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    delivered={message.delivered}
                                    seen={message.seen}
                                />
                            </div>
                        );
                    })}
                    {typingUsers.includes(selectedChat._id) && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* INPUT AREA */}
            <div className="bg-white border-t px-4 py-4 shrink-0">
                <ReplyPreview />
                {selectedFiles.length > 0 && (
                    <div className="flex gap-3 mb-4 overflow-x-auto">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><FiX size={12} /></button>
                            </div>
                        ))}
                    </div>
                )}
                {audioBlob && audioUrl && (
                    <div className="flex items-center gap-3 mb-4 bg-slate-100 p-2 rounded-xl w-max">
                        <audio src={audioUrl} controls className="h-10" />
                        <button onClick={discardAudio} className="bg-black/50 text-white rounded-full p-1"><FiX size={14} /></button>
                    </div>
                )}
                
                <div className="bg-slate-100 rounded-full px-4 h-[50px] sm:h-[58px] flex items-center gap-3">
                    <div ref={emojiRef} className="relative">
                        <button onClick={() => setShowEmoji(!showEmoji)} className="text-slate-500"><FiSmile size={20} /></button>
                        {showEmoji && <div className="absolute bottom-14 left-0 z-50"><EmojiPicker onEmojiClick={(e) => setText((p) => p + e.emoji)} /></div>}
                    </div>
                    <label className="cursor-pointer text-slate-500"><input hidden multiple type="file" onChange={(e) => setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)])} /><FiPaperclip size={20} /></label>
                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between bg-red-50 rounded-full px-4 py-1.5">
                             <div className="flex items-center gap-3 text-red-500">
                                <div className={`w-2.5 h-2.5 rounded-full bg-red-500 ${isPaused ? '' : 'animate-pulse'}`}></div>
                                <span className="font-mono text-sm w-10">{formatAudioTime(recordingTime)}</span>
                                <button onClick={() => isPaused ? resumeRecording() : pauseRecording()}>{isPaused ? <FiPlay /> : <FiPause />}</button>
                            </div>
                            <button onClick={cancelRecording} className="text-red-400"><FiX size={18} /></button>
                        </div>
                    ) : (
                        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} placeholder="Type a message..." className="flex-1 bg-transparent outline-none text-sm sm:text-base text-slate-700" disabled={!!audioBlob} />
                    )}
                    <button onClick={text.trim() || selectedFiles.length > 0 || audioBlob ? handleSend : (isRecording ? stopRecording : startRecording)} className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-indigo-500 text-white"}`}>
                        {text.trim() || selectedFiles.length > 0 || audioBlob ? <FiSend size={18} /> : (isRecording ? <FiSquare size={16} /> : <FiMic size={18} />)}
                    </button>
                </div>
            </div>
        </div>
    );
}