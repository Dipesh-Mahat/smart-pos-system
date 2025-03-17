const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

// Store for device identifiers
const deviceStore = new Map();

// Middleware to identify devices using fingerprinting
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

// Device-based rate limiter for registration
const deviceRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each device to 10 registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many registration attempts from this device, please try again after an hour',
  // Use device ID instead of IP for tracking
  keyGenerator: (req) => req.deviceId || req.ip,
  skip: (req) => !req.deviceId // Fall back to IP if no device ID
});

// Device-based rate limiter for login
const deviceAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each device to 5 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this device, please try again after an hour',
  // Use device ID instead of IP for tracking
  keyGenerator: (req) => req.deviceId || req.ip,
  skip: (req) => !req.deviceId, // Fall back to IP if no device ID
  skipSuccessfulRequests: true, // Don't count successful logins against the rate limit
});

module.exports = {
  identifyDevice,
  deviceRegisterLimiter,
  deviceAuthLimiter
}; 