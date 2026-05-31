import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { createStatus, getFriendsStatuses, markStatusViewed } from "../controllers/statusController.js";

const router = express.Router();

router.use(protect);

router.get("/feed", getFriendsStatuses);
router.post("/view/:id", markStatusViewed);
router.post("/create", upload.fields([{ name: "media", maxCount: 1 }, { name: "audio", maxCount: 1 }]), createStatus);

export default router;