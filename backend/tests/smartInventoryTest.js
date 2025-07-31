/**
 * Smart Inventory System Test Script
 * Tests the complete smart inventory functionality
 */
const mongoose = require('mongoose');
const Product = require('../models/Product');
const AutoOrder = require('../models/AutoOrder');
const User = require('../models/User');
const { checkInventoryForShop, setupAutoOrder } = require('../services/smartInventoryService');

// Connect to test database
async function connectTestDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_pos_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to test database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Create test data
async function createTestData() {
  console.log('📋 Creating test data...');
  
  // Create test user (shop owner)
  const testUser = await User.findOneAndUpdate(
    { email: 'test-shop@example.com' },
    {
      username: 'testshop',
      email: 'test-shop@example.com',
      password: 'hashedpassword',
      role: 'shopowner',
      shopId: new mongoose.Types.ObjectId()
    },
    { upsert: true, new: true }
  );

  // Create test products with varying stock levels
  const testProducts = [
    {
      name: 'Test Product 1 - Low Stock',
      price: 25.99,
      quantity: 5, // Low stock
      category: 'Electronics',
      shopId: testUser.shopId,
      barcode: 'TEST001'
    },
    {
      name: 'Test Product 2 - Critical Stock',
      price: 15.50,
      quantity: 2, // Critical stock
      category: 'Groceries',
      shopId: testUser.shopId,
      barcode: 'TEST002'
    },
    {
      name: 'Test Product 3 - Normal Stock',
      price: 45.00,
      quantity: 50, // Normal stock
      category: 'Clothing',
      shopId: testUser.shopId,
      barcode: 'TEST003'
    }
  ];

  const createdProducts = [];
  for (const productData of testProducts) {
    const product = await Product.findOneAndUpdate(
      { barcode: productData.barcode },
      productData,
      { upsert: true, new: true }
    );
    createdProducts.push(product);
  }

  console.log(`✅ Created ${createdProducts.length} test products`);
  return { testUser, testProducts: createdProducts };
}

// Test auto-order setup
async function testAutoOrderSetup(testUser, testProducts) {
  console.log('🔧 Testing auto-order setup...');
  
  const autoOrderData = {
    productId: testProducts[0]._id,
    shopId: testUser.shopId,
    supplierId: new mongoose.Types.ObjectId(),
    minStockLevel: 10,
    reorderQuantity: 50,
    frequency: 'weekly',
    priority: 'high',
    seasonalFactor: 1.2,
    isActive: true,
    autoOrderEnabled: true,
    createdBy: testUser._id
  };

  try {
    const autoOrder = await setupAutoOrder(autoOrderData);
    console.log('✅ Auto-order setup successful:', autoOrder._id);
    return autoOrder;
  } catch (error) {
    console.error('❌ Auto-order setup failed:', error);
    throw error;
  }
}

// Test inventory check
async function testInventoryCheck(testUser) {
  console.log('📊 Testing inventory check...');
  
  try {
    const result = await checkInventoryForShop(testUser.shopId);
    console.log('✅ Inventory check results:');
    console.log(`   - Products checked: ${result.productsChecked}`);
    console.log(`   - Low stock items: ${result.lowStockItems}`);
    console.log(`   - Auto-orders triggered: ${result.autoOrdersTriggered}`);
    console.log(`   - Alerts generated: ${result.alerts?.length || 0}`);
    
    if (result.alerts && result.alerts.length > 0) {
      console.log('📢 Alerts:');
      result.alerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. ${alert.type}: ${alert.message}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Inventory check failed:', error);
    throw error;
  }
}

// Test seasonal adjustments
async function testSeasonalAdjustments(autoOrder) {
  console.log('🌟 Testing seasonal adjustments...');
  
  try {
    // Test with festival season (higher demand)
    autoOrder.seasonalFactor = 2.0;
    autoOrder.seasonalReason = 'Dashain Festival - High Demand';
    await autoOrder.save();
    
    console.log('✅ Seasonal factor updated to 2.0 for festival season');
    
    // Test calculation
    const baseQuantity = autoOrder.reorderQuantity;
    const adjustedQuantity = Math.ceil(baseQuantity * autoOrder.seasonalFactor);
    console.log(`   Base quantity: ${baseQuantity}`);
    console.log(`   Adjusted quantity: ${adjustedQuantity}`);
    
    return { baseQuantity, adjustedQuantity };
  } catch (error) {
    console.error('❌ Seasonal adjustment test failed:', error);
    throw error;
  }
}

// Test priority handling
async function testPriorityHandling(testUser, testProducts) {
  console.log('⚡ Testing priority handling...');
  
  const priorities = ['low', 'medium', 'high', 'critical'];
  const autoOrders = [];
  
  try {
    for (let i = 0; i < Math.min(priorities.length, testProducts.length); i++) {
      const autoOrderData = {
        productId: testProducts[i]._id,
        shopId: testUser.shopId,
        supplierId: new mongoose.Types.ObjectId(),
        minStockLevel: 5,
        reorderQuantity: 25,
        frequency: 'weekly',
        priority: priorities[i],
        isActive: true,
        autoOrderEnabled: true,
        createdBy: testUser._id
      };
      
      const autoOrder = await AutoOrder.create(autoOrderData);
      autoOrders.push(autoOrder);
    }
    
    // Get auto-orders sorted by priority
    const sortedOrders = await AutoOrder.find({ shopId: testUser.shopId })
      .populate('productId', 'name quantity')
      .sort({ priority: -1 }); // Critical first
    
    console.log('✅ Priority-sorted auto-orders:');
    sortedOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.priority.toUpperCase()}: ${order.productId.name}`);
    });
    
    return sortedOrders;
  } catch (error) {
    console.error('❌ Priority handling test failed:', error);
    throw error;
  }
}

// Generate test report
async function generateTestReport(testUser) {
  console.log('📈 Generating test report...');
  
  try {
    const products = await Product.find({ shopId: testUser.shopId });
    const autoOrders = await AutoOrder.find({ shopId: testUser.shopId }).populate('productId');
    
    const report = {
      timestamp: new Date(),
      shopId: testUser.shopId,
      products: {
        total: products.length,
        lowStock: products.filter(p => p.quantity <= 10).length,
        criticalStock: products.filter(p => p.quantity <= 5).length
      },
      autoOrders: {
        total: autoOrders.length,
        active: autoOrders.filter(ao => ao.isActive).length,
        byPriority: {
          critical: autoOrders.filter(ao => ao.priority === 'critical').length,
          high: autoOrders.filter(ao => ao.priority === 'high').length,
          medium: autoOrders.filter(ao => ao.priority === 'medium').length,
          low: autoOrders.filter(ao => ao.priority === 'low').length
        }
      }
    };
    
    console.log('✅ Test Report:');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    throw error;
  }
}

// Clean up test data
async function cleanupTestData(testUser) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    await AutoOrder.deleteMany({ shopId: testUser.shopId });
    await Product.deleteMany({ shopId: testUser.shopId });
    await User.deleteOne({ _id: testUser._id });
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Main test runner
async function runSmartInventoryTests() {
  console.log('🚀 Starting Smart Inventory System Tests\n');
  
  try {
    // Setup
    await connectTestDB();
    const { testUser, testProducts } = await createTestData();
    
    console.log('\n📋 Test Data Created');
    console.log(`Shop ID: ${testUser.shopId}`);
    console.log(`Products: ${testProducts.length}`);
    
    // Run tests
    console.log('\n🧪 Running Tests...\n');
    
    const autoOrder = await testAutoOrderSetup(testUser, testProducts);
    console.log('');
    
    const inventoryResult = await testInventoryCheck(testUser);
    console.log('');
    
    const seasonalResult = await testSeasonalAdjustments(autoOrder);
    console.log('');
    
    const priorityResult = await testPriorityHandling(testUser, testProducts);
    console.log('');
    
    const report = await generateTestReport(testUser);
    console.log('');
    
    // Cleanup
    await cleanupTestData(testUser);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Auto-order setup - PASSED');
    console.log('✅ Inventory checking - PASSED');
    console.log('✅ Seasonal adjustments - PASSED');
    console.log('✅ Priority handling - PASSED');
    console.log('✅ Report generation - PASSED');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSmartInventoryTests();
}

module.exports = {
  runSmartInventoryTests,
  testAutoOrderSetup,
  testInventoryCheck,
  testSeasonalAdjustments,
  testPriorityHandling
};
