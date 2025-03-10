const express = require('express');
const router = express.Router();

// Import middleware
const limiter = require('../middleware/rateLimiter'); // Rate-limiting middleware
const authenticateJWT = require('../middleware/authJWT'); // JWT authentication middleware

// Apply rate limiting to all routes in this file
router.use(limiter);

// Example public route
router.get('/data', (req, res) => {
  res.send('Data from MongoDB');
});

// Protected route example (requires JWT authentication)
router.get('/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'This is a protected route.', user: req.user });
});

module.exports = router;