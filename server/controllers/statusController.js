import { getIO, userSocketMap } from "../socket/socket.js";
import StatusModel from "../models/StatusModel.js";
import UserModel from "../models/UserModel.js";

export const createStatus = async (req, res) => {
    try {
        const { text, musicUrl, musicTitle } = req.body;
        const userId = req.user._id;

        const mediaUrl = req.files?.media ? req.files.media[0].path : "";

        if (!text && !mediaUrl) {
            return res.status(400).json({ success: false, message: "Status is empty" });
        }

        const newStatus = await StatusModel.create({ 
            user: userId, 
            text: text || "", 
            mediaUrl,
            musicUrl: musicUrl || "",
            musicTitle: musicTitle || ""
        });
        
        const currentUser = await UserModel.findById(userId).populate("friends", "_id");
        
        const io = getIO();
        if (currentUser.friends && currentUser.friends.length > 0) {
            currentUser.friends.forEach(friend => {
                const friendSocketId = userSocketMap.get(friend._id.toString());
                if (friendSocketId) {                    
                    io.to(friendSocketId).emit("status:new", { 
                        userId: currentUser._id 
                    });
                }
            });
        }

        res.status(201).json({ success: true, status: newStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFriendsStatuses = async (req, res) => {
    try {
        const currentUser = await UserModel.findById(req.user._id);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const myBlockedIds = currentUser.blockedUsers 
            ? currentUser.blockedUsers.map(id => id.toString()) 
            : [];

            const usersHidingStatusFromMe = await UserModel.find({
                hiddenStatusUsers: req.user._id
            }).select('_id');
            const hiddenMeIds = usersHidingStatusFromMe.map(u => u._id.toString());
        
        const usersWhoBlockedMe = await UserModel.find({
            blockedUsers: req.user._id
        }).select('_id');
        const blockedMeIds = usersWhoBlockedMe.map(u => u._id.toString());
        
        const validFriends = (currentUser.friends || []).filter(friendId => {
            const idStr = friendId.toString();
            return !myBlockedIds.includes(idStr) && !blockedMeIds.includes(idStr) && !hiddenMeIds.includes(idStr);
        });
        
        const statuses = await StatusModel.find({
            user: { $in: [...validFriends, req.user._id] },
            createdAt: { $gte: twentyFourHoursAgo }
        })
        .populate("user", "fullName profilePic")
        .populate("viewers", "fullName profilePic")
        .sort({ createdAt: -1 });

        const groupedStatuses = statuses.reduce((acc, status) => {
            const userId = status.user._id.toString();
            if (!acc[userId]) acc[userId] = { user: status.user, statuses: [] };
            acc[userId].statuses.push(status);
            return acc;
        }, {});

        res.status(200).json({ success: true, statusFeed: Object.values(groupedStatuses) });
    } catch (error) {
        console.error("Status Feed Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markStatusViewed = async (req, res) => {
    try {
        const status = await StatusModel.findById(req.params.id);
        if (status && !status.viewers.includes(req.user._id)) {
            status.viewers.push(req.user._id);
            await status.save();
        }
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};