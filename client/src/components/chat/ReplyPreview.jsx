import { FiX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { setReplyMessage } from "../../redux/features/chatSlice";

export default function ReplyPreview() {
    const dispatch = useDispatch();
    
    // Pull from Redux
    const replyMessage = useSelector((state) => state.chat.replyMessage);

    // DEFENSIVE CHECK: If no reply is selected, render nothing to prevent crashes
    if (!replyMessage) return null;

    return (
        <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border-l-4 border-indigo-500 mb-3 mx-4">
            <div className="flex flex-col overflow-hidden pr-4">
                <span className="text-xs font-semibold text-indigo-500 mb-1">
                    Replying to {replyMessage.senderId?.fullName || "User"}
                </span>
                <span className="text-sm truncate text-slate-600">
                    {replyMessage.text || (replyMessage.images?.length > 0 ? "Photo" : "Attachment")}
                </span>
            </div>
            <button 
                onClick={() => dispatch(setReplyMessage(null))} 
                className="text-slate-500 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-full p-1 transition"
            >
                <FiX size={16} />
            </button>
        </div>
    );
}