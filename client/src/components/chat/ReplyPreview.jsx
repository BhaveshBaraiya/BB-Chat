import { useContext } from "react";
import { FiX } from "react-icons/fi";

import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

export default function ReplyPreview() {

    const {
        replyMessage,
        setReplyMessage
    } = useContext(ChatContext);

    const { user } =
        useContext(AuthContext);

    if (!replyMessage)
        return null;

    const isOwn =
        replyMessage.senderId ===
        user._id;

    return (

        <div
            className="
            bg-slate-100
            rounded-xl
            px-4
            py-3
            mb-3
            flex
            justify-between
            items-start
            border-l-4
            border-indigo-500
            "
        >

            <div className="overflow-hidden">

                <p
                    className="
                    text-xs
                    text-indigo-500
                    font-semibold
                    "
                >
                    Replying to
                    {" "}
                    {isOwn
                        ? "You"
                        : "Message"}
                </p>

                <p
                    className="
                    text-sm
                    text-slate-700
                    truncate
                    "
                >
                    {replyMessage.text}
                </p>

            </div>


            <button
                onClick={() =>
                    setReplyMessage(null)
                }
                className="
                text-slate-500
                hover:text-red-500
                "
            >

                <FiX size={18}/>

            </button>

        </div>

    );

}