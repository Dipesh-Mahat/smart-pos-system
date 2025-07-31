/**
 * Script to create sample orders for all suppliers for presentation
 * This will allow you to generate bills from orders
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
    
    // Get shop owner
    const shopOwner = await User.findOne({ role: 'shopowner' });
    if (!shopOwner) {
      console.log('No shop owner found!');
      return;
    }
    
    // Get all suppliers
    const suppliers = await User.find({ role: 'supplier' });
    console.log(`Found ${suppliers.length} suppliers`);
    
    let createdOrders = 0;
    
    for (const supplier of suppliers) {
      // Get products for this supplier
      const products = await Product.find({
        'supplierInfo.supplierId': supplier._id
      }).limit(5);
      
      if (products.length === 0) {
        console.log(`No products found for supplier ${supplier.firstName} ${supplier.lastName}`);
        continue;
      }
      
      // Create 2-3 sample orders per supplier
      for (let orderNum = 1; orderNum <= 3; orderNum++) {
        const orderItems = [];
        let totalAmount = 0;
        
        // Add 2-4 random products to order
        const productsToOrder = products.slice(0, Math.floor(Math.random() * 3) + 2);
        
        for (const product of productsToOrder) {
          const quantity = Math.floor(Math.random() * 10) + 1;
          const price = product.costPrice || product.price * 0.8;
          const itemTotal = quantity * price;
          
          orderItems.push({
            productId: product._id,
            name: product.name,
            quantity: quantity,
            unitPrice: price,
            totalPrice: itemTotal
          });
          
          totalAmount += itemTotal;
        }
        
        // Create order with random date in the last 30 days
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
        
        const order = new Order({
          orderNumber: `ORD-${Date.now()}-${createdOrders + 1}`,
          shopId: shopOwner._id,
          supplierId: supplier._id,
          items: orderItems,
          subtotal: totalAmount,
          tax: totalAmount * 0.13, // 13% tax
          total: totalAmount * 1.13,
          status: Math.random() > 0.3 ? 'delivered' : 'pending', // 70% delivered, 30% pending
          orderDate: orderDate,
          expectedDeliveryDate: new Date(orderDate.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000),
          actualDeliveryDate: Math.random() > 0.5 ? new Date(orderDate.getTime() + (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000) : null,
          notes: `Sample order ${orderNum} for presentation`,
          paymentStatus: Math.random() > 0.4 ? 'paid' : 'pending',
          paymentMethod: Math.random() > 0.5 ? 'bankTransfer' : 'cash'
        });
        
        await order.save();
        createdOrders++;
        
        console.log(`✅ Created order for ${supplier.firstName} ${supplier.lastName}: Rs. ${(totalAmount * 1.13).toFixed(2)}`);
      }
    }
    
    console.log(`🎉 Successfully created ${createdOrders} sample orders!`);
    
    // Display order summary
    console.log('\n📊 ORDER SUMMARY:');
    console.log('='.repeat(50));
    
    for (const supplier of suppliers) {
      const orderCount = await Order.countDocuments({ supplierId: supplier._id });
      const totalValue = await Order.aggregate([
        { $match: { supplierId: supplier._id } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      
      console.log(`📦 ${supplier.firstName} ${supplier.lastName}:`);
      console.log(`   Orders: ${orderCount}`);
      console.log(`   Total Value: Rs. ${totalValue[0]?.total?.toFixed(2) || '0.00'}`);
      console.log('');
    }
    
    console.log('✅ Orders created successfully! You can now generate bills from these orders.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating sample orders:', err);
    process.exit(1);
  }
};

// Run the script
createSampleOrders();
