// scripts/removeOldDemoProducts.js
// This script removes demo products older than 7 days
const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function removeOldDemoProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await Product.deleteMany({
      isDemo: true,
      createdAt: { $lt: oneWeekAgo }
    });
    console.log(`Removed ${result.deletedCount} old demo products.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error removing old demo products:', err);
    process.exit(1);
  }
}

removeOldDemoProducts();
