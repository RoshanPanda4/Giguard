const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

const { getProfile, updateProfile } = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/auth.middleware");

// Get and Update Profile
router.get("/profile", verifyToken, getProfile);
router.post("/profile", verifyToken, updateProfile);

// Upload photo
router.post("/upload-photo", verifyToken, upload.single("photo"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const url = `/usrphotos/${req.file.filename}`;

    res.json({
        message: "Uploaded successfully",
        url
    });
});

module.exports = router;