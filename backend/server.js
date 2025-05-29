// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import middleware
const helmetConfig = require('../backend/middleware/helmetConfig');
const { identifyDevice, apiLimiter, authLimiter, registerLimiter, adminLimiter } = require('../backend/middleware/rateLimiter');
const authenticateJWT = require('../backend/middleware/authJWT');
const { csrfProtection, handleCsrfError } = require('../backend/middleware/csrfProtection');

// Create an Express app (This should come first)
const app = express();
const port = process.env.PORT || 5000;

// Middleware (after app initialization)
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin) return callback(null, true);    // Define allowed origins
    const allowedOrigins = [
      'https://smart-pos-system-lime.vercel.app',   // Frontend Vercel deployment
      'https://smart-pos-system.onrender.com'  // Backend Render deployment
    ];
    
    // Check if the origin is allowed
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('CORS policy violation'), false);
    }
    
    return callback(null, true);
  },
  credentials: true // Allow cookies to be sent with requests
}));
app.use(express.json()); // Parse JSON requests
app.use(cookieParser()); // Parse cookies

// Apply Helmet security headers
app.use(helmetConfig());

// Apply CSRF protection middleware
app.use(csrfProtection);

// Handle CSRF errors
app.use(handleCsrfError);

// Apply device identification middleware
app.use(identifyDevice);

// Apply rate-limiting to specific routes
app.use('/api/auth/login', authLimiter); // Rate limiting for login
app.use('/api/auth/register', registerLimiter); // Rate limiting for registration
app.use('/api/admin', adminLimiter); // Rate limiting for admin actions
app.use('/api', apiLimiter); // General API rate limiting

// Apply CSRF protection to state-changing routes
app.use('/api/auth/register', csrfProtection);
app.use('/api/users', csrfProtection);
// GET requests typically don't need CSRF protection
app.post('/api/*', csrfProtection);
app.put('/api/*', csrfProtection);
app.delete('/api/*', csrfProtection);

// Import routes
const authRoutes = require('../backend/routes/authRoutes');
const routes = require('../backend/routes/index');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Basic route to test backend
app.get('/', (req, res) => {
  res.send('Smart POS System Backend is running');
});

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Example protected route
app.post('/api/protected-route', csrfProtection, (req, res) => {
  res.json({ success: true, message: 'CSRF-protected route accessed!' });
});

// Error handling for CSRF token failures
app.use(handleCsrfError);

// Graceful shutdown for the server
process.on('SIGINT', () => {
  console.log('Server shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0); // Exit process after MongoDB disconnects
  });
});

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined!');
  process.exit(1); // Exit process with an error code if MongoDB URI is not found
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Database connected successfully'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit if there's an error connecting to MongoDB
  });

// Default error handling middleware for any undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler for uncaught errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
