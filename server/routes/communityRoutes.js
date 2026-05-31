import express from "express";
import protect from "../middleware/authMiddleware.js";
import { createCommunity, getMyCommunities } from "../controllers/communityController.js";

const router = express.Router();

router.use(protect);
router.get("/", getMyCommunities);
router.post("/create", createCommunity);

export default router;