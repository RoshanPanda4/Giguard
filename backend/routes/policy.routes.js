const router = require('express').Router();
const { createPolicy, getPolicy } = require('../controllers/policy.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/create', verifyToken, createPolicy);
router.get('/me', verifyToken, getPolicy);

module.exports = router;