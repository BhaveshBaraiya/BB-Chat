import { FiSearch } from "react-icons/fi";
import UserList from "../chat/UserList";

export default function Sidebar({ setSelectedChat }) {

    return (
        <div className="w-screen md:w-[350px] h-screen bg-white border-r border-slate-200 p-5 flex flex-col">

            <div className="flex items-center gap-3 mb-6">

                <img
                    src="https://i.pravatar.cc/100"
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                />

                <div>

                    <h2 className="font-semibold text-slate-800">
                        Bhavesh
                    </h2>

                    <p className="text-sm text-green-500">
                        Online
                    </p>

                </div>

            </div>

            <div className="relative mb-5">

                <FiSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full h-12 bg-slate-100 rounded-full pl-12 pr-4 outline-none"
                />

            </div>

            <div className="flex flex-col gap-2 overflow-auto">
                <UserList setSelectedChat={setSelectedChat}
                />
            </div>
        </div>
    )
}