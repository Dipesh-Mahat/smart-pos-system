/**
 * API Service
 * Handles all API requests with authentication and token refresh
 */

class ApiService {
    constructor() {
        this.baseUrl = 'https://smart-pos-system.onrender.com/api';
        this.authService = window.authService;
    }

    /**
     * Gets authorization headers with current token
     * @returns {Object} Headers object with Authorization
     */
    getAuthHeaders() {
        const token = this.authService?.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    /**
     * Makes an authenticated API request
     * @param {string} endpoint - API endpoint path
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Response data
     */
    async request(endpoint, options = {}) {
        // Ensure we have a fresh token before making the request
        if (this.authService) {
            await this.authService.ensureFreshToken();
        }

        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers
                },
                credentials: 'include'
            });

            // Handle unauthorized errors (401)
            if (response.status === 401) {
                // Try to refresh the token
                if (this.authService) {
                    const refreshed = await this.authService.refreshToken();
                    
                    // If token refresh was successful, retry the request
                    if (refreshed) {
                        // Update headers with new token
                        const newHeaders = this.getAuthHeaders();
                        
                        // Retry the request with new token
                        const retryResponse = await fetch(url, {
                            ...options,
                            headers: {
                                ...newHeaders,
                                ...options.headers
                            },
                            credentials: 'include'
                        });
                        
                        if (retryResponse.ok) {
                            return await retryResponse.json();
                        }
                    }
                    
                    // If refresh failed or retry failed, redirect to login
                    this.authService.logout();
                    return { success: false, message: 'Authentication failed. Please log in again.' };
                }
            }

            // Parse JSON response
            let data;
            try {
                data = await response.json();
            } catch (e) {
                // If response is not JSON, return basic object
                return { 
                    success: response.ok,
                    message: response.ok ? 'Success' : 'Error: ' + response.statusText
                };
            }
            
            return data;
        } catch (error) {
            console.error('API request error:', error);
            return { 
                success: false, 
                message: 'Network error. Please check your connection and try again.' 
            };
        }
    }

    /**
     * Makes a GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Response data
     */
    async get(endpoint, params = {}) {
        // Add query parameters if they exist
        const queryString = Object.keys(params).length 
            ? '?' + new URLSearchParams(params).toString() 
            : '';
            
        return this.request(`${endpoint}${queryString}`, { method: 'GET' });
    }

    /**
     * Makes a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise<Object>} Response data
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Makes a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise<Object>} Response data
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Makes a DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Response data
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Create a singleton instance
const apiService = new ApiService();

// Make it globally available
window.apiService = apiService;
