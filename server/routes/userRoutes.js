import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getUsers, updateProfile, searchUsers, blocked, unblockUser, blockUser } from "../controllers/userController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/search", protect, searchUsers);
router.put("/profile", protect, upload.single("profilePic"), updateProfile);
router.put("/profile", protect, upload.single("profilePic"), updateProfile);
router.post("/block", protect, blockUser); 
router.post("/unblock", protect, unblockUser);
router.get("/blocked", protect, blocked);

export default router;