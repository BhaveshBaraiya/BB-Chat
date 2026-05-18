import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "../chat/ChatWindow";
import ProfilePanel from "../chat/ProfilePanel";
import OnlineUsersDebug from "../chat/OnlineUsersDebug";

export default function AppLayout() {

    const [selectedChat, setSelectedChat] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    return (
        <div className="h-screen bg-[#F8FAFC] flex overflow-hidden">

            <div className={`
                ${selectedChat ? "hidden md:block" : "block"}
            `}>
                <Sidebar setSelectedChat={setSelectedChat} />
            </div>

            <div className={`
                flex-1
                ${!selectedChat ? "hidden md:flex" : "flex"}
            `}>
                <ChatWindow
                    setSelectedChat={setSelectedChat}
                    setShowProfile={setShowProfile}
                />
            </div>

            <div className={`
                fixed
                top-0
                right-0
                h-full
                z-50
                transition-all
                duration-300
                md:relative
                ${showProfile
                    ? "translate-x-0"
                    : "translate-x-full md:translate-x-0"}
            `}>
                <ProfilePanel />
            </div>

<OnlineUsersDebug />
        </div>
    )
}