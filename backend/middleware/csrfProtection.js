const csrf = require('csurf');
const { logSecurityEvent } = require('../utils/securityLogger');

// Configure CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Custom middleware to handle CSRF errors
const handleCsrfError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Log CSRF attack attempt with essential information
  logSecurityEvent('CSRF_ATTACK_ATTEMPT', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    deviceId: req.deviceId || 'unknown',
    userAgent: req.get('User-Agent')  // Adding user agent for better context
  });

  // Send a generic response to prevent revealing attack details
  res.status(403).json({
    success: false,
    message: 'CSRF token validation failed'
  });
};

module.exports = { csrfProtection, handleCsrfError };
