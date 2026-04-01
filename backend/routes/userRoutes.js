const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

// Upload photo
router.post("/upload-photo", upload.single("photo"), (req, res) => {
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