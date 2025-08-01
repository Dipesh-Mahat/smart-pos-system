/**
 * Authentication Service
 * Handles login, logout, token refresh and auth state management
 */

class AuthService {
    constructor() {
        // Auto-detect API URL based on environment
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        this.apiBaseUrl = isLocalhost ? 
                         'http://localhost:5000/api' : 
                         'https://smart-pos-system.onrender.com/api';
                         
        this.tokenKey = 'neopos_auth_token';
        this.userKey = 'neopos_user';
        this.refreshTokenKey = 'neopos_refresh_token';
        this.tokenExpiryKey = 'neopos_token_expiry';
        this.refreshTimerKey = 'neopos_refresh_timer';
        
        // Initialize refresh mechanism
        this.initTokenRefresh();
    }

    /**
     * Initializes token refresh mechanism
     * Sets up timers to refresh token before expiration
     */
    initTokenRefresh() {
        // Check if we have a token to refresh
        const token = this.getToken();
        if (!token) return;

        // Clear any existing timer
        this.clearRefreshTimer();

        // Get token expiry time
        const expiryTime = this.getTokenExpiry();
        if (!expiryTime) {
            // If no expiry time, we can't schedule refresh
            console.warn('No token expiry time found, cannot schedule refresh');
            return;
        }

        // Calculate time until refresh needed (refresh at 85% of token lifetime)
        const now = Date.now();
        const expiresAt = new Date(expiryTime).getTime();
        const timeUntilExpiry = expiresAt - now;
        
        // If token is already expired, attempt an immediate refresh
        if (timeUntilExpiry <= 0) {
            this.refreshToken();
            return;
        }

        // Schedule refresh at 85% of token lifetime
        const refreshDelay = Math.max(timeUntilExpiry * 0.85, 0);
        
        // Save and start the timer
        const timerId = setTimeout(() => this.refreshToken(), refreshDelay);
        localStorage.setItem(this.refreshTimerKey, timerId);
    }

    /**
     * Clears the refresh timer if one exists
     */
    clearRefreshTimer() {
        const timerId = localStorage.getItem(this.refreshTimerKey);
        if (timerId) {
            clearTimeout(parseInt(timerId));
            localStorage.removeItem(this.refreshTimerKey);
        }
    }

    /**
     * Parses JWT token to extract information
     * @param {string} token - JWT token to parse
     * @returns {object|null} Parsed token payload or null if invalid
     */
    parseToken(token) {
        try {
            // JWT tokens consist of three parts separated by dots
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            // The middle part is the payload, Base64 encoded
            const payload = JSON.parse(atob(parts[1]));
            return payload;
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }    /**
     * Saves token data and sets up refresh timer
     * @param {string} token - JWT access token
     * @param {string} refreshToken - JWT refresh token
     * @param {object} user - User data
     * @param {string} explicitExpiry - Optional explicit expiry time in ISO format
     */
    saveTokenData(token, refreshToken, user, explicitExpiry) {
        // Debug log for troubleshooting
        console.log('Auth service saving user data:', {
            token: token ? 'present' : 'missing',
            refreshToken: refreshToken ? 'present' : 'missing',
            user: user ? {
                role: user.role,
                email: user.email,
                id: user.id
            } : 'missing'
        });
        
        // Save the tokens and user data
        localStorage.setItem(this.tokenKey, token);
        if (refreshToken) {
            localStorage.setItem(this.refreshTokenKey, refreshToken);
        }
        if (user) {
            localStorage.setItem(this.userKey, JSON.stringify(user));
        }

        // Use explicit expiry if provided, otherwise parse from token
        if (explicitExpiry) {
            localStorage.setItem(this.tokenExpiryKey, explicitExpiry);
        } else {
            // Parse token to get expiry time
            const parsedToken = this.parseToken(token);
            if (parsedToken && parsedToken.exp) {
                // Token exp is in seconds, convert to milliseconds
                const expiryTime = new Date(parsedToken.exp * 1000).toISOString();
                localStorage.setItem(this.tokenExpiryKey, expiryTime);
            }
        }

        // Set up refresh timer
        this.initTokenRefresh();
    }

    /**
     * Gets the current authentication token
     * @returns {string|null} JWT token or null if not logged in
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Gets the refresh token
     * @returns {string|null} Refresh token or null if not present
     */
    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey);
    }    /**
     * Gets token expiry time
     * @returns {string|null} ISO date string of expiry time or null
     */
    getTokenExpiry() {
        return localStorage.getItem(this.tokenExpiryKey);
    }

    /**
     * Checks if token needs refresh (if it will expire within the next 10 minutes)
     * @returns {boolean} True if token needs refresh
     */
    needsTokenRefresh() {
        const expiryTime = this.getTokenExpiry();
        if (!expiryTime) return false;
        
        const expiryDate = new Date(expiryTime).getTime();
        const now = Date.now();
        // If token expires in less than 10 minutes, it needs refresh
        return (expiryDate - now) < (10 * 60 * 1000);
    }

    /**
     * Ensures token is fresh before making API calls
     * Refreshes token if it's about to expire
     * @returns {Promise<boolean>} True if token is valid (refreshed if needed)
     */
    async ensureFreshToken() {
        if (!this.isLoggedIn()) return false;
        
        if (this.needsTokenRefresh()) {
            return await this.refreshToken();
        }
        return true;
    }

    /**
     * Gets current user data
     * @returns {object|null} User data or null if not logged in
     */
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Checks if user is logged in
     * @returns {boolean} True if logged in
     */
    isLoggedIn() {
        return !!this.getToken();
    }
    
    /**
     * Checks if user has admin privileges
     * @returns {boolean} True if user is admin
     */
    isAdmin() {
        const user = this.getUser();
        // Debug log
        console.log('Auth service checking if user is admin:', user ? {
            role: user.role,
            email: user.email,
            result: user.role === 'admin'
        } : 'No user found');
        
        return user && user.role === 'admin';
    }    /**
     * Refreshes the authentication token
     * @returns {Promise<boolean>} Promise resolving to true if refresh succeeded
     */
    async refreshToken() {
        try {
            // We don't need to explicitly send the refresh token as it should be in the HTTP-only cookie
            // But we'll include it as a fallback for legacy behavior
            const refreshToken = this.getRefreshToken();

            const response = await fetch(`${this.apiBaseUrl}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Important for cookies
                body: JSON.stringify({ refreshToken }) // Send refresh token as fallback
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                // Get refresh token from cookie or response
                const newRefreshToken = data.refreshToken || this.getCookieValue('refresh_token');
                
                // Save new token and set up new refresh timer
                this.saveTokenData(data.token, newRefreshToken, this.getUser(), data.expiresAt);
                return true;
            } else {
                console.error('Token refresh failed:', data.message);
                // If refresh fails, redirect to login page
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            // Don't logout immediately on network errors - we'll retry
            return false;
        }
    }

    /**
     * Attempts to login user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<object>} Promise resolving to result object
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                // Get refresh token from cookie or response
                const refreshToken = data.refreshToken || this.getCookieValue('refresh_token');
                // Store tokens and user data
                this.saveTokenData(data.token, refreshToken, data.user);
                return { success: true, user: data.user };
            } else {
                return { 
                    success: false, 
                    message: data.message || 'Login failed'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: 'Network error. Please try again.' 
            };
        }
    }    /**
     * Logs out the current user
     * @returns {Promise<boolean>} True if logout was successful
     */
    async logout() {
        try {
            // Call the server to blacklist tokens
            const token = this.getToken();
            const refreshToken = this.getRefreshToken();
            
            if (token) {
                try {
                    // Make the logout request to blacklist tokens
                    const response = await fetch(`${this.apiBaseUrl}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        credentials: 'include',
                        body: JSON.stringify({ refreshToken })
                    });
                    
                    if (response.ok) {
                        // Log successful server-side logout
                        if (window.securityLogger) {
                            window.securityLogger.log('LOGOUT_SUCCESS_SERVER', { 
                                timestamp: new Date().toISOString() 
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error calling logout endpoint:', error);
                    // Log failed server-side logout
                    if (window.securityLogger) {
                        window.securityLogger.log('LOGOUT_SERVER_ERROR', { 
                            error: error.message,
                            timestamp: new Date().toISOString() 
                        });
                    }
                    // Continue with local logout even if API call fails
                }
            }
            
            // Clear refresh timer
            this.clearRefreshTimer();
            
            // Clear auth data
            localStorage.removeItem(this.tokenKey);
            localStorage.removeItem(this.refreshTokenKey);
            localStorage.removeItem(this.tokenExpiryKey);
            localStorage.removeItem(this.userKey);
            
            // Log client-side logout
            if (window.securityLogger) {
                window.securityLogger.log('LOGOUT_SUCCESS_CLIENT', { 
                    timestamp: new Date().toISOString() 
                });
            }
              // Redirect to login page
            window.location.href = '../landing.html';
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    /**
     * Registers a new user
     * @param {object} userData - User registration data
     * @returns {Promise<object>} Promise resolving to result object
     */
    async register(userData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            return { 
                success: response.ok && data.success, 
                message: data.message,
                errors: data.errors // Pass through any validation errors
            };
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                message: 'Network error. Please try again.' 
            };
        }
    }

    /**
     * Gets a cookie value by name
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value or null if not found
     */
    getCookieValue(name) {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                return cookie.substring(name.length + 1);
            }
        }
        return null;
    }

    /**
     * Creates an interceptor for fetch API to handle auth headers
     * @returns {Function} Fetch interceptor function
     */
    createFetchInterceptor() {
        const originalFetch = window.fetch;
        const authService = this;

        window.fetch = async function(url, options = {}) {
            // Clone the options to avoid modifying the original
            const modifiedOptions = { ...options };
            
            // Add authorization header if token exists and we're calling our API
            if (url.includes(authService.apiBaseUrl)) {
                const token = authService.getToken();
                if (token) {
                    modifiedOptions.headers = {
                        ...modifiedOptions.headers,
                        'Authorization': `Bearer ${token}`
                    };
                }
            }

            // Make the initial request
            let response = await originalFetch(url, modifiedOptions);
            
            // If calling our API and we get a 401 (Unauthorized), try to refresh the token
            if (url.includes(authService.apiBaseUrl) && response.status === 401) {
                const refreshSuccess = await authService.refreshToken();
                
                // If refresh succeeded, retry the original request with the new token
                if (refreshSuccess) {
                    const newToken = authService.getToken();
                    modifiedOptions.headers = {
                        ...modifiedOptions.headers,
                        'Authorization': `Bearer ${newToken}`
                    };
                    
                    // Retry the request with new token
                    return originalFetch(url, modifiedOptions);
                }
            }
            
            return response;
        };
    }
}

// Create a singleton instance
const authService = new AuthService();

// Install fetch interceptor
authService.createFetchInterceptor();

// Make it globally available
window.authService = authService;
// Add retry logic for failed fetches if needed
async function requestWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
// Replace fetch calls with requestWithRetry
