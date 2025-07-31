const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB using the same connection as the server
mongoose.connect(process.env.MONGODB_URI);

async function createSampleProducts() {
    try {
        console.log('Creating sample products...');
        
        // Find shop owner
        const shopOwner = await User.findOne({ role: 'shopowner' });
        if (!shopOwner) {
            console.error('No shop owner found');
            return;
        }
        
        console.log('Shop owner found:', shopOwner._id);

        const sampleProducts = [
            {
                shopId: shopOwner._id,
                name: 'Coca Cola 500ml',
                description: 'Refreshing cola drink',
                category: 'Beverages',
                price: 45.00,
                cost: 32.00,
                stock: 150,
                minStockLevel: 20,
                barcode: '9844001001',
                sku: 'COCA-500ML',
                brand: 'Coca Cola',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Basmati Rice 5kg',
                description: 'Premium quality basmati rice',
                category: 'Groceries',
                price: 850.00,
                cost: 720.00,
                stock: 45,
                minStockLevel: 10,
                barcode: '9844001002',
                sku: 'RICE-BASMATI-5KG',
                brand: 'Local',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Kurkure Masala Munch',
                description: 'Spicy corn snack',
                category: 'Snacks',
                price: 20.00,
                cost: 14.00,
                stock: 200,
                minStockLevel: 30,
                barcode: '9844001003',
                sku: 'KURKURE-MASALA',
                brand: 'Kurkure',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Milk 1 Liter',
                description: 'Fresh full cream milk',
                category: 'Dairy Products',
                price: 65.00,
                cost: 55.00,
                stock: 30,
                minStockLevel: 15,
                barcode: '9844001004',
                sku: 'MILK-1L',
                brand: 'DDC',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Colgate Toothpaste',
                description: 'Total advanced health toothpaste',
                category: 'Personal Care',
                price: 95.00,
                cost: 75.00,
                stock: 8, // Low stock to test
                minStockLevel: 10,
                barcode: '9844001005',
                sku: 'COLGATE-TOTAL',
                brand: 'Colgate',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Detergent Powder 1kg',
                description: 'Powerful cleaning detergent',
                category: 'Household Items',
                price: 180.00,
                cost: 145.00,
                stock: 25,
                minStockLevel: 8,
                barcode: '9844001006',
                sku: 'DETERGENT-1KG',
                brand: 'Surf Excel',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Instant Noodles',
                description: '2 minute masala noodles',
                category: 'Snacks',
                price: 25.00,
                cost: 18.00,
                stock: 120,
                minStockLevel: 25,
                barcode: '9844001007',
                sku: 'NOODLES-MASALA',
                brand: 'Maggi',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Green Tea Bags',
                description: 'Healthy green tea 25 bags',
                category: 'Beverages',
                price: 220.00,
                cost: 180.00,
                stock: 40,
                minStockLevel: 10,
                barcode: '9844001008',
                sku: 'TEA-GREEN-25',
                brand: 'Lipton',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Cooking Oil 1L',
                description: 'Refined sunflower oil',
                category: 'Groceries',
                price: 185.00,
                cost: 165.00,
                stock: 60,
                minStockLevel: 15,
                barcode: '9844001009',
                sku: 'OIL-SUNFLOWER-1L',
                brand: 'Fortune',
                status: 'active'
            },
            {
                shopId: shopOwner._id,
                name: 'Shampoo 200ml',
                description: 'Anti-dandruff shampoo',
                category: 'Personal Care',
                price: 145.00,
                cost: 115.00,
                stock: 5, // Low stock
                minStockLevel: 8,
                barcode: '9844001010',
                sku: 'SHAMPOO-200ML',
                brand: 'Head & Shoulders',
                status: 'active'
            }
        ];

        // Clear existing products for this shop owner
        await Product.deleteMany({ shopId: shopOwner._id });
        console.log('Cleared existing products');

        // Insert sample products
        const insertedProducts = await Product.insertMany(sampleProducts);
        console.log(`Successfully inserted ${insertedProducts.length} sample products`);

        // Display summary
        console.log('\nProducts Summary:');
        console.log('================');
        insertedProducts.forEach(product => {
            console.log(`${product.name} - NPR ${product.price} (Stock: ${product.stock})`);
        });

        console.log('\nSample products created successfully!');
        console.log('You can now test the products page with real data.');

    } catch (error) {
        console.error('Error creating sample products:', error);
    } finally {
        mongoose.disconnect();
    }
}

createSampleProducts();
