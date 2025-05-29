// Data Manager for NeoPOS
const DataManager = {
    // Base URL for API
    apiUrl: 'https://smart-pos-system.onrender.com/api', // Update to https://smart-pos-system-backend.vercel.app/api for prod
    
    // CSRF token storage
    csrfToken: null,
    
    // Initialize data store
    async init() {
        // Try to get token from localStorage
        this.token = localStorage.getItem('neopos_auth_token');
        
        // Initialize local cache if needed
        if (!localStorage.getItem('neopos_data')) {
            localStorage.setItem('neopos_data', JSON.stringify({
                products: [],
                sales: [],
                inventory: [],
                suppliers: [],
                staff: []
            }));
        }
        
        // Fetch CSRF token
        await this.fetchCsrfToken();
    },
    
    // Fetch CSRF token
    async fetchCsrfToken() {
        try {
            const response = await fetch(`${this.apiUrl}/csrf-token`, {
                method: 'GET',
                credentials: 'include', // Include cookies for CORS
            });
            const data = await response.json();
            this.csrfToken = data.csrfToken;
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
        }
    },
    
    // Authentication methods
    async login(username, password) {
        try {
            if (!this.csrfToken) {
                await this.fetchCsrfToken();
            }
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': this.csrfToken // Include CSRF token
                },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                localStorage.setItem('neopos_auth_token', data.token);
                localStorage.setItem('neopos_user', JSON.stringify(data.user));
                this.notifyListeners('login', data.user);
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error or invalid CSRF token' };
        }
    },
    
    logout() {
        this.token = null;
        this.csrfToken = null;
        localStorage.removeItem('neopos_auth_token');
        localStorage.removeItem('neopos_user');
        this.notifyListeners('logout');
    },
    
    isLoggedIn() {
        return !!this.token;
    },
    
    getCurrentUser() {
        const userStr = localStorage.getItem('neopos_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // API Request Helper
    async apiRequest(endpoint, method = 'GET', body = null) {
        try {
            if (['POST', 'PUT', 'DELETE'].includes(method) && !this.csrfToken) {
                await this.fetchCsrfToken();
            }
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }
            
            if (['POST', 'PUT', 'DELETE'].includes(method) && this.csrfToken) {
                headers['CSRF-Token'] = this.csrfToken;
            }
            
            const options = {
                method,
                headers,
                credentials: 'include'
            };
            
            if (body && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(`${this.apiUrl}${endpoint}`, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `API request failed: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    // Get all data from local cache
    getAllData() {
        return JSON.parse(localStorage.getItem('neopos_data'));
    },
    
    // Update local cache
    updateData(data) {
        localStorage.setItem('neopos_data', JSON.stringify(data));
    },

    // Event listeners
    listeners: {},

    addEventListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    },

    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    },
    
    async syncPendingChanges() {
        if (!this.isLoggedIn() || !navigator.onLine) return;
        
        await this.fetchCsrfToken();
        
        const data = this.getAllData();
        
        for (const product of data.products) {
            if (product.pendingSync) {
                try {
                    if (product.id.startsWith('local_')) {
                        const { id, pendingSync, ...productData } = product;
                        await this.apiRequest('/products', 'POST', productData);
                    } else {
                        const { pendingSync, ...productData } = product;
                        await this.apiRequest(`/products/${product.id}`, 'PUT', productData);
                    }
                    product.pendingSync = false;
                } catch (error) {
                    console.error('Failed to sync product:', error);
                }
            }
        }
        
        this.updateData(data);
        this.notifyListeners('syncCompleted');
    }
};

// Set API base URL to Render backend only (no local testing)
const apiBaseUrl = 'https://smart-pos-system.onrender.com/api';

// Initialize data store when the script loads
DataManager.init();

// Set up automatic sync when coming back online
window.addEventListener('online', () => {
    DataManager.syncPendingChanges();
});

// Export for use in other files
window.DataManager = DataManager;