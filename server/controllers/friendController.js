import UserModel from "../models/UserModel.js";
import MessageModel from "../models/MessageModel.js";
import { getIO, userSocketMap } from "../socket/socket.js"; 

export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const loggedInUserId = req.user._id;

        if (!query) return res.status(400).json({ success: false, message: "Search query required" });

        const users = await UserModel.find({
            _id: { $ne: loggedInUserId },
            $or: [
                { fullName: { $regex: query, $options: "i" } },
                { email: query.toLowerCase() }
            ]
        }).select("_id fullName email profilePic bio");

        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendFriendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user._id;

        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({ success: false, message: "You cannot add yourself" });
        }

        const targetUser = await UserModel.findById(targetUserId);
        const currentUser = await UserModel.findById(currentUserId);

        if (!targetUser) return res.status(404).json({ success: false, message: "User not found" });

        const isAlreadyFriend = currentUser.friends.some(id => id.toString() === targetUserId.toString());
        if (isAlreadyFriend) return res.status(400).json({ success: false, message: "You are already friends" });

        const alreadySent = targetUser.friendRequests.some(id => id.toString() === currentUserId.toString());
        if (alreadySent) return res.status(400).json({ success: false, message: "Request already sent" });

        const alreadyReceived = currentUser.friendRequests.some(id => id.toString() === targetUserId.toString());
        if (alreadyReceived) return res.status(400).json({ success: false, message: "This user already sent you a request." });

        targetUser.friendRequests.push(currentUserId);
        currentUser.sentRequests.push(targetUserId);

        await Promise.all([targetUser.save(), currentUser.save()]);

        const io = getIO();
        const targetSocketId = userSocketMap.get(targetUserId.toString());
        
        if (targetSocketId) {
            io.to(targetSocketId).emit("friend:request_received", {
                _id: currentUser._id,
                fullName: currentUser.fullName,
                profilePic: currentUser.profilePic
            });
        }

        res.status(200).json({ success: true, message: "Friend request sent!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const acceptFriendRequest = async (req, res) => {
    try {
        const { senderId } = req.body; 
        const currentUserId = req.user._id; 

        const currentUser = await UserModel.findById(currentUserId);
        const senderUser = await UserModel.findById(senderId);

        const hasRequest = currentUser.friendRequests.some(id => id.toString() === senderId.toString());
        if (!hasRequest) return res.status(400).json({ success: false, message: "Friend request not found" });

        currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== senderId.toString());
        currentUser.sentRequests = currentUser.sentRequests.filter(id => id.toString() !== senderId.toString());
        senderUser.friendRequests = senderUser.friendRequests.filter(id => id.toString() !== currentUserId.toString());
        senderUser.sentRequests = senderUser.sentRequests.filter(id => id.toString() !== currentUserId.toString());

        if (!currentUser.friends.includes(senderId)) currentUser.friends.push(senderId);
        if (!senderUser.friends.includes(currentUserId)) senderUser.friends.push(currentUserId);

        await Promise.all([currentUser.save(), senderUser.save()]);

        const io = getIO();
        const senderSocketId = userSocketMap.get(senderId.toString());
        
        if (senderSocketId) {
            io.to(senderSocketId).emit("friend:request_accepted", {
                _id: currentUser._id,
                fullName: currentUser.fullName,
                profilePic: currentUser.profilePic,
                bio: currentUser.bio
            });
        }

        res.status(200).json({ success: true, message: "Friend request accepted!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectFriendRequest = async (req, res) => {
    try {
        const { senderId } = req.body; 
        const currentUserId = req.user._id; 

        const currentUser = await UserModel.findById(currentUserId);
        const senderUser = await UserModel.findById(senderId);

        const hasRequest = currentUser.friendRequests.some(id => id.toString() === senderId.toString());
        if (!hasRequest) return res.status(400).json({ success: false, message: "Friend request not found" });

        currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== senderId.toString());
        senderUser.sentRequests = senderUser.sentRequests.filter(id => id.toString() !== currentUserId.toString());

        await Promise.all([currentUser.save(), senderUser.save()]);

        res.status(200).json({ success: true, message: "Friend request rejected." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPendingRequests = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id)
            .populate("friendRequests", "_id fullName email profilePic bio");
        res.status(200).json({ success: true, requests: user.friendRequests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const unfriendUser = async (req, res) => {
    try {
        const { targetId } = req.body;
        const currentUserId = req.user._id;

        if (!targetId) return res.status(400).json({ success: false, message: "Target user ID is required" });

        const currentUser = await UserModel.findById(currentUserId);
        const targetUser = await UserModel.findById(targetId);

        if (!currentUser || !targetUser) return res.status(404).json({ success: false, message: "User not found" });

        const isFriend = currentUser.friends.some(id => id.toString() === targetId.toString());
        if (!isFriend) return res.status(400).json({ success: false, message: "You are not friends with this user" });

        currentUser.friends = currentUser.friends.filter(id => id.toString() !== targetId.toString());
        currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== targetId.toString());
        currentUser.sentRequests = currentUser.sentRequests.filter(id => id.toString() !== targetId.toString());

        targetUser.friends = targetUser.friends.filter(id => id.toString() !== currentUserId.toString());
        targetUser.friendRequests = targetUser.friendRequests.filter(id => id.toString() !== currentUserId.toString());
        targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== currentUserId.toString());

        await Promise.all([currentUser.save(), targetUser.save()]);

        const io = getIO();
        const targetSocketId = userSocketMap.get(targetId.toString());
        if (targetSocketId) {
            io.to(targetSocketId).emit("friend:removed", { userId: currentUserId });
        }

        res.status(200).json({ success: true, message: "Friend removed successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSidebarUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        
        const currentUser = await UserModel.findById(loggedInUserId)
            .populate("friends", "_id fullName email profilePic bio blockedUsers");
        
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "Current user not found." });
        }

        const friends = (currentUser.friends || []).filter(friend => friend !== null);
        
        const messages = await MessageModel.find({
            $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }]
        }); 

        const interactedUserIds = messages
            .filter(msg => msg.senderId && msg.receiverId) 
            .map(msg => 
                msg.senderId.toString() === loggedInUserId.toString() 
                    ? msg.receiverId.toString() 
                    : msg.senderId.toString()
            );

        const friendIds = friends.map(f => f._id.toString());
        
        const nonFriendIds = [...new Set(interactedUserIds)].filter(id => !friendIds.includes(id));

        const nonFriends = await UserModel.find({ _id: { $in: nonFriendIds } })
            .select("_id fullName email profilePic bio blockedUsers");

        const sidebarUsers = [...friends, ...nonFriends];
        
        res.status(200).json({ success: true, users: sidebarUsers });
        
    } catch (error) {        
        console.error("🔥 Crash in getSidebarUsers:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFriendsList = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const currentUser = await UserModel.findById(loggedInUserId)
            .populate("friends", "_id fullName email profilePic bio blockedUsers");
        
        res.status(200).json({ success: true, friends: currentUser.friends || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};