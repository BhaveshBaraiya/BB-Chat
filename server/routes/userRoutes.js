import express from "express";
import protect from "../middleware/authMiddleware.js";
import { 
    getUsers, 
    updateProfile, 
    searchUsers, 
    blocked, 
    unblockUser, 
    blockUser, 
    toggleMuteChat, 
    updateNotificationSettings,    
} from "../controllers/userController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/search", protect, searchUsers);
router.put("/profile", protect, upload.single("profilePic"), updateProfile);

router.post("/block", protect, blockUser); 
router.post("/unblock", protect, unblockUser);
router.get("/blocked", protect, blocked);

// Mute/Unmute Chats
router.post("/mute-chat", protect, toggleMuteChat);
router.post("/unmute-chat", protect, toggleMuteChat);

// Global notification toggle
router.put("/settings/notifications", protect, updateNotificationSettings);

export default router;