import { BsCheck, BsCheckAll } from "react-icons/bs";
import { FiCornerUpLeft, FiMoreVertical } from "react-icons/fi";
import { useContext, useState } from "react";
import { ChatContext } from "../../context/ChatContext";
import useDeleteMessage from "../../hooks/useDeleteMessage";

export default function MessageBubble({ messageObj, message, own, time, delivered, seen }) {

    const { setReplyMessage } = useContext(ChatContext);
    const { deleteForMe, deleteForEveryone } = useDeleteMessage();
    const [showMenu, setShowMenu] = useState(false);

    const renderStatus = () => {
        if (!own) return null;
        if (seen) return <BsCheckAll size={16} className="text-sky-400 -ml-1" />;
        if (delivered) return <BsCheckAll size={16} className="text-gray-300 -ml-1" />;
        return <BsCheck size={16} className="text-gray-300" />;
    };

    return (
        <div className={`flex w-full mb-3 ${own ? "justify-end" : "justify-start"}`}>

            {/* IMPORTANT: prevent overflow issues */}
            <div className={`relative max-w-[75%] group flex flex-col ${own ? "items-end" : "items-start"}`}>

                {/* bubble */}
                <div className={`relative px-4 py-2 rounded-2xl break-words ${own ? "bg-indigo-500 text-white" : "bg-white"}`}>

                    {/* reply button */}
                    <button
                        onClick={() => setReplyMessage(messageObj)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition"
                    >
                        <FiCornerUpLeft />
                    </button>

                    {/* menu button */}
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100"
                    >
                        <FiMoreVertical />
                    </button>

                    {/* MESSAGE */}
                    {messageObj?.isDeletedForEveryone ? (
                        <p className="italic opacity-60">This message was deleted</p>
                    ) : (
                        <p className="whitespace-pre-wrap break-words">{message}</p>
                    )}

                    {/* footer */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[11px] opacity-70">
                        <span>{time}</span>
                        {renderStatus()}
                    </div>

                </div>

                {/* MENU (FIXED - no layout break, no collapse) */}
                {showMenu && (
                    <div
                        className={`absolute top-10 z-50 bg-white shadow-lg rounded-xl overflow-hidden w-44
                        ${own ? "right-0" : "left-0"}`}
                    >

                        <button
                            onClick={() => {
                                deleteForMe(messageObj._id);
                                setShowMenu(false);
                            }}
                            className="px-4 py-2 w-full text-left hover:bg-slate-100"
                        >
                            Delete for me
                        </button>

                        {own && (
                            <button
                                onClick={() => {
                                    deleteForEveryone(messageObj._id);
                                    setShowMenu(false);
                                }}
                                className="px-4 py-2 w-full text-left hover:bg-slate-100 text-red-500"
                            >
                                Delete for everyone
                            </button>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}