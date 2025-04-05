const fs = require('fs');
const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/security.log') 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const logSecurityEvent = (eventType, details) => {
  securityLogger.info({
    eventType,
    ...details,
    timestamp: new Date()
  });
};

module.exports = { logSecurityEvent };
