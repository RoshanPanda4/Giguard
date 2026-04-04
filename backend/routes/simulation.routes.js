const express = require('express');
const router = express.Router();

// Import controller
const { runSimulation, saveResult, getResult } = require('../controllers/simulation.controller');
const { verifyToken } = require("../middleware/auth.middleware");

// 🔥 MAIN ROUTE (FINAL)
router.post('/', runSimulation);

// 🔥 RESULT ROUTES
router.post('/result', verifyToken, saveResult);
router.get('/result', verifyToken, getResult);

module.exports = router;