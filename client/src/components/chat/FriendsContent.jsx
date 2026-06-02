import { useState, useEffect, useContext } from "react";
import { FiSearch, FiUserPlus, FiCheck, FiUserMinus, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../../services/axios";
import { SocketContext } from "../../context/SocketContext";

export default function FriendsContent() {
    const { socket } = useContext(SocketContext);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false); // Optional: Helps track if search is active

    useEffect(() => {
        fetchPendingRequests();
        fetchFriends();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewRequest = (newRequestUser) => {
            setPendingRequests(prev => {
                if (prev.find(u => u._id === newRequestUser._id)) return prev;
                return [...prev, newRequestUser];
            });
            toast.success(`${newRequestUser.fullName} sent you a friend request!`);
        };

        const handleRequestAccepted = (newFriend) => {
            setFriends(prev => {
                if (prev.find(u => u._id === newFriend._id)) return prev;
                return [...prev, newFriend];
            });
            toast.success(`${newFriend.fullName} accepted your friend request!`);
        };

        socket.on("friend:request_received", handleNewRequest);
        socket.on("friend:request_accepted", handleRequestAccepted);

        return () => {
            socket.off("friend:request_received", handleNewRequest);
            socket.off("friend:request_accepted", handleRequestAccepted);
        };
    }, [socket]);

    const fetchPendingRequests = async () => {
        try {
            const { data } = await axiosInstance.get("/friends/requests");
            setPendingRequests(data.requests);
        } catch (error) { console.error(error); }
    };

    const fetchFriends = async () => {
        try {
            const { data } = await axiosInstance.get("/friends/list");
            setFriends(data.friends);
        } catch (error) { console.error(error); }
    };

    const handleSearchInput = (e) => {
        setSearchQuery(e.target.value);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            try {
                setIsSearching(true);
                const { data } = await axiosInstance.get(`/friends/search?query=${searchQuery}`);
                const filteredResults = data.users.filter(user => 
                    !friends.some(f => f._id === user._id) &&
                    !pendingRequests.some(p => p._id === user._id)
                );
                setSearchResults(filteredResults);
            } catch (error) { 
                console.error(error); 
            } finally {
                setIsSearching(false);
            }
        }, 500); 

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, friends, pendingRequests]);

    const sendRequest = async (targetUserId) => {
        try {
            setLoading(true);
            await axiosInstance.post("/friends/send", { targetUserId });
            socket?.emit("friend:send_request", { targetUserId });
            toast.success("Friend request sent!");
            setSearchResults(prev => prev.filter(u => u._id !== targetUserId));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        } finally { setLoading(false); }
    };

    const acceptRequest = async (senderId) => {
        try {
            setLoading(true);
            await axiosInstance.post("/friends/accept", { senderId });
            socket?.emit("friend:accept_request", { senderId });
            toast.success("Request accepted! You can now chat.");
            
            const acceptedUser = pendingRequests.find(u => u._id === senderId);
            setPendingRequests(prev => prev.filter(u => u._id !== senderId));
            if (acceptedUser) {
                setFriends(prev => [...prev, acceptedUser]);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept request");
        } finally { setLoading(false); }
    };

    const rejectRequest = async (senderId) => {
        try {
            setLoading(true);
            await axiosInstance.post("/friends/reject", { senderId });
            toast.success("Request rejected.");
            setPendingRequests(prev => prev.filter(u => u._id !== senderId));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject request");
        } finally { setLoading(false); }
    };

    const unfriend = async (targetId) => {
        try {
            setLoading(true);
            await axiosInstance.post("/friends/unfriend", { targetId });
            toast.success("Friend removed.");
            setFriends(prev => prev.filter(u => u._id !== targetId));
        } catch (error) {
            toast.error("Failed to remove friend");
        } finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-5 border-b shrink-0">
                <h3 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Add a Friend</h3>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchQuery}
                        onChange={handleSearchInput}
                        placeholder="Search by name..."
                        className="w-full h-10 bg-slate-100 rounded-lg pl-10 pr-4 outline-none text-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Search Results & Empty State Logic */}
                {searchQuery.trim() !== "" && (
                    <div className="p-2 border-b">
                        {isSearching ? (
                            <div className="py-6 text-center">
                                <p className="text-sm text-slate-400">Searching...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(user => (
                                <div key={user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.fullName}`} alt="profile" className="w-10 h-10 rounded-full shrink-0 object-cover" />
                                        <div className="truncate">
                                            <p className="font-medium text-sm text-slate-800 truncate">{user.fullName}</p>
                                            {/* Replaced user.email with user.bio for privacy */}
                                            <p className="text-xs text-slate-500 truncate">{user.bio || "Available"}</p>
                                        </div>
                                    </div>
                                    <button disabled={loading} onClick={() => sendRequest(user._id)} className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition shrink-0">
                                        <FiUserPlus size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 flex flex-col items-center justify-center gap-2">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-1">
                                    <FiSearch className="text-slate-300 w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">No users found</p>
                                <p className="text-xs text-slate-400 text-center px-4">
                                    We couldn't find anyone matching "{searchQuery}".
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-2 border-b">
                    <h3 className="px-3 pt-4 pb-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        Pending Requests ({pendingRequests.length})
                    </h3>
                    
                    {pendingRequests.length === 0 ? (
                        <p className="px-3 text-sm text-slate-400">No pending requests.</p>
                    ) : (
                        pendingRequests.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 bg-indigo-50/50 mb-1">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.fullName}`} alt="profile" className="w-10 h-10 object-cover rounded-full shrink-0" />
                                    <div className="truncate">
                                        <p className="font-medium text-sm text-slate-800 truncate">{user.fullName}</p>
                                        <p className="text-xs text-indigo-500 font-medium truncate">Wants to be friends</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button disabled={loading} onClick={() => acceptRequest(user._id)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1">
                                        <FiCheck size={14} /> Accept
                                    </button>
                                    <button disabled={loading} onClick={() => rejectRequest(user._id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition flex items-center gap-1">
                                        <FiX size={14} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-2">
                    <h3 className="px-3 pt-4 pb-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        My Friends ({friends.length})
                    </h3>
                    
                    {friends.length === 0 ? (
                        <p className="px-3 text-sm text-slate-400">You haven't added any friends yet.</p>
                    ) : (
                        friends.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.fullName}`} alt="profile" className="w-10 h-10 object-cover rounded-full shrink-0" />
                                    <div className="truncate">
                                        <p className="font-medium text-sm text-slate-800 truncate">{user.fullName}</p>
                                        <p className="text-xs text-slate-500 truncate">{user.bio || "Available"}</p>
                                    </div>
                                </div>
                                <button disabled={loading} onClick={() => unfriend(user._id)} title="Unfriend" className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                    <FiUserMinus size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}