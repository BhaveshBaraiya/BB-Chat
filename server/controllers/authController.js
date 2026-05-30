import bcrypt from "bcrypt";
import validator from "validator";
import UserModel from "../models/UserModel.js";
import generateToken from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        
        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" });
        }
        
        const isStrong = validator.isStrongPassword(password, {
            minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
        });

        if (!isStrong) {
            return res.status(400).json({ success: false, message: "Password is not strong enough" });
        }

        const existingUser = await UserModel.findOne({ email });
        
        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ success: false, message: "User already exists" });
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                const otp = generateOTP();

                existingUser.fullName = fullName;
                existingUser.password = hashedPassword;
                existingUser.verificationCode = otp;
                existingUser.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
                
                await existingUser.save();
                await sendVerificationEmail(email, otp);

                return res.status(200).json({
                    success: true,
                    message: "Account updated. Please check your email for the new verification code.",
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        const user = await UserModel.create({
            fullName,
            email,
            password: hashedPassword,
            verificationCode: otp,
            verificationCodeExpires: Date.now() + 15 * 60 * 1000
        });
        
        await sendVerificationEmail(email, otp);

        res.status(201).json({
            success: true,
            message: "Account created. Please verify your email.",
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "Account is already verified" });
        }

        if (user.verificationCode !== otp) {
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }

        if (user.verificationCodeExpires < Date.now()) {
            return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one." });
        }
        
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save();

        generateToken(user._id, res);

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePic: user.profilePic
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        
        if (!user.isVerified) {
            return res.status(403).json({ 
                success: false, 
                isVerified: false, 
                message: "Please verify your email before logging in." 
            });
        }

        generateToken(user._id, res);

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePic: user.profilePic
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await UserModel.findOne({ email });

        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.isVerified) return res.status(400).json({ success: false, message: "User is already verified" });

        const otp = generateOTP();
        user.verificationCode = otp;
        user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        await sendVerificationEmail(email, otp);

        res.status(200).json({ success: true, message: "Verification code resent" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCurrentUser = async (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
};

export const logoutUser = async (req, res) => {
    res.cookie(
    "token",
    "",
    {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax"
    }
);

    res.status(200).json({
        success: true,
        message: "Logged out"
    });

};