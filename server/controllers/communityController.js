import CommunityModel from "../models/CommunityModel.js";
import MessageModel from "../models/MessageModel.js"; 
import { getIO, userSocketMap } from "../socket/socket.js";

export const createCommunity = async (req, res) => {
    try {
        const { name, description, members } = req.body; 
        const adminId = req.user._id;

        if (!name) return res.status(400).json({ success: false, message: "Community name is required" });

        const communityMembers = [...new Set([...members, adminId.toString()])];

        const newCommunity = await CommunityModel.create({
            name,
            description,
            admin: adminId,
            members: communityMembers
        });

        const populatedCommunity = await CommunityModel.findById(newCommunity._id).populate("members", "fullName profilePic");

        const io = getIO();
        communityMembers.forEach(memberId => {
            if (memberId.toString() !== adminId.toString()) {
                const memberSocketId = userSocketMap.get(memberId.toString());
                if (memberSocketId) {
                    io.to(memberSocketId).emit("community:message", { communityId: newCommunity._id });
                }
            }
        });

        res.status(201).json({ success: true, community: populatedCommunity });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyCommunities = async (req, res) => {
    try {
        const communities = await CommunityModel.find({ members: req.user._id })
            .populate("members", "fullName profilePic")
            .populate({
                path: "lastMessage",
                select: "text createdAt senderId",
                populate: { path: "senderId", select: "fullName" }
            })
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, communities });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendCommunityMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { communityId } = req.params;
        const senderId = req.user._id;

        const newMessage = await MessageModel.create({
            communityId,
            senderId,
            text,
        });
        
        const populatedMessage = await MessageModel.findById(newMessage._id)
            .populate("senderId", "fullName profilePic")
            .populate("communityId", "name avatar");

        const community = await CommunityModel.findById(communityId);
        
        if (community) {
            community.lastMessage = newMessage._id;
            await community.save();
        }

        const io = getIO();
        
        if (community && community.members) {
            community.members.forEach(memberId => {
                if (memberId.toString() !== senderId.toString()) {
                    const memberSocketId = userSocketMap.get(memberId.toString());
                    
                    if (memberSocketId) {
                        io.to(memberSocketId).emit("newCommunityMessage", populatedMessage);
                    }
                }
            });
        }

        res.status(201).json({ success: true, message: populatedMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};