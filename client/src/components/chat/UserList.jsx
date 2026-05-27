import { useState, useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import useUsers from "../../hooks/useUsers";
import { SocketContext } from "../../context/SocketContext";
import { setSelectedChat, clearUnreadCount } from "../../redux/features/chatSlice";

export default function UserList() {
    const dispatch = useDispatch();
    const unreadCounts = useSelector((state) => state.chat.unreadCounts);
    
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
                prevUsers.map((u) =>
                    u._id === updatedUser._id
                        ? { ...u, fullName: updatedUser.fullName, profilePic: updatedUser.profilePic, bio: updatedUser.bio }
                        : u
                )
            );
        };
        socket.on("profile:updated", handleProfileUpdate);
        return () => socket.off("profile:updated", handleProfileUpdate);
    }, [socket]);

    const openChat = (chat) => {
        dispatch(setSelectedChat(chat));
        dispatch(clearUnreadCount(chat._id));
    };

    return (
        <div className="space-y-2">
            {users.map((user) => (
                <div key={user._id} onClick={() => openChat(user)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 cursor-pointer transition">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={user.profilePic ? `${user.profilePic}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${user.fullName}`}
                                className="w-12 h-12 rounded-full object-cover"
                                alt="profile"
                            />
                            {onlineUsers.includes(user._id) && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-800">{user.fullName}</h3>
                            <p className="text-sm text-slate-500">{onlineUsers.includes(user._id) ? "Online" : "Offline"}</p>
                        </div>
                    </div>
                    {unreadCounts?.[user._id] > 0 && (
                        <div className="min-w-6 h-6 px-2 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-medium">
                            {unreadCounts[user._id]}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}