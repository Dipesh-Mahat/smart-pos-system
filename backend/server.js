// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import middleware
const helmetConfig = require('./middleware/helmetConfig'); // Fix path
const { apiLimiter, authLimiter, registerLimiter } = require('./middleware/rateLimiter'); // Fix path and import specific limiters
const authenticateJWT = require('./middleware/authJWT'); // Fix path

// Import routes
const authRoutes = require('./routes/authRoutes'); // Fix path
const routes = require('./routes/index'); // Fix path

// Create an Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests

// Apply Helmet security headers
app.use(helmetConfig()); // Use the imported Helmet configuration

// Apply rate-limiting to specific routes
app.use('/api/auth/login', authLimiter); // Stricter rate limiting for login
app.use('/api/auth/register', registerLimiter); // Rate limiting for registration
app.use('/api', apiLimiter); // General API rate limiting

// Use routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api', routes); // Use your main routes file

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
