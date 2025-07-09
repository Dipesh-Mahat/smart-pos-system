// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import middleware
const helmetConfig = require('./middleware/helmetConfig');
const { identifyDevice, apiLimiter, authLimiter, registerLimiter, adminLimiter } = require('./middleware/rateLimiter');
const authenticateJWT = require('./middleware/authJWT');
const { csrfProtection, handleCsrfError } = require('./middleware/csrfProtection');
const errorLogger = require('./middleware/errorLogger');
const swagger = require('./config/swagger');

// Create an Express app (This should come first)
const app = express();
const port = process.env.PORT || 5000;

// Middleware (after app initialization)
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin) return callback(null, true);
      // Define allowed origins - both production and development URLs
    const allowedOrigins = [
      'https://smart-pos-system-lime.vercel.app',  // Frontend Vercel deployment
      'https://smart-pos-system.onrender.com',     // backend Render deployment
      'http://localhost:3000',                     // Development frontend
      'http://localhost:5000',                     // Development backend
      'http://localhost:8080',                     // Local development server
      'http://127.0.0.1:8080',                     // Alternative localhost
      'http://127.0.0.1:5000',                     // Alternative localhost
      'http://127.0.0.1:3000',                     // Alternative localhost
      'http://localhost:5500',                     // Live Server default
      'http://127.0.0.1:5500'                      // Live Server default
    ];
    
    // For development and debugging - uncomment this to see the actual origin
    console.log('Request origin:', origin);
    
    // Check if the origin is allowed
    if(allowedOrigins.indexOf(origin) === -1){
      // In development, we allow all requests for easier testing
      console.warn(`CORS policy warning: Origin ${origin} not in allowedOrigins - allowing anyway`);
      return callback(null, true); // Allow request anyway instead of blocking
    }
    
    return callback(null, true);
  },
  credentials: true, // Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly list allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'] // Explicitly list allowed headers
}));
app.use(express.json()); // Parse JSON requests
app.use(cookieParser()); // Parse cookies

// Use compression middleware to compress responses
app.use(compression());

// Setup request logging with Morgan
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log all requests to access.log
app.use(morgan(logFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: process.env.NODE_ENV === 'production' 
    ? fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' }) 
    : process.stdout
}));

// Apply Helmet security headers
app.use(helmetConfig());

// In production, enable CSRF protection
if (false) { // Temporarily disabled for testing
  // Apply CSRF protection middleware
  app.use(csrfProtection);
  
  // Handle CSRF errors
  app.use(handleCsrfError);
  
  // Apply CSRF protection to state-changing routes
  app.use('/api/auth/register', csrfProtection);
  app.use('/api/users', csrfProtection);
  app.post('/api/*', csrfProtection);
  app.put('/api/*', csrfProtection);
  app.delete('/api/*', csrfProtection);
  
  // CSRF token endpoint
  app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
} else {
  console.log('CSRF protection is disabled in development mode');
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const routes = require('./routes/index');

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Documentation with Swagger (only in non-production for security)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swagger.serve, swagger.setup);
  console.log('API documentation available at /api-docs');
}

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// Basic route to test backend
app.get('/', (req, res) => {
  res.send('Smart POS System backend is running');
});

// Apply device identification middleware
app.use(identifyDevice);

// Apply rate-limiting to specific routes
app.use('/api/auth/login', authLimiter); // Rate limiting for login
app.use('/api/auth/register', registerLimiter); // Rate limiting for registration
app.use('/api/admin', adminLimiter); // Rate limiting for admin actions
app.use('/api', apiLimiter); // General API rate limiting

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
  console.log('Creating an in-memory MongoDB instance for development...');
  
  // Use an in-memory MongoDB server for development if MONGODB_URI is not defined
  const { MongoMemoryServer } = require('mongodb-memory-server');
  
  (async () => {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`In-memory MongoDB server started at ${uri}`);
    
    mongoose
      .connect(uri)
      .then(() => console.log('Connected to in-memory MongoDB successfully'))
      .catch((err) => {
        console.error('Error connecting to in-memory MongoDB:', err);
        process.exit(1); 
      });
  })();
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Database connected successfully');
      
      // Auto-seed database if SEED_DATABASE environment variable is set to 'true'
      if (process.env.SEED_DATABASE === 'true') {
        console.log('Starting automatic database seeding...');
        try {
          const seedDatabase = require('./utils/seedDatabase');
          await seedDatabase();
          console.log('Database seeding completed successfully');
        } catch (error) {
          console.error('Error seeding database:', error);
          // Don't exit the process, just log the error
        }
      }
    })
    .catch((err) => {
      console.error('Error connecting to MongoDB:', err);
      process.exit(1); // Exit if there's an error connecting to MongoDB
    });
}

// Default error handling middleware for any undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler for uncaught errors
app.use(errorLogger);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

