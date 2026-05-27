import { useState } from "react";
import UserList from "../chat/UserList";
import { useDispatch } from "react-redux";
import { setSelectedChat } from "../../redux/features/chatSlice";
import useSearchUsers from "../../hooks/useSearchUsers";
import { FiSearch } from "react-icons/fi";
import SettingsContent from "../chat/SettingsContent";
import StatusContent from "../chat/StatusContent";
import axiosInstance from "../../services/axios";

export default function Sidebar({ activeTab }) {
    const [query, setQuery] = useState("");
    const dispatch = useDispatch();
    const { users, searchUsers } = useSearchUsers();

    const handleCreateOrOpenChat = async (user) => {
        try {
            const { data } = await axiosInstance.post("/conversations/create", { receiverId: user._id });
            dispatch(setSelectedChat(data)); 
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="w-screen md:w-[350px] h-screen bg-white border-r border-slate-200 flex flex-col">
            
            <div className="px-5 pt-5 pb-4 border-b">
                <h2 className="text-2xl font-semibold text-[#111B21]">
                    {activeTab === "chats" && "Chats"}
                    {activeTab === "status" && "Status"}
                    {activeTab === "settings" && "Settings"}
                </h2>
            </div>

            {activeTab === "chats" && (
                <>
                    <div className="relative px-5 my-4">
                        <FiSearch className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(e) => {
                                const value = e.target.value;
                                setQuery(value);
                                searchUsers(value);
                            }}
                            placeholder="Search or start new chat"
                            className="w-full h-10 bg-slate-100 rounded-lg pl-10 pr-4 outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto px-2">
                        {query.trim() ? (
                            users.map(user => (
                                <div
                                    key={user._id}
                                    onClick={() => handleCreateOrOpenChat(user)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 cursor-pointer"
                                >
                                    <img
                                        src={
                                            user.profilePic ||
                                            `https://ui-avatars.com/api/?name=${user.fullName}`
                                        }
                                        className="w-12 h-12 rounded-full object-cover"
                                        alt="profile"
                                    />
                                    <div>
                                        <div className="font-medium">
                                            {user.fullName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <UserList />
                        )}
                    </div>
                </>
            )}

            {activeTab === "status" && <StatusContent />}
            {activeTab === "settings" && <SettingsContent />}
            
        </div>
    );
}