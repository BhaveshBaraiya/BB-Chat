import express from "express";
import { registerUser, loginUser, getCurrentUser, logoutUser, verifyEmail, resendVerification, forgotPassword, resetPassword } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getCurrentUser);

// Verify User
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;