import { useState, useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import useUsers from "../../hooks/useUsers";
import { SocketContext } from "../../context/SocketContext";
import { setSelectedChat, clearUnreadCount } from "../../redux/features/chatSlice";
import { FiUserPlus } from "react-icons/fi";

export default function UserList({searchTerm, onGoToFriends}) {
    const dispatch = useDispatch();
    const unreadCounts = useSelector((state) => state.chat.unreadCounts);    
    const currentUser = useSelector((state) => state.auth.user); 
    const selectedChat = useSelector((state) => state.chat.selectedChat);
    
    const { users: fetchedUsers, loading } = useUsers();
    const [users, setUsers] = useState([]);
    const { socket, onlineUsers } = useContext(SocketContext);

    useEffect(() => {
        if (fetchedUsers) {            
            if (searchTerm) {
                const lowerCaseSearch = searchTerm.toLowerCase();
                const filtered = fetchedUsers.filter(u => 
                    u.fullName.toLowerCase().includes(lowerCaseSearch) || 
                    u.email.toLowerCase().includes(lowerCaseSearch)
                );
                setUsers(filtered);
            } else {
                setUsers(fetchedUsers);
            }
        }
    }, [fetchedUsers, searchTerm]);

    useEffect(() => {
        if (!socket) return;
        
        const handleProfileUpdate = (updatedUser) => {
            setUsers((prevUsers) =>
                prevUsers.map((u) => u._id === updatedUser._id ? { ...u, fullName: updatedUser.fullName, profilePic: updatedUser.profilePic, bio: updatedUser.bio } : u)
            );
        };

        const handleBlockedMe = ({ blockerId }) => {
            setUsers((prev) => prev.map(u => 
                u._id === blockerId ? { ...u, blockedUsers: [...(u.blockedUsers || []), currentUser._id] } : u
            ));
        };

        const handleUnblockedMe = ({ blockerId }) => {
            setUsers((prev) => prev.map(u => 
                u._id === blockerId ? { ...u, blockedUsers: (u.blockedUsers || []).filter(id => id !== currentUser._id) } : u
            ));
        };

        socket.on("profile:updated", handleProfileUpdate);
        socket.on("user:blockedMe", handleBlockedMe);
        socket.on("user:unblockedMe", handleUnblockedMe);

        return () => {
            socket.off("profile:updated", handleProfileUpdate);
            socket.off("user:blockedMe", handleBlockedMe);
            socket.off("user:unblockedMe", handleUnblockedMe);
        };
    }, [socket, currentUser._id]);

    useEffect(() => {
        const handleRemoveUser = (e) => {
            const removedUserId = e.detail;
            setUsers((prev) => prev.filter((u) => u._id !== removedUserId));
        };
        window.addEventListener("removeUserFromList", handleRemoveUser);
        return () => window.removeEventListener("removeUserFromList", handleRemoveUser);
    }, []);

    const openChat = (chat) => {
        dispatch(setSelectedChat(chat));
        dispatch(clearUnreadCount(chat._id));
    };

    if (loading) {
        return (
             <div className="flex justify-center p-6">
                 <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
        )
    }

    if (users.length === 0 && !searchTerm) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-6 mt-10">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                    <FiUserPlus size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No friends yet</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-[200px]">
                    Connect with people to start chatting securely.
                </p>
                <button 
                    onClick={onGoToFriends}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                    Find Friends
                </button>
            </div>
        );
    }

    if (users.length === 0 && searchTerm) {
        return (
            <div className="text-center p-6 text-slate-500 text-sm">
                No chats match your search.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {users.map((user) => {
                const isBlockedByMe = currentUser?.blockedUsers?.includes(user._id);
                const amIBlockedByThem = user?.blockedUsers?.includes(currentUser?._id);
                const isBlocked = isBlockedByMe || amIBlockedByThem;

                const showOnline = onlineUsers.includes(user._id) && !isBlocked;
                const displayPic = isBlocked || !user.profilePic 
                    ? `https://ui-avatars.com/api/?name=${user.fullName}` 
                    : `${user.profilePic}?t=${Date.now()}`;
                
                const isActive = selectedChat?._id === user._id;

                return (
                    <div 
                        key={user._id} 
                        onClick={() => openChat(user)} 
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition ${
                            isActive 
                            ? "bg-indigo-50 dark:bg-slate-800/80" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/40"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img
                                    src={displayPic}
                                    className="w-12 h-12 rounded-full object-cover bg-slate-200"
                                    alt="profile"
                                />
                                {showOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-medium">
                                    {user.fullName}
                                </h3>
                                <p className={`text-sm ${showOnline ? "text-green-500 font-medium" : "text-slate-500 dark:text-slate-500"}`}>
                                    {showOnline ? "Online" : "Offline"}
                                </p>
                            </div>
                        </div>
                        {unreadCounts?.[user._id] > 0 && (
                            <div className="min-w-6 h-6 px-2 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-medium shadow-sm">
                                {unreadCounts[user._id]}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}