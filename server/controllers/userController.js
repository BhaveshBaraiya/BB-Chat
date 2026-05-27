import UserModel from "../models/UserModel.js";
import cloudinary from "../config/cloudinary.js";
import { getIO, userSocketMap } from "../socket/socket.js";

export const getUsers = async (req, res) => {
    try {

        const currentUser = await UserModel.findById(req.user._id);

        const users = await UserModel.find({
            _id: { $ne: req.user._id }
        }).select("-password");

        const updatedUsers = users.map(user => {

            const iBlocked = currentUser.blockedUsers?.includes(user._id);

            const blockedMe = user.blockedUsers?.includes(req.user._id);

            return {
                ...user.toObject(),
                iBlocked,
                blockedMe
            };
        });

        res.status(200).json({
            success: true,
            users: updatedUsers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const keyword = req.query.q;
        if (!keyword) {
            return res.json([]);
        }

        const users = await UserModel.find({
            $or: [
                {
                    fullName: {
                        $regex: keyword,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: keyword,
                        $options: "i"
                    }
                }
            ]
        })
            .select("-password")
            .limit(10);

        res.json(users);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const { fullName, bio } = req.body;

        let profilePic = req.file?.path || null;

        const user = await UserModel.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        user.fullName = fullName;
        user.bio = bio;

        if (profilePic) {
            user.profilePic = profilePic;
        }

        await user.save();

        // 🚀 EMIT REALTIME UPDATE
        const io = getIO();

        io.emit("profile:updated", {
            _id: user._id,
            fullName: user.fullName,
            bio: user.bio,
            profilePic: user.profilePic
        });

        res.json(user);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Profile update failed" });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const currentUser = await UserModel.findById(req.user._id);

        if (!currentUser.blockedUsers) currentUser.blockedUsers = [];

        if (!currentUser.blockedUsers.includes(userId)) {
            currentUser.blockedUsers.push(userId);
            await currentUser.save();
        }

        // 🚀 INSTANT SYNC: Tell the other user they got blocked
        const io = getIO();
        const receiverSocketId = userSocketMap.get(userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("user:blockedMe", { blockerId: req.user._id });
        }

        res.status(200).json({ message: "User blocked successfully" });
    } catch (error) {
        console.error("BLOCK ERROR:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const currentUser = await UserModel.findById(req.user._id);

        if (!currentUser.blockedUsers) currentUser.blockedUsers = [];

        currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userId);
        await currentUser.save();

        const io = getIO();
        const receiverSocketId = userSocketMap.get(userId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("user:unblockedMe", { blockerId: req.user._id });
        }

        res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
        console.error("UNBLOCK ERROR:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const blocked = async (req, res) => {
    try {
        const currentUser = await UserModel.findById(req.user._id).populate("blockedUsers", "fullName profilePic");
        res.status(200).json(currentUser.blockedUsers);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};