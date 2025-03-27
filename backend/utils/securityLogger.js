const winston = require('winston');
const path = require('path');

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
