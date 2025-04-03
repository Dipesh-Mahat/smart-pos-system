// Data Manager for NeoPOS
const DataManager = {
    // Base URL for API - change to your actual backend URL
    apiUrl: 'http://localhost:5000/api',
    
    // Auth token storage
    token: null,
    
    // Initialize data store
    init() {
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
    },
    
    // Authentication methods
    async login(username, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
            return { success: false, message: 'Network error' };
        }
    },
    
    logout() {
        this.token = null;
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
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add auth token if available
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }
            
            const options = {
                method,
                headers
            };
            
            if (body && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(`${this.apiUrl}${endpoint}`, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
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

    // ===== INVENTORY METHODS =====
    
    // Get all products from API
    async getProducts() {
        try {
            const response = await this.apiRequest('/products');
            // Update local cache
            const data = this.getAllData();
            data.products = response.products || [];
            this.updateData(data);
            this.notifyListeners('productsLoaded', data.products);
            return data.products;
        } catch (error) {
            // Fallback to local cache if API fails
            return this.getAllData().products;
        }
    },

    // Add a new product
    async addProduct(product) {
        try {
            const response = await this.apiRequest('/products', 'POST', product);
            // Update local cache
            const data = this.getAllData();
            data.products.push(response.product);
            this.updateData(data);
            this.notifyListeners('productAdded', response.product);
            return response.product;
        } catch (error) {
            // Fallback to local storage if offline
            const data = this.getAllData();
            // Generate a temporary local ID
            product.id = 'local_' + Date.now();
            product.pendingSync = true;
            data.products.push(product);
            this.updateData(data);
            this.notifyListeners('productAdded', product);
            return product;
        }
    },

    // Update product
    async updateProduct(productId, updatedProduct) {
        try {
            const response = await this.apiRequest(`/products/${productId}`, 'PUT', updatedProduct);
            // Update local cache
            const data = this.getAllData();
            const index = data.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                data.products[index] = response.product;
                this.updateData(data);
                this.notifyListeners('productUpdated', response.product);
            }
            return response.product;
        } catch (error) {
            // Fallback to local update
            const data = this.getAllData();
            const index = data.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                updatedProduct.pendingSync = true;
                data.products[index] = updatedProduct;
                this.updateData(data);
                this.notifyListeners('productUpdated', updatedProduct);
            }
            return updatedProduct;
        }
    },

    // Delete product
    async deleteProduct(productId) {
        try {
            await this.apiRequest(`/products/${productId}`, 'DELETE');
            // Update local cache
            const data = this.getAllData();
            data.products = data.products.filter(p => p.id !== productId);
            this.updateData(data);
            this.notifyListeners('productDeleted', { id: productId });
            return true;
        } catch (error) {
            // Mark for deletion locally
            const data = this.getAllData();
            const index = data.products.findIndex(p => p.id === productId);
            if (index !== -1) {
                data.products[index].pendingDelete = true;
                this.updateData(data);
                this.notifyListeners('productDeleted', { id: productId });
            }
            return false;
        }
    },

    // ===== SALES METHODS =====
    
    // Get all sales
    async getSales() {
        try {
            const response = await this.apiRequest('/sales');
            // Update local cache
            const data = this.getAllData();
            data.sales = response.sales || [];
            this.updateData(data);
            this.notifyListeners('salesLoaded', data.sales);
            return data.sales;
        } catch (error) {
            // Fallback to local cache
            return this.getAllData().sales;
        }
    },

    // Add a new sale
    async addSale(sale) {
        try {
            const response = await this.apiRequest('/sales', 'POST', sale);
            // Update local cache
            const data = this.getAllData();
            data.sales.push(response.sale);
            this.updateData(data);
            this.notifyListeners('saleAdded', response.sale);
            return response.sale;
        } catch (error) {
            // Fallback to local storage
            const data = this.getAllData();
            sale.id = 'local_' + Date.now();
            sale.pendingSync = true;
            data.sales.push(sale);
            this.updateData(data);
            this.notifyListeners('saleAdded', sale);
            return sale;
        }
    },

    // ===== SUPPLIER METHODS =====
    
    // Get all suppliers
    async getSuppliers() {
        try {
            const response = await this.apiRequest('/suppliers');
            // Update local cache
            const data = this.getAllData();
            data.suppliers = response.suppliers || [];
            this.updateData(data);
            this.notifyListeners('suppliersLoaded', data.suppliers);
            return data.suppliers;
        } catch (error) {
            // Fallback to local cache
            return this.getAllData().suppliers;
        }
    },

    // Add a supplier
    async addSupplier(supplier) {
        try {
            const response = await this.apiRequest('/suppliers', 'POST', supplier);
            // Update local cache
            const data = this.getAllData();
            data.suppliers.push(response.supplier);
            this.updateData(data);
            this.notifyListeners('supplierAdded', response.supplier);
            return response.supplier;
        } catch (error) {
            // Fallback to local storage
            const data = this.getAllData();
            supplier.id = 'local_' + Date.now();
            supplier.pendingSync = true;
            data.suppliers.push(supplier);
            this.updateData(data);
            this.notifyListeners('supplierAdded', supplier);
            return supplier;
        }
    },

    // ===== INVENTORY METHODS =====
    
    // Update inventory
    async updateInventory(productId, quantity) {
        try {
            const response = await this.apiRequest(`/inventory/${productId}`, 'PUT', { quantity });
            // Update local cache
            const data = this.getAllData();
            const inventoryItem = data.inventory.find(item => item.productId === productId);
            if (inventoryItem) {
                inventoryItem.quantity = quantity;
            } else {
                data.inventory.push({ productId, quantity });
            }
            this.updateData(data);
            this.notifyListeners('inventoryUpdated', { productId, quantity });
            return response.inventory;
        } catch (error) {
            // Fallback to local update
            const data = this.getAllData();
            const inventoryItem = data.inventory.find(item => item.productId === productId);
            if (inventoryItem) {
                inventoryItem.quantity = quantity;
                inventoryItem.pendingSync = true;
            } else {
                data.inventory.push({ productId, quantity, pendingSync: true });
            }
            this.updateData(data);
            this.notifyListeners('inventoryUpdated', { productId, quantity });
            return { productId, quantity };
        }
    },

    // Event listeners
    listeners: {},

    // Add event listener
    addEventListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    // Remove event listener
    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    },

    // Notify listeners of changes
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    },
    
    // Sync pending changes (offline-first support)
    async syncPendingChanges() {
        if (!this.isLoggedIn() || !navigator.onLine) return;
        
        const data = this.getAllData();
        
        // Sync products
        for (const product of data.products) {
            if (product.pendingSync) {
                try {
                    if (product.id.startsWith('local_')) {
                        // New product that was created offline
                        const { id, pendingSync, ...productData } = product;
                        await this.apiRequest('/products', 'POST', productData);
                    } else {
                        // Existing product that was updated offline
                        const { pendingSync, ...productData } = product;
                        await this.apiRequest(`/products/${product.id}`, 'PUT', productData);
                    }
                    // Remove pending flag after successful sync
                    product.pendingSync = false;
                } catch (error) {
                    console.error('Failed to sync product:', error);
                }
            }
        }
        
        // Update local storage after sync
        this.updateData(data);
        this.notifyListeners('syncCompleted');
    }
};

// Initialize data store when the script loads
DataManager.init();

// Set up automatic sync when coming back online
window.addEventListener('online', () => {
    DataManager.syncPendingChanges();
});

// Export for use in other files
window.DataManager = DataManager;