/**
 * Festival Intelligence System Test Script
 * Tests the complete Nepali calendar and festival-based business intelligence
 */
const mongoose = require('mongoose');
const nepaliCalendarService = require('../services/nepaliCalendarService');
const smartInventoryService = require('../services/smartInventoryService');
const Product = require('../models/Product');
const AutoOrder = require('../models/AutoOrder');
const User = require('../models/User');

// Test data for festival scenarios
const testProducts = [
  {
    name: 'Dashain Electronics - TV',
    category: 'electronics',
    quantity: 15,
    price: 45000,
    barcode: 'DASH001'
  },
  {
    name: 'Red Sari for Teej',
    category: 'clothing', 
    quantity: 8,
    price: 3500,
    barcode: 'TEEJ001'
  },
  {
    name: 'Holi Colors Set',
    category: 'decorations',
    quantity: 25,
    price: 150,
    barcode: 'HOLI001'
  },
  {
    name: 'Tihar Lights',
    category: 'decorations',
    quantity: 12,
    price: 800,
    barcode: 'TIHAR001'
  },
  {
    name: 'Traditional Jewelry',
    category: 'jewelry',
    quantity: 6,
    price: 12000,
    barcode: 'JEWEL001'
  }
];

// Connect to test database
async function connectTestDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_pos_festival_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to festival test database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Create test data for festival scenarios
async function createFestivalTestData() {
  console.log('🎭 Creating festival test data...');
  
  // Create test user (shop owner)
  const testUser = await User.findOneAndUpdate(
    { email: 'festival-test@example.com' },
    {
      username: 'festivalshop',
      email: 'festival-test@example.com',
      password: 'hashedpassword',
      role: 'shopowner',
      shopId: new mongoose.Types.ObjectId()
    },
    { upsert: true, new: true }
  );

  // Create festival-related products
  const createdProducts = [];
  for (const productData of testProducts) {
    const product = await Product.findOneAndUpdate(
      { barcode: productData.barcode },
      {
        ...productData,
        shopId: testUser.shopId
      },
      { upsert: true, new: true }
    );
    createdProducts.push(product);
  }

  // Create auto-orders for festival products
  const autoOrders = [];
  for (const product of createdProducts) {
    const autoOrder = await AutoOrder.findOneAndUpdate(
      { productId: product._id },
      {
        productId: product._id,
        shopId: testUser.shopId,
        supplierId: new mongoose.Types.ObjectId(),
        minStockLevel: 10,
        reorderQuantity: 50,
        frequency: 'weekly',
        priority: 'medium',
        seasonalFactor: 1.0, // Will be updated by festival intelligence
        isActive: true,
        autoOrderEnabled: true,
        createdBy: testUser._id
      },
      { upsert: true, new: true }
    );
    autoOrders.push(autoOrder);
  }

  console.log(`✅ Created festival test data:`);
  console.log(`   - Shop ID: ${testUser.shopId}`);
  console.log(`   - Products: ${createdProducts.length}`);
  console.log(`   - Auto-orders: ${autoOrders.length}`);
  
  return { testUser, testProducts: createdProducts, autoOrders };
}

// Test Nepali calendar functionality
async function testNepaliCalendar() {
  console.log('📅 Testing Nepali calendar functionality...');
  
  try {
    // Test date conversion
    const today = new Date();
    const nepaliDate = await nepaliCalendarService.englishToNepali(today);
    
    console.log('✅ Date conversion:');
    console.log(`   English: ${today.toDateString()}`);
    console.log(`   Nepali: ${nepaliDate.formatted} (${nepaliDate.monthName})`);
    console.log(`   Seasonal factor: ${nepaliDate.monthPattern?.generalFactor || 1.0}`);
    
    return nepaliDate;
  } catch (error) {
    console.error('❌ Nepali calendar test failed:', error);
    throw error;
  }
}

// Test festival detection
async function testFestivalDetection() {
  console.log('🎊 Testing festival detection...');
  
  try {
    // Get upcoming festivals
    const upcomingFestivals = nepaliCalendarService.getUpcomingFestivals(90);
    
    console.log('✅ Upcoming festivals (next 90 days):');
    upcomingFestivals.forEach((festival, index) => {
      console.log(`   ${index + 1}. ${festival.name} (${festival.englishName})`);
      console.log(`      - Days until: ${festival.daysUntil}`);
      console.log(`      - Business impact: ${festival.businessImpact}`);
      console.log(`      - Seasonal factor: ${festival.seasonalFactor}x`);
      console.log(`      - Preparation phase: ${festival.preparationPhase ? 'YES' : 'NO'}`);
    });
    
    return upcomingFestivals;
  } catch (error) {
    console.error('❌ Festival detection test failed:', error);
    throw error;
  }
}

// Test festival recommendations
async function testFestivalRecommendations() {
  console.log('💡 Testing festival recommendations...');
  
  try {
    const festivals = ['dashain', 'tihar', 'holi'];
    const recommendations = {};
    
    for (const festivalKey of festivals) {
      const rec = nepaliCalendarService.getFestivalRecommendations(festivalKey);
      recommendations[festivalKey] = rec;
      
      console.log(`✅ ${rec.festival} recommendations:`);
      console.log(`   - Seasonal factor: ${rec.seasonalFactor}x`);
      console.log(`   - Business impact: ${rec.businessImpact}`);
      console.log(`   - Product recommendations:`);
      rec.recommendations.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item}`);
      });
      console.log(`   - Suggested actions:`);
      rec.suggestedActions.forEach((action, index) => {
        console.log(`     ${index + 1}. ${action}`);
      });
      console.log('');
    }
    
    return recommendations;
  } catch (error) {
    console.error('❌ Festival recommendations test failed:', error);
    throw error;
  }
}

// Test festival-aware inventory checking
async function testFestivalInventoryIntegration(testUser) {
  console.log('🏪 Testing festival-aware inventory checking...');
  
  try {
    // Run festival-aware inventory check
    const result = await smartInventoryService.checkInventoryWithFestivalIntelligence(testUser.shopId);
    
    console.log('✅ Festival-aware inventory analysis:');
    console.log(`   - Products checked: ${result.productsChecked || 'N/A'}`);
    console.log(`   - Low stock items: ${result.lowStockItems?.length || 0}`);
    console.log(`   - Auto-orders triggered: ${result.autoOrdersTriggered || 0}`);
    
    if (result.festivalIntelligence) {
      const fi = result.festivalIntelligence;
      console.log(`   - Current seasonal factor: ${fi.currentSeasonalFactor}`);
      console.log(`   - Festival-adjusted recommendations: ${fi.festivalAdjustedRecommendations.length}`);
      console.log(`   - Urgent festival preparations: ${fi.urgentFestivalPreparations.length}`);
      
      if (fi.festivalAdjustedRecommendations.length > 0) {
        console.log('   📊 Festival stock adjustments needed:');
        fi.festivalAdjustedRecommendations.forEach((rec, index) => {
          console.log(`     ${index + 1}. ${rec.productName}:`);
          console.log(`        Current: ${rec.currentStock}, Recommended: ${rec.recommendedStock}`);
          console.log(`        Urgency: ${rec.urgency}, Reasoning: ${rec.reasoning}`);
        });
      }
    }
    
    if (result.enhancedRecommendations?.length > 0) {
      console.log('   🎯 Enhanced recommendations:');
      result.enhancedRecommendations.forEach((rec, index) => {
        console.log(`     ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Festival inventory integration test failed:', error);
    throw error;
  }
}

// Test auto-application of festival factors
async function testAutoApplyFestivalFactors(testUser) {
  console.log('⚡ Testing auto-application of festival factors...');
  
  try {
    const result = await smartInventoryService.autoApplyFestivalFactors(testUser.shopId);
    
    console.log('✅ Auto-application of festival factors:');
    console.log(`   - Festival: ${result.festival || 'None detected'}`);
    if (result.festival) {
      console.log(`   - Days until festival: ${result.daysUntil}`);
      console.log(`   - Applied seasonal factor: ${result.seasonalFactor}x`);
      console.log(`   - Auto-orders updated: ${result.updatedCount}`);
      console.log(`   - Message: ${result.message}`);
    } else {
      console.log(`   - Message: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Auto-apply festival factors test failed:', error);
    throw error;
  }
}

// Test seasonal factor calculations
async function testSeasonalFactorCalculations() {
  console.log('🧮 Testing seasonal factor calculations...');
  
  try {
    const testScenarios = [
      { baseQuantity: 20, category: 'electronics' },
      { baseQuantity: 15, category: 'clothing' },
      { baseQuantity: 30, category: 'decorations' },
      { baseQuantity: 10, category: 'jewelry' },
      { baseQuantity: 25, category: 'food' }
    ];
    
    console.log('✅ Festival-adjusted quantity calculations:');
    
    for (const scenario of testScenarios) {
      const adjustment = nepaliCalendarService.calculateFestivalAdjustedQuantity(
        scenario.baseQuantity,
        scenario.category
      );
      
      console.log(`   ${scenario.category.toUpperCase()}:`);
      console.log(`     Base: ${adjustment.originalQuantity} → Adjusted: ${adjustment.finalQuantity}`);
      console.log(`     Factors: ${adjustment.reasoning}`);
    }
    
    return testScenarios;
  } catch (error) {
    console.error('❌ Seasonal factor calculations test failed:', error);
    throw error;
  }
}

// Test complete festival intelligence flow
async function testCompleteFestivalIntelligence() {
  console.log('🎭 Testing complete festival intelligence flow...');
  
  try {
    const intelligence = await nepaliCalendarService.getFestivalIntelligence();
    
    console.log('✅ Complete festival intelligence:');
    console.log(`   - Nepali date: ${intelligence.nepaliDate?.formatted}`);
    console.log(`   - Current month: ${intelligence.nepaliDate?.monthName}`);
    console.log(`   - Seasonal factor: ${intelligence.currentSeasonalFactor}x`);
    console.log(`   - Upcoming festivals: ${intelligence.upcomingFestivals?.length || 0}`);
    console.log(`   - Immediate preparations: ${intelligence.immediatePreparation?.length || 0}`);
    console.log(`   - Next major festival: ${intelligence.nextMajorFestival?.name || 'None soon'}`);
    
    if (intelligence.recommendations?.length > 0) {
      console.log('   📋 Current recommendations:');
      intelligence.recommendations.forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec}`);
      });
    }
    
    return intelligence;
  } catch (error) {
    console.error('❌ Complete festival intelligence test failed:', error);
    throw error;
  }
}

// Generate comprehensive test report
async function generateFestivalTestReport(testData) {
  console.log('📊 Generating festival intelligence test report...');
  
  try {
    const { testUser } = testData;
    
    // Get final state
    const products = await Product.find({ shopId: testUser.shopId });
    const autoOrders = await AutoOrder.find({ shopId: testUser.shopId });
    const festivalIntelligence = await nepaliCalendarService.getFestivalIntelligence();
    
    const report = {
      timestamp: new Date(),
      testScope: 'Festival Intelligence System',
      shopId: testUser.shopId,
      
      calendar: {
        nepaliDate: festivalIntelligence.nepaliDate,
        currentSeasonalFactor: festivalIntelligence.currentSeasonalFactor
      },
      
      festivals: {
        upcoming: festivalIntelligence.upcomingFestivals?.length || 0,
        immediatePrep: festivalIntelligence.immediatePreparation?.length || 0,
        nextMajor: festivalIntelligence.nextMajorFestival?.name || 'None'
      },
      
      inventory: {
        totalProducts: products.length,
        totalAutoOrders: autoOrders.length,
        festivalReadyProducts: products.filter(p => p.quantity > 20).length,
        lowStockProducts: products.filter(p => p.quantity <= 10).length
      },
      
      intelligence: {
        recommendations: festivalIntelligence.recommendations?.length || 0,
        seasonalAdjustmentsNeeded: autoOrders.filter(ao => ao.seasonalFactor > 2.0).length,
        highPriorityItems: autoOrders.filter(ao => ao.priority === 'high' || ao.priority === 'critical').length
      }
    };
    
    console.log('✅ Festival Intelligence Test Report:');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    throw error;
  }
}

// Clean up test data
async function cleanupFestivalTestData(testUser) {
  console.log('🧹 Cleaning up festival test data...');
  
  try {
    await AutoOrder.deleteMany({ shopId: testUser.shopId });
    await Product.deleteMany({ shopId: testUser.shopId });
    await User.deleteOne({ _id: testUser._id });
    
    console.log('✅ Festival test data cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Main test runner
async function runFestivalIntelligenceTests() {
  console.log('🚀 Starting Festival Intelligence System Tests\n');
  
  try {
    // Setup
    await connectTestDB();
    const testData = await createFestivalTestData();
    
    console.log('\n🎭 Test Data Created');
    console.log(`Shop ID: ${testData.testUser.shopId}`);
    console.log(`Products: ${testData.testProducts.length}`);
    console.log(`Auto-orders: ${testData.autoOrders.length}`);
    
    // Run tests
    console.log('\n🧪 Running Festival Intelligence Tests...\n');
    
    const nepaliDate = await testNepaliCalendar();
    console.log('');
    
    const festivals = await testFestivalDetection();
    console.log('');
    
    const recommendations = await testFestivalRecommendations();
    console.log('');
    
    const calculations = await testSeasonalFactorCalculations();
    console.log('');
    
    const intelligence = await testCompleteFestivalIntelligence();
    console.log('');
    
    const inventoryResult = await testFestivalInventoryIntegration(testData.testUser);
    console.log('');
    
    const autoApplyResult = await testAutoApplyFestivalFactors(testData.testUser);
    console.log('');
    
    const report = await generateFestivalTestReport(testData);
    console.log('');
    
    // Cleanup
    await cleanupFestivalTestData(testData.testUser);
    
    console.log('\n🎉 All festival intelligence tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Nepali calendar conversion - PASSED');
    console.log('✅ Festival detection - PASSED');
    console.log('✅ Festival recommendations - PASSED');
    console.log('✅ Seasonal calculations - PASSED');
    console.log('✅ Complete intelligence flow - PASSED');
    console.log('✅ Inventory integration - PASSED');
    console.log('✅ Auto-apply festival factors - PASSED');
    console.log('✅ Report generation - PASSED');
    
  } catch (error) {
    console.error('\n❌ Festival intelligence test suite failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runFestivalIntelligenceTests();
}

module.exports = {
  runFestivalIntelligenceTests,
  testNepaliCalendar,
  testFestivalDetection,
  testFestivalRecommendations,
  testFestivalInventoryIntegration
};
