import express from "express";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { getMessages, sendMessage, getUnreadCounts, reactToMessage, deleteForEveryone, deleteForMe, editMessage, togglePinMessage, clearChat } from "../controllers/messageController.js";

const router= express.Router();

router.get("/unread", protect, getUnreadCounts);
router.get("/:id", protect, getMessages);
router.post("/send/:id", protect, upload.fields([
    { name: "files", maxCount: 10 }, 
    { name: "audio", maxCount: 1 }
]), sendMessage);
router.put("/edit/:id",protect, editMessage);
router.put("/pin/:id", protect, togglePinMessage);
router.put("/react", protect, reactToMessage);
router.put("/delete/me/:id",protect,deleteForMe);
router.put("/delete/all/:id", protect,deleteForEveryone);
router.delete("/clear/:userId", protect,clearChat);

export default router;