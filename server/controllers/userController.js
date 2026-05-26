import UserModel from "../models/UserModel.js";
import cloudinary from "../config/cloudinary.js";
import { getIO } from "../socket/socket.js";

export const getUsers = async (req, res) => {
    try {
        const users = await UserModel.find({ _id: { $ne: req.user._id } })
            .select("-password");

        res.status(200).json({
            success: true,
            users
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
        console.log("query:", req.query.q);
        console.log("user:", req.user);

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

        console.log("results:", users.length);

        res.json(users);

    } catch (error) {
        console.log("SEARCH ERROR:", error);
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

        // 👇 FIX IS HERE: Changed User to UserModel
        const user = await UserModel.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        user.fullName = fullName;
        user.bio = bio;

        // 👇 Cloudinary update or remove logic
        if (profilePic) {
            user.profilePic = profilePic; // cloudinary URL
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