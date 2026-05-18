import express from "express";

import protect from "../middleware/authMiddleware.js";

import { getMessages, sendMessage, getUnreadCounts, reactToMessage, deleteForEveryone, deleteForMe } from "../controllers/messageController.js";

const router= express.Router();

router.get("/unread", protect, getUnreadCounts);
router.get("/:id", protect, getMessages);
router.post("/send/:id", protect, sendMessage);
router.put("/react", protect, reactToMessage);
router.put("/delete/me/:id",protect,deleteForMe);
router.put("/delete/all/:id", protect,deleteForEveryone);

export default router;