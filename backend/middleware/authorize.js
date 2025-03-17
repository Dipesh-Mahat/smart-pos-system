/**
 * Role-based authorization middleware
 * This middleware checks if the authenticated user has the required role(s)
 * to access a specific route.
 */

// Middleware to check user roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists in request (set by authenticateJWT middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
      });
    }

    // Check if user has one of the allowed roles
    const hasAllowedRole = allowedRoles.includes(req.user.role);
    
    if (!hasAllowedRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    // User has required role, proceed to the next middleware/route handler
    next();
  };
};

module.exports = authorize; 