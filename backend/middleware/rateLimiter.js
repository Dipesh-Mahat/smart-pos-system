const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

/**
 * Device identification middleware
 * Identifies unique devices using cookies and UUID
 */
const identifyDevice = (req, res, next) => {
  // Check for existing device ID in cookies
  let deviceId = req.cookies?.device_id;
  
  if (!deviceId) {
    // Generate a new device ID if none exists
    deviceId = uuidv4();
    
    // Set a persistent cookie with the device ID
    res.cookie('device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      sameSite: 'strict'
    });
  }
  
  // Add device ID to request object for use in rate limiter
  req.deviceId = deviceId;
  next();
};

/**
 * Key generator function that uses device ID if available, falls back to IP
 * @param {Object} req - Express request object
 * @returns {string} - Key to use for rate limiting
 */
const keyGenerator = (req) => {
  // Use device ID if available, otherwise use IP
  return req.deviceId || req.ip;
};

/**
 * General API rate limiter
 * Less strict, applies to most API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for retail environment with multiple employees
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again after 15 minutes',
  keyGenerator
});

/**
 * Authentication rate limiter
 * More strict, applies to login endpoints
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Increased for retail environment with multiple employees
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again after an hour',
  skipSuccessfulRequests: true, // Don't count successful logins against the rate limit
  keyGenerator
});

/**
 * Registration rate limiter
 * Applies to user registration endpoints
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Increased for retail environment with multiple employees
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many registration attempts, please try again after an hour',
  keyGenerator
});

/**
 * Admin action rate limiter
 * For sensitive admin operations
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Reasonable limit for admin actions
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin actions, please try again after an hour',
  keyGenerator
});

module.exports = {
  identifyDevice,
  apiLimiter,
  authLimiter,
  registerLimiter,
  adminLimiter
};