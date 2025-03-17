const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authControllers');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

// Apply specific rate limiters to auth endpoints
router.post('/login', authLimiter, login);
router.post('/register', registerLimiter, register);

module.exports = router;
