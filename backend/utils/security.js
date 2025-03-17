/**
 * Security utility functions for the Smart POS System
 * These functions help sanitize inputs, validate data, and prevent common security issues
 */

const validator = require('validator');
const crypto = require('crypto');

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - The user input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Escape HTML special characters
  return validator.escape(input.trim());
};

/**
 * Sanitize an object's string properties
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes
 * @returns {string} - Hex-encoded random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Create a hash of a value using SHA-256
 * @param {string} value - The value to hash
 * @returns {string} - The hashed value
 */
const hashValue = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid flag and message
 */
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
  generateSecureToken,
  hashValue,
  isValidEmail,
  validatePasswordStrength
}; 