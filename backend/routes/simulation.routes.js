const express = require('express');
const router = express.Router();

router.post('/run', (req, res) => {
    res.json({
        success: true,
        message: "Simulation route working"
    });
});

module.exports = router;