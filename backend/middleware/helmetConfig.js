const helmet = require('helmet');
const ms = require('ms');

/**
 * Enhanced security headers configuration
 * Implements comprehensive protection against common web vulnerabilities
 */
const helmetConfig = () => {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'strict-dynamic'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'", 
          process.env.FRONTEND_URL || "http://localhost:3000",

        ],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [true] : [],
        sanctionedUri: ["'self'"]
      },
      reportOnly: false
    },

    // Cross-Site Scripting (XSS) Protection
    xssFilter: true,
    
    // Clickjacking Protection
    frameguard: {
      action: 'deny'
    },

    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false
    },

    // MIME Type Protection
    noSniff: true,

    // HSTS Configuration
    hsts: {
      maxAge: ms('1y') / 1000,
      includeSubDomains: true,
      preload: true
    },

    // Referrer Policy
    referrerPolicy: {
      policy: ['strict-origin-when-cross-origin']
    },

    // Permissions Policy (formerly Feature-Policy)
    permissionsPolicy: {
      features: {
        accelerometer: [],
        ambientLightSensor: [],
        autoplay: [],
        camera: ["'self'"],
        encryptedMedia: [],
        fullscreen: ["'self'"],
        geolocation: ["'self'"],
        gyroscope: [],
        magnetometer: [],
        microphone: ["'self'"],
        midi: [],
        payment: ["'self'"],
        pictureInPicture: [],
        speaker: [],
        syncXhr: [],
        usb: [],
        vibrate: [],
        wakeLock: []
      }
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