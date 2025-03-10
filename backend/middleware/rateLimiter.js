const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 requests per hour
  message: 'Too many requests from this IP, please try again later',
  headers: true, // Include rate limit info in headers
});

module.exports = limiter;