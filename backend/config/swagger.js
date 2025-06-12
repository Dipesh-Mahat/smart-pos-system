const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart POS System API',
      version: '1.0.0',
      description: 'API for Smart POS System',
      contact: {
        name: 'API Support',
        email: 'support@smartpos.com',
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
  },
  apis: [
    './routes/*.js',
    './models/*.js',
    './controllers/*.js'
  ],
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Export swagger middleware
module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(swaggerDocs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }),
};
