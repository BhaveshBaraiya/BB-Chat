import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getUsers, updateProfile, searchUsers } from "../controllers/userController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/search", protect, searchUsers);
router.put("/profile", protect, upload.single("profilePic"), updateProfile);

export default router;