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
const aiDataCollectionService = require('./aiDataCollectionService');

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
      
      // Collect comprehensive business data using the new service
      console.log('Collecting comprehensive business data...');
      const comprehensiveData = await aiDataCollectionService.collectComprehensiveData(shopId, options.userId);
      
      // Check if we have sufficient data
      if (comprehensiveData.dataQuality.level === 'poor') {
        return {
          success: false,
          error: 'Insufficient data for AI analysis',
          dataQuality: comprehensiveData.dataQuality,
          fallbackRecommendations: this.generatePersonalizedFallbackRecommendations(comprehensiveData)
        };
      }
      
      // Get festival context
      const festivalContext = await nepaliCalendarService.getFestivalIntelligence();
      
      // Generate AI insights if Gemini is available
      if (this.isGeminiAvailable()) {
        const insights = await this.generatePersonalizedAIInsights(comprehensiveData, festivalContext, options);
        return {
          success: true,
          aiProvider: 'Gemini',
          insights,
          dataQuality: comprehensiveData.dataQuality,
          businessProfile: comprehensiveData.businessProfile,
          timestamp: new Date()
        };
      } else {
        // Use enhanced fallback recommendations with real data
        return {
          success: true,
          aiProvider: 'Enhanced Fallback',
          insights: this.generatePersonalizedFallbackRecommendations(comprehensiveData),
          dataQuality: comprehensiveData.dataQuality,
          businessProfile: comprehensiveData.businessProfile,
          timestamp: new Date()
        };
      }
      
    } catch (error) {
      console.error('AI Business Intelligence Error:', error);
      throw error;
    }
  }

  /**
   * Generate personalized AI insights using comprehensive business data
   * @param {Object} comprehensiveData - Complete business data
   * @param {Object} festivalContext - Festival context
   * @param {Object} options - Analysis options
   * @returns {Object} Personalized AI insights
   */
  async generatePersonalizedAIInsights(comprehensiveData, festivalContext, options = {}) {
    const insights = {};
    
    // Sales prediction analysis with real data
    if (!options.excludeCategories?.includes(this.analysisCategories.SALES_PREDICTION)) {
      insights.salesPrediction = await this.generatePersonalizedSalesPrediction(comprehensiveData, festivalContext);
    }
    
    // Inventory optimization with real data
    if (!options.excludeCategories?.includes(this.analysisCategories.INVENTORY_OPTIMIZATION)) {
      insights.inventoryOptimization = await this.generatePersonalizedInventoryOptimization(comprehensiveData, festivalContext);
    }
    
    // Product performance analysis with real data
    if (!options.excludeCategories?.includes(this.analysisCategories.PRODUCT_PERFORMANCE)) {
      insights.productPerformance = await this.analyzePersonalizedProductPerformance(comprehensiveData);
    }
    
    // Customer behavior analysis with real data
    if (!options.excludeCategories?.includes(this.analysisCategories.CUSTOMER_BEHAVIOR)) {
      insights.customerBehavior = await this.analyzePersonalizedCustomerBehavior(comprehensiveData);
    }
    
    // Pricing strategy with real data
    if (!options.excludeCategories?.includes(this.analysisCategories.PRICING_STRATEGY)) {
      insights.pricingStrategy = await this.generatePersonalizedPricingStrategy(comprehensiveData);
    }
    
    // Business insights with real data
    if (!options.excludeCategories?.includes(this.analysisCategories.BUSINESS_INSIGHTS)) {
      insights.businessInsights = await this.generatePersonalizedBusinessInsights(comprehensiveData, festivalContext);
    }
    
    return insights;
  }

  /**
   * Generate personalized sales prediction using real business data
   */
  async generatePersonalizedSalesPrediction(comprehensiveData, festivalContext) {
    try {
      const { businessProfile, salesData, seasonalData } = comprehensiveData;
      
      // Build personalized prompt with real data
      const prompt = this.buildPersonalizedSalesPredictionPrompt(
        businessProfile, 
        salesData, 
        seasonalData, 
        festivalContext
      );
      
      if (this.isGeminiAvailable()) {
        const aiResponse = await this.callGeminiAPI(prompt, 'personalized_sales_prediction');
        return {
          ...aiResponse,
          confidence: this.calculateConfidenceLevel(salesData),
          dataPoints: salesData.recentSales.transactionCount,
          personalizedFactors: {
            businessType: businessProfile.business.type,
            recentTrend: salesData.trends.trend,
            seasonalFactor: seasonalData.seasonalTrends.seasonalityIndex || 1.0,
            upcomingFestivals: festivalContext.upcomingFestivals?.length || 0
          },
          analysisDate: new Date()
        };
      } else {
        return this.generatePersonalizedSalesFallback(comprehensiveData, festivalContext);
      }
    } catch (error) {
      console.error('Error generating personalized sales prediction:', error);
      return this.generatePersonalizedSalesFallback(comprehensiveData, festivalContext);
    }
  }

  /**
   * Generate personalized inventory optimization recommendations
   */
  async generatePersonalizedInventoryOptimization(comprehensiveData, festivalContext) {
    try {
      const { productData, inventoryData, salesData } = comprehensiveData;
      
      const prompt = this.buildPersonalizedInventoryPrompt(
        productData, 
        inventoryData, 
        salesData, 
        festivalContext
      );
      
      if (this.isGeminiAvailable()) {
        const aiResponse = await this.callGeminiAPI(prompt, 'personalized_inventory_optimization');
        return {
          ...aiResponse,
          confidence: 'high',
          urgentActions: this.identifyUrgentInventoryActions(inventoryData, productData),
          personalizedRecommendations: this.generateInventoryRecommendations(productData, salesData),
          costImpact: this.calculateInventoryCostImpact(inventoryData, productData)
        };
      } else {
        return this.generatePersonalizedInventoryFallback(comprehensiveData);
      }
    } catch (error) {
      console.error('Error generating personalized inventory optimization:', error);
      return this.generatePersonalizedInventoryFallback(comprehensiveData);
    }
  }

  /**
   * Analyze personalized product performance
   */
  async analyzePersonalizedProductPerformance(comprehensiveData) {
    try {
      const { productData, salesData } = comprehensiveData;
      
      const prompt = this.buildPersonalizedProductPerformancePrompt(productData, salesData);
      
      if (this.isGeminiAvailable()) {
        const aiResponse = await this.callGeminiAPI(prompt, 'personalized_product_performance');
        return {
          ...aiResponse,
          topPerformers: productData.performance.topSelling.slice(0, 5),
          underperformers: productData.performance.lowPerforming,
          profitOpportunities: this.identifyProfitOpportunities(productData),
          actionableInsights: this.generateProductActionItems(productData, salesData)
        };
      } else {
        return this.generatePersonalizedProductFallback(comprehensiveData);
      }
    } catch (error) {
      console.error('Error analyzing personalized product performance:', error);
      return this.generatePersonalizedProductFallback(comprehensiveData);
    }
  }

  /**
   * Analyze personalized customer behavior
   */
  async analyzePersonalizedCustomerBehavior(comprehensiveData) {
    try {
      const { customerData, salesData } = comprehensiveData;
      
      const prompt = this.buildPersonalizedCustomerBehaviorPrompt(customerData, salesData);
      
      if (this.isGeminiAvailable()) {
        const aiResponse = await this.callGeminiAPI(prompt, 'personalized_customer_behavior');
        return {
          ...aiResponse,
          customerSegments: customerData.customerSegments,
          retentionOpportunities: this.identifyRetentionOpportunities(customerData),
          loyaltyRecommendations: this.generateLoyaltyRecommendations(customerData),
          acquisitionStrategies: this.generateAcquisitionStrategies(customerData, salesData)
        };
      } else {
        return this.generatePersonalizedCustomerFallback(comprehensiveData);
      }
    } catch (error) {
      console.error('Error analyzing personalized customer behavior:', error);
      return this.generatePersonalizedCustomerFallback(comprehensiveData);
    }
  }

  /**
   * Generate personalized pricing strategy
   */
  async generatePersonalizedPricingStrategy(comprehensiveData) {
    try {
      const { productData, financialData, salesData } = comprehensiveData;
      
      const prompt = this.buildPersonalizedPricingPrompt(productData, financialData, salesData);
      
      if (this.isGeminiAvailable()) {
        const aiResponse = await this.callGeminiAPI(prompt, 'personalized_pricing_strategy');
        return {
          ...aiResponse,
          priceOptimizationOpportunities: this.identifyPriceOptimizationOpportunities(productData),
          marginImprovements: this.calculateMarginImprovements(productData, financialData),
          competitivePricing: this.generateCompetitivePricingInsights(productData),
          revenueImpact: this.calculatePricingRevenueImpact(productData, salesData)
        };
      } else {
        return this.generatePersonalizedPricingFallback(comprehensiveData);
      }
    } catch (error) {
      console.error('Error generating personalized pricing strategy:', error);
      return this.generatePersonalizedPricingFallback(comprehensiveData);
    }
  }

  /**
   * Generate personalized business insights
   */
  async generatePersonalizedBusinessInsights(comprehensiveData, festivalContext) {
    try {
      const { businessProfile, businessMetrics, financialData } = comprehensiveData;
      
      const prompt = this.buildPersonalizedBusinessInsightsPrompt(
        businessProfile, 
        businessMetrics, 
        financialData, 
        festivalContext
      );
      
      if (this.isGeminiAvailable()) {
        const aiResponse = await this.callGeminiAPI(prompt, 'personalized_business_insights');
        return {
          ...aiResponse,
          businessHealthScore: businessMetrics.businessHealth,
          growthOpportunities: this.identifyGrowthOpportunities(comprehensiveData),
          riskFactors: this.identifyRiskFactors(comprehensiveData),
          strategicRecommendations: this.generateStrategicRecommendations(comprehensiveData),
          nextSteps: this.generateNextSteps(comprehensiveData)
        };
      } else {
        return this.generatePersonalizedBusinessFallback(comprehensiveData, festivalContext);
      }
    } catch (error) {
      console.error('Error generating personalized business insights:', error);
      return this.generatePersonalizedBusinessFallback(comprehensiveData, festivalContext);
    }
  }

  /**
   * Generate personalized fallback recommendations using real data
   */
  generatePersonalizedFallbackRecommendations(comprehensiveData) {
    const { businessProfile, productData, salesData, inventoryData, customerData, financialData } = comprehensiveData;
    
    return {
      salesPrediction: this.generatePersonalizedSalesFallback(comprehensiveData),
      inventoryOptimization: this.generatePersonalizedInventoryFallback(comprehensiveData),
      productPerformance: this.generatePersonalizedProductFallback(comprehensiveData),
      customerBehavior: this.generatePersonalizedCustomerFallback(comprehensiveData),
      pricingStrategy: this.generatePersonalizedPricingFallback(comprehensiveData),
      businessInsights: this.generatePersonalizedBusinessFallback(comprehensiveData)
    };
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
      // Clean the response text
      let cleanText = aiText.trim();
      
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s*|\s*```/g, '');
      cleanText = cleanText.replace(/```\s*|\s*```/g, '');
      
      // Try to parse as JSON first
      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        const parsed = JSON.parse(cleanText);
        // Ensure we have the required insights array
        if (!parsed.insights && parsed.recommendations) {
          parsed.insights = parsed.recommendations;
        }
        if (!parsed.insights && parsed.predictions) {
          parsed.insights = parsed.predictions;
        }
        if (!parsed.insights && parsed.strategies) {
          parsed.insights = parsed.strategies;
        }
        return parsed;
      }
      
      // Otherwise, structure the text response intelligently
      const lines = aiText.split('\n').filter(line => line.trim());
      const insights = [];
      
      // Extract meaningful insights from text
      for (const line of lines) {
        const cleanLine = line.trim().replace(/^[•\-\*\d\.]+\s*/, '');
        if (cleanLine.length > 20 && !cleanLine.match(/^(please|provide|focus|analyze)/i)) {
          insights.push(cleanLine);
        }
      }
      
      // Category-specific parsing for personalized responses
      switch (category) {
        case 'personalized_sales_prediction':
        case 'sales_prediction':
          return {
            insights: insights.slice(0, 4),
            nextMonthRevenue: this.extractNumber(aiText, 'revenue'),
            confidenceLevel: this.extractConfidence(aiText),
            keyDrivers: this.extractKeyDrivers(aiText),
            personalizedActions: insights.filter(line => line.includes('recommend') || line.includes('should')).slice(0, 3)
          };
        
        case 'personalized_inventory_optimization':
        case 'inventory_optimization':
          return {
            insights: insights.slice(0, 4),
            urgentActions: insights.filter(line => line.includes('urgent') || line.includes('immediate')).slice(0, 2),
            costSavings: this.extractNumber(aiText, 'saving'),
            reorderRecommendations: insights.filter(line => line.includes('reorder') || line.includes('stock')).slice(0, 3),
            confidence: 'medium'
          };
          
        case 'personalized_customer_behavior':
        case 'customer_behavior':
          return {
            insights: insights.slice(0, 4),
            retentionOpportunities: insights.filter(line => line.includes('retention') || line.includes('loyal')).slice(0, 2),
            loyaltyRecommendations: insights.filter(line => line.includes('loyalty') || line.includes('reward')).slice(0, 2),
            acquisitionStrategies: insights.filter(line => line.includes('new customer') || line.includes('acquisition')).slice(0, 2),
            confidence: 'medium'
          };
          
        case 'personalized_pricing_strategy':
        case 'pricing_strategy':
          return {
            insights: insights.slice(0, 4),
            priceOptimizationOpportunities: insights.filter(line => line.includes('price') || line.includes('margin')).slice(0, 2),
            revenueImpact: {
              projectedIncrease: this.extractNumber(aiText, 'increase'),
              timeframe: '3 months'
            },
            confidence: 'medium'
          };
          
        case 'personalized_product_performance':
        case 'product_performance':
          return {
            insights: insights.slice(0, 4),
            topPerformers: this.extractProducts(aiText, 'top'),
            underperformers: this.extractProducts(aiText, 'low'),
            actionableInsights: insights.filter(line => line.includes('recommend') || line.includes('action')).slice(0, 3),
            confidence: 'medium'
          };
          
        case 'personalized_business_insights':
        case 'business_insights':
          return {
            insights: insights.slice(0, 4),
            businessHealthScore: this.extractNumber(aiText, 'health') || this.extractNumber(aiText, 'score') || 75,
            growthOpportunities: insights.filter(line => line.includes('growth') || line.includes('opportunity')).slice(0, 3),
            riskFactors: insights.filter(line => line.includes('risk') || line.includes('challenge')).slice(0, 2),
            nextSteps: insights.filter(line => line.includes('next') || line.includes('step') || line.includes('action')).slice(0, 3),
            confidence: 'medium'
          };
        
        default:
          return {
            insights: insights.slice(0, 4),
            summary: insights[0] || 'AI analysis completed',
            confidence: 'medium'
          };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback parsing - extract any meaningful sentences
      const sentences = aiText.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      return {
        insights: sentences.slice(0, 4).map(s => s.trim()),
        summary: sentences[0]?.trim() || 'AI analysis completed',
        confidence: 'low',
        note: 'Parsed from text format'
      };
    }
  }

  // Helper methods for parsing AI responses
  extractNumber(text, context) {
    const patterns = {
      revenue: /revenue[:\s]*(?:NPR\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      saving: /saving[s]?[:\s]*(?:NPR\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      increase: /increase[:\s]*(?:NPR\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      health: /health[:\s]*(\d+(?:\.\d+)?)/i,
      score: /score[:\s]*(\d+(?:\.\d+)?)/i
    };
    
    const pattern = patterns[context];
    if (pattern) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return null;
  }

  extractConfidence(text) {
    if (text.includes('high confidence') || text.includes('very confident')) return 'high';
    if (text.includes('low confidence') || text.includes('uncertain')) return 'low';
    return 'medium';
  }

  extractKeyDrivers(text) {
    const drivers = [];
    if (text.includes('seasonal')) drivers.push('seasonal trends');
    if (text.includes('festival')) drivers.push('festival demand');
    if (text.includes('customer')) drivers.push('customer behavior');
    if (text.includes('inventory') || text.includes('stock')) drivers.push('inventory levels');
    return drivers.length > 0 ? drivers : ['market trends', 'customer demand'];
  }

  extractProducts(text, type) {
    // Simple product extraction - in a real implementation, this would be more sophisticated
    const products = [];
    if (type === 'top') {
      if (text.includes('electronics')) products.push('Electronics');
      if (text.includes('cosmetics')) products.push('Cosmetics');
      if (text.includes('food')) products.push('Food Items');
    }
    return products.length > 0 ? products.slice(0, 3) : ['Product 1', 'Product 2'];
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

  // ============ PERSONALIZED AI METHODS ============

  /**
   * Build personalized sales prediction prompt
   */
  buildPersonalizedSalesPredictionPrompt(businessProfile, salesData, seasonalData, festivalContext) {
    return `
You are an AI business consultant analyzing sales data for ${businessProfile.business.name}, a ${businessProfile.business.type.toLowerCase()} business.

BUSINESS CONTEXT:
- Business Type: ${businessProfile.business.type}
- Owner: ${businessProfile.owner.name}
- Currency: ${businessProfile.business.currency}

CURRENT SALES PERFORMANCE:
- Recent Revenue: ${businessProfile.business.currency} ${salesData.recentSales.totalRevenue}
- Transaction Count: ${salesData.recentSales.transactionCount}
- Average Transaction: ${businessProfile.business.currency} ${salesData.recentSales.averageTransaction.toFixed(2)}
- Growth Trend: ${salesData.trends.trend}

SEASONAL FACTORS:
- Seasonal Index: ${seasonalData.seasonalTrends.seasonalityIndex || 1.0}
- Best Season: ${seasonalData.seasonalTrends.bestSeason || 'N/A'}
- Upcoming Festivals: ${festivalContext.upcomingFestivals?.length || 0}

Provide specific, actionable sales predictions for the next 30 days with personalized recommendations for ${businessProfile.owner.name}.

Respond in JSON format with:
{
  "insights": [
    "specific prediction 1",
    "specific prediction 2", 
    "specific prediction 3"
  ],
  "nextMonthRevenue": estimated_amount,
  "confidenceLevel": "high/medium/low",
  "keyDrivers": ["driver1", "driver2"],
  "personalizedActions": ["action1", "action2"]
}`;
  }

  /**
   * Build personalized inventory optimization prompt
   */
  buildPersonalizedInventoryPrompt(productData, inventoryData, salesData, festivalContext) {
    return `
You are an inventory optimization expert for a ${productData.totalProducts} product business.

INVENTORY STATUS:
- Total Products: ${productData.totalProducts}
- Low Stock Items: ${inventoryData.lowStockItems}
- Out of Stock: ${inventoryData.outOfStockItems}
- Total Inventory Value: ${inventoryData.totalInventoryValue}

TOP SELLING PRODUCTS:
${productData.performance.topSelling.slice(0, 5).map(([id, perf]) => 
  `- Product ${id}: ${perf.sold} units sold, revenue ${perf.revenue}`
).join('\n')}

SALES PATTERNS:
- Daily Revenue: ${salesData.recentSales.totalRevenue / 7}
- Transaction Volume: ${salesData.recentSales.transactionCount}

Provide specific inventory optimization recommendations.

Respond in JSON format with:
{
  "insights": [
    "specific recommendation 1",
    "specific recommendation 2",
    "specific recommendation 3"
  ],
  "urgentActions": ["urgent1", "urgent2"],
  "costSavings": estimated_amount,
  "reorderRecommendations": ["product1", "product2"]
}`;
  }

  /**
   * Generate personalized fallback recommendations
   */
  generatePersonalizedSalesFallback(comprehensiveData, festivalContext) {
    const { businessProfile, salesData } = comprehensiveData;
    const businessName = businessProfile.business.name;
    const ownerName = businessProfile.owner.name;
    const currentRevenue = salesData.recentSales.totalRevenue;
    
    return {
      insights: [
        `${ownerName}, your ${businessName} has generated ${businessProfile.business.currency} ${currentRevenue} recently`,
        `With ${salesData.recentSales.transactionCount} transactions, your average sale is ${businessProfile.business.currency} ${salesData.recentSales.averageTransaction.toFixed(2)}`,
        `Your business trend is ${salesData.trends.trend} - focus on maintaining this momentum`,
        `Based on your transaction patterns, consider promoting during peak hours`
      ],
      nextMonthRevenue: currentRevenue * 1.15,
      confidenceLevel: 'medium',
      keyDrivers: ['transaction frequency', 'average order value', 'customer retention'],
      personalizedActions: [
        `Implement customer loyalty program for ${businessName}`,
        'Focus on upselling during peak transaction times',
        'Analyze your best-performing products for expansion'
      ]
    };
  }

  generatePersonalizedInventoryFallback(comprehensiveData) {
    const { productData, inventoryData, businessProfile } = comprehensiveData;
    
    return {
      insights: [
        `You have ${inventoryData.lowStockItems} items running low - prioritize restocking`,
        `${inventoryData.outOfStockItems} items are completely out of stock and losing potential sales`,
        `Your inventory is worth ${businessProfile.business.currency} ${inventoryData.totalInventoryValue} - optimize for better cash flow`,
        `Focus on your top ${productData.performance.topSelling.length} selling products for maximum ROI`
      ],
      urgentActions: [
        'Restock out-of-stock items immediately',
        'Set up automatic reorder alerts for low stock items'
      ],
      costSavings: inventoryData.totalInventoryValue * 0.15,
      reorderRecommendations: productData.performance.topSelling.slice(0, 3).map(([id]) => `Product ${id}`)
    };
  }

  generatePersonalizedProductFallback(comprehensiveData) {
    const { productData, businessProfile } = comprehensiveData;
    
    return {
      insights: [
        `Your catalog has ${productData.totalProducts} products across ${productData.totalCategories} categories`,
        `Top performing products are driving most of your revenue - consider expanding these lines`,
        `Low performing products may need price adjustments or promotional support`,
        `Your high-margin products offer the best profit opportunities`
      ],
      topPerformers: productData.performance.topSelling.slice(0, 5),
      underperformers: productData.performance.lowPerforming,
      profitOpportunities: productData.performance.highMargin.map(p => p.name),
      actionableInsights: [
        'Promote your best-selling products more prominently',
        'Consider bundling slow-moving items with popular ones',
        'Review pricing strategy for underperforming products'
      ]
    };
  }

  generatePersonalizedCustomerFallback(comprehensiveData) {
    const { customerData, businessProfile } = comprehensiveData;
    
    return {
      insights: [
        `You have ${customerData.totalCustomers} customers with ${customerData.activeCustomers} currently active`,
        `${customerData.customerSegments.loyal} loyal customers are your most valuable asset`,
        `Customer retention rate of ${customerData.retentionRate}% shows good relationship management`,
        `${customerData.customerSegments.new} new customers acquired recently show growth potential`
      ],
      retentionOpportunities: [
        'Create personalized offers for loyal customers',
        'Implement win-back campaigns for inactive customers'
      ],
      loyaltyRecommendations: [
        'Launch a points-based loyalty program',
        'Offer exclusive discounts to repeat customers'
      ],
      acquisitionStrategies: [
        'Referral program for existing customers',
        'Social media engagement campaigns'
      ]
    };
  }

  generatePersonalizedPricingFallback(comprehensiveData) {
    const { productData, financialData } = comprehensiveData;
    
    return {
      insights: [
        `Your current profit margin is ${financialData.profitability.profitMargin.toFixed(1)}%`,
        `High-margin products offer the best pricing optimization opportunities`,
        `Consider dynamic pricing for seasonal products`,
        `Review competitor pricing for better market positioning`
      ],
      priceOptimizationOpportunities: productData.performance.highMargin.slice(0, 3).map(p => p.name),
      marginImprovements: `Potential ${(financialData.profitability.profitMargin * 0.1).toFixed(1)}% margin increase`,
      competitivePricing: ['Research local competitor prices', 'Consider value-based pricing'],
      revenueImpact: financialData.revenue.total * 0.08
    };
  }

  generatePersonalizedBusinessFallback(comprehensiveData, festivalContext) {
    const { businessProfile, businessMetrics, financialData } = comprehensiveData;
    
    return {
      insights: [
        `${businessProfile.business.name} has a business health score of ${businessMetrics.businessHealth}/100`,
        `Your ${businessProfile.business.type} business shows strong fundamentals`,
        `Net profit of ${businessProfile.business.currency} ${financialData.profitability.netProfit} indicates healthy operations`,
        `Growth opportunities exist in customer retention and inventory optimization`
      ],
      businessHealthScore: businessMetrics.businessHealth,
      growthOpportunities: [
        'Expand successful product categories',
        'Implement customer loyalty programs',
        'Optimize inventory turnover'
      ],
      riskFactors: [
        'Monitor cash flow during slow periods',
        'Diversify product portfolio',
        'Maintain adequate stock levels'
      ],
      strategicRecommendations: [
        `Focus on your core ${businessProfile.business.type} strengths`,
        'Invest in customer relationship management',
        'Leverage seasonal trends for growth'
      ],
      nextSteps: [
        'Review and optimize top-performing products',
        'Implement data-driven inventory management',
        'Develop customer retention strategies'
      ]
    };
  }

  // Helper methods for confidence and analysis
  calculateConfidenceLevel(salesData) {
    const transactionCount = salesData.recentSales.transactionCount;
    if (transactionCount > 100) return 'high';
    if (transactionCount > 30) return 'medium';
    return 'low';
  }

  identifyUrgentInventoryActions(inventoryData, productData) {
    const actions = [];
    if (inventoryData.outOfStockItems > 0) {
      actions.push(`Restock ${inventoryData.outOfStockItems} out-of-stock items immediately`);
    }
    if (inventoryData.lowStockItems > 5) {
      actions.push(`Review reorder levels for ${inventoryData.lowStockItems} low-stock items`);
    }
    return actions;
  }

  generateInventoryRecommendations(productData, salesData) {
    return [
      'Focus on restocking top-selling products first',
      'Consider seasonal demand patterns for reordering',
      'Implement automatic reorder points for fast-moving items'
    ];
  }

  calculateInventoryCostImpact(inventoryData, productData) {
    return {
      currentValue: inventoryData.totalInventoryValue,
      optimizedValue: inventoryData.totalInventoryValue * 0.85,
      potentialSavings: inventoryData.totalInventoryValue * 0.15
    };
  }

  identifyProfitOpportunities(productData) {
    return productData.performance.highMargin.slice(0, 3).map(product => ({
      name: product.name,
      currentMargin: product.profitMargin,
      opportunity: 'Price optimization'
    }));
  }

  generateProductActionItems(productData, salesData) {
    return [
      'Promote top-selling products more aggressively',
      'Bundle slow-moving items with popular products',
      'Review pricing for underperforming products',
      'Consider discontinuing products with very low sales'
    ];
  }

  identifyRetentionOpportunities(customerData) {
    return [
      `Target ${customerData.customerSegments.returning} returning customers with loyalty offers`,
      'Re-engage inactive customers with personalized campaigns',
      'Reward your most loyal customers with exclusive benefits'
    ];
  }

  generateLoyaltyRecommendations(customerData) {
    return [
      'Implement a points-based loyalty program',
      'Offer birthday discounts and special occasion rewards',
      'Create VIP tiers for high-value customers'
    ];
  }

  generateAcquisitionStrategies(customerData, salesData) {
    return [
      'Referral incentives for existing customers',
      'Social media marketing campaigns',
      'Local community engagement initiatives'
    ];
  }

  identifyPriceOptimizationOpportunities(productData) {
    return productData.performance.highMargin.slice(0, 5).map(product => ({
      name: product.name,
      currentPrice: product.price,
      suggestedAction: 'Consider small price increase'
    }));
  }

  calculateMarginImprovements(productData, financialData) {
    return {
      currentMargin: financialData.profitability.profitMargin,
      potentialMargin: financialData.profitability.profitMargin + 2.5,
      improvement: 2.5
    };
  }

  generateCompetitivePricingInsights(productData) {
    return [
      'Research competitor pricing for your top products',
      'Consider value-based pricing for unique items',
      'Monitor market trends for pricing opportunities'
    ];
  }

  calculatePricingRevenueImpact(productData, salesData) {
    return {
      currentRevenue: salesData.recentSales.totalRevenue,
      projectedIncrease: salesData.recentSales.totalRevenue * 0.08,
      timeframe: '3 months'
    };
  }

  identifyGrowthOpportunities(comprehensiveData) {
    const { productData, customerData, salesData } = comprehensiveData;
    return [
      `Expand successful categories (currently ${productData.totalCategories} categories)`,
      `Increase customer retention (current rate: ${customerData.retentionRate}%)`,
      `Optimize high-performing products for greater sales`,
      'Implement cross-selling strategies'
    ];
  }

  identifyRiskFactors(comprehensiveData) {
    const { inventoryData, financialData } = comprehensiveData;
    return [
      inventoryData.outOfStockItems > 0 ? 'Stock-outs causing lost sales' : null,
      financialData.profitability.profitMargin < 20 ? 'Low profit margins' : null,
      'Seasonal demand fluctuations',
      'Customer concentration risk'
    ].filter(Boolean);
  }

  generateStrategicRecommendations(comprehensiveData) {
    const { businessProfile, businessMetrics } = comprehensiveData;
    return [
      `Leverage your ${businessProfile.business.type} market position`,
      'Invest in customer relationship management',
      'Optimize inventory management processes',
      'Focus on high-margin product categories'
    ];
  }

  generateNextSteps(comprehensiveData) {
    const { inventoryData, customerData, productData } = comprehensiveData;
    const steps = [];
    
    if (inventoryData.outOfStockItems > 0) {
      steps.push('Address out-of-stock items immediately');
    }
    if (customerData.retentionRate < 80) {
      steps.push('Implement customer retention strategies');
    }
    if (productData.performance.lowPerforming.length > 0) {
      steps.push('Review underperforming product strategies');
    }
    
    steps.push('Set up regular business performance reviews');
    return steps;
  }
}

module.exports = new AIBusinessIntelligenceService();
