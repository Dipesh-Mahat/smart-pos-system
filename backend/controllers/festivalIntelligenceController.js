/**
 * Festival Intelligence Controller
 * Handles API endpoints for Nepali calendar and festival-based business intelligence
 */

const nepaliCalendarService = require('../services/nepaliCalendarService');
const smartInventoryService = require('../services/smartInventoryService');
const Product = require('../models/Product');
const AutoOrder = require('../models/AutoOrder');

/**
 * Get comprehensive festival dashboard
 */
const getFestivalDashboard = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    
    // Get festival intelligence
    const festivalData = await nepaliCalendarService.getFestivalIntelligence();
    
    // Get inventory that might be affected by festivals
    const products = await Product.find({ shopId })
      .select('name category quantity price')
      .lean();
    
    // Get auto-orders with seasonal factors
    const autoOrders = await AutoOrder.find({ shopId, isActive: true })
      .populate('productId', 'name category')
      .lean();
    
    // Calculate festival impact on inventory
    const festivalImpactAnalysis = analyzeInventoryFestivalImpact(
      products, 
      festivalData.upcomingFestivals,
      festivalData.currentSeasonalFactor
    );
    
    // Generate action items
    const actionItems = generateFestivalActionItems(
      festivalData.immediatePreparation,
      festivalImpactAnalysis
    );
    
    res.status(200).json({
      success: true,
      data: {
        nepaliDate: festivalData.nepaliDate,
        currentSeasonalFactor: festivalData.currentSeasonalFactor,
        upcomingFestivals: festivalData.upcomingFestivals,
        immediatePreparation: festivalData.immediatePreparation,
        nextMajorFestival: festivalData.nextMajorFestival,
        monthlyPattern: festivalData.monthlyPattern,
        recommendations: festivalData.recommendations,
        inventoryImpact: festivalImpactAnalysis,
        actionItems,
        autoOrdersCount: autoOrders.length,
        productsAnalyzed: products.length
      }
    });
  } catch (error) {
    console.error('Error getting festival dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get festival dashboard',
      error: error.message
    });
  }
};

/**
 * Get upcoming festivals
 */
const getUpcomingFestivals = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 60;
    const upcomingFestivals = nepaliCalendarService.getUpcomingFestivals(days);
    
    res.status(200).json({
      success: true,
      data: {
        festivals: upcomingFestivals,
        count: upcomingFestivals.length,
        timeframe: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error getting upcoming festivals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming festivals',
      error: error.message
    });
  }
};

/**
 * Get festival-specific recommendations
 */
const getFestivalRecommendations = async (req, res) => {
  try {
    const { festivalKey } = req.params;
    const recommendations = nepaliCalendarService.getFestivalRecommendations(festivalKey);
    
    if (!recommendations) {
      return res.status(404).json({
        success: false,
        message: 'Festival not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting festival recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get festival recommendations',
      error: error.message
    });
  }
};

/**
 * Convert English date to Nepali date
 */
const convertToNepaliDate = async (req, res) => {
  try {
    const { date } = req.query;
    const inputDate = date ? new Date(date) : new Date();
    
    const nepaliDate = await nepaliCalendarService.englishToNepali(inputDate);
    
    if (!nepaliDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date conversion'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        englishDate: inputDate.toISOString().split('T')[0],
        nepaliDate
      }
    });
  } catch (error) {
    console.error('Error converting date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert date',
      error: error.message
    });
  }
};

/**
 * Update auto-orders with festival seasonal factors
 */
const updateAutoOrdersWithFestivalFactors = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { festivalKey, applyToAll = false } = req.body;
    
    // Get festival data
    const festivalData = nepaliCalendarService.getFestivalRecommendations(festivalKey);
    if (!festivalData) {
      return res.status(404).json({
        success: false,
        message: 'Festival not found'
      });
    }
    
    let query = { shopId, isActive: true };
    if (!applyToAll && req.body.productIds) {
      query.productId = { $in: req.body.productIds };
    }
    
    // Update auto-orders with festival seasonal factor
    const updateResult = await AutoOrder.updateMany(
      query,
      {
        $set: {
          seasonalFactor: festivalData.seasonalFactor,
          seasonalReason: `${festivalData.festival} Festival Preparation`,
          lastUpdated: new Date()
        }
      }
    );
    
    // Log the update
    console.log(`Updated ${updateResult.modifiedCount} auto-orders for ${festivalData.festival}`);
    
    res.status(200).json({
      success: true,
      data: {
        festival: festivalData.festival,
        seasonalFactor: festivalData.seasonalFactor,
        updatedAutoOrders: updateResult.modifiedCount,
        message: `Applied ${festivalData.festival} seasonal factor (${festivalData.seasonalFactor}x) to auto-orders`
      }
    });
  } catch (error) {
    console.error('Error updating auto-orders with festival factors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auto-orders',
      error: error.message
    });
  }
};

/**
 * Get festival preparation checklist
 */
const getFestivalPreparationChecklist = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { festivalKey } = req.params;
    
    const festivalData = nepaliCalendarService.getFestivalRecommendations(festivalKey);
    if (!festivalData) {
      return res.status(404).json({
        success: false,
        message: 'Festival not found'
      });
    }
    
    // Get current inventory related to festival
    const products = await Product.find({ shopId })
      .select('name category quantity price')
      .lean();
    
    // Analyze festival readiness
    const readinessAnalysis = analyzeFestivalReadiness(products, festivalData);
    
    // Generate checklist
    const checklist = generateFestivalChecklist(festivalData, readinessAnalysis);
    
    res.status(200).json({
      success: true,
      data: {
        festival: festivalData.festival,
        seasonalFactor: festivalData.seasonalFactor,
        preparationDays: festivalData.preparationDays,
        checklist,
        readinessScore: readinessAnalysis.readinessScore,
        recommendations: festivalData.recommendations,
        suggestedActions: festivalData.suggestedActions
      }
    });
  } catch (error) {
    console.error('Error getting festival checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get festival checklist',
      error: error.message
    });
  }
};

/**
 * Helper function to analyze inventory festival impact
 */
function analyzeInventoryFestivalImpact(products, upcomingFestivals, currentSeasonalFactor) {
  const analysis = {
    totalProducts: products.length,
    lowStockForFestivals: 0,
    criticalStockForFestivals: 0,
    festivalReadyProducts: 0,
    estimatedRevenueBump: 0,
    categoryImpact: {}
  };
  
  products.forEach(product => {
    const category = product.category?.toLowerCase() || 'general';
    
    if (!analysis.categoryImpact[category]) {
      analysis.categoryImpact[category] = {
        totalProducts: 0,
        lowStock: 0,
        estimatedDemandIncrease: currentSeasonalFactor
      };
    }
    
    analysis.categoryImpact[category].totalProducts++;
    
    // Calculate festival-adjusted demand
    const festivalAdjustment = nepaliCalendarService.calculateFestivalAdjustedQuantity(
      product.quantity, 
      category
    );
    
    const requiredStock = festivalAdjustment.finalQuantity;
    
    if (product.quantity < requiredStock * 0.3) {
      analysis.criticalStockForFestivals++;
      analysis.categoryImpact[category].lowStock++;
    } else if (product.quantity < requiredStock * 0.6) {
      analysis.lowStockForFestivals++;
      analysis.categoryImpact[category].lowStock++;
    } else {
      analysis.festivalReadyProducts++;
    }
    
    // Estimate revenue impact
    analysis.estimatedRevenueBump += product.price * (festivalAdjustment.finalQuantity - product.quantity);
  });
  
  return analysis;
}

/**
 * Helper function to generate festival action items
 */
function generateFestivalActionItems(immediatePreparation, impactAnalysis) {
  const actionItems = [];
  
  immediatePreparation.forEach(festival => {
    actionItems.push({
      priority: 'high',
      festival: festival.name,
      daysUntil: festival.daysUntil,
      action: `Prepare for ${festival.name} (${festival.daysUntil} days)`,
      recommendations: festival.recommendations.slice(0, 2)
    });
  });
  
  if (impactAnalysis.criticalStockForFestivals > 0) {
    actionItems.push({
      priority: 'critical',
      action: `${impactAnalysis.criticalStockForFestivals} products critically low for upcoming festivals`,
      category: 'inventory'
    });
  }
  
  if (impactAnalysis.lowStockForFestivals > 0) {
    actionItems.push({
      priority: 'medium',
      action: `${impactAnalysis.lowStockForFestivals} products may need restocking for festivals`,
      category: 'inventory'
    });
  }
  
  return actionItems.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Helper function to analyze festival readiness
 */
function analyzeFestivalReadiness(products, festivalData) {
  let readyProducts = 0;
  let totalRelevantProducts = 0;
  
  // This is a simplified analysis - in reality, you'd match products to festival categories
  products.forEach(product => {
    totalRelevantProducts++;
    
    // Simple heuristic: products with good stock are "ready"
    if (product.quantity > 20) {
      readyProducts++;
    }
  });
  
  const readinessScore = totalRelevantProducts > 0 ? 
    Math.round((readyProducts / totalRelevantProducts) * 100) : 0;
  
  return {
    readyProducts,
    totalRelevantProducts,
    readinessScore,
    status: readinessScore >= 80 ? 'excellent' : 
             readinessScore >= 60 ? 'good' : 
             readinessScore >= 40 ? 'fair' : 'poor'
  };
}

/**
 * Helper function to generate festival checklist
 */
function generateFestivalChecklist(festivalData, readinessAnalysis) {
  const checklist = [];
  
  // Basic preparation items
  checklist.push({
    item: 'Inventory Assessment',
    completed: readinessAnalysis.readinessScore >= 70,
    priority: 'high',
    description: 'Assess current inventory levels for festival items'
  });
  
  checklist.push({
    item: 'Supplier Coordination',
    completed: false,
    priority: 'high',
    description: 'Confirm availability with suppliers for festival stock'
  });
  
  checklist.push({
    item: 'Festival Display Setup',
    completed: false,
    priority: 'medium',
    description: 'Arrange special displays for festival products'
  });
  
  // Add festival-specific items
  festivalData.recommendations.forEach((rec, index) => {
    checklist.push({
      item: `Stock ${rec}`,
      completed: false,
      priority: index < 2 ? 'high' : 'medium',
      description: `Ensure adequate supply of ${rec.toLowerCase()}`
    });
  });
  
  return checklist;
}

module.exports = {
  getFestivalDashboard,
  getUpcomingFestivals,
  getFestivalRecommendations,
  convertToNepaliDate,
  updateAutoOrdersWithFestivalFactors,
  getFestivalPreparationChecklist
};
