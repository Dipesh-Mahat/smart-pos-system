const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { format } = winston;

// Ensure logs directory exists with proper permissions
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o750 }); // Restricted permissions
}

// Define custom log formats
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.metadata({
        fillExcept: ['timestamp', 'level', 'message']
    }),
    format.printf(info => {
        const { timestamp, level, message, metadata } = info;
        return `${timestamp} [${level.toUpperCase()}] ${message} ${JSON.stringify(metadata)}`;
    })
);

// Create request logger
const requestLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'api-requests.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true,
            options: { flags: 'a', mode: 0o640 } // Append with restricted permissions
        }),
        // Console transport for development
        process.env.NODE_ENV !== 'production' ? 
            new winston.transports.Console({ format: format.simple() }) : 
            null
    ].filter(Boolean)
});

/**
 * Extract safe request data for logging
 * @param {Object} req - Express request object
 * @returns {Object} - Sanitized request data
 */
const extractSafeRequestData = (req) => {
    // Create a copy of body and sanitize sensitive fields
    const safeBody = req.body ? { ...req.body } : {};
    
    // Mask sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'credit_card', 'card', 'cvv', 'pin'];
    sensitiveFields.forEach(field => {
        if (safeBody[field]) {
            safeBody[field] = '********';
        }
    });

    return {
        id: uuidv4(), // Unique request ID
        method: req.method,
        url: req.originalUrl || req.url,
        path: req.path,
        params: req.params,
        query: req.query,
        body: safeBody,
        headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'content-length': req.headers['content-length'],
            'accept': req.headers['accept'],
            'accept-encoding': req.headers['accept-encoding'],
            'x-forwarded-for': req.headers['x-forwarded-for'],
        },
        ip: req.ip,
        userId: req.user?.id || 'anonymous',
        role: req.user?.role || 'none'
    };
};

/**
 * Extract safe response data for logging
 * @param {Object} res - Express response object
 * @param {Object} responseBody - Response body
 * @returns {Object} - Sanitized response data
 */
const extractSafeResponseData = (res, responseBody) => {
    // Clone the response body and sanitize sensitive data
    let safeResponseBody = null;

    if (responseBody) {
        try {
            safeResponseBody = JSON.parse(JSON.stringify(responseBody));
            // Remove sensitive data
            if (safeResponseBody.token) safeResponseBody.token = '[REDACTED]';
            if (safeResponseBody.accessToken) safeResponseBody.accessToken = '[REDACTED]';
            if (safeResponseBody.refreshToken) safeResponseBody.refreshToken = '[REDACTED]';
            // Limit response size in logs
            safeResponseBody = JSON.stringify(safeResponseBody).substring(0, 1000);
            if (safeResponseBody.length === 1000) {
                safeResponseBody += '... [truncated]';
            }
            try {
                safeResponseBody = JSON.parse(safeResponseBody);
            } catch (e) {
                // Keep as string if parsing fails after truncation
            }
        } catch (error) {
            safeResponseBody = { error: 'Could not parse response body' };
        }
    }

    return {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        responseTime: res.responseTime,
        responseSize: res.get('content-length'),
        body: safeResponseBody
    };
};

/**
 * Request and response logging middleware
 */
const apiRequestLogger = (req, res, next) => {
    // Add request start time
    req._startTime = Date.now();
    
    // Generate unique request ID
    req.requestId = uuidv4();
    res.setHeader('X-Request-ID', req.requestId);
    
    // Extract safe request data
    const requestData = extractSafeRequestData(req);
    
    // Log incoming request
    requestLogger.info(`${req.method} ${req.originalUrl}`, {
        type: 'REQUEST',
        request: requestData,
        requestId: req.requestId
    });
    
    // Capture response data
    const originalSend = res.send;
    res.send = function (body) {
        res.responseBody = body;
        return originalSend.apply(res, arguments);
    };
    
    // Log response when finished
    res.on('finish', () => {
        // Calculate response time
        res.responseTime = Date.now() - req._startTime;
        
        // Parse response body if it's JSON
        let responseBody = null;
        if (res.responseBody) {
            try {
                responseBody = JSON.parse(res.responseBody);
            } catch (e) {
                responseBody = res.responseBody;
            }
        }
        
        // Extract safe response data
        const responseData = extractSafeResponseData(res, responseBody);
        
        // Log response
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';
        requestLogger.log(logLevel, `${req.method} ${req.originalUrl} ${res.statusCode} ${res.responseTime}ms`, {
            type: 'RESPONSE',
            response: responseData,
            requestId: req.requestId
        });
        
        // Additional logging for failed requests
        if (res.statusCode >= 400) {
            requestLogger.error(`Request failed: ${req.method} ${req.originalUrl}`, {
                type: 'REQUEST_FAILED',
                statusCode: res.statusCode,
                responseTime: res.responseTime,
                requestId: req.requestId,
                userId: req.user?.id || 'anonymous'
            });
        }
    });
    
    next();
};

/**
 * Log API errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logApiError = (err, req, res) => {
    requestLogger.error(`API Error: ${err.message}`, {
        error: {
            message: err.message,
            stack: err.stack,
            name: err.name,
            code: err.code
        },
        requestId: req.requestId || uuidv4(),
        path: req.path,
        method: req.method,
        userId: req.user?.id || 'anonymous'
    });
};

module.exports = {
    apiRequestLogger,
    logApiError,
    requestLogger
};
