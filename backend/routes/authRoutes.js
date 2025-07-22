const express = require('express');
const router = express.Router();
const { login, register, googleAuth, registerSupplier } = require('../controllers/authControllers');
const { refreshToken, logout } = require('../controllers/tokenController');
const { createDynamicRateLimiter } = require('../middleware/rateLimiter');
const { bruteForceProtection, resetLoginAttempts, monitorSuspiciousActivity } = require('../middleware/bruteForceProtection');
const authenticateJWT = require('../middleware/authJWT');

// Apply security middleware to auth endpoints
router.post('/login', 
    createDynamicRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 attempts per 15 minutes
    bruteForceProtection,
    monitorSuspiciousActivity,
    login,
    resetLoginAttempts
);

router.post('/register',
    createDynamicRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }), // 3 attempts per hour
    monitorSuspiciousActivity,
    register
);

router.post('/register-supplier',
    createDynamicRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }), // 3 attempts per hour
    monitorSuspiciousActivity,
    registerSupplier
);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticateJWT, logout);

// Google OAuth routes
router.post('/google', googleAuth);

module.exports = router;
