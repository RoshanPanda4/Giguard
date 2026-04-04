const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ================== CREATE FOLDER ==================
const uploadDir = path.join(__dirname, "../usrphotos");

// Create folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ================== STORAGE CONFIG ==================
const storage = multer.memoryStorage();

// ================== FILE FILTER ==================
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

// ================== LIMITS ==================
const limits = {
    fileSize: 2 * 1024 * 1024 // 2MB
};

// ================== EXPORT ==================
const upload = multer({
    storage,
    fileFilter,
    limits
});

module.exports = upload;