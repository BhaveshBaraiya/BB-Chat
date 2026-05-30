import express from "express";
import protect from "../middleware/authMiddleware.js";
import { 
    searchUsers, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    getFriendsList, 
    getPendingRequests,
    unfriendUser,
    getSidebarUsers
} from "../controllers/friendController.js";

const router = express.Router();

router.use(protect);

router.get("/search", searchUsers);
router.get("/list", getFriendsList);
router.get("/requests", getPendingRequests);
router.get("/sidebar-users", getSidebarUsers); // Important!

router.post("/send", sendFriendRequest);
router.post("/accept", acceptFriendRequest);
router.post("/reject", rejectFriendRequest); 
router.post("/unfriend", unfriendUser);

export default router;