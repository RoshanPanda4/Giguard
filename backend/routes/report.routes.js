const express = require('express');
const router = express.Router();

const { addReport, getZoneRiskStatus } = require('../controllers/reports.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Submit an emergency report
router.post('/', verifyToken, addReport);

// Check current zone risk status
router.get('/status/:zone', getZoneRiskStatus);

module.exports = router;
