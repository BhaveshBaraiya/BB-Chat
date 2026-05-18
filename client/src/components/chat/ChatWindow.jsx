import { useContext, useState, useRef, useEffect } from "react";
import {
    FiArrowLeft,
    FiPhone,
    FiVideo,
    FiMoreVertical,
    FiSmile,
    FiPaperclip,
    FiSend,
    FiMic,
    FiSquare,
    FiX
} from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";

import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";

import useMessages from "../../hooks/useMessages";
import useSendMessage from "../../hooks/useSendMessage";

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ReplyPreview from "./ReplyPreview";

export default function ChatWindow() {
    const { selectedChat, setSelectedChat, typingUsers, setUnreadCounts } = useContext(ChatContext);
    const { user } = useContext(AuthContext);
    const { socket, onlineUsers } = useContext(SocketContext);
    const { messages, setMessages } = useMessages();
    const { sendMessage } = useSendMessage();
    
    const [text, setText] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showEmoji, setShowEmoji] = useState(false);
    const [search, setSearch] = useState("");
    
    // NEW AUDIO STATES
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const messagesEndRef = useRef(null);
    const emojiRef = useRef(null);
    
    const isOnline = onlineUsers.includes(selectedChat?._id);
    const filteredMessages = messages.filter(msg => 
        msg.text?.toLowerCase().includes(search.toLowerCase())
    );
    const pinnedMessage = messages.find(msg => msg.pinned);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!socket || !selectedChat) return;

        const handleUserOnline = (onlineUserId) => {
            if (onlineUserId !== selectedChat._id) return;
            setMessages(prev => prev.map(msg =>
                msg.senderId === user._id && !msg.delivered ? { ...msg, delivered: true } : msg
            ));
        };

        socket.on("userCameOnline", handleUserOnline);

        return () => {
            socket.off("userCameOnline", handleUserOnline);
        };
    }, [socket, selectedChat, user._id]);

    useEffect(() => {
        if (!socket || !selectedChat) return;

        const unseenMessages = messages.filter(msg =>
            msg.senderId === selectedChat._id && !msg.seen
        );

        if (!unseenMessages.length) return;

        unseenMessages.forEach(msg => {
            socket.emit("messageSeen", {
                messageId: msg._id,
                senderId: msg.senderId
            });
        });

        setMessages(prev =>
            prev.map(msg =>
                msg.senderId === selectedChat._id && !msg.seen
                    ? { ...msg, seen: true, delivered: true }
                    : msg
            )
        );
    }, [messages, selectedChat, socket]);

    useEffect(() => {
        if (!selectedChat) return;
        setUnreadCounts(prev => ({
            ...prev,
            [selectedChat._id]: 0
        }));
    }, [selectedChat, setUnreadCounts]);

    useEffect(() => {
        const handleClick = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) {
                setShowEmoji(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
    }, []);

    // AUDIO RECORDING LOGIC
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic usage
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Microphone access denied or unavailable.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSend = () => {
        if (!text.trim() && selectedFiles.length === 0 && !audioBlob) return;

        // Pass the audioBlob as the third parameter to your hook
        sendMessage(text, selectedFiles, audioBlob);
        setSelectedFiles([]);
        setText("");
        setAudioBlob(null);
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

    return (
        <div className="h-screen flex flex-col w-full">
            {/* HEADER */}
            <div className="h-[80px] bg-white border-b px-6 flex justify-between items-center z-10 relative">
                <div className="flex gap-3 items-center">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-[180px] px-4 py-2 rounded-full bg-slate-100 outline-none text-sm"
                    />
                    <button onClick={() => setSelectedChat(null)} className="md:hidden">
                        <FiArrowLeft size={22} />
                    </button>
                    <img
                        src={selectedChat.profilePic || `https://ui-avatars.com/api/?name=${selectedChat.fullName}`}
                        className="w-12 h-12 rounded-full object-cover"
                        alt="profile"
                    />
                    <div>
                        <h2 className="font-semibold text-slate-800">{selectedChat.fullName}</h2>
                        <p className={`text-sm ${isOnline ? "text-green-500" : "text-slate-400"}`}>
                            {isOnline ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 text-slate-600">
                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                        <FiPhone />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                        <FiVideo />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                        <FiMoreVertical />
                    </button>
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50">
                <div className="space-y-2">
                    {filteredMessages.map((message, index) => {
                        const currentDate = new Date(message.createdAt).toDateString();
                        const previousDate = index > 0 ? new Date(filteredMessages[index - 1].createdAt).toDateString() : null;

                        return (
                            <div key={message._id}>
                                {currentDate !== previousDate && (
                                    <div className="text-center my-4">
                                        <span className="bg-slate-200 px-3 py-1 rounded-full text-xs text-slate-600">
                                            {currentDate}
                                        </span>
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

            {/* INPUT SECTION */}
            <div className="bg-white border-t px-4 py-4">
                <ReplyPreview />

                {/* File Previews */}
                {selectedFiles.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border flex-shrink-0 bg-slate-50 shadow-sm">
                                {file.type.startsWith("image") ? (
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[10px] p-2 text-center text-slate-600 break-all">
                                        📄 {file.name}
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Audio Preview Pill */}
                {audioBlob && (
                    <div className="flex items-center gap-3 mb-3 bg-indigo-50 border border-indigo-100 p-2 rounded-full w-max">
                        <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 max-w-[200px]" />
                        <button onClick={() => setAudioBlob(null)} className="bg-red-100 text-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-200 transition">
                            <FiX size={16}/>
                        </button>
                    </div>
                )}

                {/* Input Bar */}
                <div className="bg-slate-100 rounded-full px-4 h-[58px] flex items-center gap-3">
                    <div ref={emojiRef} className="relative">
                        <button
                            onClick={() => setShowEmoji(!showEmoji)}
                            className="text-slate-500 hover:text-slate-700 transition mt-1"
                        >
                            <FiSmile size={20} />
                        </button>
                        {showEmoji && (
                            <div className="absolute bottom-14 left-0 z-50">
                                <EmojiPicker onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)} />
                            </div>
                        )}
                    </div>

                    <label className="cursor-pointer text-slate-500 hover:text-slate-700 transition mt-1">
                        <input
                            hidden
                            multiple
                            type="file"
                            onChange={(e) => {
                                setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
                            }}
                        />
                        <FiPaperclip size={20} />
                    </label>

                    {isRecording ? (
                        <div className="flex-1 flex items-center gap-2 text-red-500 font-medium animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Recording Audio...
                        </div>
                    ) : (
                        <input
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                socket.emit("typing:start", { receiverId: selectedChat._id, userId: user._id });
                                clearTimeout(window.typingTimeout);
                                window.typingTimeout = setTimeout(() => {
                                    socket.emit("typing:stop", { receiverId: selectedChat._id, userId: user._id });
                                }, 1000);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSend();
                            }}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
                            disabled={!!audioBlob} // Disable text input if audio is pending
                        />
                    )}

                    {/* DYNAMIC BUTTON: Send vs Microphone */}
                    {text.trim() || selectedFiles.length > 0 || audioBlob ? (
                        <button
                            onClick={handleSend}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition bg-indigo-500 text-white hover:bg-indigo-600"
                        >
                            <FiSend size={18} className="ml-1" />
                        </button>
                    ) : (
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition text-white shadow-sm ${
                                isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-slate-500 hover:bg-slate-600"
                            }`}
                        >
                            {isRecording ? <FiSquare size={16} /> : <FiMic size={18} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}