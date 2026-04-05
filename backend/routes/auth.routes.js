const router = require('express').Router();
const { signup, login, forgotPassword, resetPassword } = require('../controllers/auth.controller');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot', forgotPassword);
router.post('/reset', resetPassword);

module.exports = router;