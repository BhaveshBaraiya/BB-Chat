import multer from "multer";
import fs from "fs";

// 1. Automatically create the 'uploads' directory if it doesn't exist
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Replace spaces with dashes in original filename to prevent URL issues
        const safeName = file.originalname.replace(/\s+/g, '-');
        cb(null, Date.now() + "-" + safeName);
    }
});

const upload = multer({
    storage
});

export default upload;