const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authControllers');
const { refreshToken } = require('../controllers/tokenController');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Apply specific rate limiters to auth endpoints
router.post('/login', authLimiter, login);
router.post('/register', registerLimiter, register);
router.post('/refresh-token', refreshToken);

module.exports = router;
