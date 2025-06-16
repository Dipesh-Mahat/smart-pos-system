/**
 * Demo Products Module
 * Contains standardized demo products that appear across the application
 * These will be automatically removed when a user adds their first real product
 */

const DEMO_PRODUCTS = [
    {
        id: 'demo1',
        name: 'Coca Cola 500ml',
        price: 275,
        cost: 220,
        barcode: '9843201234567',
        category: 'Beverages',
        stock: 25,
        minStock: 5,
        status: 'active',
        image: '../images/products/coca-cola.jpg',
        description: 'Refreshing carbonated soft drink',
        brand: 'Coca Cola',
        sku: 'BVRG-CC-500'
    },
    {
        id: 'demo2',
        name: 'Dairy Milk Chocolate',
        price: 330,
        cost: 280,
        barcode: '9843201234568',
        category: 'Chocolates',
        stock: 15,
        minStock: 5,
        status: 'active',
        image: '../images/products/dairy-milk.jpg',
        description: 'Creamy milk chocolate bar',
        brand: 'Cadbury',
        sku: 'CHOC-DM-100'
    },
    {
        id: 'demo3',
        name: 'Potato Chips',
        price: 219,
        cost: 180,
        barcode: '9843201234571',
        category: 'Snacks',
        stock: 30,
        minStock: 10,
        status: 'active',
        image: '../images/products/chips.jpg',
        description: 'Crunchy salted potato chips',
        brand: 'Lays',
        sku: 'SNCK-PC-200'
    },
    {
        id: 'demo4',
        name: 'Water Bottle 1L',
        price: 138,
        cost: 100,
        barcode: '9843201234572',
        category: 'Beverages',
        stock: 50,
        minStock: 20,
        status: 'active',
        image: '../images/products/water.jpg',
        description: 'Purified mineral water',
        brand: 'Bisleri',
        sku: 'BVRG-WB-1L'
    },
    {
        id: 'demo5',
        name: 'Energy Drink',
        price: 495,
        cost: 400,
        barcode: '9843201234573',
        category: 'Beverages',
        stock: 18,
        minStock: 8,
        status: 'active',
        image: '../images/products/energy-drink.jpg',
        description: 'Caffeinated energy drink',
        brand: 'Red Bull',
        sku: 'BVRG-ED-250'
    }
];

/**
 * Check if we should display demo products
 * @returns {boolean} True if demo products should be shown
 */
function shouldShowDemoProducts() {
    // Check localStorage flag
    return localStorage.getItem('showDemoProducts') !== 'false';
}

/**
 * Remove demo products after adding first real product
 */
function hideDemoProducts() {
    localStorage.setItem('showDemoProducts', 'false');
}

/**
 * Reset demo products visibility (for testing)
 */
function resetDemoProducts() {
    localStorage.removeItem('showDemoProducts');
}

/**
 * Get demo products if they should be shown
 * @returns {Array} Array of demo products or empty array
 */
function getDemoProducts() {
    return shouldShowDemoProducts() ? DEMO_PRODUCTS : [];
}
