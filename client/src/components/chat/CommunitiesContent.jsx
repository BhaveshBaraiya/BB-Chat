import { useState, useEffect } from "react";
import { FiUsers, FiPlus, FiSearch, FiCheck, FiX } from "react-icons/fi";
import axiosInstance from "../../services/axios";
import toast from "react-hot-toast";

import { useDispatch } from "react-redux";
import { setSelectedChat } from "../../redux/features/chatSlice";

export default function CommunitiesContent() {
    const [communities, setCommunities] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    const [groupName, setGroupName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
        fetchCommunities();
        fetchFriends();
    }, []);

    const openCommunityChat = (community) => {    
    dispatch(setSelectedChat({
        _id: community._id,
        fullName: community.name,
        profilePic: community.avatar || null,
        isGroup: true,
        members: community.members
    }));
};

    const fetchCommunities = async () => {
        try {
            const { data } = await axiosInstance.get("/communities");
            setCommunities(data.communities || []);
        } catch (error) { console.error("Failed to fetch communities", error); }
    };

    const fetchFriends = async () => {
        try {
            const { data } = await axiosInstance.get("/friends/list");
            setFriends(data.friends || []);
        } catch (error) { console.error("Failed to fetch friends", error); }
    };

    const toggleFriendSelection = (friendId) => {
        setSelectedFriends(prev => 
            prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
        );
    };

    const handleCreateCommunity = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return toast.error("Group name is required");
        if (selectedFriends.length === 0) return toast.error("Select at least one friend to add to the community");

        try {
            setLoading(true);
            const { data } = await axiosInstance.post("/communities/create", {
                name: groupName,
                members: selectedFriends
            });
            toast.success("Community created successfully!");
            setCommunities([data.community, ...communities]);
            
            setIsCreating(false);
            setGroupName("");
            setSelectedFriends([]);
            setSearchQuery("");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create community");
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = friends.filter(f => f.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (isCreating) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 shadow-sm z-10">
                    <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition">
                        <FiX size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">New Community</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{selectedFriends.length} members selected</p>
                    </div>
                </div>
                
                <form onSubmit={handleCreateCommunity} className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Community Name</label>
                        <input 
                            type="text" placeholder="e.g. Gaming Squad" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none text-slate-800 dark:text-white font-medium focus:border-indigo-500 transition"
                        />
                    </div>
                    
                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Select Members</label>
                        
                        <div className="relative mb-3 shrink-0">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text" placeholder="Search friends..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none text-slate-800 dark:text-white"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1">
                            {friends.length === 0 ? (
                                <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-4 border border-slate-100 dark:border-slate-700">
                                    <FiUsers size={32} className="mx-auto text-slate-400 mb-3" />
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">You don't have any friends yet.</p>
                                    <p className="text-xs text-slate-500 mt-1">Add friends from the Friends tab first to create a community.</p>
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No friends found matching "{searchQuery}"</p>
                            ) : (
                                filteredFriends.map(friend => (
                                    <div key={friend._id} onClick={() => toggleFriendSelection(friend._id)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                                        <div className="flex items-center gap-3">
                                            <img src={friend.profilePic || `https://ui-avatars.com/api/?name=${friend.fullName}`} alt="profile" className="w-10 h-10 rounded-full object-cover" />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{friend.fullName}</span>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedFriends.includes(friend._id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {selectedFriends.includes(friend._id) && <FiCheck size={14} />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button disabled={loading || friends.length === 0} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 mt-auto shrink-0 shadow-md">
                        {loading ? "Creating..." : `Create Community (${selectedFriends.length})`}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Communities</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <button onClick={() => setIsCreating(true)} className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition group mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                        <FiPlus size={24} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">New Community</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Bring your groups together</p>
                    </div>
                </button>

                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Your Communities</h3>
                {communities.length === 0 ? (
                    <div className="flex flex-col items-center text-center p-6 mt-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <FiUsers size={40} className="text-indigo-300 dark:text-indigo-500/50 mb-4" />
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">No communities yet</h4>
                        <p className="text-sm text-slate-500">Create one to chat with multiple friends at once!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {communities.map(community => (
                            <div 
                                key={community._id} 
                                onClick={() => openCommunityChat(community)}
                                className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl cursor-pointer transition"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-sm">
                                    {community.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{community.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{community.members.length} members</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}