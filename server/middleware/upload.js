import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        if (file.mimetype.startsWith("audio") || file.originalname === "voice.webm" || file.mimetype === "video/webm") {
            return {
                folder: "chat-app/audio",
                resource_type: "video",
            };
        }
        
        if (file.mimetype.startsWith("image")) {
            return {
                folder: "chat-app/images",
                resource_type: "image",
                allowed_formats: ["jpg", "png", "jpeg", "webp"],
                transformation: [{ width: 800, height: 800, crop: "limit" }]
            };
        }

        return {
            folder: "chat-app/documents",
            resource_type: "raw",
        };
    }
});

const upload = multer({ storage });

export default upload;