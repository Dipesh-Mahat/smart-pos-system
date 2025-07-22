const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const { logSecurityEvent } = require('./securityLogger');

// Initialize Redis client for session storage
const redisClient = new Redis(process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
});

// Session configuration with security best practices
const sessionConfig = {
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || uuidv4(),
    name: 'sessionId', // Change from default 'connect.sid'
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on every response
    cookie: {
        httpOnly: true, // Prevent XSS accessing cookie
        secure: process.env.NODE_ENV === 'production', // Require HTTPS in production
        sameSite: 'strict', // CSRF protection
        maxAge: 1800000, // 30 minutes
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined
    }
};

/**
 * Session validation and security middleware
 */
const secureSession = (req, res, next) => {
    // Check if session exists
    if (!req.session) {
        return next(new Error('Session store is not configured'));
    }

    // Regenerate session on first login
    if (req.session.isNew && req.path !== '/login') {
        req.session.regenerate((err) => {
            if (err) {
                logSecurityEvent('SESSION_REGENERATION_FAILED', {
                    error: err.message,
                    path: req.path
                });
                return next(err);
            }
            next();
        });
        return;
    }

    // Validate session data
    if (req.session.user) {
        // Check for session expiry
        const now = Date.now();
        const sessionAge = now - (req.session.created || now);
        
        if (sessionAge > sessionConfig.cookie.maxAge) {
            logSecurityEvent('SESSION_EXPIRED', {
                userId: req.session.user.id,
                sessionAge
            });
            
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
                res.redirect('/login');
            });
            return;
        }

        // Verify user agent consistency
        const currentUA = req.get('user-agent');
        if (req.session.userAgent && req.session.userAgent !== currentUA) {
            logSecurityEvent('SESSION_USER_AGENT_MISMATCH', {
                userId: req.session.user.id,
                originalUA: req.session.userAgent,
                currentUA
            });
            
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
                res.status(403).json({
                    success: false,
                    message: 'Session invalidated due to client mismatch'
                });
            });
            return;
        }

        // Verify IP address (with tolerance for proxy changes)
        const currentIP = req.ip;
        if (req.session.ip && req.session.ip !== currentIP) {
            // Log IP change but don't immediately invalidate (consider mobile users)
            logSecurityEvent('SESSION_IP_CHANGED', {
                userId: req.session.user.id,
                originalIP: req.session.ip,
                newIP: currentIP
            });
        }
    }

    next();
};

/**
 * Initialize session data on login
 */
const initializeSession = (req, user) => {
    // Set essential session data
    req.session.user = {
        id: user.id,
        role: user.role,
        email: user.email
    };
    
    // Set session metadata
    req.session.created = Date.now();
    req.session.userAgent = req.get('user-agent');
    req.session.ip = req.ip;
    req.session.lastActive = Date.now();
    
    // Generate session identifier
    req.session.id = uuidv4();

    logSecurityEvent('SESSION_INITIALIZED', {
        userId: user.id,
        ip: req.ip
    });
};

/**
 * Session cleanup on logout
 */
const cleanupSession = (req, res, next) => {
    if (req.session) {
        const userId = req.session.user?.id;
        
        req.session.destroy((err) => {
            if (err) {
                logSecurityEvent('SESSION_CLEANUP_ERROR', {
                    userId,
                    error: err.message
                });
                return next(err);
            }

            // Clear session cookie
            res.clearCookie('sessionId', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            logSecurityEvent('SESSION_CLEANED', { userId });
            next();
        });
    } else {
        next();
    }
};

/**
 * Middleware to track session activity
 */
const trackSessionActivity = (req, res, next) => {
    if (req.session && req.session.user) {
        const inactivityPeriod = Date.now() - (req.session.lastActive || Date.now());
        const maxInactivity = 30 * 60 * 1000; // 30 minutes

        if (inactivityPeriod > maxInactivity) {
            logSecurityEvent('SESSION_INACTIVITY_TIMEOUT', {
                userId: req.session.user.id,
                inactivityPeriod
            });

            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
                return res.status(401).json({
                    success: false,
                    message: 'Session expired due to inactivity'
                });
            });
            return;
        }

        req.session.lastActive = Date.now();
    }
    next();
};

module.exports = {
    sessionConfig,
    secureSession,
    initializeSession,
    cleanupSession,
    trackSessionActivity
};
