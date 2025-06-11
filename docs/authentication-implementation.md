# Authentication Implementation Guide

This document provides a comprehensive overview of the implementation details for the JWT authentication system in the Smart POS System.

## Key Components

### Backend

1. **User Model (User.js)**
   - Generates JWT tokens with unique identifiers (jti)
   - Sets appropriate expiration times based on user roles
   - Uses secure cryptographic methods for token generation

2. **Token Controller (tokenController.js)**
   - Handles token refresh operations
   - Manages token revocation/blacklisting on logout
   - Sets HTTP-only cookies for refresh tokens

3. **Auth Middleware (authJWT.js)**
   - Validates tokens on protected routes
   - Checks token blacklist before granting access
   - Provides detailed error responses for different failure scenarios

4. **Token Blacklist (tokenBlacklist.js)**
   - In-memory store for invalidated tokens
   - Automatically cleans up expired tokens
   - Supports blacklisting by user ID or token ID

### Frontend

1. **Auth Service (auth-service.js)**
   - Manages token storage and retrieval
   - Handles automatic token refresh
   - Provides authentication state management

2. **API Service (api-service.js)**
   - Wraps fetch API with authentication headers
   - Handles 401 errors with automatic token refresh
   - Retries failed requests after token refresh

3. **Security Logger (security-logger.js)**
   - Logs security events client-side
   - Helps with debugging authentication issues
   - Maintains audit trail of security operations

## HTTP-Only Cookies Implementation

For enhanced security, we store refresh tokens in HTTP-only cookies:

```javascript
// Backend - Setting the cookie during login/refresh
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Frontend - Ensuring credentials are included with requests
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify(data)
});
```

## Token Blacklisting Implementation

When a user logs out, their tokens are blacklisted to prevent reuse:

```javascript
// Backend - Adding a token to the blacklist
tokenBlacklist.addToBlacklist(decoded.jti, decoded.exp, 'logout');

// Backend - Checking if a token is blacklisted in middleware
if (decoded.jti && tokenBlacklist.isBlacklisted(decoded.jti)) {
  return res.status(401).json({
    success: false,
    message: 'Token has been revoked. Please login again.',
  });
}
```

## Automatic Token Refresh

Tokens are automatically refreshed at 85% of their lifetime:

```javascript
// Calculate time until refresh needed (refresh at 85% of token lifetime)
const timeUntilExpiry = expiresAt - now;
const refreshDelay = Math.max(timeUntilExpiry * 0.85, 0);

// Schedule refresh
this.refreshTimer = setTimeout(() => {
  this.refreshToken();
}, refreshDelay);
```

## Testing the Authentication System

To verify the implementation:

1. **Login Flow**
   - Check that HTTP-only cookies are set
   - Verify that tokens are properly stored
   - Test automatic redirects to dashboard

2. **API Access**
   - Ensure protected routes require authentication
   - Test that invalid tokens are properly rejected
   - Verify that blacklisted tokens cannot be used

3. **Token Refresh**
   - Test automatic refresh functionality
   - Verify that expired tokens are properly handled
   - Check that refresh tokens work across page reloads

4. **Logout Flow**
   - Verify that tokens are properly blacklisted
   - Ensure cookies are cleared
   - Check that redirects to login page work

## Common Issues and Troubleshooting

1. **"Token expired" errors**
   - Check token expiration times
   - Verify that refresh mechanism is working
   - Ensure clocks are synchronized between client and server

2. **HTTP-only cookie issues**
   - Check same-origin policy and CORS settings
   - Verify that credentials: 'include' is set on requests
   - Test in different browsers for cookie behavior

3. **Blacklist not working**
   - Verify that token JTIs are properly generated
   - Check that blacklist is being checked in middleware
   - Ensure blacklist cleanup isn't removing valid entries

## Next Steps for Enhancement

1. Implement token rotation on refresh for enhanced security
2. Add Redis support for distributed token blacklist in production
3. Implement user session management UI for viewing active sessions
4. Add multi-factor authentication for sensitive operations
