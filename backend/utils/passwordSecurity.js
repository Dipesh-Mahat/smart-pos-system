/**
 * Password security utility functions
 * Implements strong password requirements and validation
 */

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid flag and requirements
 */
const validatePassword = (password) => {
    const requirements = {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[@$!%*?&]/.test(password)
    };

    const isValid = Object.values(requirements).every(Boolean);

    return {
        isValid,
        requirements: {
            ...requirements,
            description: [
                'Minimum 8 characters',
                'At least one uppercase letter',
                'At least one lowercase letter',
                'At least one number',
                'At least one special character (@$!%*?&)'
            ]
        },
        strengthScore: Object.values(requirements).filter(Boolean).length
    };
};

/**
 * Get password strength message
 * @param {number} score - Password strength score (0-5)
 * @returns {string} - Password strength description
 */
const getPasswordStrengthMessage = (score) => {
    const messages = {
        0: 'Very Weak',
        1: 'Weak',
        2: 'Fair',
        3: 'Good',
        4: 'Strong',
        5: 'Very Strong'
    };
    return messages[score] || 'Invalid Score';
};

module.exports = {
    validatePassword,
    getPasswordStrengthMessage,
    passwordStrengthRegex
};
