// helmetConfig.js

const helmet = require('helmet');

const helmetConfig = () => {
  return helmet({
    // Protect against cross-site scripting (XSS) attacks
    xssFilter: true,
    
    // Set Content Security Policy headers to prevent loading untrusted resources
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts (be cautious)
        objectSrc: ["'none'"], // Disallow embedding objects
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles (be cautious)
        imgSrc: ["'self'", "data:"], // Allow images from self and data URIs
        fontSrc: ["'self'"],
      },
    },
    
    // Protect against clickjacking by disallowing the app to be framed
    frameguard: {
      action: 'deny', // Prevent the app from being embedded in iframes
    },
    
    // Prevent browsers from opening the app in a new tab, helping mitigate tabnapping attacks
    noCache: true, // Disable caching of sensitive content
    
    // Set a referrer policy that minimizes leakage of sensitive information
    referrerPolicy: { policy: 'no-referrer' },
    
    // DNS Prefetch control
    dnsPrefetchControl: { allow: false }, // Disable DNS prefetching
    
    // HTTP Strict Transport Security (HSTS) - Enforces HTTPS for all requests
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true, // Apply to all subdomains as well
      preload: true, // Allow browsers to preload the site for strict HTTPS enforcement
    },
  });
};

module.exports = helmetConfig;
