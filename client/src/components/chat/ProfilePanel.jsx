import { FiBell, FiImage, FiUsers } from "react-icons/fi";
import LogoutButton from "./LogoutButton";

export default function ProfilePanel() {

    return (
        <div className="w-[320px] bg-white border-l border-slate-200 p-6">

            <div className="flex flex-col items-center">

                <img
                    src="https://i.pravatar.cc/101"
                    alt=""
                    className="w-24 h-24 rounded-full object-cover"
                />

                <h2 className="mt-4 text-xl font-semibold text-slate-800">
                    Rahul Sharma
                </h2>

                <p className="text-sm text-green-500 mt-1">
                    Online
                </p>

                <p className="text-sm text-slate-500 text-center mt-4">
                    Building the most premium realtime app 🔥
                </p>

            </div>

            <div className="mt-8 space-y-3">

                <button className="w-full h-14 bg-slate-50 rounded-2xl px-4 flex items-center gap-3 hover:bg-slate-100 transition">

                    <FiBell size={18} />

                    <span className="text-slate-700">
                        Notifications
                    </span>

                </button>

                <button className="w-full h-14 bg-slate-50 rounded-2xl px-4 flex items-center gap-3 hover:bg-slate-100 transition">

                    <FiImage size={18} />

                    <span className="text-slate-700">
                        Shared Media
                    </span>

                </button>

                <button className="w-full h-14 bg-slate-50 rounded-2xl px-4 flex items-center gap-3 hover:bg-slate-100 transition">

                    <FiUsers size={18} />

                    <span className="text-slate-700">
                        Members
                    </span>

                </button>

            </div>

            <div className="mt-8">

                <LogoutButton />

            </div>

        </div>
    )
}