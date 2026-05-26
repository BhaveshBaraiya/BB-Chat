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
    FiX,
    FiPause,
    FiPlay
} from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";

import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";

import useMessages from "../../hooks/useMessages";
import useSendMessage from "../../hooks/useSendMessage";
import { useAudioRecorder } from '../../hooks/useAudioRecorder'; 
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ReplyPreview from "./ReplyPreview";

import { CallContext } from "../../context/CallContext";
import CallOverlay from "./CallOverlay";

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

    const { call, setCall, myVideo, userVideo, peerRef, connectionRef } = useContext(CallContext);
    
    const {
        isRecording,
        isPaused,
        recordingTime,
        audioBlob,
        audioUrl,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        cancelRecording,
        discardAudio
    } = useAudioRecorder();

    const formatAudioTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const [showMenu, setShowMenu] = useState(false);

    const initiateCall = async (type) => {

    try {

        const stream =
        await navigator.mediaDevices.getUserMedia({
            video:type==="video",
            audio:true
        });

        myVideo.current.srcObject=stream;

        setCall(prev=>({
            ...prev,
            stream,
            active:true
        }));


        socket.emit(
            "call:initiate",
            {
                to:selectedChat._id,
                type,
                peerId:peerRef.current.id
            }
        );


        const outgoingCall=
        peerRef.current.call(
            selectedChat._id,
            stream
        );

        outgoingCall.on("stream",
            (remoteStream)=>{
                userVideo.current.srcObject=
                remoteStream
            }
        );

        connectionRef.current=
        outgoingCall;
    }
    catch(err){
        console.log(err)
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
    const filteredMessages = messages.filter(msg => 
        msg.text?.toLowerCase().includes(search.toLowerCase())
    );

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
        if (!socket) return;
        socket.on("call:incoming", (data) => {
            // In a real app, you would set a state here to show your <CallModal />
            console.log(`Incoming ${data.type} call from ${data.from}`);
            alert(`Incoming ${data.type} call!`);
        });
        return () => socket.off("call:incoming");
    }, [socket]);

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

    useEffect(() => {
        if (!socket) return;
        socket.on("call:incoming",(data)=>{

            setCall({
                isReceivingCall:true,
                from:data.from,
                type:data.type,
                peerId:data.peerId
            })

            })
        return () => socket.off("call:incoming");
    }, [socket, setCall]);

    const acceptCall=async()=>{

        const stream=
        await navigator.mediaDevices.getUserMedia({

        video:call.type==="video",
        audio:true

        })

        myVideo.current.srcObject=
        stream


        setCall(prev=>({

        ...prev,
        stream,
        active:true,
        isReceivingCall:false

        }))


        const incomingCall=
        peerRef.current.call(
            call.peerId,
            stream
        )


        incomingCall.on(
            "stream",
            (remoteStream)=>{

            userVideo.current.srcObject=
            remoteStream

        })

        connectionRef.current=
        incomingCall

        }
const endCall=()=>{

connectionRef.current?.close()

call.stream
?.getTracks()
.forEach(track=>track.stop())

setCall({

isReceivingCall:false,
from:null,
type:null,
active:false,
peerId:null,
stream:null

})

}

useEffect(()=>{

if(call.stream && myVideo.current){

myVideo.current.srcObject=
call.stream

}

},[call.stream])

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

    return (
        <div className="h-screen flex flex-col w-full">
            <CallOverlay onEndCall={endCall} onAccept={acceptCall} />
            <div className="h-[80px] bg-white border-b px-6 flex justify-between items-center z-10 relative">
                <div className="flex gap-3 items-center">
                    <button onClick={() => setSelectedChat(null)} className="md:hidden">
                        <FiArrowLeft size={22} />
                    </button>
                    <img src={selectedChat.profilePic ? `${selectedChat.profilePic}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${selectedChat.fullName}`} className="w-12 h-12 rounded-full object-cover" alt="profile" />
                    <div>
                        <h2 className="font-semibold text-slate-800">{selectedChat.fullName}</h2>
                        <p className={`text-sm ${isOnline ? "text-green-500" : "text-slate-400"}`}>{isOnline ? "Online" : "Offline"}</p>
                    </div>
                </div>

                <div className="flex gap-3 text-slate-600">
                    <button onClick={() => initiateCall('audio')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                        <FiPhone />
                    </button>
                    <button onClick={() => initiateCall('video')} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                        <FiVideo />
                    </button>
                    <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                        <FiMoreVertical />
                    </button>
                    {showMenu && <MoreOptionsMenu onClose={() => setShowMenu(false)} />}
                </div>
            </div>
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

            <div className="bg-white border-t px-4 py-4">
                <ReplyPreview />

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

                {audioBlob && (
                    <div className="flex items-center gap-3 mb-3 bg-indigo-50 border border-indigo-100 p-2 rounded-full w-max">
                        <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                        <button type="button" onClick={discardAudio} className="bg-red-100 text-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-200 transition">
                            <FiX size={16}/>
                        </button>
                    </div>
                )}

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
                        <div className="flex-1 flex items-center justify-between bg-red-50 rounded-full px-4 py-1.5 border border-red-100">
                            <div className="flex items-center gap-3 text-red-500">
                                <div className={`w-2.5 h-2.5 rounded-full bg-red-500 ${isPaused ? '' : 'animate-pulse'}`}></div>
                                <span className="font-mono text-sm font-medium w-10">{formatAudioTime(recordingTime)}</span>
                                
                                <button 
                                    type="button" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        isPaused ? resumeRecording() : pauseRecording();
                                    }} 
                                    className="text-red-500 hover:text-red-700 transition flex items-center justify-center p-1 rounded-full hover:bg-red-100"
                                >
                                    {isPaused ? <FiPlay size={16} /> : <FiPause size={16} />}
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center gap-1 h-4 opacity-70 ${isPaused ? 'hidden' : ''}`}>
                                    <div className="w-1 bg-red-400 h-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1 bg-red-400 h-2/3 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1 bg-red-400 h-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <div className={`text-xs text-red-400 font-medium ${isPaused ? '' : 'hidden'}`}>Paused</div>
                                
                                <button 
                                    type="button" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        cancelRecording();
                                    }} 
                                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
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
                            disabled={!!audioBlob}
                        />
                    )}

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