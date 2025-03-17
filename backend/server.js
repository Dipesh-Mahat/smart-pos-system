// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import middleware
const helmetConfig = require('./middleware/helmetConfig');
const { apiLimiter } = require('./middleware/rateLimiter');
const { identifyDevice, deviceRegisterLimiter, deviceAuthLimiter } = require('./middleware/deviceRateLimiter');
const authenticateJWT = require('./middleware/authJWT');

// Import routes
const authRoutes = require('./routes/authRoutes');
const routes = require('./routes/index');

// Create an Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true // Allow cookies to be sent with requests
}));
app.use(express.json()); // Parse JSON requests
app.use(cookieParser()); // Parse cookies

// Apply Helmet security headers
app.use(helmetConfig());

// Apply device identification middleware
app.use(identifyDevice);

// Apply rate-limiting to specific routes
app.use('/api/auth/login', deviceAuthLimiter); // Device-based rate limiting for login
app.use('/api/auth/register', deviceRegisterLimiter); // Device-based rate limiting for registration
app.use('/api', apiLimiter); // General API rate limiting

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Basic route to test backend
app.get('/', (req, res) => {
  res.send('Smart POS System Backend is running');
});

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
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
