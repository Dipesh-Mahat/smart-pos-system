// rateLimiter.js

const rateLimit = require('express-rate-limit');

// Rate-limiting middleware configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `windowMs` (15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  statusCode: 429, // Status code for rate-limit exceeded
  headers: true, // Include rate limit headers in response
});

module.exports = rateLimiter;
