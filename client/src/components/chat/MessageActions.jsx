import { FiCornerUpLeft, FiMoreHorizontal } from "react-icons/fi";

export default function MessageActions() {

    return (
        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-2">

            <div className="bg-white rounded-full shadow-sm px-2 h-10 flex items-center gap-1">

                <button className="w-8 h-8 rounded-full hover:bg-slate-100 transition">
                    ❤️
                </button>

                <button className="w-8 h-8 rounded-full hover:bg-slate-100 transition">
                    🔥
                </button>

                <button className="w-8 h-8 rounded-full hover:bg-slate-100 transition">
                    😂
                </button>

                <button className="w-8 h-8 rounded-full hover:bg-slate-100 transition">
                    😮
                </button>

            </div>

            <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 transition">

                <FiCornerUpLeft size={16} />

            </button>

            <button className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 transition">

                <FiMoreHorizontal size={16} />

            </button>

        </div>
    )
}