import { useContext, useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import { FiCornerUpLeft, FiMoreVertical, FiSmile, FiEdit2, FiCopy, FiInfo, FiDownload, FiX } from "react-icons/fi";
import { LuPin } from "react-icons/lu";

import { ChatContext } from "../../context/ChatContext";
import useDeleteMessage from "../../hooks/useDeleteMessage";
import useReaction from "../../hooks/useReaction";
import useEditMessage from "../../hooks/useEditMessage";
import usePinMessage from "../../hooks/usePinMessage";

export default function MessageBubble({ messageObj, message, own, time, delivered, seen }) {
    const { setReplyMessage } = useContext(ChatContext);
    const { deleteForMe, deleteForEveryone } = useDeleteMessage();
    const { reactToMessage } = useReaction();
    const { editMessage } = useEditMessage();
    const { pinMessage } = usePinMessage();

    const [showMenu, setShowMenu] = useState(false);
    const [showReaction, setShowReaction] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showImage, setShowImage] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editedText, setEditedText] = useState(message);

    const menuRef = useRef(null);
    const reactionRef = useRef(null);
    const infoRef = useRef(null);

    const emojis = ["❤️", "😂", "🔥", "👍", "😮"];

    const hasAttachments = 
        (messageObj.images && messageObj.images.length > 0) || 
        (messageObj.documents && messageObj.documents.length > 0) || 
        (messageObj.audio && messageObj.audio !== "");

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
            if (reactionRef.current && !reactionRef.current.contains(e.target)) {
                setShowReaction(false);
                setShowEmojiPicker(false);
            }
            if (infoRef.current && !infoRef.current.contains(e.target)) {
                setShowInfo(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const renderStatus = () => {
        if (!own) return null;
        if (seen) return <BsCheckAll size={16} className="text-sky-400 -ml-1" />;
        if (delivered) return <BsCheckAll size={16} className="text-gray-300 -ml-1" />;
        return <BsCheck size={16} className="text-gray-300" />;
    };

    const handleCopy = async () => {
        try {
            if (message) {
                await navigator.clipboard.writeText(message);
            } else if (messageObj.images && messageObj.images.length > 0) {
                const imgUrl = `http://localhost:5000${messageObj.images[0]}`;
                const response = await fetch(imgUrl);
                const blob = await response.blob();
                
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]);
            }
        } catch (error) {
            console.error("Copy failed.", error);
        } finally {
            setShowMenu(false);
        }
    };

    return (
        <div className={`flex w-full mb-3 ${own ? "justify-end" : "justify-start"}`}>
            <div className={`relative max-w-[75%] group flex flex-col ${own ? "items-end" : "items-start"}`}>
                
                <button
                    onClick={() => setReplyMessage(messageObj)}
                    className="absolute top-1/2 -translate-y-1/2 left-[-35px] opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-full bg-white shadow flex items-center justify-center z-20"
                >
                    <FiCornerUpLeft />
                </button>

                {!own && (
                    <button
                        onClick={() => setShowReaction(!showReaction)}
                        className="absolute top-1/2 -translate-y-1/2 right-[-38px] opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-full bg-white shadow flex items-center justify-center z-20"
                    >
                        <FiSmile size={16} />
                    </button>
                )}

                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition z-20 text-slate-500"
                >
                    <FiMoreVertical />
                </button>

                {/* OVERFLOW FIX: Anchored to bottom-full (above bubble) instead of the right side */}
                {!own && showReaction && (
                    <div
                        ref={reactionRef}
                        className="absolute bottom-full left-0 mb-2 bg-white shadow-xl border border-slate-100 rounded-full px-3 py-2 flex items-center gap-2 z-50 w-max"
                    >
                        {emojis.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    reactToMessage(messageObj._id, emoji);
                                    setShowReaction(false);
                                }}
                                className="text-xl hover:scale-125 transition"
                            >
                                {emoji}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                        >
                            +
                        </button>
                    </div>
                )}

                {/* OVERFLOW FIX: Emoji picker anchored safely */}
                {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 z-50 shadow-2xl rounded-lg">
                        <EmojiPicker
                            onEmojiClick={(emojiData) => {
                                reactToMessage(messageObj._id, emojiData.emoji);
                                setShowEmojiPicker(false);
                                setShowReaction(false);
                            }}
                        />
                    </div>
                )}

                {showMenu && (
                    <div ref={menuRef} className={`absolute top-10 z-50 ${own ? "right-0" : "left-0"}`}>
                        <div className="bg-white rounded-xl shadow-xl min-w-[220px] overflow-hidden border border-slate-100">
                            
                            {own && !messageObj.isDeletedForEveryone && !hasAttachments && (
                                <button
                                    onClick={() => {
                                        setEditing(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                                >
                                    <FiEdit2 size={14} /> Edit message
                                </button>
                            )}

                            {(!messageObj.isDeletedForEveryone) && (
                                <button
                                    onClick={handleCopy}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                                >
                                    <FiCopy size={14} /> Copy
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    pinMessage(messageObj._id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                            >
                                <LuPin size={14} /> {messageObj.pinned ? "Unpin" : "Pin"}
                            </button>
                            <button
                                onClick={() => {
                                    setShowInfo(true);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 flex items-center gap-2 text-slate-700"
                            >
                                <FiInfo size={14} /> Message info
                            </button>
                            <button
                                onClick={() => {
                                    deleteForMe(messageObj._id);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-100 text-slate-700"
                            >
                                Delete for me
                            </button>
                            {own && (
                                <button
                                    onClick={() => {
                                        deleteForEveryone(messageObj._id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50"
                                >
                                    Delete for everyone
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {showInfo && (
                    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center">
                        <div ref={infoRef} className="bg-white rounded-2xl p-5 w-[320px] shadow-2xl">
                            <h2 className="font-semibold text-lg mb-4 text-black">Message Info</h2>
                            <div className="space-y-2 text-sm text-black">
                                <p><b>Time:</b> {time}</p>
                                <p><b>Status:</b> {seen ? "Seen" : delivered ? "Delivered" : "Sent"}</p>
                                <p><b>Reactions:</b> {messageObj.reactions?.length || 0}</p>
                                <p><b>Edited:</b> {messageObj.edited ? "Yes" : "No"}</p>
                            </div>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="mt-5 w-full py-2 rounded-xl bg-indigo-500 text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <div className={`relative px-4 py-3 rounded-2xl break-words ${own ? "bg-indigo-500 text-white" : "bg-white text-black shadow-sm border border-slate-100"}`}>
                    
                    {messageObj.pinned && (
                        <div className={`flex items-center gap-1 text-[11px] mb-2 opacity-80 ${own ? "text-white" : "text-black"}`}>
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
                        <p className="italic opacity-60">This message was deleted</p>
                    ) : editing ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                className="border rounded-lg px-2 py-1 text-black flex-1"
                            />
                            <button
                                onClick={() => {
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
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {messageObj.images.map((img, index) => (
                                        <img
                                            key={index}
                                            src={`http://localhost:5000${img}`}
                                            alt="attachment"
                                            onClick={() => setShowImage(img)}
                                            className="max-w-[260px] rounded-xl cursor-pointer hover:opacity-95 transition object-cover"
                                        />
                                    ))}
                                </div>
                            )}

                            {messageObj.documents && messageObj.documents.length > 0 && (
                                <div className="flex flex-col gap-2 mb-2">
                                    {messageObj.documents.map((doc, index) => (
                                        <a
                                            key={index}
                                            href={`http://localhost:5000${doc.fileUrl}`}
                                            download={doc.fileName}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`flex items-center gap-2 p-3 rounded-lg text-sm transition ${
                                                own ? "bg-white/20 hover:bg-white/30 text-white" : "bg-slate-100 hover:bg-slate-200 text-black"
                                            }`}
                                        >
                                            <span className="text-xl">📄</span>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="truncate font-medium">{doc.fileName}</span>
                                                <span className="text-[10px] opacity-80">{doc.fileSize}</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* UPDATED AUDIO RENDER */}
                            {messageObj.audio && (
                                <div className={`flex flex-col gap-2 mb-2 p-3 rounded-xl ${own ? "bg-white/20" : "bg-slate-100"}`}>
                                    <audio controls className="w-full max-w-[260px]">
                                        <source src={`http://localhost:5000${messageObj.audio}`} />
                                    </audio>
                                    <div className={`text-[11px] mt-1 ${own ? "text-white/80" : "text-slate-500"}`}>
                                        🎵 Voice Message
                                    </div>
                                </div>
                            )}

                            {message && (
                                <p className="whitespace-pre-wrap break-words">
                                    {message}
                                    {messageObj.edited && (
                                        <span className="text-[10px] opacity-70 ml-2">(edited)</span>
                                    )}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[11px] opacity-70">{time}</span>
                        {renderStatus()}
                    </div>
                </div>

                {showImage && (
                    <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center">
                        <button
                            onClick={() => setShowImage(null)}
                            className="absolute top-5 right-5 text-white text-2xl hover:text-red-400 transition"
                        >
                            <FiX />
                        </button>
                        <a
                            href={`http://localhost:5000${showImage}`}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-5 left-5 text-white text-2xl hover:text-indigo-400 transition"
                            title="Download Image"
                        >
                            <FiDownload />
                        </a>
                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch(`http://localhost:5000${showImage}`);
                                    const blob = await response.blob();
                                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                                    alert("Image copied to clipboard!");
                                } catch (err) {
                                    console.error("Failed to copy image", err);
                                }
                            }}
                            className="absolute top-5 left-16 text-white text-2xl hover:text-indigo-400 transition"
                            title="Copy Image"
                        >
                            <FiCopy />
                        </button>
                        <img
                            src={`http://localhost:5000${showImage}`}
                            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
                            alt="Full Screen Preview"
                        />
                    </div>
                )}

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
        </div>
    );
}