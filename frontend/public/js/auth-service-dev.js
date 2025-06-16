/**
 * Authentication Service - Development Mode
 * This is a development-only version of the auth service that allows bypassing authentication
 * DO NOT USE IN PRODUCTION!
 */

class AuthService {
    constructor() {
        console.warn('DEVELOPMENT MODE: Using mock authentication service');
        this.apiBaseUrl = 'https://smart-pos-system.onrender.com/api';
        this.tokenKey = 'neopos_auth_token';
        this.userKey = 'neopos_user';
        this.refreshTokenKey = 'neopos_refresh_token';
        this.tokenExpiryKey = 'neopos_token_expiry';
        this.refreshTimerKey = 'neopos_refresh_timer';
        
        // Set mock user data for development
        if (!localStorage.getItem(this.userKey)) {
            this.setMockUserData();
        }
    }

    /**
     * Sets mock user data for development
     */
    setMockUserData() {
        const mockUser = {
            _id: 'dev123456',
            name: 'Development User',
            email: 'dev@example.com',
            role: 'shop_owner',
            shopName: 'Development Shop'
        };
        
        localStorage.setItem(this.userKey, JSON.stringify(mockUser));
        localStorage.setItem(this.tokenKey, 'mock-auth-token');
        
        // Set token expiry to 1 hour from now
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1);
        localStorage.setItem(this.tokenExpiryKey, expiry.toISOString());
    }

    /**
     * Checks if user is logged in
     * @returns {boolean} True if user is logged in
     */
    isLoggedIn() {
        // Always return true in development mode
        return true;
    }

    /**
     * Gets the current auth token
     * @returns {string|null} Auth token or null if not logged in
     */
    getToken() {
        return localStorage.getItem(this.tokenKey) || 'mock-auth-token';
    }

    /**
     * Gets the current user data
     * @returns {Object|null} User data or null if not logged in
     */
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Logs the user out
     */
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.tokenExpiryKey);
        
        window.location.href = '../landing.html';
    }

    /**
     * Ensures token is fresh before making API requests
     * @returns {Promise<boolean>} Promise resolving to true if token is fresh
     */
    async ensureFreshToken() {
        // Always return true in development mode
        return Promise.resolve(true);
    }

    /**
     * Clears the refresh timer
     */
    clearRefreshTimer() {
        const timerId = localStorage.getItem(this.refreshTimerKey);
        if (timerId) {
            clearTimeout(parseInt(timerId));
            localStorage.removeItem(this.refreshTimerKey);
        }
    }
}

// Initialize the auth service
window.authService = new AuthService();
