/**
 * Demo Products Module
 * Contains standardized demo products that appear across the application
 * These will be automatically removed when a user adds their first real product
 */

const DEMO_PRODUCTS = [
    {
        id: 'demo1',
        name: 'Basmati Rice 5kg',
        price: 850,
        cost: 700,
        barcode: '9843201234567',
        category: 'Groceries',
        stock: 45,
        minStock: 10,
        status: 'active',
        image: '../images/products/basmati-rice.jpg',
        description: 'Premium quality Basmati rice from India',
        brand: 'Himalayan Gold',
        sku: 'RICE-BASMATI-5KG'
    },
    {
        id: 'demo2',
        name: 'Nepali Tea 250g',
        price: 180,
        cost: 120,
        barcode: '9843201234568',
        category: 'Beverages',
        stock: 75,
        minStock: 15,
        status: 'active',
        image: '../images/products/nepali-tea.jpg',
        description: 'Fresh Nepali black tea leaves from Ilam',
        brand: 'Ilam Tea',
        sku: 'TEA-NEPALI-250G'
    },
    {
        id: 'demo3',
        name: 'Wai Wai Noodles',
        price: 30,
        cost: 22,
        barcode: '9843201234569',
        category: 'Snacks',
        stock: 200,
        minStock: 50,
        status: 'active',
        image: '../images/products/waiwai-noodles.jpg',
        description: 'Popular instant noodles - chicken flavor',
        brand: 'Wai Wai',
        sku: 'NOODLES-WAIWAI'
    },
    {
        id: 'demo4',
        name: 'DDC Milk 1 Liter',
        price: 85,
        cost: 70,
        barcode: '9843201234570',
        category: 'Dairy Products',
        stock: 40,
        minStock: 10,
        status: 'active',
        image: '../images/products/ddc-milk.jpg',
        description: 'Fresh pasteurized milk from DDC',
        brand: 'DDC',
        sku: 'MILK-DDC-1L'
    },
    {
        id: 'demo5',
        name: 'Lux Soap 100g',
        price: 45,
        cost: 35,
        barcode: '9843201234571',
        category: 'Personal Care',
        stock: 80,
        minStock: 20,
        status: 'active',
        image: '../images/products/lux-soap.jpg',
        description: 'Premium beauty soap with rose fragrance',
        brand: 'Lux',
        sku: 'SOAP-LUX-100G'
    },
    {
        id: 'demo6',
        name: 'Teer Detergent 1kg',
        price: 280,
        cost: 220,
        barcode: '9843201234572',
        category: 'Household Items',
        stock: 60,
        minStock: 15,
        status: 'active',
        image: '../images/products/teer-detergent.jpg',
        description: 'Powerful washing powder for clean clothes',
        brand: 'Teer',
        sku: 'DETERGENT-TEER-1KG'
    },
    {
        id: 'demo7',
        name: 'Masala Dal 1kg',
        price: 160,
        cost: 130,
        barcode: '9843201234573',
        category: 'Groceries',
        stock: 90,
        minStock: 20,
        status: 'active',
        image: '../images/products/masala-dal.jpg',
        description: 'Mixed lentils with traditional Nepali spices',
        brand: 'Local',
        sku: 'DAL-MASALA-1KG'
    },
    {
        id: 'demo8',
        name: 'Khukri Rum 375ml',
        price: 980,
        cost: 800,
        barcode: '9843201234574',
        category: 'Beverages',
        stock: 25,
        minStock: 5,
        status: 'active',
        image: '../images/products/khukri-rum.jpg',
        description: 'Premium Nepali rum - aged blend',
        brand: 'Khukri',
        sku: 'RUM-KHUKRI-375ML'
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
