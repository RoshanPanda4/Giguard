const router = require('express').Router();
const { getWallet, creditWallet } = require('../controllers/wallet.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/me', verifyToken, getWallet);
router.post('/credit', verifyToken, creditWallet);

module.exports = router;