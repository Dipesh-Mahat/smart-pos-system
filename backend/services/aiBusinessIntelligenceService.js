/**
 * AI Business Intelligence Service
 * Provides AI-powered business analytics using Google Gemini API
 * Perfect for college projects with generous free tier limits
 */

const axios = require('axios');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const AutoOrder = require('../models/AutoOrder');
const nepaliCalendarService = require('./nepaliCalendarService');

class AIBusinessIntelligenceService {
  constructor() {
    // Google Gemini API configuration
    this.geminiConfig = {
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 1000,
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7
    };
    
    // Cache for AI responses (1 hour for free tier optimization)
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
    
    // Business intelligence categories
    this.analysisCategories = {
      SALES_PREDICTION: 'sales_prediction',
      INVENTORY_OPTIMIZATION: 'inventory_optimization',
      CUSTOMER_BEHAVIOR: 'customer_behavior',
      FESTIVAL_PREPARATION: 'festival_preparation',
      PRODUCT_PERFORMANCE: 'product_performance',
      PRICING_STRATEGY: 'pricing_strategy',
      BUSINESS_INSIGHTS: 'business_insights'
    };
  }

  /**
   * Check if Gemini API is available
   * @returns {Boolean} API availability status
   */
  isGeminiAvailable() {
    return !!(this.geminiConfig.apiKey);
  }

  /**
   * Get active AI provider (for compatibility with tests)
   * @returns {String} Active provider name
   */
  getActiveProvider() {
    if (this.isGeminiAvailable()) {
      return 'Gemini';
    }
    return 'Fallback';
  }

  /**
   * Get AI-powered business insights for a shop
   * @param {String} shopId - Shop identifier
   * @param {Object} options - Analysis options
   * @returns {Object} Comprehensive AI analysis
   */
  async getBusinessIntelligence(shopId, options = {}) {
    try {
      // Handle mock data for testing
      if (options.mockData) {
        const businessData = options.mockData;
        const insights = await this.generateMockInsights(businessData);
        return {
          success: true,
          aiProvider: 'Mock',
          insights,
          dataQuality: this.assessDataQuality(businessData),
          timestamp: new Date()
        };
      }
      
      // Collect comprehensive business data
      const businessData = await this.collectBusinessData(shopId);
      
      // Assess data quality
      const dataQuality = this.assessDataQuality(businessData);
      
      // Check if we have sufficient data
      if (dataQuality.level === 'insufficient') {
        return {
          success: false,
          error: 'Insufficient data for AI analysis',
          dataQuality,
          fallbackRecommendations: this.generateFallbackRecommendations(businessData)
        };
      }
      
      // Get festival context
      const festivalContext = await nepaliCalendarService.getFestivalIntelligence();
      
      // Generate AI insights if Gemini is available
      if (this.isGeminiAvailable()) {
        const insights = await this.generateAIInsights(businessData, festivalContext, options);
        return {
          success: true,
          aiProvider: 'Gemini',
          insights,
          dataQuality,
          timestamp: new Date()
        };
      } else {
        // Use fallback recommendations
        return {
          success: true,
          aiProvider: 'Fallback',
          fallbackRecommendations: this.generateFallbackRecommendations(businessData),
          dataQuality,
          timestamp: new Date()
        };
      }
      
    } catch (error) {
      console.error('AI Business Intelligence Error:', error);
      throw error;
    }
  }

  /**
   * Generate AI insights using Gemini
   * @param {Object} businessData - Business data
   * @param {Object} festivalContext - Festival context
   * @param {Object} options - Analysis options
   * @returns {Object} AI insights
   */
  async generateAIInsights(businessData, festivalContext, options = {}) {
    const insights = {};
    
    // Sales prediction analysis
    if (!options.excludeCategories?.includes(this.analysisCategories.SALES_PREDICTION)) {
      insights.salesPrediction = await this.generateSalesPrediction(businessData, festivalContext);
    }
    
    // Inventory optimization
    if (!options.excludeCategories?.includes(this.analysisCategories.INVENTORY_OPTIMIZATION)) {
      insights.inventoryOptimization = await this.generateInventoryOptimization(businessData, festivalContext);
    }
    
    // Product performance analysis
    if (!options.excludeCategories?.includes(this.analysisCategories.PRODUCT_PERFORMANCE)) {
      insights.productPerformance = await this.analyzeProductPerformance(businessData);
    }
    
    // Festival preparation insights
    if (!options.excludeCategories?.includes(this.analysisCategories.FESTIVAL_PREPARATION)) {
      insights.festivalPreparation = await this.generateFestivalInsights(businessData, festivalContext);
    }
    
    // Customer behavior analysis
    if (!options.excludeCategories?.includes(this.analysisCategories.CUSTOMER_BEHAVIOR)) {
      insights.customerBehavior = await this.analyzeCustomerBehavior(businessData);
    }
    
    // Pricing strategy recommendations
    if (!options.excludeCategories?.includes(this.analysisCategories.PRICING_STRATEGY)) {
      insights.pricingStrategy = await this.generatePricingStrategy(businessData, festivalContext);
    }
    
    // Overall business recommendations
    insights.businessRecommendations = await this.generateBusinessRecommendations(businessData, festivalContext, insights);
    
    return insights;
  }

  /**
   * Generate mock insights for testing
   * @param {Object} businessData - Business data
   * @returns {Object} Mock insights
   */
  async generateMockInsights(businessData) {
    return {
      salesPrediction: {
        predictions: ['Expected 15% revenue increase next month'],
        confidence: 'high'
      },
      inventoryOptimization: {
        optimizations: ['Reduce slow-moving inventory by 25%'],
        confidence: 'medium'
      },
      productPerformance: {
        topPerformers: ['Electronics products showing strong growth'],
        confidence: 'high'
      }
    };
  }

  /**
   * Collect comprehensive business data for AI analysis
   * @param {String} shopId - Shop identifier
   * @returns {Object} Business data
   */
  async collectBusinessData(shopId) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      
      // Get all business data
      const [products, orders, transactions, autoOrders] = await Promise.all([
        Product.find({ shopId }).lean(),
        Order.find({ 
          shopId, 
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed' 
        }).lean(),
        Transaction.find({ 
          shopId, 
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed' 
        }).lean(),
        AutoOrder.find({ shopId }).lean()
      ]);

      // Calculate business metrics
      const metrics = this.calculateBusinessMetrics(products, orders, transactions);
      
      return {
        products,
        orders,
        transactions,
        autoOrders,
        metrics,
        collectedAt: new Date()
      };
    } catch (error) {
      console.error('Error collecting business data:', error);
      throw error;
    }
  }

  /**
   * Calculate key business metrics
   */
  calculateBusinessMetrics(products, orders, transactions) {
    // Handle both object and separate parameter calls
    if (typeof products === 'object' && products !== null && !Array.isArray(products)) {
      // Called with business data object
      const businessData = products;
      products = businessData.products || [];
      orders = businessData.orders || [];
      transactions = businessData.transactions || [];
    }
    
    // Ensure arrays are valid
    const validProducts = Array.isArray(products) ? products : [];
    const validOrders = Array.isArray(orders) ? orders : [];
    const validTransactions = Array.isArray(transactions) ? transactions : [];
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Filter recent data
    const recentOrders = validOrders.filter(o => o && o.createdAt && new Date(o.createdAt) >= thirtyDaysAgo);
    const recentTransactions = validTransactions.filter(t => t && t.createdAt && new Date(t.createdAt) >= thirtyDaysAgo);
    
    // Calculate metrics
    const totalProducts = validProducts.length;
    const totalRevenue = recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const averageOrderValue = recentOrders.length > 0 ? 
      recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / recentOrders.length : 0;
    
    const lowStockProducts = validProducts.filter(p => p && p.quantity !== undefined && p.quantity <= 10).length;
    const topSellingProducts = this.getTopSellingProducts(validProducts, recentTransactions);
    
    return {
      totalProducts,
      totalRevenue,
      averageOrderValue,
      lowStockProducts,
      topSellingProducts,
      dailyAverageRevenue: totalRevenue / 30,
      inventoryTurnover: this.calculateInventoryTurnover(validProducts, recentOrders),
      orderFrequency: recentOrders.length / 30
    };
  }

  /**
   * Generate AI-powered sales prediction
   */
  async generateSalesPrediction(businessData, festivalContext) {
    try {
      const prompt = this.buildSalesPredictionPrompt(businessData, festivalContext);
      const aiResponse = await this.callGeminiAPI(prompt, 'sales_prediction');
      
      return {
        ...aiResponse,
        confidence: 'high',
        dataPoints: businessData.orders?.length || 0,
        analysisDate: new Date()
      };
    } catch (error) {
      console.error('Error generating sales prediction:', error);
      return this.getFallbackSalesPrediction(businessData);
    }
  }

  /**
   * Generate inventory optimization recommendations
   */
  async generateInventoryOptimization(businessData, festivalContext) {
    try {
      const prompt = this.buildInventoryOptimizationPrompt(businessData, festivalContext);
      const aiResponse = await this.callGeminiAPI(prompt, 'inventory_optimization');
      
      return {
        ...aiResponse,
        confidence: 'high',
        lowStockItems: businessData.metrics?.lowStockProducts || 0,
        analysisDate: new Date()
      };
    } catch (error) {
      console.error('Error generating inventory optimization:', error);
      return this.getFallbackInventoryOptimization(businessData);
    }
  }

  /**
   * Analyze product performance
   */
  async analyzeProductPerformance(businessData) {
    try {
      const prompt = this.buildProductPerformancePrompt(businessData);
      const aiResponse = await this.callGeminiAPI(prompt, 'product_performance');
      
      return {
        ...aiResponse,
        confidence: 'medium',
        totalProducts: businessData.products?.length || 0,
        analysisDate: new Date()
      };
    } catch (error) {
      console.error('Error analyzing product performance:', error);
      return this.getFallbackProductPerformance(businessData);
    }
  }

  /**
   * Generate festival-specific insights
   */
  async generateFestivalInsights(businessData, festivalContext) {
    try {
      const prompt = this.buildFestivalInsightsPrompt(businessData, festivalContext);
      const aiResponse = await this.callGeminiAPI(prompt, 'festival_preparation');
      
      return {
        ...aiResponse,
        confidence: 'high',
        upcomingFestival: festivalContext.upcomingFestivals?.[0]?.name || 'None',
        analysisDate: new Date()
      };
    } catch (error) {
      console.error('Error generating festival insights:', error);
      return this.getFallbackFestivalInsights(festivalContext);
    }
  }

  /**
   * Analyze customer behavior patterns
   */
  async analyzeCustomerBehavior(businessData) {
    try {
      const prompt = this.buildCustomerBehaviorPrompt(businessData);
      const aiResponse = await this.callGeminiAPI(prompt, 'customer_behavior');
      
      return {
        ...aiResponse,
        confidence: 'medium',
        orderCount: businessData.orders?.length || 0,
        analysisDate: new Date()
      };
    } catch (error) {
      console.error('Error analyzing customer behavior:', error);
      return this.getFallbackCustomerBehavior(businessData);
    }
  }

  /**
   * Generate pricing strategy recommendations
   */
  async generatePricingStrategy(businessData, festivalContext) {
    try {
      const prompt = this.buildPricingStrategyPrompt(businessData, festivalContext);
      const aiResponse = await this.callGeminiAPI(prompt, 'pricing_strategy');
      
      return {
        ...aiResponse,
        confidence: 'medium',
        avgOrderValue: businessData.metrics?.averageOrderValue || 0,
        analysisDate: new Date()
      };
    } catch (error) {
      console.error('Error generating pricing strategy:', error);
      return this.getFallbackPricingStrategy(businessData);
    }
  }

  /**
   * Generate comprehensive business recommendations
   */
  async generateBusinessRecommendations(businessData, festivalContext, insights) {
    try {
      const prompt = this.buildBusinessRecommendationsPrompt(businessData, festivalContext, insights);
      const aiResponse = await this.callGeminiAPI(prompt, 'business_insights');
      
      return {
        ...aiResponse,
        confidence: 'high',
        analysisScope: Object.keys(insights).length,
        analysisDate: new Date()
      };
    } catch (error) {
      console.error('Error generating business recommendations:', error);
      return this.getFallbackBusinessRecommendations(businessData);
    }
  }

  /**
   * Call Gemini API for AI analysis
   * @param {String} prompt - Analysis prompt
   * @param {String} category - Analysis category
   * @returns {Object} AI response
   */
  async callGeminiAPI(prompt, category) {
    if (!this.isGeminiAvailable()) {
      throw new Error('Gemini API key not configured');
    }

    const cacheKey = `${category}_${this.hashPrompt(prompt)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`Using cached AI response for ${category}`);
        return cached.data;
      }
    }

    try {
      const response = await axios.post(
        `${this.geminiConfig.baseURL}/models/${this.geminiConfig.model}:generateContent?key=${this.geminiConfig.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: this.geminiConfig.temperature,
            maxOutputTokens: this.geminiConfig.maxTokens
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiText = response.data.candidates[0].content.parts[0].text;
        const parsedResponse = this.parseAIResponse(aiText, category);
        
        // Cache the response
        this.cache.set(cacheKey, {
          data: parsedResponse,
          timestamp: Date.now()
        });
        
        return parsedResponse;
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      console.error(`Gemini API Error for ${category}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(aiText, category) {
    try {
      // Try to parse as JSON first
      if (aiText.trim().startsWith('{')) {
        return JSON.parse(aiText);
      }
      
      // Otherwise, structure the text response
      const lines = aiText.split('\n').filter(line => line.trim());
      
      switch (category) {
        case 'sales_prediction':
          return {
            predictions: lines.filter(line => line.includes('predict') || line.includes('expect')),
            insights: lines.filter(line => line.includes('insight') || line.includes('trend')),
            actions: lines.filter(line => line.includes('recommend') || line.includes('should'))
          };
        
        case 'inventory_optimization':
          return {
            optimizations: lines.filter(line => line.includes('optim') || line.includes('stock')),
            savings: lines.find(line => line.includes('save') || line.includes('cost')),
            risks: lines.filter(line => line.includes('risk') || line.includes('warning')),
            priorities: lines.filter(line => line.includes('priority') || line.includes('urgent'))
          };
        
        default:
          return {
            insights: lines.slice(0, 3),
            recommendations: lines.slice(3, 6),
            summary: lines[0] || 'AI analysis completed'
          };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return {
        insights: [aiText.substring(0, 200) + '...'],
        summary: 'AI analysis completed with partial results'
      };
    }
  }

  /**
   * Build sales prediction prompt
   */
  buildSalesPredictionPrompt(businessData, festivalContext) {
    const metrics = businessData.metrics || {};
    const upcomingFestival = festivalContext.upcomingFestivals?.[0];
    
    return `
Analyze sales data for a small business in Nepal and provide sales predictions:

Business Data:
- Total Revenue (30 days): NPR ${metrics.totalRevenue || 0}
- Average Order Value: NPR ${metrics.averageOrderValue || 0}
- Daily Orders: ${metrics.orderFrequency || 0}
- Total Products: ${metrics.totalProducts || 0}
- Product Categories: Electronics, Cosmetics, Food, Household items

Festival Context:
- Upcoming Festival: ${upcomingFestival?.name || 'None'}
- Days Until Festival: ${upcomingFestival?.daysUntil || 'N/A'}

Please provide:
1. Sales predictions for next month
2. Key insights about current trends
3. Actionable recommendations

Focus on Nepal's market context and cultural factors. Provide specific, practical advice for a small POS business.
`;
  }

  /**
   * Build inventory optimization prompt
   */
  buildInventoryOptimizationPrompt(businessData, festivalContext) {
    const metrics = businessData.metrics || {};
    const products = businessData.products || [];
    const lowStockItems = products.filter(p => p.quantity <= 10);
    
    return `
Analyze inventory for a small business in Nepal and provide optimization recommendations:

Inventory Status:
- Total Products: ${products.length}
- Low Stock Items: ${lowStockItems.length}
- Inventory Turnover: ${metrics.inventoryTurnover || 0}
- Categories: Electronics, Cosmetics, Food, Household, Snacks, Beverages

Festival Context:
- Upcoming Festival: ${festivalContext.upcomingFestivals?.[0]?.name || 'None'}
- Festival Preparation: ${festivalContext.upcomingFestivals?.[0]?.daysUntil || 'N/A'} days

Please provide:
1. Inventory optimization strategies
2. Cost reduction opportunities
3. Stock level recommendations
4. Festival preparation advice

Focus on Nepal's seasonal patterns and festival shopping behaviors.
`;
  }

  /**
   * Build product performance prompt
   */
  buildProductPerformancePrompt(businessData) {
    const products = businessData.products || [];
    const topProducts = businessData.metrics?.topSellingProducts || [];
    
    return `
Analyze product performance for a Nepal-based retail business:

Product Portfolio:
- Total Products: ${products.length}
- Categories: Electronics, Cosmetics, Food, Household items
- Top Performers: ${topProducts.slice(0, 3).map(p => p.name).join(', ')}

Sales Context:
- Revenue: NPR ${businessData.metrics?.totalRevenue || 0}
- Average Order: NPR ${businessData.metrics?.averageOrderValue || 0}

Please analyze:
1. Top performing products and why
2. Underperforming products that need attention
3. Product mix optimization recommendations
4. Pricing insights

Consider Nepal's consumer preferences and market trends.
`;
  }

  /**
   * Build festival insights prompt
   */
  buildFestivalInsightsPrompt(businessData, festivalContext) {
    const upcomingFestival = festivalContext.upcomingFestivals?.[0];
    
    return `
Provide festival-specific business insights for a Nepal retail business:

Upcoming Festival: ${upcomingFestival?.name || 'None'}
Days Until Festival: ${upcomingFestival?.daysUntil || 'N/A'}
Festival Type: ${upcomingFestival?.type || 'Cultural'}

Current Business:
- Monthly Revenue: NPR ${businessData.metrics?.totalRevenue || 0}
- Product Categories: Electronics, Cosmetics, Food, Household

Festival Intelligence Needed:
1. Festival-specific inventory recommendations
2. Expected demand patterns
3. Marketing and promotion strategies
4. Cultural considerations for product placement

Focus on authentic Nepal festival traditions and shopping patterns.
`;
  }

  /**
   * Build customer behavior prompt
   */
  buildCustomerBehaviorPrompt(businessData) {
    const orders = businessData.orders || [];
    const metrics = businessData.metrics || {};
    
    return `
Analyze customer behavior patterns for a Nepal retail business:

Customer Data:
- Total Orders (30 days): ${orders.length}
- Average Order Value: NPR ${metrics.averageOrderValue || 0}
- Daily Order Frequency: ${metrics.orderFrequency || 0}
- Peak Categories: Electronics, Cosmetics, Food

Analyze:
1. Customer purchasing patterns
2. Peak shopping times and seasons
3. Product bundling opportunities
4. Customer loyalty indicators
5. Upselling and cross-selling opportunities

Consider Nepal's shopping culture and economic patterns.
`;
  }

  /**
   * Build pricing strategy prompt
   */
  buildPricingStrategyPrompt(businessData, festivalContext) {
    const metrics = businessData.metrics || {};
    
    return `
Develop pricing strategy for a Nepal retail business:

Current Performance:
- Average Order Value: NPR ${metrics.averageOrderValue || 0}
- Monthly Revenue: NPR ${metrics.totalRevenue || 0}
- Product Mix: Electronics, Cosmetics, Food, Household

Market Context:
- Location: Nepal
- Business Type: Small retail/POS
- Festival Season: ${festivalContext.upcomingFestivals?.[0]?.name || 'Regular period'}

Pricing Strategy Needed:
1. Competitive pricing recommendations
2. Festival pricing adjustments
3. Bulk purchase incentives
4. Margin optimization strategies

Focus on Nepal's price sensitivity and purchasing power.
`;
  }

  /**
   * Build business recommendations prompt
   */
  buildBusinessRecommendationsPrompt(businessData, festivalContext, insights) {
    const metrics = businessData.metrics || {};
    const categories = Object.keys(insights);
    
    return `
Provide comprehensive business recommendations for a Nepal retail business:

Business Overview:
- Monthly Revenue: NPR ${metrics.totalRevenue || 0}
- Total Products: ${metrics.totalProducts || 0}
- Analysis Categories: ${categories.join(', ')}

Context:
- Location: Nepal
- Business Type: Small retail with POS system
- Market: Local community + festival shoppers

Previous Analysis Insights:
${categories.map(cat => `- ${cat}: Available`).join('\n')}

Provide Strategic Recommendations:
1. Top 3 immediate actions to increase revenue
2. Long-term growth strategies
3. Technology and system improvements
4. Market expansion opportunities
5. Risk mitigation strategies

Focus on practical, actionable advice for Nepal's small business environment.
`;
  }

  /**
   * Generate hash for prompt caching
   */
  hashPrompt(prompt) {
    return prompt.length.toString() + prompt.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Assess data quality for AI analysis
   */
  assessDataQuality(businessData) {
    const products = businessData.products || [];
    const orders = businessData.orders || [];
    const transactions = businessData.transactions || [];
    
    let score = 0;
    const recommendations = [];
    
    // Product data quality (25 points)
    if (products.length >= 10) score += 25;
    else if (products.length >= 5) score += 15;
    else if (products.length >= 1) score += 10;
    else recommendations.push('Add more products to your inventory');
    
    // Order data quality (35 points)
    if (orders.length >= 50) score += 35;
    else if (orders.length >= 20) score += 25;
    else if (orders.length >= 10) score += 15;
    else if (orders.length >= 1) score += 5;
    else recommendations.push('Need more sales data for accurate predictions');
    
    // Transaction data quality (25 points)
    if (transactions.length >= 50) score += 25;
    else if (transactions.length >= 20) score += 15;
    else if (transactions.length >= 10) score += 10;
    else if (transactions.length >= 1) score += 5;
    else recommendations.push('Complete transaction records needed');
    
    // Data completeness (15 points)
    const hasCompleteProducts = products.every(p => p.name && p.price && p.category);
    const hasCompleteOrders = orders.every(o => o.totalAmount && o.createdAt);
    
    if (hasCompleteProducts && hasCompleteOrders) score += 15;
    else if (hasCompleteProducts || hasCompleteOrders) score += 10;
    else recommendations.push('Improve data completeness for better insights');
    
    // Determine quality level
    let level;
    if (score >= 80) level = 'excellent';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    else if (score >= 20) level = 'poor';
    else level = 'insufficient';
    
    return {
      score,
      level,
      recommendations,
      dataPoints: {
        products: products.length,
        orders: orders.length,
        transactions: transactions.length
      }
    };
  }

  /**
   * Generate fallback recommendations when AI is unavailable
   */
  generateFallbackRecommendations(businessData) {
    const metrics = businessData.metrics || {};
    const products = businessData.products || [];
    
    const basicRecommendations = [];
    const inventoryAlerts = [];
    const salesInsights = [];
    
    // Basic inventory recommendations
    if (metrics.lowStockProducts > 0) {
      inventoryAlerts.push(`${metrics.lowStockProducts} products are running low on stock`);
      basicRecommendations.push('Review and reorder low stock items');
    }
    
    // Sales insights
    if (metrics.totalRevenue > 0) {
      salesInsights.push(`Monthly revenue: NPR ${metrics.totalRevenue.toFixed(2)}`);
      salesInsights.push(`Average order value: NPR ${metrics.averageOrderValue.toFixed(2)}`);
    }
    
    // Basic business recommendations
    if (products.length < 20) {
      basicRecommendations.push('Consider expanding your product catalog');
    }
    
    if (metrics.orderFrequency < 5) {
      basicRecommendations.push('Focus on customer acquisition and marketing');
    }
    
    basicRecommendations.push('Monitor inventory levels regularly');
    basicRecommendations.push('Track customer preferences and buying patterns');
    basicRecommendations.push('Plan for upcoming festivals and seasons');
    
    return {
      basicRecommendations,
      inventoryAlerts,
      salesInsights,
      note: 'These are basic recommendations. Configure Gemini API key for advanced AI insights.'
    };
  }

  /**
   * Get fallback sales prediction
   */
  getFallbackSalesPrediction(businessData) {
    return {
      predictions: [
        'Based on current trends, maintain steady sales growth',
        'Monitor seasonal patterns for better predictions',
        'Track customer behavior for improved forecasting'
      ],
      confidence: 'low',
      note: 'Enable Gemini AI for detailed sales predictions'
    };
  }

  /**
   * Get fallback inventory optimization
   */
  getFallbackInventoryOptimization(businessData) {
    return {
      optimizations: [
        'Review slow-moving items weekly',
        'Maintain 2-week safety stock for popular items',
        'Use seasonal demand patterns for ordering'
      ],
      confidence: 'low',
      note: 'Enable Gemini AI for advanced inventory optimization'
    };
  }

  /**
   * Get fallback product performance
   */
  getFallbackProductPerformance(businessData) {
    return {
      insights: [
        'Track top-selling products daily',
        'Monitor profit margins by category',
        'Review underperforming products monthly'
      ],
      confidence: 'low',
      note: 'Enable Gemini AI for detailed product analysis'
    };
  }

  /**
   * Get fallback festival insights
   */
  getFallbackFestivalInsights(festivalContext) {
    const upcoming = festivalContext.upcomingFestivals?.[0];
    return {
      insights: [
        `Prepare for ${upcoming?.name || 'upcoming festivals'}`,
        'Stock festival-specific items in advance',
        'Plan special promotions and offers'
      ],
      confidence: 'low',
      note: 'Enable Gemini AI for detailed festival preparation'
    };
  }

  /**
   * Get fallback customer behavior
   */
  getFallbackCustomerBehavior(businessData) {
    return {
      insights: [
        'Monitor peak shopping hours',
        'Track customer purchase frequency',
        'Identify repeat customers'
      ],
      confidence: 'low',
      note: 'Enable Gemini AI for advanced customer analysis'
    };
  }

  /**
   * Get fallback pricing strategy
   */
  getFallbackPricingStrategy(businessData) {
    return {
      recommendations: [
        'Research competitor prices regularly',
        'Adjust prices for festivals and seasons',
        'Offer bulk purchase discounts'
      ],
      confidence: 'low',
      note: 'Enable Gemini AI for dynamic pricing strategies'
    };
  }

  /**
   * Get fallback business recommendations
   */
  getFallbackBusinessRecommendations(businessData) {
    return {
      recommendations: [
        'Focus on customer service excellence',
        'Maintain accurate inventory records',
        'Plan for seasonal demand changes',
        'Monitor cash flow regularly'
      ],
      confidence: 'low',
      note: 'Enable Gemini AI for comprehensive business insights'
    };
  }

  /**
   * Helper method to get top selling products
   */
  getTopSellingProducts(products, transactions) {
    // Simple implementation - in real scenario, would analyze transaction items
    return products.slice(0, 5).map(product => ({
      id: product._id,
      name: product.name,
      category: product.category,
      sales: Math.floor(Math.random() * 100) // Mock sales data
    }));
  }

  /**
   * Calculate inventory turnover
   */
  calculateInventoryTurnover(products, orders) {
    if (!products.length || !orders.length) return 0;
    
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalSalesValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    return totalInventoryValue > 0 ? (totalSalesValue / totalInventoryValue) : 0;
  }
}

module.exports = new AIBusinessIntelligenceService();
