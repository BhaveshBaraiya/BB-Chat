import { useState, useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import useUsers from "../../hooks/useUsers";
import { SocketContext } from "../../context/SocketContext";
import { setSelectedChat, clearUnreadCount } from "../../redux/features/chatSlice";

export default function UserList() {
    const dispatch = useDispatch();
    const unreadCounts = useSelector((state) => state.chat.unreadCounts);
    // Grab the current logged-in user so we can check blocked arrays
    const currentUser = useSelector((state) => state.auth.user); 
    
    const { users: fetchedUsers } = useUsers();
    const [users, setUsers] = useState([]);
    const { socket, onlineUsers } = useContext(SocketContext);

    useEffect(() => {
        if (fetchedUsers) setUsers(fetchedUsers);
    }, [fetchedUsers]);

    useEffect(() => {
        if (!socket) return;
        
        const handleProfileUpdate = (updatedUser) => {
            setUsers((prevUsers) =>
                prevUsers.map((u) => u._id === updatedUser._id ? { ...u, fullName: updatedUser.fullName, profilePic: updatedUser.profilePic, bio: updatedUser.bio } : u)
            );
        };

        // Listen for getting blocked
        const handleBlockedMe = ({ blockerId }) => {
            setUsers((prev) => prev.map(u => 
                u._id === blockerId ? { ...u, blockedUsers: [...(u.blockedUsers || []), currentUser._id] } : u
            ));
        };

        // Listen for getting unblocked
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

    const openChat = (chat) => {
        dispatch(setSelectedChat(chat));
        dispatch(clearUnreadCount(chat._id));
    };

    return (
        <div className="space-y-2">
            {users.map((user) => {
                // Check mutual blocking status
                const isBlockedByMe = currentUser?.blockedUsers?.includes(user._id);
                const amIBlockedByThem = user?.blockedUsers?.includes(currentUser?._id);
                const isBlocked = isBlockedByMe || amIBlockedByThem;

                // Determine if we should show the real profile pic and online status
                const showOnline = onlineUsers.includes(user._id) && !isBlocked;
                const displayPic = isBlocked || !user.profilePic 
                    ? `https://ui-avatars.com/api/?name=${user.fullName}` 
                    : `${user.profilePic}?t=${Date.now()}`;

                return (
                    <div key={user._id} onClick={() => openChat(user)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 cursor-pointer transition">
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
                                <h3 className="font-medium text-slate-800">{user.fullName}</h3>
                                <p className={`text-sm ${showOnline ? "text-green-500 font-medium" : "text-slate-500"}`}>
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