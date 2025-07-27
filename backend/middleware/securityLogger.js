const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const securityLogPath = path.join(logsDir, 'security.log');

/**
 * Log security events to file
 */
function logSecurityEvent(event, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        event,
        details,
        ip: details.ip || 'unknown',
        userAgent: details.userAgent || 'unknown'
    };

    const logLine = `${timestamp} [SECURITY] ${event}: ${JSON.stringify(details)}\n`;
    
    try {
        fs.appendFileSync(securityLogPath, logLine);
    } catch (error) {
        console.error('Failed to write security log:', error);
    }
}

/**
 * Log authentication events
 */
function logAuthEvent(type, userId, details = {}) {
    logSecurityEvent(`AUTH_${type.toUpperCase()}`, {
        userId,
        ...details
    });
}

/**
 * Log access control events
 */
function logAccessEvent(action, userId, resource, details = {}) {
    logSecurityEvent(`ACCESS_${action.toUpperCase()}`, {
        userId,
        resource,
        ...details
    });
}

module.exports = {
    logSecurityEvent,
    logAuthEvent,
    logAccessEvent
};
