const express = require('express');
const router = express.Router();
const { login, register, googleAuth } = require('../controllers/authControllers');
const { refreshToken, logout } = require('../controllers/tokenController');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const authenticateJWT = require('../middleware/authJWT');

// Apply specific rate limiters to auth endpoints
router.post('/login', authLimiter, login);
router.post('/register', registerLimiter, register);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateJWT, logout);

// Google OAuth routes
router.post('/google', googleAuth);

module.exports = router;
