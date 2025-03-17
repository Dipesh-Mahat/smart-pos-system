const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ success: false, message: 'Invalid token format.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired. Please login again.',
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({
            success: false,
            message: 'Invalid token. Please login again.',
          });
        } else {
          return res.status(403).json({
            success: false,
            message: 'Token validation failed.',
            error: err.message,
          });
        }
      }

      req.user = decoded;
      req.authTime = new Date();
      
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error during authentication',
    });
  }
};

module.exports = authenticateJWT;
