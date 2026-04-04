const router = require('express').Router();
const { createPolicy, getPolicy, savePendingPolicy, getPendingPolicy, activatePolicy } = require('../controllers/policy.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/create', verifyToken, createPolicy);
router.get('/me', verifyToken, getPolicy);

router.post('/pending', verifyToken, savePendingPolicy);
router.get('/pending', verifyToken, getPendingPolicy);
router.post('/activate', verifyToken, activatePolicy);

module.exports = router;