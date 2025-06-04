// Data Manager for NeoPOS
const DataManager = {
    // Initialize data store
    init() {
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

    // Get all data
    getAllData() {
        return JSON.parse(localStorage.getItem('neopos_data'));
    },

    // Add a new product
    addProduct(product) {
        const data = this.getAllData();
        data.products.push(product);
        this.updateData(data);
        this.notifyListeners('productAdded', product);
    },

    // Update product
    updateProduct(productId, updatedProduct) {
        const data = this.getAllData();
        const index = data.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            data.products[index] = updatedProduct;
            this.updateData(data);
            this.notifyListeners('productUpdated', updatedProduct);
        }
    },

    // Add a new sale
    addSale(sale) {
        const data = this.getAllData();
        data.sales.push(sale);
        this.updateData(data);
        this.notifyListeners('saleAdded', sale);
    },

    // Update inventory
    updateInventory(productId, quantity) {
        const data = this.getAllData();
        const inventoryItem = data.inventory.find(item => item.productId === productId);
        if (inventoryItem) {
            inventoryItem.quantity = quantity;
            this.updateData(data);
            this.notifyListeners('inventoryUpdated', { productId, quantity });
        }
    },

    // Update data in localStorage
    updateData(data) {
        localStorage.setItem('neopos_data', JSON.stringify(data));
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
    }
};

// Initialize data store when the script loads
DataManager.init();

// Export for use in other files
window.DataManager = DataManager; 