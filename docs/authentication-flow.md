# Authentication Flow Documentation

## Overview

This document explains the authentication flow and token refresh mechanism in the Smart POS System.

## Token-Based Authentication Flow

The Smart POS System uses JWT (JSON Web Token) for authentication with a dual-token approach:

1. **Access Token**: Short-lived token (12 hours) used for API authentication
2. **Refresh Token**: Long-lived token (7 days) used to obtain new access tokens

### Authentication Process

1. **Login**:
   - User submits credentials (email/password)
   - Server validates credentials and generates both access and refresh tokens
   - Access token is returned in the response and stored in localStorage
   - Refresh token is set as an HTTP-only cookie and also returned in the response

2. **API Requests**:
   - The access token is included in the Authorization header
   - The server validates the token for each protected API request
   - If valid, the request is processed
   - If invalid or expired, a 401 response is returned

3. **Token Refresh**:
   - When the access token expires, the client can request a new one using the refresh token
   - The refresh token is sent to the server (from cookie or localStorage)
   - If valid, the server issues new access and refresh tokens
   - If invalid or expired, the user must log in again

## Frontend Implementation

### Auth Service (`auth-service.js`)

The `AuthService` class handles all authentication-related functionality:

- Token storage and retrieval
- Automatic token refresh before expiration
- Token validation and parsing
- Login, logout, and registration functions

Key features:

1. **Token Storage**:
   - Access token stored in localStorage (`neopos_auth_token`)
   - Refresh token stored in localStorage (`neopos_refresh_token`) and as HTTP-only cookie
   - Token expiry time stored in localStorage (`neopos_token_expiry`)

2. **Automatic Token Refresh**:
   - Calculates token lifetime and schedules refresh at 85% of lifetime
   - Uses setTimeout to schedule refresh before expiration
   - Stores timer ID in localStorage for persistence across page loads

3. **Token Refresh Logic**:
   - Sends refresh token to server
   - Saves new tokens and updates expiry time
   - Handles refresh failures by redirecting to login

4. **Fetch Interceptor**:
   - Automatically adds authorization headers to API requests
   - Handles 401 responses by attempting token refresh
   - Retries failed requests with new token if refresh succeeds

### API Service (`api-service.js`)

The `ApiService` class provides a wrapper around fetch API with authentication:

- Automatic inclusion of authorization headers
- Token refresh on 401 responses
- Retry mechanism for failed requests due to expired tokens
- Consistent error handling

## Backend Implementation

### Token Controller (`tokenController.js`)

The `refreshToken` endpoint handles token refresh requests:

- Validates the refresh token from cookie or request body
- Finds the associated user
- Generates new access and refresh tokens
- Sets refresh token as HTTP-only cookie
- Returns new tokens and expiry information

### Auth Middleware (`authJWT.js`)

The `authenticateJWT` middleware validates tokens for protected routes:

- Extracts the token from the Authorization header
- Verifies token validity using the JWT secret
- Provides specific error messages for different failure cases
- Adds user information to the request object

## Security Considerations

1. **Token Storage**:
   - Access tokens are stored in localStorage for easy access
   - Refresh tokens are primarily stored as HTTP-only cookies for XSS protection
   - A copy of the refresh token is kept in localStorage for clients that don't support cookies

2. **Token Expiration**:
   - Access tokens expire after 12 hours (configurable in .env)
   - Refresh tokens expire after 7 days
   - Token expiry times are balanced for security and user experience

3. **CSRF Protection**:
   - Strict same-site cookie policy for refresh tokens
   - CSRF tokens required for state-changing operations

## Troubleshooting

Common authentication issues and solutions:

1. **"Token has expired"**:
   - The access token has expired
   - The automatic refresh mechanism should handle this
   - If persistent, check if refresh token is valid or expired

2. **"Invalid token"**:
   - The token signature is invalid
   - Typically happens if JWT secret is changed
   - User should be redirected to login page

3. **"Refresh token not found"**:
   - The refresh token is missing from both cookie and request body
   - User needs to log in again

4. **Token refresh loop**:
   - If you notice constant refreshing, check token expiry calculation
   - Ensure new tokens are properly saved after refresh

## Best Practices

1. Always use the auth service for authentication operations
2. Use the API service for making authenticated requests
3. Include the auth service in all pages that require authentication
4. Check authentication status at page load and redirect if needed
5. Implement proper error handling for authentication failures
