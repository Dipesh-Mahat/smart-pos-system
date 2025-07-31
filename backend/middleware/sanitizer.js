const xss = require('xss');
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');
const { check, validationResult } = require('express-validator');

/**
 * Custom sanitization options for HTML content
 */
const sanitizeOptions = {
    allowedTags: [ 
        'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'
    ],
    allowedAttributes: {},
    allowedIframeHostnames: []
};

/**
 * Sanitizes an object's string values recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        if (typeof value === 'string') {
            // Apply multiple sanitization methods
            let sanitized = value;
            sanitized = xss(sanitized); // Prevent XSS
            sanitized = validator.escape(sanitized); // Escape special characters
            
            // For fields that might contain HTML
            if (key.toLowerCase().includes('description') || key.toLowerCase().includes('content')) {
                sanitized = sanitizeHtml(value, sanitizeOptions);
            }
            
            acc[key] = sanitized;
        } else if (typeof value === 'object' && value !== null) {
            acc[key] = sanitizeObject(value);
        } else {
            acc[key] = value;
        }
        return acc;
    }, Array.isArray(obj) ? [] : {});
};

/**
 * Common validation rules for different types of data
 */
const validationRules = {
    email: check('email')
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage('Invalid email format'),
    
    password: check('password')
        .trim()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    
    phone: check('phone')
        .trim()
        .matches(/^\+?[\d\s-]{10,}$/)
        .withMessage('Invalid phone number format'),
    
    mongoId: check('id')
        .trim()
        .isMongoId()
        .withMessage('Invalid ID format'),
    
    price: check('price')
        .trim()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    
    quantity: check('quantity')
        .trim()
        .isInt({ min: 0 })
        .withMessage('Quantity must be a positive integer')
};

/**
 * Middleware to sanitize request body, query parameters, and URL parameters
 */
const sanitizeRequest = (req, res, next) => {
    try {
        // Sanitize body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }

        // Special handling for file uploads
        if (req.file || req.files) {
            // Sanitize file names
            const sanitizeFile = (file) => {
                if (!file) return;
                file.originalname = validator.escape(file.originalname);
                file.filename = validator.escape(file.filename);
            };

            if (req.file) {
                sanitizeFile(req.file);
            }
            if (req.files) {
                Array.isArray(req.files) 
                    ? req.files.forEach(sanitizeFile)
                    : Object.values(req.files).forEach(sanitizeFile);
            }
        }

        next();
    } catch (error) {
        console.error('Sanitization error:', error);
        res.status(400).json({
            success: false,
            message: 'Invalid request data'
        });
    }
};

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

/**
 * SQL Injection prevention middleware
 */
const preventSqlInjection = (req, res, next) => {
    const sqlInjectionPattern = /(\b(select|insert|update|delete|drop|union|exec|declare|cast)\b)|(['"])/gi;
    
    const checkForSqlInjection = (value) => {
        if (typeof value === 'string' && sqlInjectionPattern.test(value)) {
            throw new Error('Potential SQL injection detected');
        }
    };

    try {
        // Check body
        if (req.body) {
            Object.values(req.body).forEach(checkForSqlInjection);
        }

        // Check query parameters
        if (req.query) {
            Object.values(req.query).forEach(checkForSqlInjection);
        }

        // Check URL parameters
        if (req.params) {
            Object.values(req.params).forEach(checkForSqlInjection);
        }

        next();
    } catch (error) {
        console.error('SQL Injection attempt detected:', error);
        res.status(403).json({
            success: false,
            message: 'Invalid request'
        });
    }
};

module.exports = {
    sanitizeRequest,
    validationRules,
    handleValidationErrors,
    preventSqlInjection
};
