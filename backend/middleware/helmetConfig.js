const helmet = require('helmet');

const helmetConfig = () => {
  return helmet({
    // Enable XSS protection in browsers
    xssFilter: true,

    // Set Content Security Policy (CSP) headers
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Allow resources only from the same origin
        scriptSrc: [
          "'self'", // Allow scripts from the same origin
          "'unsafe-inline'", // Allow inline scripts (use cautiously)
          "'unsafe-eval'", // Allow eval (use cautiously, avoid if possible)
        ],
        styleSrc: [
          "'self'", // Allow styles from the same origin
          "'unsafe-inline'", // Allow inline styles (use cautiously)
        ],
        imgSrc: [
          "'self'", // Allow images from the same origin
          "data:", // Allow data URIs for images
        ],
        fontSrc: ["'self'"], // Allow fonts from the same origin
        objectSrc: ["'none'"], // Disallow embedding objects (e.g., Flash)
        frameAncestors: ["'none'"], // Prevent the app from being embedded in iframes
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
    referrerPolicy: { policy: 'no-referrer' },

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
  });
};

module.exports = helmetConfig;