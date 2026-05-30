import { useState } from "react";
import UserList from "../chat/UserList";
import { FiSearch } from "react-icons/fi";
import SettingsContent from "../chat/SettingsContent";
import StatusContent from "../chat/StatusContent";
import FriendsContent from "../chat/FriendsContent";

export default function Sidebar({ activeTab, setActiveTab }) {
    const [localChatFilter, setLocalChatFilter] = useState(""); 

    return (
        <div className="w-screen md:w-[350px] h-screen bg-white border-r border-slate-200 flex flex-col">
            
            <div className="px-5 pt-5 pb-4 border-b">
                <h2 className="text-2xl font-semibold text-[#111B21]">
                    {activeTab === "chats" && "Chats"}
                    {activeTab === "friends" && "Friends"}
                    {activeTab === "status" && "Status"}
                    {activeTab === "settings" && "Settings"}
                </h2>
            </div>

            {activeTab === "chats" && (
                <>
                    <div className="relative px-5 my-4">
                        <FiSearch className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={localChatFilter}
                            onChange={(e) => setLocalChatFilter(e.target.value)}
                            placeholder="Search existing chats..."
                            className="w-full h-10 bg-slate-100 rounded-lg pl-10 pr-4 outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto px-2">                        
                        <UserList 
                            searchTerm={localChatFilter} 
                            onGoToFriends={() => setActiveTab("friends")} 
                        />
                    </div>
                </>
            )}

            {activeTab === "friends" && <FriendsContent />}
            {activeTab === "status" && <StatusContent />}
            {activeTab === "settings" && <SettingsContent />}
            
        </div>
    );
}