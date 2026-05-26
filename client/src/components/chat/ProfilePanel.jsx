import {
    FiBell,
    FiImage,
    FiUsers,
    FiMail,
    FiInfo
} from "react-icons/fi";

import { useContext } from "react";
import LogoutButton from "./LogoutButton";
import { AuthContext } from "../../context/AuthContext";

export default function ProfilePanel() {

     const { user } = useContext(AuthContext);

    const imageUrl = user?.profilePic
        ? `${user.profilePic}?t=${Date.now()}`
        : `https://ui-avatars.com/api/?name=${user?.fullName}`;

    return (<div className="w-[320px] bg-white border-l
            border-slate-200
            p-6
            overflow-y-auto
        ">

            {/* PROFILE HEADER */}
            <div className="flex flex-col items-center">

                <img
                    src={imageUrl}
                    className="w-24 h-24 rounded-full object-cover"
                    alt="profile"
                />

                <h2 className="mt-4 text-xl font-semibold">
                    {user?.fullName}
                </h2>

                <p className="text-sm text-slate-500 mt-4">
                    {user?.bio || "Hey there 👋 I am using ChatApp"}
                </p>

            </div>

            {/* USER INFO */}
            <div className="
                mt-8
                bg-slate-50
                rounded-2xl
                p-4
                space-y-4
            ">

                <div className="flex gap-3">
                    <FiMail className="mt-1 text-slate-500" />

                    <div>
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="text-sm">{user?.email}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <FiInfo className="mt-1 text-slate-500" />

                    <div>
                        <p className="text-xs text-slate-400">About</p>
                        <p className="text-sm">
                            {user?.bio || "Available"}
                        </p>
                    </div>
                </div>

            </div>

            {/* OPTIONS */}
            <div className="mt-8 space-y-3">

                <button className="
                    w-full
                    h-14
                    bg-slate-50
                    rounded-2xl
                    px-4
                    flex
                    items-center
                    gap-3
                    hover:bg-slate-100
                    transition
                ">
                    <FiBell size={18} />
                    <span>Notifications</span>
                </button>

                <button className="
                    w-full
                    h-14
                    bg-slate-50
                    rounded-2xl
                    px-4
                    flex
                    items-center
                    gap-3
                    hover:bg-slate-100
                    transition
                ">
                    <FiImage size={18} />
                    <span>Shared Media</span>
                </button>

                <button className="
                    w-full
                    h-14
                    bg-slate-50
                    rounded-2xl
                    px-4
                    flex
                    items-center
                    gap-3
                    hover:bg-slate-100
                    transition
                ">
                    <FiUsers size={18} />
                    <span>Groups</span>
                </button>

            </div>

            <div className="mt-8">
                <LogoutButton />
            </div>

        </div>
    );
}