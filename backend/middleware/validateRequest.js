const Joi = require('joi');
const { sanitizeObject } = require('../utils/security');
const { logSecurityEvent } = require('../utils/securityLogger');

/**
 * Middleware to validate request data against a schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateRequestSchema = (schema) => {
    return (req, res, next) => {
        // Sanitize input before validation
        const sanitizedData = sanitizeObject(req.body);
        
        // Validate against schema
        const { error, value } = schema.validate(sanitizedData, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            // Log validation failures for security monitoring
            logSecurityEvent('REQUEST_VALIDATION_FAILED', {
                path: req.path,
                method: req.method,
                errors: error.details.map(err => err.message),
                ip: req.ip
            });

            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
                errors: error.details.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        // Replace potentially dangerous data with validated data
        req.body = value;
        next();
    };
};

// Common validation schemas
const commonSchemas = {
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    email: Joi.string().email(),
    password: Joi.string().min(8),
    phone: Joi.string().pattern(/^\+?[\d\s-()]{8,}$/),
    date: Joi.date().iso()
};

module.exports = {
    validateRequestSchema,
    commonSchemas
};
