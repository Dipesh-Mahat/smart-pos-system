const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// More strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this IP, please try again after an hour',
  skipSuccessfulRequests: true, // Don't count successful logins against the rate limit
});

// Rate limiter for user registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many registration attempts from this IP, please try again after an hour',
});

module.exports = {
  apiLimiter,
  authLimiter,
  registerLimiter
};