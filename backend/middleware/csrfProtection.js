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

  // Log CSRF attack attempt
  logSecurityEvent('CSRF_ATTACK_ATTEMPT', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    headers: req.headers,
    deviceId: req.deviceId || 'unknown'
  });

  // Send forbidden response
  res.status(403).json({
    success: false,
    message: 'Invalid or missing CSRF token'
  });
};

module.exports = { csrfProtection, handleCsrfError };