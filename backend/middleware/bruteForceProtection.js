const Redis = require('ioredis');
const { logSecurityEvent } = require('../utils/securityLogger');

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
});

// Constants for brute force protection
const WINDOW_SIZE_IN_SECONDS = 3600; // 1 hour
const MAX_WRONG_ATTEMPTS_BY_IP_PER_WINDOW = 100;
const MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP = 10;
const LOGIN_BLOCK_DURATION_IN_SECONDS = 900; // 15 minutes
const ACCOUNT_LOCK_DURATION_IN_SECONDS = 3600; // 1 hour

/**
 * Helper to get Redis keys for rate limiting
 */
const getRedisKeys = (ip, username) => ({
    ipKey: `bruteforce:ip:${ip}`,
    usernameIpKey: username ? `bruteforce:username:${username}:ip:${ip}` : null,
    accountLockKey: username ? `bruteforce:accountlock:${username}` : null
});

/**
 * Brute force protection middleware
 */
const bruteForceProtection = async (req, res, next) => {
    const ip = req.ip;
    const username = req.body.email?.toLowerCase() || req.body.username?.toLowerCase();

    if (!username) {
        return res.status(400).json({
            success: false,
            message: 'Username/email is required'
        });
    }

    const { ipKey, usernameIpKey, accountLockKey } = getRedisKeys(ip, username);

    try {
        // Check if account is locked
        const isAccountLocked = await redisClient.get(accountLockKey);
        if (isAccountLocked) {
            const timeLeft = await redisClient.ttl(accountLockKey);
            logSecurityEvent('ACCOUNT_LOCKED_ATTEMPT', {
                username,
                ip,
                remainingTime: timeLeft
            });
            return res.status(403).json({
                success: false,
                message: `Account is locked. Try again in ${Math.ceil(timeLeft / 60)} minutes`
            });
        }

        // Check IP-based attempts
        const ipAttempts = await redisClient.incr(ipKey);
        if (ipAttempts === 1) {
            await redisClient.expire(ipKey, WINDOW_SIZE_IN_SECONDS);
        }

        if (ipAttempts > MAX_WRONG_ATTEMPTS_BY_IP_PER_WINDOW) {
            logSecurityEvent('IP_BLOCKED', {
                ip,
                attempts: ipAttempts
            });
            return res.status(429).json({
                success: false,
                message: 'Too many requests from this IP, please try again after an hour'
            });
        }

        // Check username + IP combined attempts
        const usernameIpAttempts = await redisClient.incr(usernameIpKey);
        if (usernameIpAttempts === 1) {
            await redisClient.expire(usernameIpKey, LOGIN_BLOCK_DURATION_IN_SECONDS);
        }

        if (usernameIpAttempts > MAX_CONSECUTIVE_FAILS_BY_USERNAME_AND_IP) {
            // Lock the account
            await redisClient.setex(accountLockKey, ACCOUNT_LOCK_DURATION_IN_SECONDS, 'locked');
            
            logSecurityEvent('ACCOUNT_LOCKED', {
                username,
                ip,
                attempts: usernameIpAttempts
            });

            return res.status(403).json({
                success: false,
                message: 'Account locked due to too many failed attempts. Try again in 1 hour'
            });
        }

        // Store the attempt data for the next middleware
        req.bruteForce = {
            ipKey,
            usernameIpKey,
            accountLockKey
        };

        next();
    } catch (error) {
        console.error('Brute force protection error:', error);
        next(error);
    }
};

/**
 * Reset login attempts on successful login
 */
const resetLoginAttempts = async (req, res, next) => {
    if (!req.bruteForce) {
        return next();
    }

    const { ipKey, usernameIpKey } = req.bruteForce;

    try {
        // Reset the counters
        await Promise.all([
            redisClient.del(ipKey),
            redisClient.del(usernameIpKey)
        ]);

        next();
    } catch (error) {
        console.error('Error resetting login attempts:', error);
        next(error);
    }
};

/**
 * Monitor suspicious activities
 */
const monitorSuspiciousActivity = async (req, res, next) => {
    const ip = req.ip;
    const username = req.body.email?.toLowerCase() || req.body.username?.toLowerCase();

    // Suspicious patterns to check
    const patterns = {
        rapidRequests: await checkRapidRequests(ip),
        multipleUsernames: await checkMultipleUsernames(ip),
        distributedAttempts: await checkDistributedAttempts(username)
    };

    // If any pattern is detected, log it
    const suspiciousPatterns = Object.entries(patterns)
        .filter(([_, isDetected]) => isDetected)
        .map(([pattern]) => pattern);

    if (suspiciousPatterns.length > 0) {
        logSecurityEvent('SUSPICIOUS_ACTIVITY', {
            ip,
            username,
            patterns: suspiciousPatterns
        });
    }

    next();
};

/**
 * Check for rapid requests from an IP
 */
async function checkRapidRequests(ip) {
    const key = `requests:${ip}`;
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute

    await redisClient.zadd(key, now, now.toString());
    await redisClient.zremrangebyscore(key, 0, now - windowSize);
    
    const count = await redisClient.zcard(key);
    await redisClient.expire(key, 60); // Expire after 1 minute

    return count > 30; // More than 30 requests per minute
}

/**
 * Check for attempts with multiple usernames from same IP
 */
async function checkMultipleUsernames(ip) {
    const key = `usernames:${ip}`;
    const count = await redisClient.scard(key);
    return count > 5; // More than 5 different usernames tried
}

/**
 * Check for distributed login attempts for the same username
 */
async function checkDistributedAttempts(username) {
    if (!username) return false;
    
    const key = `ips:${username}`;
    const count = await redisClient.scard(key);
    return count > 3; // Attempts from more than 3 different IPs
}

module.exports = {
    bruteForceProtection,
    resetLoginAttempts,
    monitorSuspiciousActivity
};
