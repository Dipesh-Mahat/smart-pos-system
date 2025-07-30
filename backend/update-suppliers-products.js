/**
 * Script to distribute products among all suppliers for presentation
 * Run this after the main seed script to ensure all suppliers have products
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Product = require('./models/Product');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://smartpos-admin:QsIKePK7zpwmpmv8@smart-pos-cluster.lpptxzc.mongodb.net/smart-pos-system');
    console.log('MongoDB connected for supplier products update');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

// Update suppliers with products
const updateSupplierProducts = async () => {
  try {
    await connectDB();
    
    // Get all suppliers
    const suppliers = await User.find({ role: 'supplier' });
    console.log(`Found ${suppliers.length} suppliers`);
    
    // Get all products that don't have a supplier assigned
    let products = await Product.find({});
    console.log(`Found ${products.length} products`);
    
    if (suppliers.length === 0) {
      console.log('No suppliers found!');
      return;
    }
    
    // Create additional products for each supplier
    const productTemplates = [
      {
        name: 'Premium Cooking Oil (2L)',
        barcode: 'OIL001',
        description: 'Refined sunflower cooking oil',
        category: 'Groceries',
        price: 480,
        costPrice: 420,
        stock: 50,
        minStockLevel: 10,
        unit: 'liter',
        brand: 'Dhara',
        tax: 13
      },
      {
        name: 'Organic Green Tea (250g)',
        barcode: 'TEA001',
        description: 'Premium organic green tea from Ilam',
        category: 'Beverages',
        price: 650,
        costPrice: 550,
        stock: 30,
        minStockLevel: 5,
        unit: 'pack',
        brand: 'Himalayan Tea',
        tax: 13
      },
      {
        name: 'Fresh Milk (1L)',
        barcode: 'MILK001',
        description: 'Fresh pasteurized milk',
        category: 'Dairy',
        price: 85,
        costPrice: 70,
        stock: 40,
        minStockLevel: 15,
        unit: 'pack',
        brand: 'DDC',
        tax: 13
      },
      {
        name: 'Brown Bread (500g)',
        barcode: 'BREAD001',
        description: 'Whole wheat brown bread',
        category: 'Bakery',
        price: 65,
        costPrice: 50,
        stock: 25,
        minStockLevel: 8,
        unit: 'piece',
        brand: 'Kathmandu Bakery',
        tax: 13
      },
      {
        name: 'Instant Noodles (Pack of 5)',
        barcode: 'NOODLE001',
        description: 'Spicy chicken flavor instant noodles',
        category: 'Snacks',
        price: 125,
        costPrice: 100,
        stock: 80,
        minStockLevel: 20,
        unit: 'pack',
        brand: 'Wai Wai',
        tax: 13
      },
      {
        name: 'Detergent Powder (1kg)',
        barcode: 'DET001',
        description: 'Strong cleaning detergent powder',
        category: 'Household',
        price: 280,
        costPrice: 230,
        stock: 35,
        minStockLevel: 10,
        unit: 'pack',
        brand: 'Surf Excel',
        tax: 13
      },
      {
        name: 'Tomato Sauce (500g)',
        barcode: 'SAUCE001',
        description: 'Rich tomato ketchup sauce',
        category: 'Condiments',
        price: 180,
        costPrice: 150,
        stock: 45,
        minStockLevel: 12,
        unit: 'liter',
        brand: 'Maggi',
        tax: 13
      }
    ];
    
    // Distribute products among suppliers
    let createdProducts = 0;
    
    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i];
      console.log(`Adding products for supplier: ${supplier.firstName} ${supplier.lastName}`);
      
      // Add 5-7 products per supplier
      const productsToAdd = productTemplates.slice(i * 2, (i * 2) + 5);
      
      for (let j = 0; j < productsToAdd.length; j++) {
        const template = productsToAdd[j];
        
        const newProduct = new Product({
          ...template,
          barcode: template.barcode + '_' + supplier._id.toString().slice(-4),
          shopId: supplier._id, // Assuming products belong to shop
          supplierInfo: {
            supplierId: supplier._id,
            supplierName: `${supplier.firstName} ${supplier.lastName}`,
            supplierCode: `SUP${String(i + 1).padStart(3, '0')}`
          },
          isActive: true,
          expiryDate: new Date('2025-12-31'),
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        
        await newProduct.save();
        createdProducts++;
      }
    }
    
    // Also update existing products to distribute them among suppliers
    const existingProducts = await Product.find({});
    const suppliersCount = suppliers.length;
    
    for (let i = 0; i < existingProducts.length; i++) {
      const product = existingProducts[i];
      const supplierIndex = i % suppliersCount;
      const supplier = suppliers[supplierIndex];
      
      await Product.findByIdAndUpdate(product._id, {
        supplierInfo: {
          supplierId: supplier._id,
          supplierName: `${supplier.firstName} ${supplier.lastName}`,
          supplierCode: `SUP${String(supplierIndex + 1).padStart(3, '0')}`
        }
      });
    }
    
    console.log(`✅ Successfully created ${createdProducts} new products`);
    console.log(`✅ Updated ${existingProducts.length} existing products`);
    console.log(`✅ All ${suppliers.length} suppliers now have products!`);
    
    // Display supplier product counts
    for (const supplier of suppliers) {
      const productCount = await Product.countDocuments({
        'supplierInfo.supplierId': supplier._id
      });
      console.log(`📦 ${supplier.firstName} ${supplier.lastName}: ${productCount} products`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error updating supplier products:', err);
    process.exit(1);
  }
};

// Run the update script
updateSupplierProducts();
