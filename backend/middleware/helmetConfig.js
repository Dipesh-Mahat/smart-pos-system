const helmet = require('helmet');

const helmetConfig = () => {
  return helmet({
    // Enable XSS protection in browsers
    xssFilter: true,

    // Set Content Security Policy (CSP) headers with stricter rules
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Allow resources only from the same origin
        scriptSrc: [
          "'self'", // Allow scripts from the same origin
          // Remove unsafe-inline and unsafe-eval for better security
        ],
        styleSrc: [
          "'self'", // Allow styles from the same origin
          "'unsafe-inline'", // Allow inline styles (needed for many UI frameworks)
        ],
        imgSrc: [
          "'self'", // Allow images from the same origin
          "data:", // Allow data URIs for images
          "https:", // Allow HTTPS images
        ],
        connectSrc: [
          "'self'", // Allow connections to same origin
          process.env.FRONTEND_URL || "http://localhost:3000", // Allow connections to frontend
        ],
        fontSrc: ["'self'", "https:", "data:"], // Allow fonts from same origin and HTTPS
        objectSrc: ["'none'"], // Disallow embedding objects (e.g., Flash)
        mediaSrc: ["'self'"], // Allow media from same origin
        frameSrc: ["'none'"], // Disallow frames
        frameAncestors: ["'none'"], // Prevent the app from being embedded in iframes
        formAction: ["'self'"], // Forms can only submit to same origin
        upgradeInsecureRequests: [], // Upgrade HTTP requests to HTTPS
      },
    },

    // Prevent clickjacking by disallowing the app to be embedded in iframes
    frameguard: {
      action: 'deny', // Deny all attempts to embed the app in iframes
    },

    // Disable caching for sensitive content
    noCache: true,

    // Set a strict referrer policy to minimize sensitive information leakage
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

    // Disable DNS prefetching to reduce information leakage
    dnsPrefetchControl: { allow: false },

    // Enforce HTTPS with HTTP Strict Transport Security (HSTS)
    hsts: {
      maxAge: 31536000, // Enforce HTTPS for 1 year
      includeSubDomains: true, // Apply to all subdomains
      preload: true, // Allow browsers to preload the site for strict HTTPS enforcement
    },

    // Hide the "X-Powered-By" header to avoid exposing server information
    hidePoweredBy: true,

    // Prevent MIME type sniffing
    noSniff: true,

    // Add Cross-Origin-Opener-Policy header
    crossOriginOpenerPolicy: { policy: 'same-origin' },

    // Add Cross-Origin-Resource-Policy header
    crossOriginResourcePolicy: { policy: 'same-origin' },

    // Add Cross-Origin-Embedder-Policy header
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
  });
};

module.exports = helmetConfig;