import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "../chat/ChatWindow";
import ProfilePanel from "../chat/ProfilePanel";
import LeftRail from "./LeftRail";

export default function AppLayout() {
    const [selectedChat, setSelectedChat] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [activeTab, setActiveTab] = useState("chats");

    return (

        <div className="
        h-screen
        bg-[#F0F2F5]
        flex
        overflow-hidden
        ">

            {/* LEFT ICON RAIL */}

            <LeftRail
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* SIDEBAR */}

            <div className={`
            ${selectedChat
                    ? "hidden md:block"
                    : "block"
                }
            `}>

                <Sidebar
                    activeTab={activeTab}
                    setSelectedChat={setSelectedChat}
                />

            </div>


            {/* CHAT */}

            <div className={`
            flex-1
            ${!selectedChat
                    ? "hidden md:flex"
                    : "flex"
                }
            `}>

                <ChatWindow
                    setSelectedChat={setSelectedChat}
                    setShowProfile={setShowProfile}
                />

            </div>


            {/* PROFILE PANEL */}

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
                    : "translate-x-full md:translate-x-0"
                }
            `}>

                <ProfilePanel />

            </div>


        </div>
    )
}