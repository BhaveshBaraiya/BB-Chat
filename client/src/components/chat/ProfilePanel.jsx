import { useState, useEffect, useContext } from "react";
import { useSelector } from "react-redux";
import { FiBell, FiImage, FiUsers, FiMail, FiInfo, FiArrowLeft, FiChevronRight } from "react-icons/fi";
import LogoutButton from "./LogoutButton";
import { SocketContext } from "../../context/SocketContext";

export default function ProfilePanel() {
    const user = useSelector((state) => state.auth.user);
    const messages = useSelector((state) => state.chat.messages) || [];
    const { socket } = useContext(SocketContext);
    
    const [activeView, setActiveView] = useState("main");
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (data, type) => {
            let text = "";
            if (type === "received") text = `${data.fullName} sent you a friend request.`;
            if (type === "accepted") text = `${data.fullName} accepted your friend request!`;
            
            const newNotif = {
                id: Date.now(),
                text: text,
                time: new Date(),
                read: false
            };
            setNotifications(prev => [newNotif, ...prev]);
            toast(text, { icon: '🔔' }); 
        };

        socket.on("friend:request_received", (data) => handleNewNotification(data, "received"));
        socket.on("friend:request_accepted", (data) => handleNewNotification(data, "accepted"));

        return () => {
            socket.off("friend:request_received");
            socket.off("friend:request_accepted");
        };
    }, [socket]);

    const sharedImages = messages
        .filter((msg) => msg.images && msg.images.length > 0)
        .flatMap((msg) => msg.images);

    const BASE_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
    const getMediaUrl = (url) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${BASE_URL}${url}`;
    };

    const imageUrl = user?.profilePic
        ? `${user.profilePic}?t=${Date.now()}`
        : `https://ui-avatars.com/api/?name=${user?.fullName}`;

    const hasUnreadNotifications = notifications.some(n => !n.read);

    const handleOpenNotifications = () => {
        setActiveView("notifications");
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    if (activeView === "notifications") {
        return (
            <div className="w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 pb-4 mb-2">
                    <button onClick={() => setActiveView("main")} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition mb-6 w-max">
                        <FiArrowLeft size={18} /> Back
                    </button>
                    <div className="flex justify-between items-end">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Notifications</h2>
                        {notifications.length > 0 && (
                            <button onClick={() => setNotifications([])} className="text-xs text-indigo-500 hover:underline">Clear all</button>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col gap-2">
                    {notifications.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                            No new notifications
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-sm text-slate-700 dark:text-slate-200">{notif.text}</p>
                                <span className="text-xs text-slate-400 mt-1 block">
                                    {notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (activeView === "media") {
        return (
            <div className="w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 pb-4 mb-2">
                    <button 
                        onClick={() => setActiveView("main")} 
                        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition mb-6 w-max"
                    >
                        <FiArrowLeft size={18} /> Back
                    </button>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Shared Media</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {sharedImages.length} {sharedImages.length === 1 ? "image" : "images"} shared
                    </p>
                </div>

                {sharedImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 pb-6">
                        {sharedImages.map((imgUrl, index) => (
                            <div 
                                key={index} 
                                className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative border border-slate-100 dark:border-slate-800"
                            >
                                <img 
                                    src={getMediaUrl(imgUrl)} 
                                    alt="shared media" 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm opacity-70">
                        <FiImage size={48} className="mb-4 opacity-50" />
                        <p>No media shared yet</p>
                    </div>
                )}
            </div>
        );
    }

    if (activeView === "groups") {
        return (
            <div className="w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full">
                <button onClick={() => setActiveView("main")} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition mb-6 w-max">
                    <FiArrowLeft size={18} /> Back
                </button>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Your Groups</h2>
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                    You are not in any groups
                </div>
            </div>
        );
    }

    return (
        <div className="w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto h-full flex flex-col">
            
            <div className="flex flex-col items-center shrink-0">
                <img src={imageUrl} className="w-24 h-24 rounded-full object-cover shadow-sm bg-slate-100 dark:bg-slate-800" alt="profile" />
                <h2 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{user?.fullName}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center px-4">{user?.bio || "Hey there 👋 I am using ChatApp"}</p>
            </div>

            <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-4 shrink-0 border border-slate-100 dark:border-slate-800">
                <div className="flex gap-3">
                    <FiMail className="mt-1 text-slate-500 dark:text-slate-400" />
                    <div className="truncate">
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Email</p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{user?.email}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <FiInfo className="mt-1 text-slate-500 dark:text-slate-400 min-w-[24px] max-w-[24px]" />
                    <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">About</p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{user?.bio || "Available"}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-2 shrink-0">
                <button 
                    onClick={handleOpenNotifications}
                    className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 transition-colors group relative"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center relative">
                            <FiBell size={16} />
                            {hasUnreadNotifications && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            )}
                        </div>
                        <span className="font-medium text-sm">Notifications</span>
                    </div>
                    <FiChevronRight className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </button>

                <button 
                    onClick={() => setActiveView("media")}
                    className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-500 flex items-center justify-center">
                            <FiImage size={16} />
                        </div>
                        <span className="font-medium text-sm">Shared Media</span>
                    </div>
                    <FiChevronRight className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                </button>

                <button 
                    onClick={() => setActiveView("groups")}
                    className="w-full py-3.5 px-4 rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <FiUsers size={16} />
                        </div>
                        <span className="font-medium text-sm">Groups</span>
                    </div>
                    <FiChevronRight className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </button>
            </div>

            <div className="mt-auto pt-8 shrink-0">
                <LogoutButton />
            </div>
        </div>
    );
}