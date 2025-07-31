/**
 * AI Business Intelligence Controller
 * Handles API endpoints for AI-powered business analytics and recommendations
 */

const aiBusinessIntelligenceService = require('../services/aiBusinessIntelligenceService');
const smartInventoryService = require('../services/smartInventoryService');
const nepaliCalendarService = require('../services/nepaliCalendarService');

/**
 * Get comprehensive AI business intelligence dashboard
 */
const getAIBusinessDashboard = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userId = req.user.id;
    const options = {
      userId: userId,
      excludeCategories: req.query.exclude ? req.query.exclude.split(',') : [],
      includeOnly: req.query.include ? req.query.include.split(',') : null
    };

    // Get AI business intelligence with personalized data
    const aiInsights = await aiBusinessIntelligenceService.getBusinessIntelligence(shopId, options);
    
    // Get current inventory status for context
    const inventoryStatus = await smartInventoryService.checkInventoryWithFestivalIntelligence(shopId);
    
    // Get festival intelligence for additional context
    const festivalContext = await nepaliCalendarService.getFestivalIntelligence();

    // Combine insights with actionable dashboard data
    const dashboardData = {
      aiInsights,
      inventoryContext: {
        lowStockItems: inventoryStatus.lowStockItems?.length || 0,
        autoOrdersTriggered: inventoryStatus.autoOrdersTriggered || 0,
        festivalAdjustments: inventoryStatus.festivalIntelligence?.festivalAdjustedRecommendations?.length || 0
      },
      festivalContext: {
        currentFactor: festivalContext.currentSeasonalFactor,
        upcomingFestivals: festivalContext.upcomingFestivals?.length || 0,
        nextMajor: festivalContext.nextMajorFestival?.name || 'None'
      },
      quickActions: generateQuickActions(aiInsights, inventoryStatus, festivalContext)
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      timestamp: new Date(),
      analysisQuality: aiInsights.dataQuality
    });

  } catch (error) {
    console.error('Error getting AI business dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI business intelligence',
      error: error.message
    });
  }
};

/**
 * Get specific AI analysis category
 */
const getSpecificAIAnalysis = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userId = req.user.id;
    const { category } = req.params;
    
    const validCategories = [
      'sales_prediction',
      'inventory_optimization', 
      'product_performance',
      'customer_behavior',
      'festival_preparation',
      'pricing_strategy',
      'business_insights'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid analysis category',
        validCategories
      });
    }

    // Get specific analysis with personalized data
    const options = {
      userId: userId,
      excludeCategories: validCategories.filter(c => c !== category)
    };

    const analysis = await aiBusinessIntelligenceService.getBusinessIntelligence(shopId, options);

    res.status(200).json({
      success: true,
      data: {
        category,
        analysis: analysis.insights[toCamelCase(category)],
        dataQuality: analysis.dataQuality,
        aiProvider: analysis.aiProvider
      }
    });

  } catch (error) {
    console.error('Error getting specific AI analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI analysis',
      error: error.message
    });
  }
};

/**
 * Get AI-powered product recommendations
 */
const getAIProductRecommendations = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { type = 'general' } = req.query; // general, festival, trending, etc.

    // Get AI insights focused on product recommendations
    const options = {
      includeOnly: ['product_performance', 'inventory_optimization', 'festival_preparation']
    };

    const aiInsights = await aiBusinessIntelligenceService.getBusinessIntelligence(shopId, options);
    
    // Extract and format product recommendations
    const recommendations = extractProductRecommendations(aiInsights, type);

    res.status(200).json({
      success: true,
      data: {
        type,
        recommendations,
        confidence: calculateRecommendationConfidence(aiInsights),
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting AI product recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product recommendations',
      error: error.message
    });
  }
};

/**
 * Get AI-powered sales forecasting
 */
const getAISalesForecasting = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { timeframe = '30', includeSeasonality = 'true' } = req.query;

    // Get AI insights focused on sales prediction
    const options = {
      includeOnly: ['sales_prediction', 'festival_preparation']
    };

    const aiInsights = await aiBusinessIntelligenceService.getBusinessIntelligence(shopId, options);
    
    // Get festival context for seasonal adjustments
    const festivalContext = await nepaliCalendarService.getFestivalIntelligence();

    // Format forecasting data
    const forecasting = {
      timeframe: `${timeframe} days`,
      predictions: aiInsights.insights.salesPrediction?.predictions || [],
      seasonalFactors: includeSeasonality === 'true' ? {
        currentFactor: festivalContext.currentSeasonalFactor,
        upcomingFestivals: festivalContext.upcomingFestivals?.map(f => ({
          name: f.name,
          daysUntil: f.daysUntil,
          expectedImpact: f.seasonalFactor
        })) || []
      } : null,
      confidence: aiInsights.insights.salesPrediction?.confidence || 'medium',
      recommendations: aiInsights.insights.salesPrediction?.recommendedActions || []
    };

    res.status(200).json({
      success: true,
      data: forecasting
    });

  } catch (error) {
    console.error('Error getting AI sales forecasting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales forecasting',
      error: error.message
    });
  }
};

/**
 * Get AI-powered inventory insights
 */
const getAIInventoryInsights = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    
    // Get AI insights focused on inventory
    const options = {
      includeOnly: ['inventory_optimization', 'product_performance']
    };

    const aiInsights = await aiBusinessIntelligenceService.getBusinessIntelligence(shopId, options);
    
    // Get current inventory status
    const inventoryStatus = await smartInventoryService.checkInventoryWithFestivalIntelligence(shopId);

    // Combine AI insights with current inventory data
    const inventoryInsights = {
      optimization: aiInsights.insights.inventoryOptimization,
      currentStatus: {
        lowStockItems: inventoryStatus.lowStockItems?.length || 0,
        festivalAdjustments: inventoryStatus.festivalIntelligence?.festivalAdjustedRecommendations || [],
        autoOrdersActive: inventoryStatus.autoOrdersTriggered || 0
      },
      aiRecommendations: aiInsights.insights.inventoryOptimization?.optimizations || [],
      productPerformance: aiInsights.insights.productPerformance,
      actionPriority: generateInventoryActionPriority(aiInsights, inventoryStatus)
    };

    res.status(200).json({
      success: true,
      data: inventoryInsights
    });

  } catch (error) {
    console.error('Error getting AI inventory insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory insights',
      error: error.message
    });
  }
};

/**
 * Get AI-powered customer behavior analysis
 */
const getAICustomerAnalysis = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    
    // Get AI insights focused on customer behavior
    const options = {
      includeOnly: ['customer_behavior', 'sales_prediction']
    };

    const aiInsights = await aiBusinessIntelligenceService.getBusinessIntelligence(shopId, options);

    const customerAnalysis = {
      behaviorPatterns: aiInsights.insights.customerBehavior?.patterns || [],
      demographics: aiInsights.insights.customerBehavior?.demographics || [],
      preferences: aiInsights.insights.customerBehavior?.preferences || [],
      loyaltyInsights: aiInsights.insights.customerBehavior?.loyaltyInsights || [],
      engagementSuggestions: aiInsights.insights.customerBehavior?.engagementSuggestions || [],
      confidence: aiInsights.insights.customerBehavior?.confidence || 'medium'
    };

    res.status(200).json({
      success: true,
      data: customerAnalysis
    });

  } catch (error) {
    console.error('Error getting AI customer analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer analysis',
      error: error.message
    });
  }
};

/**
 * Get AI-powered pricing recommendations
 */
const getAIPricingRecommendations = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    
    // Get AI insights focused on pricing
    const options = {
      includeOnly: ['pricing_strategy', 'product_performance', 'festival_preparation']
    };

    const aiInsights = await aiBusinessIntelligenceService.getBusinessIntelligence(shopId, options);
    
    // Get festival context for seasonal pricing
    const festivalContext = await nepaliCalendarService.getFestivalIntelligence();

    const pricingRecommendations = {
      strategies: aiInsights.insights.pricingStrategy?.strategies || [],
      optimizations: aiInsights.insights.pricingStrategy?.optimizations || [],
      seasonalAdjustments: {
        currentFactor: festivalContext.currentSeasonalFactor,
        recommendations: aiInsights.insights.pricingStrategy?.seasonalAdjustments || [],
        upcomingFestivals: festivalContext.upcomingFestivals?.map(f => ({
          festival: f.name,
          suggestedPriceAdjustment: calculatePriceAdjustment(f.seasonalFactor),
          daysUntil: f.daysUntil
        })) || []
      },
      profitImpact: aiInsights.insights.pricingStrategy?.profitImpact || 'Not calculated',
      confidence: aiInsights.insights.pricingStrategy?.confidence || 'medium'
    };

    res.status(200).json({
      success: true,
      data: pricingRecommendations
    });

  } catch (error) {
    console.error('Error getting AI pricing recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing recommendations',
      error: error.message
    });
  }
};

/**
 * Generate AI business report
 */
const generateAIBusinessReport = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { format = 'json', includeCharts = 'false' } = req.query;

    // Get comprehensive AI analysis
    const aiInsights = await aiBusinessIntelligenceService.getBusinessIntelligence(shopId);
    
    // Get supporting data
    const [inventoryStatus, festivalContext] = await Promise.all([
      smartInventoryService.checkInventoryWithFestivalIntelligence(shopId),
      nepaliCalendarService.getFestivalIntelligence()
    ]);

    // Generate comprehensive report
    const report = {
      reportId: generateReportId(),
      generatedAt: new Date(),
      shopId,
      reportType: 'AI Business Intelligence Report',
      
      executiveSummary: generateExecutiveSummary(aiInsights, inventoryStatus, festivalContext),
      
      sections: {
        salesAnalysis: aiInsights.insights.salesPrediction,
        inventoryOptimization: aiInsights.insights.inventoryOptimization,
        productPerformance: aiInsights.insights.productPerformance,
        customerInsights: aiInsights.insights.customerBehavior,
        festivalIntelligence: aiInsights.insights.festivalPreparation,
        pricingStrategy: aiInsights.insights.pricingStrategy,
        businessRecommendations: aiInsights.insights.businessRecommendations
      },
      
      actionItems: generateActionItems(aiInsights),
      
      dataQuality: aiInsights.dataQuality,
      
      disclaimer: 'This report is generated by AI and should be used as guidance alongside business judgment.'
    };

    if (format === 'pdf') {
      // In a real implementation, you'd generate a PDF here
      res.status(501).json({
        success: false,
        message: 'PDF generation not yet implemented',
        availableFormats: ['json']
      });
    } else {
      res.status(200).json({
        success: true,
        data: report
      });
    }

  } catch (error) {
    console.error('Error generating AI business report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate business report',
      error: error.message
    });
  }
};

// Helper functions

function generateQuickActions(aiInsights, inventoryStatus, festivalContext) {
  const actions = [];
  
  // Inventory-based actions
  if (inventoryStatus.lowStockItems?.length > 0) {
    actions.push({
      type: 'inventory',
      priority: 'high',
      action: `Restock ${inventoryStatus.lowStockItems.length} low-stock items`,
      category: 'immediate'
    });
  }
  
  // Festival-based actions
  if (festivalContext.nextMajorFestival && festivalContext.nextMajorFestival.daysUntil <= 30) {
    actions.push({
      type: 'festival',
      priority: 'high', 
      action: `Prepare for ${festivalContext.nextMajorFestival.name} (${festivalContext.nextMajorFestival.daysUntil} days)`,
      category: 'preparation'
    });
  }
  
  // AI recommendation-based actions
  const businessRecs = aiInsights.insights?.businessRecommendations?.quickWins || [];
  businessRecs.slice(0, 2).forEach(rec => {
    actions.push({
      type: 'ai_recommendation',
      priority: 'medium',
      action: rec,
      category: 'optimization'
    });
  });
  
  return actions.slice(0, 5); // Limit to top 5 actions
}

function extractProductRecommendations(aiInsights, type) {
  const recommendations = [];
  
  // Extract from different AI insight categories
  if (aiInsights.insights.productPerformance?.recommendations) {
    recommendations.push(...aiInsights.insights.productPerformance.recommendations);
  }
  
  if (aiInsights.insights.inventoryOptimization?.priorityItems) {
    recommendations.push(...aiInsights.insights.inventoryOptimization.priorityItems);
  }
  
  if (type === 'festival' && aiInsights.insights.festivalPreparation?.stockingRecommendations) {
    recommendations.push(...aiInsights.insights.festivalPreparation.stockingRecommendations);
  }
  
  return recommendations.slice(0, 10); // Limit recommendations
}

function calculateRecommendationConfidence(aiInsights) {
  const confidences = Object.values(aiInsights.insights)
    .map(insight => insight?.confidence)
    .filter(c => c);
    
  if (confidences.length === 0) return 'medium';
  
  const highCount = confidences.filter(c => c === 'high').length;
  const mediumCount = confidences.filter(c => c === 'medium').length;
  
  if (highCount > mediumCount) return 'high';
  if (mediumCount > 0) return 'medium';
  return 'low';
}

function generateInventoryActionPriority(aiInsights, inventoryStatus) {
  const priorities = [];
  
  // Critical stock items
  if (inventoryStatus.lowStockItems?.length > 0) {
    priorities.push({
      priority: 1,
      action: 'Restock critical items',
      count: inventoryStatus.lowStockItems.length
    });
  }
  
  // AI optimization suggestions
  const optimizations = aiInsights.insights.inventoryOptimization?.priorityItems || [];
  optimizations.forEach((opt, index) => {
    priorities.push({
      priority: index + 2,
      action: opt,
      type: 'ai_optimization'
    });
  });
  
  return priorities.slice(0, 5);
}

function calculatePriceAdjustment(seasonalFactor) {
  const baseAdjustment = (seasonalFactor - 1) * 0.5; // Conservative adjustment
  return `${baseAdjustment > 0 ? '+' : ''}${(baseAdjustment * 100).toFixed(1)}%`;
}

function generateExecutiveSummary(aiInsights, inventoryStatus, festivalContext) {
  return {
    overview: `AI analysis of your business performance and recommendations`,
    keyFindings: [
      `${inventoryStatus.lowStockItems?.length || 0} items need immediate restocking`,
      `Next major festival: ${festivalContext.nextMajorFestival?.name || 'None'} affecting business by ${festivalContext.currentSeasonalFactor}x`,
      `Data quality: ${aiInsights.dataQuality?.level || 'fair'} - ${aiInsights.dataQuality?.score?.toFixed(0) || 'N/A'}%`
    ],
    topRecommendations: aiInsights.insights.businessRecommendations?.strategicRecommendations?.slice(0, 3) || []
  };
}

function generateActionItems(aiInsights) {
  const actionItems = [];
  
  Object.values(aiInsights.insights).forEach(insight => {
    if (insight?.recommendedActions) {
      actionItems.push(...insight.recommendedActions);
    }
    if (insight?.recommendations) {
      actionItems.push(...insight.recommendations);
    }
  });
  
  return [...new Set(actionItems)].slice(0, 10); // Remove duplicates and limit
}

function generateReportId() {
  return `AIR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

module.exports = {
  getAIBusinessDashboard,
  getSpecificAIAnalysis,
  getAIProductRecommendations,
  getAISalesForecasting,
  getAIInventoryInsights,
  getAICustomerAnalysis,
  getAIPricingRecommendations,
  generateAIBusinessReport
};
