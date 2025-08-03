const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_pos_db');

const Product = require('./models/Product');
const SupplierInventory = require('./models/SupplierInventory');

async function checkSupplierStock() {
  try {
    console.log('Checking supplier products and stock...');
    
    const supplierId = '688da6f077e9338dab0e091e'; // Shyam Sharma
    
    // Get all products from this supplier first
    const products = await Product.find({ 'supplierInfo.supplierId': supplierId });
    console.log(`Found ${products.length} products for supplier`);
    
    // Delete old inventory to start fresh
    await SupplierInventory.deleteMany({ supplierId });
    console.log('Cleaned old inventory');
    
    // Create fresh inventory for each product
    for (const product of products) {
      const stockAmount = Math.floor(Math.random() * 100) + 20; // Random stock 20-120
      const newInventory = new SupplierInventory({
        supplierId,
        productId: product._id,
        sku: product.barcode || `SKU-${product._id}`, // Use barcode or generate SKU
        currentStock: stockAmount,
        minStock: 10,
        maxStock: 200,
        costPrice: product.costPrice || product.price * 0.8,
        sellingPrice: product.price,
        status: 'in-stock', // Will be auto-set by pre-save hook
        lastUpdated: new Date()
      });
      
      await newInventory.save();
      console.log(`Created inventory for: ${product.name} - Stock: ${stockAmount}`);
    }
    
    console.log('Stock creation completed!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkSupplierStock();
