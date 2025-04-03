const authorize = (roles = []) => {
  // roles param can be a single role string (e.g., 'admin') or an array of roles (e.g., ['admin', 'manager'])
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
      }

      // Check if user has the required role
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden. You do not have access to this resource.' });
      }

      // User is authorized
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error during authorization' });
    }
  };
};

module.exports = authorize;
