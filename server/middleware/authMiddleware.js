import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel.js";

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = await UserModel.findById(decoded.userId).select("-password");

        next();

    } catch (error) {

        res.status(401).json({
            success: false,
            message: "Invalid token"
        });

    }

};

export default protect;