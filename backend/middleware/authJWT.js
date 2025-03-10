const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];  // Extract token from Authorization header
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {  // Verify token with your secret
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;  // Attach user info to the request object
    next();  // Call the next middleware or route handler
  });
};

// Export the middleware function
module.exports = authenticateJWT;
