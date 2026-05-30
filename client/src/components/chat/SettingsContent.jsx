import { useState, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiUser, FiLock, FiMoon, FiChevronRight, FiArrowLeft, FiBell } from "react-icons/fi";
import ProfileSettings from "./ProfileSettings";
import LogoutButton from "./LogoutButton";
import { ThemeContext } from "../../context/ThemeContext";
import axiosInstance from "../../services/axios";
import toast from "react-hot-toast";
import { updateUser } from "../../redux/features/authSlice";

export default function SettingsContent() {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const [active, setActive] = useState("");
    const { theme, setTheme } = useContext(ThemeContext);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);
    
    // --- PRODUCTION MUTE LOGIC: Read straight from Redux ---
    const isGlobalMuted = user?.globalNotificationsMuted || false;

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // --- PRODUCTION MUTE HANDLER: Update DB and Redux ---
    const toggleNotifications = async () => {
        try {
            const newState = !isGlobalMuted;
            await axiosInstance.put("/users/settings/notifications", { muted: newState });
            dispatch(updateUser({ globalNotificationsMuted: newState }));
            toast.success(newState ? "Notifications muted 🔕" : "Notifications enabled 🔔");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings");
        }
    };
    
    useEffect(() => {
        if (active === "privacy") {
            const fetchBlockedUsers = async () => {
                try {
                    setLoadingBlocked(true);
                    const { data } = await axiosInstance.get("/users/blocked");
                    setBlockedUsers(data);
                } catch (error) {
                    console.error("Failed to fetch blocked users:", error);
                } finally {
                    setLoadingBlocked(false);
                }
            };
            fetchBlockedUsers();
        }
    }, [active]);

    const handleUnblock = async (blockedUserId) => {
        try {
            await axiosInstance.post("/users/unblock", { userId: blockedUserId });
            setBlockedUsers(prev => prev.filter(u => u._id !== blockedUserId));
            toast.success("User unblocked");
        } catch (error) {
            console.error("Failed to unblock:", error);
            toast.error("Failed to unblock user");
        }
    };

    if (active === "profile") {
        return <ProfileSettings goBack={() => setActive("")} />;
    }

    if (active === "privacy") {
        return (
            <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
                <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <button onClick={() => setActive("")} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                        <FiArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Privacy</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
                    <div className="max-w-xl mx-auto w-full space-y-8">
                        
                        {/* Standard Privacy Toggles */}
                        <div>
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-3">General</h3>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center text-slate-700 dark:text-slate-200">
                                    <span>Read Receipts</span>
                                    <input type="checkbox" className="w-5 h-5 accent-indigo-600" defaultChecked />
                                </div>
                                <div className="p-4 flex justify-between items-center text-slate-700 dark:text-slate-200">
                                    <span>Last Seen</span>
                                    <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm p-1.5 outline-none font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                                        <option>Everyone</option>
                                        <option>Nobody</option>
                                    </select>
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
            <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
                <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <button onClick={() => setActive("")} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                        <FiArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Theme</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
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
            <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
                <div className="flex items-center gap-4 p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <button onClick={() => setActive("")} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300">
                        <FiArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Notifications</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
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