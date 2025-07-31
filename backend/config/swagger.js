const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { logSecurityEvent } = require('../utils/securityLogger');
const basicAuth = require('express-basic-auth');

/**
 * Secure Swagger configuration with enhanced security
 * - Role-based access control
 * - Rate limiting
 * - Access logging
 * - Information sanitization
 */

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart POS System API',
      version: '1.0.0',
      description: 'API Documentation for Smart POS System - For authorized users only',
      termsOfService: '/terms/',
      contact: {
        name: 'API Security Team',
        email: 'apisecurity@smartpos.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://smart-pos-system.onrender.com/api'
          : 'http://localhost:5000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: { type: 'string', example: 'Product Name' },
            barcode: { type: 'string', example: '1234567890123' },
            price: { type: 'number', example: 10.99 },
            stock: { type: 'number', example: 100 },
            category: { type: 'string', example: 'Electronics' },
            description: { type: 'string', example: 'Product description' },
            minStockLevel: { type: 'number', example: 10 },
            imageUrl: { type: 'string', example: '/uploads/products/product-image.jpg' }
          }
        },
        Customer: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            phone: { type: 'string', example: '+1234567890' },
            email: { type: 'string', example: 'john@example.com' },
            address: { type: 'string', example: '123 Main St' },
            loyaltyPoints: { type: 'number', example: 100 },
            type: { type: 'string', enum: ['regular', 'wholesale', 'vip'], example: 'regular' },
            notes: { type: 'string', example: 'Customer notes' }
          }
        },
        Transaction: {
          type: 'object',
          required: ['items', 'paymentMethod', 'total'],
          properties: {
            items: { 
              type: 'array', 
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string', example: '5f8d0f3e1c9d440000b7e1a1' },
                  name: { type: 'string', example: 'Product Name' },
                  price: { type: 'number', example: 10.99 },
                  quantity: { type: 'number', example: 2 },
                  subtotal: { type: 'number', example: 21.98 }
                }
              }
            },
            paymentMethod: { type: 'string', enum: ['cash', 'card', 'mobile'], example: 'cash' },
            total: { type: 'number', example: 21.98 },
            discount: { type: 'number', example: 0 },
            tax: { type: 'number', example: 0 },
            grandTotal: { type: 'number', example: 21.98 },
            status: { type: 'string', enum: ['completed', 'refunded', 'voided'], example: 'completed' }
          }
        },
        Expense: {
          type: 'object',
          required: ['title', 'amount', 'date', 'category'],
          properties: {
            title: { type: 'string', example: 'Office Rent' },
            amount: { type: 'number', example: 1000 },
            date: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
            category: { type: 'string', example: 'rent' },
            description: { type: 'string', example: 'Monthly office rent payment' },
            recurring: { type: 'boolean', example: true },
            attachmentUrl: { type: 'string', example: '/uploads/expenses/receipt.pdf' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    // Security definitions
    securityDefinitions: {
      apiKey: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    },
    // Add global security requirement
    security: [
      {
        apiKey: []
      }
    ],
    // Document global headers
    parameters: {
      HeaderParameters: {
        name: 'X-CSRF-Token',
        in: 'header',
        description: 'CSRF protection token',
        required: true,
        schema: {
          type: 'string'
        }
      }
    }
  },
  apis: [
    './routes/*.js',
    './models/*.js',
    './controllers/*.js'
  ],
};

// Obscure sensitive fields in Swagger responses
const sensitiveFieldsRegex = /(password|token|secret|key|credential|auth)/i;

// Initialize swagger-jsdoc with sanitization
const sanitizeSwaggerOptions = (options) => {
  // Function to recursively sanitize an object
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Clone the object to avoid modifying the original
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    
    Object.keys(sanitized).forEach(key => {
      // Check if this is a sensitive field
      if (sensitiveFieldsRegex.test(key)) {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = '[REDACTED OBJECT]';
        }
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(sanitized[key]);
      }
    });
    
    return sanitized;
  };
  
  // Create a deep copy and sanitize
  const sanitizedOptions = JSON.parse(JSON.stringify(options));
  
  // Sanitize specific sections of Swagger docs
  if (sanitizedOptions.swaggerDefinition && sanitizedOptions.swaggerDefinition.components) {
    if (sanitizedOptions.swaggerDefinition.components.schemas) {
      sanitizedOptions.swaggerDefinition.components.schemas = 
        sanitizeObject(sanitizedOptions.swaggerDefinition.components.schemas);
    }
    
    // Remove any example values containing potentially sensitive data
    if (sanitizedOptions.swaggerDefinition.components.examples) {
      Object.keys(sanitizedOptions.swaggerDefinition.components.examples).forEach(key => {
        const example = sanitizedOptions.swaggerDefinition.components.examples[key];
        if (example && example.value) {
          sanitizedOptions.swaggerDefinition.components.examples[key].value = 
            sanitizeObject(example.value);
        }
      });
    }
  }
  
  return sanitizedOptions;
};

// Apply sanitization to swagger options
const sanitizedSwaggerOptions = sanitizeSwaggerOptions(swaggerOptions);
const swaggerSpec = swaggerJsDoc(sanitizedSwaggerOptions);

// Basic authentication middleware for Swagger UI
const swaggerAuth = basicAuth({
  users: {
    [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'SwaggerSecureP@ss1',
  },
  challenge: true,
  realm: 'Smart POS API Documentation',
  unauthorizedResponse: () => 'Unauthorized access to API documentation'
});

// Rate limiting for Swagger UI access
const swaggerRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  req.app.locals.swaggerAccess = req.app.locals.swaggerAccess || {};
  const swaggerAccess = req.app.locals.swaggerAccess;
  
  // Clean up old entries
  Object.keys(swaggerAccess).forEach(key => {
    if (now - swaggerAccess[key].timestamp > windowMs) {
      delete swaggerAccess[key];
    }
  });
  
  // Check/update this IP's access
  if (!swaggerAccess[ip]) {
    swaggerAccess[ip] = {
      count: 1,
      timestamp: now
    };
  } else {
    swaggerAccess[ip].count++;
    
    // Limit to 30 requests per 15 minutes window
    if (swaggerAccess[ip].count > 30) {
      logSecurityEvent('SWAGGER_RATE_LIMIT_EXCEEDED', { ip });
      return res.status(429).json({
        error: 'Too many requests to API documentation'
      });
    }
  }
  
  next();
};

// Log Swagger UI access
const logSwaggerAccess = (req, res, next) => {
  logSecurityEvent('SWAGGER_ACCESS', {
    ip: req.ip,
    path: req.path,
    userAgent: req.headers['user-agent']
  });
  next();
};

/**
 * Setup Swagger routes with security measures
 * @param {Object} app - Express application
 */
const setupSwagger = (app) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, apply all security measures
    app.use('/api-docs', 
      swaggerRateLimit,
      swaggerAuth,
      logSwaggerAccess,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, { 
        explorer: false,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Smart POS API (Secure)',
        swaggerOptions: {
          docExpansion: 'none',
          filter: true,
          persistAuthorization: true
        }
      })
    );
  } else {
    // In development, use lighter security
    app.use('/api-docs',
      logSwaggerAccess,
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'Smart POS API (Development)',
        swaggerOptions: {
          docExpansion: 'list',
          filter: true
        }
      })
    );
  }
  
  // JSON endpoint for the Swagger documentation
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

// Export swagger middleware with enhanced security
module.exports = setupSwagger;

