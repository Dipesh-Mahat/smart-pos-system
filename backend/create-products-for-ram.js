const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-pos-system';

async function createProductsForRam() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        // Find ram_kirana user
        const ramUser = await User.findOne({ username: 'ram_kirana' });
        if (!ramUser) {
            console.log('Ram user not found!');
            return;
        }

        console.log('Found Ram user:', ramUser.firstName, ramUser.lastName);

        // Create categories first
        const categories = [
            { name: 'Rice & Grains', description: 'Rice, wheat, and other grains', shopId: ramUser._id },
            { name: 'Pulses & Lentils', description: 'Dal and lentil varieties', shopId: ramUser._id },
            { name: 'Cooking Oil', description: 'Cooking oils and ghee', shopId: ramUser._id },
            { name: 'Spices', description: 'Spices and seasonings', shopId: ramUser._id },
            { name: 'Personal Care', description: 'Soap, shampoo, toiletries', shopId: ramUser._id },
            { name: 'Beverages', description: 'Tea, coffee, cold drinks', shopId: ramUser._id },
            { name: 'Snacks', description: 'Biscuits, noodles, snacks', shopId: ramUser._id },
            { name: 'Sweeteners', description: 'Sugar and sweetening products', shopId: ramUser._id }
        ];

        // Clear existing categories and create new ones
        await Category.deleteMany({ shopId: ramUser._id });
        const createdCategories = await Category.insertMany(categories);
        console.log('Created', createdCategories.length, 'categories');

        // Clear existing products
        await Product.deleteMany({ shopId: ramUser._id });

        // Create products for ram_kirana
        const products = [
            {
                name: 'Basmati Rice Premium - 5kg',
                barcode: 'RICE5KG',
                description: 'Premium quality basmati rice 5kg pack',
                category: 'Rice & Grains',
                price: 800,
                costPrice: 650,
                stock: 25,
                minStockLevel: 5,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Trishakti',
                createdAt: new Date()
            },
            {
                name: 'Red Lentils (Masoor Dal) - 1kg',
                barcode: 'MASOOR1KG',
                description: 'Fresh red lentils 1kg pack',
                category: 'Pulses & Lentils',
                price: 180,
                costPrice: 150,
                stock: 40,
                minStockLevel: 10,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Nepal Agro',
                createdAt: new Date()
            },
            {
                name: 'Sunflower Cooking Oil - 1L',
                barcode: 'OIL1L',
                description: 'Pure sunflower cooking oil 1 liter',
                category: 'Cooking Oil',
                price: 220,
                costPrice: 190,
                stock: 30,
                minStockLevel: 8,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Dhara',
                createdAt: new Date()
            },
            {
                name: 'Turmeric Powder - 100g',
                barcode: 'TURMERIC100',
                description: 'Pure turmeric powder 100g pack',
                category: 'Spices',
                price: 60,
                costPrice: 45,
                stock: 50,
                minStockLevel: 15,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Everest',
                createdAt: new Date()
            },
            {
                name: 'Lux Beauty Soap Bar',
                barcode: 'LUXSOAP',
                description: 'Premium beauty soap bar 100g',
                category: 'Personal Care',
                price: 50,
                costPrice: 35,
                stock: 80,
                minStockLevel: 20,
                unit: 'piece',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Lux',
                createdAt: new Date()
            },
            {
                name: 'Gorkha Tea Premium - 250g',
                barcode: 'TEA250',
                description: 'Premium black tea leaves 250g pack',
                category: 'Beverages',
                price: 180,
                costPrice: 150,
                stock: 40,
                minStockLevel: 10,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Gorkha Tea',
                createdAt: new Date()
            },
            {
                name: 'Wai Wai Instant Noodles',
                barcode: 'WAIWAI001',
                description: 'Spicy instant noodles 75g pack',
                category: 'Snacks',
                price: 20,
                costPrice: 15,
                stock: 100,
                minStockLevel: 25,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Wai Wai',
                createdAt: new Date()
            },
            {
                name: 'Marie Gold Biscuits - 200g',
                barcode: 'MARIE001',
                description: 'Classic marie biscuits 200g pack',
                category: 'Snacks',
                price: 45,
                costPrice: 35,
                stock: 90,
                minStockLevel: 20,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Britannia',
                createdAt: new Date()
            },
            {
                name: 'White Sugar Premium - 1kg',
                barcode: 'SUGAR1KG',
                description: 'Pure white sugar 1kg pack',
                category: 'Sweeteners',
                price: 120,
                costPrice: 100,
                stock: 70,
                minStockLevel: 15,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Nepal Sugar Mills',
                createdAt: new Date()
            },
            {
                name: 'Colgate Toothpaste - 200g',
                barcode: 'COLGATE001',
                description: 'Advanced whitening toothpaste 200g',
                category: 'Personal Care',
                price: 185,
                costPrice: 140,
                stock: 60,
                minStockLevel: 15,
                unit: 'pack',
                shopId: ramUser._id,
                isActive: true,
                brand: 'Colgate',
                createdAt: new Date()
            }
        ];

        const createdProducts = await Product.insertMany(products);
        console.log('✅ Created', createdProducts.length, 'products for Ram Kirana Pasal');
        
        console.log('Sample products:');
        createdProducts.slice(0, 3).forEach(p => {
            console.log(`- ${p.name} - NPR ${p.price} (Stock: ${p.stock})`);
        });

        await mongoose.disconnect();
        console.log('Database connection closed.');
        
    } catch (error) {
        console.error('Error creating products:', error);
        await mongoose.disconnect();
    }
}

createProductsForRam();
