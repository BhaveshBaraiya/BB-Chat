import { useState, useRef, useEffect, memo } from "react";
import EmojiPicker from "emoji-picker-react";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import { FiCornerUpLeft, FiMoreVertical, FiCornerUpRight, FiSmile, FiEdit2, FiCopy, FiInfo, FiDownload, FiX, FiPlay, FiPause, FiMic } from "react-icons/fi";
import { LuPin } from "react-icons/lu";
import { setReplyMessage, setForwardMessageData } from "../../redux/features/chatSlice";
import useDeleteMessage from "../../hooks/useDeleteMessage";
import useReaction from "../../hooks/useReaction";
import useEditMessage from "../../hooks/useEditMessage";
import usePinMessage from "../../hooks/usePinMessage";
import { useDispatch } from "react-redux";

const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

const getMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
};

const WhatsAppAudioPlayer = ({ src, own }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);

    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current.duration === Infinity || isNaN(audioRef.current.duration)) {
            setDuration(100); 
        } else {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const time = Number(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (time) => {
        if (!time || isNaN(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3 w-full min-w-[180px] sm:min-w-[220px]">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
            />
            
            <button onClick={togglePlayPause} className={`text-xl sm:text-2xl flex-shrink-0 focus:outline-none ${own ? 'text-white' : 'text-slate-600'}`}>
                {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} className="ml-0.5" />}
            </button>

            <div className="flex flex-col flex-1 mt-1">
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className={`w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none ${
                        own ? "bg-indigo-400 accent-white" : "bg-slate-200 accent-indigo-500"
                    }`}
                />
                <div className={`flex justify-between mt-1.5 text-[9px] sm:text-[10px] font-medium ${own ? 'text-indigo-100' : 'text-slate-400'}`}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0 flex items-center justify-center ${own ? 'bg-indigo-400' : 'bg-slate-200'}`}>
                <FiMic className={own ? 'text-indigo-100' : 'text-slate-500'} size={16} />
            </div>
        </div>
    );
};

const MessageBubble = ({ messageObj, message, own, time, delivered, seen, onImageClick }) => {
    const dispatch = useDispatch();

    const { deleteForMe, deleteForEveryone } = useDeleteMessage();
    const { reactToMessage } = useReaction();
    const { editMessage } = useEditMessage();
    const { pinMessage } = usePinMessage();
    const [showMenu, setShowMenu] = useState(false);
    const [showReaction, setShowReaction] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedText, setEditedText] = useState(message);

    const menuRef = useRef(null);
    const reactionRef = useRef(null);
    const infoRef = useRef(null);
    const messageRef = useRef(null);
    const longPressTimer = useRef(null);

    const emojis = ["❤️", "😂", "🔥", "👍", "😮"];

    const hasAttachments = 
        (messageObj.images && messageObj.images.length > 0) || 
        (messageObj.documents && messageObj.documents.length > 0) || 
        (messageObj.audio && messageObj.audio !== "");

    const actionVisible = showMenu || showReaction || showEmojiPicker || showInfo;

    useEffect(() => {
        if (!actionVisible) return;

        const handleClickOutside = (e) => {            
            const isMobile = window.innerWidth < 768;
            if (isMobile) return; 

            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
            if (reactionRef.current && !reactionRef.current.contains(e.target)) {
                setShowReaction(false);
                setShowEmojiPicker(false);
            }
            if (infoRef.current && !infoRef.current.contains(e.target)) setShowInfo(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [actionVisible]);

    const handleTouchStart = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile && !actionVisible) {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
            longPressTimer.current = setTimeout(() => {
                setShowMenu(true);
            }, 500); 
        }
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleTouchMove = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const renderStatus = () => {
        if (!own) return null;
        if (seen) return <BsCheckAll size={16} className="text-sky-400 -ml-1" />;
        if (delivered) return <BsCheckAll size={16} className="text-gray-300 -ml-1" />;
        return <BsCheck size={16} className="text-gray-300" />;
    };

    const handleCopy = async (e) => {
        if(e) e.stopPropagation();
        try {
            if (message) {
                await navigator.clipboard.writeText(message);
            } else if (messageObj.images && messageObj.images.length > 0) {
                const imgUrl = getMediaUrl(messageObj.images[0]);
                const response = await fetch(imgUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
            }
        } catch (error) {
            console.error("Copy failed.", error);
        } finally {
            closeAllMobileModals();
        }
    };

    const closeAllMobileModals = () => {
        setShowMenu(false);
        setShowReaction(false);
        setShowEmojiPicker(false);
        setShowInfo(false);
    };

    const handleReplyClick = (e) => {
        e.stopPropagation();
        dispatch(setReplyMessage(messageObj));
        closeAllMobileModals();
    };

    const handleForwardClick = (e) => {
        e.stopPropagation();
        dispatch(setForwardMessageData(messageObj));
        closeAllMobileModals();
    };

    const handleReactionClick = (e, emoji) => {
        e.stopPropagation();
        reactToMessage(messageObj._id, emoji);
        closeAllMobileModals();
    };

    const handlePinClick = (e) => {
        e.stopPropagation();
        pinMessage(messageObj._id);
        closeAllMobileModals();
    };

    const handleDeleteForMeClick = (e) => {
        e.stopPropagation();
        deleteForMe(messageObj._id);
        closeAllMobileModals();
    };

    const handleDeleteForEveryoneClick = (e) => {
        e.stopPropagation();
        deleteForEveryone(messageObj._id);
        closeAllMobileModals();
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        setEditing(true);
        closeAllMobileModals();
    };

    const handleInfoClick = (e) => {
        e.stopPropagation();
        setShowInfo(true);
        closeAllMobileModals();
    };

    const isMobileUI = window.innerWidth < 768;

    return (
        <div 
            className={`flex w-full mb-3 group ${own ? "justify-end" : "justify-start"}`}
            ref={messageRef}
        >
            <div 
                className={`flex items-center gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[70%] ${own ? "flex-row-reverse" : "flex-row"}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
            >
                <div className={`relative flex flex-col ${own ? "items-end" : "items-start"} max-w-full`}>
                    <div 
                        className={`relative px-3 sm:px-4 py-2 sm:py-3 rounded-2xl break-words w-full ${
                            own ? "bg-indigo-500 text-white" : "bg-white text-black shadow-sm border border-slate-100"
                        } ${isMobileUI ? 'cursor-pointer' : ''}`}
                    >
                        {messageObj.isForwarded && (
                            <div className={`flex items-center gap-1 text-[10px] sm:text-[11px] mb-2 italic opacity-80 ${own ? "text-white" : "text-slate-500"}`}>
                                <FiCornerUpRight size={12} />
                                <span>Forwarded</span>
                            </div>
                        )}
                        
                        {messageObj.pinned && (
                            <div className={`flex items-center gap-1 text-[10px] sm:text-[11px] mb-2 opacity-80 ${own ? "text-white" : "text-black"}`}>
                                <LuPin size={12} />
                                <span>Pinned</span>
                            </div>
                        )}

                        {messageObj.replyTo && (
                            <div className={`text-xs opacity-80 border-l-4 pl-2 mb-2 ${own ? "border-indigo-300" : "border-indigo-500"}`}>
                                Replying: {messageObj.replyTo.text}
                            </div>
                        )}

                        {messageObj.isDeletedForEveryone ? (
                            <p className="italic opacity-60 text-sm">This message was deleted</p>
                        ) : editing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="border rounded-lg px-2 py-1 text-black flex-1 min-w-[120px] sm:min-w-[150px]"
                                    autoFocus
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        editMessage(messageObj._id, editedText);
                                        setEditing(false);
                                    }}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded text-xs"
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <div>
                                {messageObj.images && messageObj.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 justify-center">
                                        {messageObj.images.map((img, index) => (
                                            <img
                                                key={index}
                                                src={getMediaUrl(img)} 
                                                alt="attachment"
                                                onClick={(e) => { 
                                                    e.stopPropagation();                                                    
                                                    if(onImageClick) {
                                                        const resolvedImages = messageObj.images.map(i => getMediaUrl(i));
                                                        onImageClick(resolvedImages, index);
                                                    }
                                                }}
                                                className="max-w-[180px] rounded-xl cursor-pointer hover:opacity-95 transition object-cover"
                                            />
                                        ))}
                                    </div>
                                )}

                                {messageObj.documents && messageObj.documents.length > 0 && (
                                    <div className="flex flex-col gap-2 mb-2">
                                        {messageObj.documents.map((doc, index) => (
                                            <a
                                                key={index}
                                                href={getMediaUrl(doc.fileUrl)} 
                                                download={doc.fileName}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg text-sm transition ${
                                                    own ? "bg-white/20 hover:bg-white/30 text-white" : "bg-slate-100 hover:bg-slate-200 text-black"
                                                }`}
                                            >
                                                <span className="text-xl">📄</span>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="truncate font-medium text-xs sm:text-sm">{doc.fileName}</span>
                                                    <span className="text-[10px] opacity-80">{doc.fileSize}</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {messageObj.audio && (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <WhatsAppAudioPlayer src={getMediaUrl(messageObj.audio)} own={own} />
                                    </div>
                                )}

                                {message && (
                                    <p className="whitespace-pre-wrap break-words mt-1 text-sm sm:text-base">
                                        {message}
                                        {messageObj.edited && (
                                            <span className="text-[10px] opacity-70 ml-2">(edited)</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1.5">
                            <span className="text-[9px] sm:text-[10px] opacity-70">{time}</span>
                            {renderStatus()}
                        </div>
                    </div>

                    {messageObj.reactions?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap max-w-full overflow-hidden">
                            {messageObj.reactions.map(reaction => (
                                <span key={reaction.userId} className="bg-white shadow border border-slate-100 rounded-full px-2 py-1 text-xs text-black max-w-fit">
                                    {reaction.emoji}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Action Buttons */}
                <div className={`hidden md:flex items-center gap-1.5 transition-all duration-300 transform z-10 ${
                    actionVisible 
                        ? "opacity-100 translate-x-0" 
                        : `opacity-0 group-hover:opacity-100 group-hover:translate-x-0 ${own ? "translate-x-4" : "-translate-x-4"}`
                }`}>
                    <button
                        onClick={handleReplyClick}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shadow-sm transition"
                        title="Reply"
                    >
                        <FiCornerUpLeft size={14} />
                    </button>

                    {!own && (
                        <div className="relative" ref={reactionRef}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowReaction(!showReaction); }}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shadow-sm transition"
                                title="React"
                            >
                                <FiSmile size={14} />
                            </button>

                            {showReaction && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white shadow-xl border border-slate-100 rounded-full px-3 py-2 flex items-center gap-2 z-50 w-max" onClick={(e) => e.stopPropagation()}>
                                    {emojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={(e) => handleReactionClick(e, emoji)}
                                            className="text-xl hover:scale-125 transition"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowEmojiPicker(!showEmojiPicker);
                                            setShowReaction(false);
                                        }}
                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                                    >
                                        +
                                    </button>
                                </div>
                            )}

                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl rounded-lg" onClick={(e) => e.stopPropagation()}>
                                    <EmojiPicker
                                        onEmojiClick={(emojiData) => handleReactionClick({stopPropagation: () => {}}, emojiData.emoji)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shadow-sm transition"
                            title="More options"
                        >
                            <FiMoreVertical size={14} />
                        </button>

                        {showMenu && (
                            <div className={`absolute top-full mt-2 z-50 ${own ? "right-0" : "left-0"} bg-white rounded-xl shadow-xl min-w-[220px] overflow-hidden border border-slate-100`} onClick={(e) => e.stopPropagation()}>
                                {own && !messageObj.isDeletedForEveryone && !hasAttachments && (
                                    <button onClick={handleEditClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                        <FiEdit2 size={14} /> Edit message
                                    </button>
                                )}
                                {(!messageObj.isDeletedForEveryone) && (
                                    <button onClick={handleCopy} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                        <FiCopy size={14} /> Copy
                                    </button>
                                )}
                                {(!messageObj.isDeletedForEveryone) && (
                                   <button onClick={handleForwardClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                        <FiCornerUpRight size={14} /> Forward
                                    </button>
                                )}
                                <button onClick={handlePinClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                    <LuPin size={14} /> {messageObj.pinned ? "Unpin" : "Pin"}
                                </button>
                                <button onClick={handleInfoClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                    <FiInfo size={14} /> Message info
                                </button>
                                <button onClick={handleDeleteForMeClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 text-slate-700">
                                    Delete for me
                                </button>
                                {own && (
                                    <button onClick={handleDeleteForEveryoneClick} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50">
                                        Delete for everyone
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Action Menu Modal */}
                {isMobileUI && showMenu && (
                    <div 
                        className="fixed inset-0 bg-black/40 z-[100]" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                        }}
                    >
                        <div 
                            className="absolute top-16 right-4 w-[220px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100"
                            onClick={(e) => e.stopPropagation()} 
                        >
                            <button onClick={handleReplyClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                <FiCornerUpLeft size={14} /> Reply
                            </button>
                            
                            {!own && (
                                <button 
                                    onClick={() => { setShowReaction(true); setShowMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                                >
                                    <FiSmile size={14} /> React
                                </button>
                            )}
                            
                            {own && !messageObj.isDeletedForEveryone && !hasAttachments && (
                                <button onClick={handleEditClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                    <FiEdit2 size={14} /> Edit message
                                </button>
                            )}
                            
                            {!messageObj.isDeletedForEveryone && (
                                <button onClick={handleCopy} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                    <FiCopy size={14} /> Copy
                                </button>
                            )}
                            
                            {!messageObj.isDeletedForEveryone && (
                                <button onClick={handleForwardClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                    <FiCornerUpRight size={14} /> Forward
                                </button>
                            )}
                            
                            <button onClick={handlePinClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                <LuPin size={14} /> {messageObj.pinned ? "Unpin" : "Pin"}
                            </button>
                            
                            <button onClick={handleInfoClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700">
                                <FiInfo size={14} /> Message info
                            </button>
                            
                            <button onClick={handleDeleteForMeClick} className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 text-slate-700">
                                Delete for me
                            </button>
                            
                            {own && (
                                <button onClick={handleDeleteForEveryoneClick} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50">
                                    Delete for everyone
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile Reaction Modal */}
                {isMobileUI && showReaction && (
                    <div 
                        className="fixed inset-0 bg-black/40 z-[100]" 
                        onClick={(e) => { e.stopPropagation(); setShowReaction(false); }}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <div 
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-4"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <div className="flex gap-3 mb-4 justify-center">
                                {emojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={(e) => handleReactionClick(e, emoji)}
                                        className="text-2xl hover:scale-125 transition"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowEmojiPicker(true);
                                        setShowReaction(false);
                                    }}
                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xl"
                                >
                                    +
                                </button>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowReaction(false); }}
                                className="w-full py-2 bg-slate-100 rounded-lg text-sm text-slate-700 hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Mobile Emoji Picker Modal */}
                {isMobileUI && showEmojiPicker && (
                    <div 
                        className="fixed inset-0 bg-black/40 z-[100]" 
                        onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <div 
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()} 
                        >
                            <EmojiPicker
                                onEmojiClick={(emojiData) => handleReactionClick({stopPropagation: () => {}}, emojiData.emoji)}
                            />
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}
                                className="w-full py-2 bg-white rounded-b-xl text-sm text-slate-700 hover:bg-slate-100 border-t border-slate-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Message Info Modal */}
            {showInfo && (
                <div 
                    className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" 
                    onClick={(e) => { e.stopPropagation(); setShowInfo(false); }}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <div 
                        ref={infoRef} 
                        className="bg-white rounded-2xl p-5 w-[90%] sm:w-[320px] max-w-[320px] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="font-semibold text-lg mb-4 text-black">Message Info</h2>
                        <div className="space-y-2 text-sm text-black">
                            <p><b>Time:</b> {time}</p>
                            <p><b>Status:</b> {seen ? "Seen" : delivered ? "Delivered" : "Sent"}</p>
                            <p><b>Reactions:</b> {messageObj.reactions?.length || 0}</p>
                            <p><b>Edited:</b> {messageObj.edited ? "Yes" : "No"}</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowInfo(false); }} 
                            className="mt-5 w-full py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(MessageBubble);