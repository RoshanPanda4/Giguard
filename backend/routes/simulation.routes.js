const express = require('express');
const router = express.Router();

// Import controller
const { runSimulation } = require('../controllers/simulation.controller');

// 🔥 MAIN ROUTE (FINAL)
router.post('/', runSimulation);

module.exports = router;