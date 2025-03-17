const helmet = require('helmet');

const helmetConfig = () => {
  return helmet({
    xssFilter: true,

    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'", 
          process.env.FRONTEND_URL || "http://localhost:3000"
        ],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },

    frameguard: {
      action: 'deny',
    },

    noCache: true,

    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    dnsPrefetchControl: { allow: false },

    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },

    hidePoweredBy: true,

    noSniff: true,

    crossOriginOpenerPolicy: { policy: 'same-origin' },

    crossOriginResourcePolicy: { policy: 'same-origin' },

    crossOriginEmbedderPolicy: { policy: 'require-corp' },
  });
};

module.exports = helmetConfig;