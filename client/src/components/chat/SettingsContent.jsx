import { useState, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiUser, FiLock, FiMoon, FiChevronRight, FiArrowLeft, FiBell } from "react-icons/fi";
import ProfileSettings from "./ProfileSettings";
import LogoutButton from "./LogoutButton";
import { ThemeContext } from "../../context/ThemeContext";
import axiosInstance from "../../services/axios";
import toast from "react-hot-toast";
import { updateUser } from "../../redux/features/authSlice";
import { SocketContext } from "../../context/SocketContext";

export default function SettingsContent() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const [active, setActive] = useState("");
    const { theme, setTheme } = useContext(ThemeContext);
    const { socket } = useContext(SocketContext);
    
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);
    
    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [showHideStatusList, setShowHideStatusList] = useState(false);
    const [hiddenFrom, setHiddenFrom] = useState(user?.hiddenStatusUsers || []);
    
    const isGlobalMuted = user?.globalNotificationsMuted || false;
    const isOnlineStatusVisible = user?.showOnlineStatus !== false; 

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const toggleNotifications = async () => {
        try {
            const newState = !isGlobalMuted;
            await axiosInstance.put("/users/settings/notifications", { muted: newState });
            dispatch(updateUser({ globalNotificationsMuted: newState }));
            toast.success(newState ? "Notifications muted 🔕" : "Notifications enabled 🔔");
        } catch (error) {
            toast.error("Failed to update settings");
        }
    };

    const toggleOnlineStatus = async () => {
        try {
            const newState = !isOnlineStatusVisible;
            await axiosInstance.put("/users/settings/privacy", { showOnlineStatus: newState });
            dispatch(updateUser({ showOnlineStatus: newState }));
            
            if (socket) {
                socket.emit("updatePrivacy", { showOnlineStatus: newState });
            }
            
            toast.success(newState ? "Online status is now visible" : "Online status is hidden");
        } catch (error) {
            toast.error("Failed to update privacy settings");
        }
    };
    
    useEffect(() => {
        if (active === "privacy") {
            const fetchPrivacyData = async () => {
                try {
                    setLoadingBlocked(true);
                    setLoadingFriends(true);
                    
                    const [blockedRes, friendsRes] = await Promise.all([
                        axiosInstance.get("/users/blocked"),
                        axiosInstance.get("/friends/list")
                    ]);
                    
                    setBlockedUsers(blockedRes.data);
                    setFriends(friendsRes.data.friends || []);
                } catch (error) {
                    console.error("Failed to fetch privacy data");
                } finally {
                    setLoadingBlocked(false);
                    setLoadingFriends(false);
                }
            };
            fetchPrivacyData();
            setHiddenFrom(user?.hiddenStatusUsers || []);
        }
    }, [active, user?.hiddenStatusUsers]);

    const handleUnblock = async (blockedUserId) => {
        try {
            await axiosInstance.post("/users/unblock", { userId: blockedUserId });
            setBlockedUsers(prev => prev.filter(u => u._id !== blockedUserId));
            toast.success("User unblocked");
        } catch (error) {
            toast.error("Failed to unblock user");
        }
    };

    const toggleHideFrom = async (friendId) => {
        const isCurrentlyHidden = hiddenFrom.includes(friendId);
        const newHiddenList = isCurrentlyHidden 
            ? hiddenFrom.filter(id => id !== friendId)
            : [...hiddenFrom, friendId];
        
        setHiddenFrom(newHiddenList);
        
        try {
            await axiosInstance.put("/users/settings/privacy", { hiddenStatusUsers: newHiddenList });
            dispatch(updateUser({ hiddenStatusUsers: newHiddenList }));
        } catch (error) {            
            setHiddenFrom(hiddenFrom);
            toast.error("Failed to update status privacy");
        }
    };

    if (active === "profile") {
        return <ProfileSettings goBack={() => setActive("")} />;
    }

    if (active === "privacy") {
        return (
            <div className="absolute inset-0 sm:relative sm:w-full sm:h-full flex flex-col bg-white dark:bg-slate-900 z-50">
                <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                    <button onClick={() => setActive("")} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                        <FiArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Privacy</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
                    <div className="max-w-xl mx-auto w-full space-y-8">
                        
                        <div>
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-3">General</h3>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center text-slate-700 dark:text-slate-200">
                                    <span>Show Online Status</span>
                                    <button 
                                        onClick={toggleOnlineStatus}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${isOnlineStatusVisible ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${isOnlineStatusVisible ? 'translate-x-6' : 'translate-x-1'}`}></div>
                                    </button>
                                </div>
                                
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center text-slate-700 dark:text-slate-200">
                                    <span>Read Receipts</span>
                                    <input type="checkbox" className="w-5 h-5 accent-indigo-600" defaultChecked />
                                </div>
                                
                                <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                                    <span>Last Seen</span>
                                    <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm p-1.5 outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                                        <option>Everyone</option>
                                        <option>Nobody</option>
                                    </select>
                                </div>

                                {/* NEW: Hide Status From Section */}
                                <div className="p-4 flex flex-col text-slate-700 dark:text-slate-200">
                                    <div 
                                        className="flex justify-between items-center cursor-pointer select-none"
                                        onClick={() => setShowHideStatusList(!showHideStatusList)}
                                    >
                                        <span>Hide Status From</span>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                            {hiddenFrom.length} users <FiChevronRight className={`transition-transform duration-200 ${showHideStatusList ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                    
                                    {showHideStatusList && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-1 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                                            {loadingFriends ? (
                                                <div className="text-sm text-center text-slate-400 py-4">Loading friends...</div>
                                            ) : friends.length === 0 ? (
                                                <div className="text-sm text-center text-slate-400 py-4">No friends found.</div>
                                            ) : (
                                                friends.map(friend => (
                                                    <label key={friend._id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl cursor-pointer transition">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                                                            checked={hiddenFrom.includes(friend._id)}
                                                            onChange={() => toggleHideFrom(friend._id)}
                                                        />
                                                        <img src={friend.profilePic || `https://ui-avatars.com/api/?name=${friend.fullName}`} className="w-8 h-8 rounded-full object-cover bg-slate-200" alt={friend.fullName} />
                                                        <span className="text-sm font-medium">{friend.fullName}</span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Blocked Users Section */}
                        <div>
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-3">Blocked Users</h3>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                {loadingBlocked ? (
                                    <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">Loading...</div>
                                ) : blockedUsers.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No blocked users</div>
                                ) : (
                                    blockedUsers.map((u, idx) => (
                                        <div key={u._id} className={`p-4 flex items-center justify-between ${idx !== blockedUsers.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={u.profilePic || `https://ui-avatars.com/api/?name=${u.fullName}`} 
                                                    alt="avatar" 
                                                    className="w-10 h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-700"
                                                />
                                                <span className="font-medium text-slate-700 dark:text-slate-200">{u.fullName}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleUnblock(u._id)}
                                                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-full transition"
                                            >
                                                Unblock
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    if (active === "theme") {
        return (
            <div className="absolute inset-0 sm:relative sm:w-full sm:h-full flex flex-col bg-white dark:bg-slate-900 z-50">
                <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                    <button onClick={() => setActive("")} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                        <FiArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Theme</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
                    <div className="max-w-xl mx-auto w-full">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 flex justify-between items-center text-slate-700 dark:text-slate-200">
                                <span className="font-medium flex items-center gap-3">
                                    <FiMoon size={18} className="text-indigo-500" /> Dark Mode
                                </span>
                                <button 
                                    onClick={toggleTheme}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (active === "notifications") {
        return (
            <div className="absolute inset-0 sm:relative sm:w-full sm:h-full flex flex-col bg-white dark:bg-slate-900 z-50">
                <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                    <button onClick={() => setActive("")} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                        <FiArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Notifications</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
                    <div className="max-w-xl mx-auto w-full">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 flex justify-between items-center text-slate-700 dark:text-slate-200">
                                <span className="font-medium flex items-center gap-3">
                                    <FiBell size={18} className="text-indigo-500" /> Real-time Alerts
                                </span>
                                <button 
                                    onClick={toggleNotifications}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${!isGlobalMuted ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${!isGlobalMuted ? 'translate-x-6' : 'translate-x-1'}`}></div>
                                </button>
                            </div>
                            <div className="px-4 pb-4 pt-1 text-xs text-slate-500 dark:text-slate-400">
                                When enabled, you will receive pop-up alerts across the app when someone sends you a message.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const MenuItem = ({ icon: Icon, title, onClick }) => (
        <button 
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-[0.98] mb-3 group"
        >
            <div className="flex items-center gap-4 text-slate-700 dark:text-slate-200 font-medium">
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Icon size={18} />
                </div>
                {title}
            </div>
            <FiChevronRight className="text-slate-400 dark:text-slate-500 group-hover:translate-x-1 transition-transform" />
        </button>
    );

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
                <div className="max-w-xl mx-auto w-full">
                    <MenuItem icon={FiUser} title="Profile" onClick={() => setActive("profile")} />
                    <MenuItem icon={FiBell} title="Notifications" onClick={() => setActive("notifications")} />
                    <MenuItem icon={FiLock} title="Privacy" onClick={() => setActive("privacy")} />
                    <MenuItem icon={FiMoon} title="Theme" onClick={() => setActive("theme")} />
                </div>
                <div className="max-w-xl mx-auto w-full mt-10">
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}