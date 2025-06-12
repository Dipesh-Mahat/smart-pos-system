const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${err.stack || err.message}\n`;
  
  // Log to console in development
  console.error(err);
  
  // Append to log file
  fs.appendFile(
    path.join(logsDir, 'error.log'),
    logMessage,
    (writeErr) => {
      if (writeErr) {
        console.error('Failed to write to error log:', writeErr);
      }
    }
  );
  
  // If response hasn't been sent yet, send an error response
  if (!res.headersSent) {
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || 'Something went wrong';
    
    res.status(statusCode).json({
      error: message
    });
  }
};

module.exports = errorLogger;
