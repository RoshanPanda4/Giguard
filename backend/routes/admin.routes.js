const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// GET /api/admin/stats
router.get('/stats', verifyToken, getStats);

module.exports = router;
