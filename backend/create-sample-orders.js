/**
 * Script to create sample orders for testing the order history page
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://smartpos-admin:QsIKePK7zpwmpmv8@smart-pos-cluster.lpptxzc.mongodb.net/smart-pos-system');
    console.log('MongoDB connected for order creation');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

// Create sample orders
const createSampleOrders = async () => {
  try {
    await connectDB();
    
    // Get the shop owner (Ram Kirana Pasal)
    const shopOwner = await User.findOne({ email: 'ram@kirana.com' });
    if (!shopOwner) {
      console.log('Ram Kirana Pasal shop owner not found!');
      return;
    }
    console.log('Found shop owner:', shopOwner.firstName, shopOwner.lastName);
    
    // Get suppliers
    const suppliers = await User.find({ role: 'supplier' });
    console.log(`Found ${suppliers.length} suppliers`);
    
    if (suppliers.length === 0) {
      console.log('No suppliers found!');
      return;
    }
    
    // Get some products
    const products = await Product.find({}).limit(10);
    console.log(`Found ${products.length} products`);
    
    if (products.length === 0) {
      console.log('No products found!');
      return;
    }
    
    // Create sample orders with different statuses and dates
    const sampleOrders = [];
    
    // Order 1 - Delivered order from last week
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    sampleOrders.push({
      orderNumber: `ORD-${Date.now()}-001`,
      shopId: shopOwner._id,
      supplierId: suppliers[0]._id,
      items: [
        {
          productId: products[0]._id,
          name: products[0].name,
          sku: products[0].sku || `SKU-${products[0]._id}`,
          quantity: 20,
          unitPrice: products[0].costPrice || 100,
          totalPrice: (products[0].costPrice || 100) * 20,
          discount: 0
        },
        {
          productId: products[1]._id,
          name: products[1].name,
          sku: products[1].sku || `SKU-${products[1]._id}`,
          quantity: 15,
          unitPrice: products[1].costPrice || 80,
          totalPrice: (products[1].costPrice || 80) * 15,
          discount: 50
        }
      ],
      subtotal: ((products[0].costPrice || 100) * 20) + ((products[1].costPrice || 80) * 15),
      shippingCost: 200,
      discount: 50,
      total: ((products[0].costPrice || 100) * 20) + ((products[1].costPrice || 80) * 15) + 200 - 50,
      status: 'delivered',
      orderDate: lastWeek,
      expectedDeliveryDate: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      actualDeliveryDate: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      shippingAddress: {
        street: 'Naya Sadak',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      paymentMethod: 'bankTransfer',
      paymentStatus: 'paid',
      notes: 'Regular weekly grocery order'
    });
    
    // Order 2 - Pending order from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    sampleOrders.push({
      orderNumber: `ORD-${Date.now()}-002`,
      shopId: shopOwner._id,
      supplierId: suppliers[0]._id,
      items: [
        {
          productId: products[2]._id,
          name: products[2].name,
          sku: products[2].sku || `SKU-${products[2]._id}`,
          quantity: 50,
          unitPrice: products[2].costPrice || 60,
          totalPrice: (products[2].costPrice || 60) * 50,
          discount: 100
        }
      ],
      subtotal: (products[2].costPrice || 60) * 50,
      shippingCost: 150,
      discount: 100,
      total: ((products[2].costPrice || 60) * 50) + 150 - 100,
      status: 'pending',
      orderDate: yesterday,
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      shippingAddress: {
        street: 'Naya Sadak',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      paymentMethod: 'creditAccount',
      paymentStatus: 'pending',
      notes: 'Festival season special order'
    });
    
    // Order 3 - Today's order
    sampleOrders.push({
      orderNumber: `ORD-${Date.now()}-003`,
      shopId: shopOwner._id,
      supplierId: suppliers[0]._id,
      items: [
        {
          productId: products[3]._id,
          name: products[3].name,
          sku: products[3].sku || `SKU-${products[3]._id}`,
          quantity: 30,
          unitPrice: products[3].costPrice || 90,
          totalPrice: (products[3].costPrice || 90) * 30,
          discount: 0
        },
        {
          productId: products[4]._id,
          name: products[4].name,
          sku: products[4].sku || `SKU-${products[4]._id}`,
          quantity: 25,
          unitPrice: products[4].costPrice || 120,
          totalPrice: (products[4].costPrice || 120) * 25,
          discount: 0
        }
      ],
      subtotal: ((products[3].costPrice || 90) * 30) + ((products[4].costPrice || 120) * 25),
      shippingCost: 250,
      discount: 0,
      total: ((products[3].costPrice || 90) * 30) + ((products[4].costPrice || 120) * 25) + 250,
      status: 'confirmed',
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      shippingAddress: {
        street: 'Naya Sadak',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      paymentMethod: 'creditAccount',
      paymentStatus: 'pending',
      notes: 'Monthly stock replenishment'
    });
    
    // Create orders in database
    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Successfully created ${createdOrders.length} sample orders`);
    
    // Display created orders
    createdOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log(`  - Number: ${order.orderNumber}`);
      console.log(`  - Status: ${order.status}`);
      console.log(`  - Total: NPR ${order.total}`);
      console.log(`  - Items: ${order.items.length}`);
      console.log(`  - Date: ${order.orderDate.toLocaleDateString()}`);
      console.log('');
    });
    
    mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error creating sample orders:', error);
    mongoose.connection.close();
  }
};

// Run the script
if (require.main === module) {
  createSampleOrders();
}

module.exports = { createSampleOrders };
