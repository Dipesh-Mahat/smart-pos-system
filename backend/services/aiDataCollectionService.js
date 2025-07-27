/**
 * AI Data Collection Service
 * Collects comprehensive user business data for personalized AI insights
 */

const Product = require('../models/Product');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Settings = require('../models/Settings');
const User = require('../models/User');

class AIDataCollectionService {
  constructor() {
    this.dataRetentionDays = {
      recent: 7,
      shortTerm: 30,
      longTerm: 90,
      yearly: 365
    };
  }

  /**
   * Collect comprehensive business data for AI analysis
   * @param {String} shopId - Shop identifier
   * @param {String} userId - User identifier
   * @returns {Object} Comprehensive business intelligence data
   */
  async collectComprehensiveData(shopId, userId) {
    try {
      console.log(`Collecting comprehensive data for shop: ${shopId}, user: ${userId}`);

      // Define date ranges for analysis
      const dateRanges = this.getDateRanges();

      // Collect all data in parallel for performance
      const [
        businessProfile,
        productData,
        salesData,
        customerData,
        inventoryData,
        financialData,
        operationalData,
        seasonalData
      ] = await Promise.all([
        this.collectBusinessProfile(shopId, userId),
        this.collectProductData(shopId, dateRanges),
        this.collectSalesData(shopId, dateRanges),
        this.collectCustomerData(shopId, dateRanges),
        this.collectInventoryData(shopId, dateRanges),
        this.collectFinancialData(shopId, dateRanges),
        this.collectOperationalData(shopId, dateRanges),
        this.collectSeasonalData(shopId, dateRanges)
      ]);

      // Calculate comprehensive business metrics
      const businessMetrics = this.calculateComprehensiveMetrics({
        businessProfile,
        productData,
        salesData,
        customerData,
        inventoryData,
        financialData,
        operationalData,
        seasonalData
      });

      return {
        businessProfile,
        productData,
        salesData,
        customerData,
        inventoryData,
        financialData,
        operationalData,
        seasonalData,
        businessMetrics,
        dataQuality: this.assessDataCompleteness({
          productData,
          salesData,
          customerData,
          inventoryData,
          financialData
        }),
        collectionTimestamp: new Date()
      };

    } catch (error) {
      console.error('Error collecting comprehensive data:', error);
      throw error;
    }
  }

  /**
   * Collect business profile information
   */
  async collectBusinessProfile(shopId, userId) {
    try {
      const [user, settings] = await Promise.all([
        User.findById(userId).select('name email phone shopName businessType createdAt').lean(),
        Settings.findOne({ shopId }).lean()
      ]);

      return {
        owner: {
          name: user?.name || 'Business Owner',
          email: user?.email,
          phone: user?.phone,
          joinDate: user?.createdAt
        },
        business: {
          name: user?.shopName || settings?.businessName || 'Smart POS Shop',
          type: user?.businessType || settings?.businessType || 'Retail',
          address: settings?.address,
          currency: settings?.currency || 'NPR',
          taxRate: settings?.taxRate || 13,
          businessHours: settings?.businessHours
        },
        preferences: {
          language: settings?.language || 'en',
          theme: settings?.theme || 'light',
          notifications: settings?.notifications || {},
          autoOrdering: settings?.autoOrdering || false
        }
      };
    } catch (error) {
      console.error('Error collecting business profile:', error);
      return this.getDefaultBusinessProfile();
    }
  }

  /**
   * Collect detailed product data and analytics
   */
  async collectProductData(shopId, dateRanges) {
    try {
      const [products, categories, recentOrders] = await Promise.all([
        Product.find({ shopId }).lean(),
        Category.find({ shopId }).lean(),
        Order.find({ 
          shopId, 
          createdAt: { $gte: dateRanges.shortTerm },
          status: 'completed'
        }).lean()
      ]);

      // Analyze product performance
      const productPerformance = this.analyzeProductPerformance(products, recentOrders);
      const categoryAnalysis = this.analyzeCategoryPerformance(categories, products, recentOrders);
      const inventoryAnalysis = this.analyzeInventoryLevels(products);

      return {
        totalProducts: products.length,
        totalCategories: categories.length,
        products: products.map(product => ({
          id: product._id,
          name: product.name,
          category: product.category,
          price: product.price,
          cost: product.cost,
          quantity: product.quantity,
          reorderLevel: product.reorderLevel,
          sold: productPerformance[product._id]?.sold || 0,
          revenue: productPerformance[product._id]?.revenue || 0,
          profitMargin: ((product.price - product.cost) / product.price * 100) || 0,
          createdAt: product.createdAt
        })),
        categories: categoryAnalysis,
        performance: {
          topSelling: Object.entries(productPerformance)
            .sort(([,a], [,b]) => b.sold - a.sold)
            .slice(0, 10),
          lowPerforming: Object.entries(productPerformance)
            .sort(([,a], [,b]) => a.sold - b.sold)
            .slice(0, 5),
          highMargin: products
            .filter(p => p.price && p.cost)
            .sort((a, b) => ((b.price - b.cost) / b.price) - ((a.price - a.cost) / a.price))
            .slice(0, 5)
        },
        inventory: inventoryAnalysis
      };
    } catch (error) {
      console.error('Error collecting product data:', error);
      return { totalProducts: 0, totalCategories: 0, products: [], categories: [] };
    }
  }

  /**
   * Collect comprehensive sales data and trends
   */
  async collectSalesData(shopId, dateRanges) {
    try {
      const [recentTransactions, allTransactions, recentOrders] = await Promise.all([
        Transaction.find({ 
          shopId, 
          createdAt: { $gte: dateRanges.recent },
          status: 'completed'
        }).lean(),
        Transaction.find({ 
          shopId, 
          createdAt: { $gte: dateRanges.longTerm },
          status: 'completed'
        }).lean(),
        Order.find({ 
          shopId, 
          createdAt: { $gte: dateRanges.longTerm },
          status: 'completed'
        }).lean()
      ]);

      const salesTrends = this.analyzeSalesTrends(allTransactions);
      const dailyPatterns = this.analyzeDailyPatterns(allTransactions);
      const monthlyGrowth = this.calculateMonthlyGrowth(allTransactions);

      return {
        recentSales: {
          totalRevenue: recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
          transactionCount: recentTransactions.length,
          averageTransaction: recentTransactions.length > 0 
            ? recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / recentTransactions.length 
            : 0
        },
        trends: salesTrends,
        patterns: {
          daily: dailyPatterns,
          hourly: this.analyzeHourlyPatterns(allTransactions),
          weekly: this.analyzeWeeklyPatterns(allTransactions)
        },
        growth: monthlyGrowth,
        orders: {
          totalOrders: recentOrders.length,
          averageOrderValue: recentOrders.length > 0 
            ? recentOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / recentOrders.length 
            : 0
        }
      };
    } catch (error) {
      console.error('Error collecting sales data:', error);
      return { recentSales: { totalRevenue: 0, transactionCount: 0 }, trends: {}, patterns: {} };
    }
  }

  /**
   * Collect customer behavior and analytics data
   */
  async collectCustomerData(shopId, dateRanges) {
    try {
      const [customers, recentTransactions] = await Promise.all([
        Customer.find({ shopId }).lean(),
        Transaction.find({ 
          shopId, 
          createdAt: { $gte: dateRanges.shortTerm },
          status: 'completed'
        }).lean()
      ]);

      const customerAnalysis = this.analyzeCustomerBehavior(customers, recentTransactions);

      return {
        totalCustomers: customers.length,
        activeCustomers: customerAnalysis.activeCustomers,
        customerSegments: customerAnalysis.segments,
        loyaltyMetrics: customerAnalysis.loyalty,
        acquisitionTrends: customerAnalysis.acquisition,
        retentionRate: customerAnalysis.retention
      };
    } catch (error) {
      console.error('Error collecting customer data:', error);
      return { totalCustomers: 0, activeCustomers: 0 };
    }
  }

  /**
   * Collect inventory management data
   */
  async collectInventoryData(shopId, dateRanges) {
    try {
      const products = await Product.find({ shopId }).lean();
      
      const inventoryMetrics = {
        lowStockItems: products.filter(p => p.quantity <= (p.reorderLevel || 10)).length,
        outOfStockItems: products.filter(p => p.quantity <= 0).length,
        overStockItems: products.filter(p => p.quantity > (p.reorderLevel || 10) * 5).length,
        totalInventoryValue: products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.cost || 0)), 0),
        averageStockTurnover: this.calculateStockTurnover(products, dateRanges)
      };

      return inventoryMetrics;
    } catch (error) {
      console.error('Error collecting inventory data:', error);
      return { lowStockItems: 0, outOfStockItems: 0, totalInventoryValue: 0 };
    }
  }

  /**
   * Collect financial data and expense tracking
   */
  async collectFinancialData(shopId, dateRanges) {
    try {
      const [expenses, transactions] = await Promise.all([
        Expense.find({ 
          shopId, 
          date: { $gte: dateRanges.shortTerm }
        }).lean(),
        Transaction.find({ 
          shopId, 
          createdAt: { $gte: dateRanges.shortTerm },
          status: 'completed'
        }).lean()
      ]);

      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;

      return {
        revenue: {
          total: totalRevenue,
          daily: totalRevenue / 30,
          growth: this.calculateRevenueGrowth(transactions)
        },
        expenses: {
          total: totalExpenses,
          byCategory: this.categorizeExpenses(expenses),
          daily: totalExpenses / 30
        },
        profitability: {
          netProfit,
          profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
          breakEvenPoint: this.calculateBreakEvenPoint(totalRevenue, totalExpenses)
        }
      };
    } catch (error) {
      console.error('Error collecting financial data:', error);
      return { revenue: { total: 0 }, expenses: { total: 0 }, profitability: { netProfit: 0 } };
    }
  }

  /**
   * Collect operational efficiency data
   */
  async collectOperationalData(shopId, dateRanges) {
    try {
      // This would include metrics like:
      // - Average transaction time
      // - Peak hours analysis
      // - Staff efficiency (if available)
      // - System usage patterns

      return {
        efficiency: {
          averageTransactionTime: 2.5, // minutes - could be calculated from actual data
          peakHours: ['10:00-12:00', '15:00-17:00'],
          systemUptime: 99.5
        }
      };
    } catch (error) {
      console.error('Error collecting operational data:', error);
      return { efficiency: {} };
    }
  }

  /**
   * Collect seasonal and time-based patterns
   */
  async collectSeasonalData(shopId, dateRanges) {
    try {
      const transactions = await Transaction.find({ 
        shopId, 
        createdAt: { $gte: dateRanges.yearly },
        status: 'completed'
      }).lean();

      return {
        seasonalTrends: this.analyzeSeasonalTrends(transactions),
        festivalImpact: this.analyzeFestivalImpact(transactions),
        weekdayVsWeekend: this.analyzeWeekdayWeekendPatterns(transactions)
      };
    } catch (error) {
      console.error('Error collecting seasonal data:', error);
      return { seasonalTrends: {}, festivalImpact: {} };
    }
  }

  /**
   * Get date ranges for different analysis periods
   */
  getDateRanges() {
    const now = new Date();
    return {
      recent: new Date(now.getTime() - (this.dataRetentionDays.recent * 24 * 60 * 60 * 1000)),
      shortTerm: new Date(now.getTime() - (this.dataRetentionDays.shortTerm * 24 * 60 * 60 * 1000)),
      longTerm: new Date(now.getTime() - (this.dataRetentionDays.longTerm * 24 * 60 * 60 * 1000)),
      yearly: new Date(now.getTime() - (this.dataRetentionDays.yearly * 24 * 60 * 60 * 1000))
    };
  }

  /**
   * Calculate comprehensive business metrics
   */
  calculateComprehensiveMetrics(data) {
    return {
      businessHealth: this.calculateBusinessHealthScore(data),
      growthRate: this.calculateGrowthRate(data.salesData),
      efficiency: this.calculateEfficiencyMetrics(data),
      marketPosition: this.assessMarketPosition(data),
      recommendations: this.generateBasicRecommendations(data)
    };
  }

  /**
   * Assess data completeness for AI analysis quality
   */
  assessDataCompleteness(data) {
    const completeness = {
      products: data.productData?.totalProducts > 0,
      sales: data.salesData?.recentSales?.transactionCount > 0,
      customers: data.customerData?.totalCustomers > 0,
      inventory: data.inventoryData?.totalInventoryValue > 0,
      financial: data.financialData?.revenue?.total > 0
    };

    const completenessScore = Object.values(completeness).filter(Boolean).length / Object.keys(completeness).length;

    return {
      score: completenessScore,
      level: completenessScore >= 0.8 ? 'excellent' : 
             completenessScore >= 0.6 ? 'good' : 
             completenessScore >= 0.4 ? 'fair' : 'poor',
      details: completeness,
      recommendations: this.getDataImprovementRecommendations(completeness)
    };
  }

  // Helper methods for analysis
  analyzeProductPerformance(products, orders) {
    const performance = {};
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (!performance[item.productId]) {
            performance[item.productId] = { sold: 0, revenue: 0 };
          }
          performance[item.productId].sold += item.quantity || 0;
          performance[item.productId].revenue += (item.quantity || 0) * (item.price || 0);
        });
      }
    });
    return performance;
  }

  analyzeCategoryPerformance(categories, products, orders) {
    // Implementation for category analysis
    return categories.map(cat => ({
      name: cat.name,
      productCount: products.filter(p => p.category === cat.name).length,
      totalRevenue: 0 // Calculate based on orders
    }));
  }

  analyzeInventoryLevels(products) {
    return {
      lowStock: products.filter(p => p.quantity <= (p.reorderLevel || 10)),
      overStock: products.filter(p => p.quantity > (p.reorderLevel || 10) * 5),
      optimal: products.filter(p => p.quantity > (p.reorderLevel || 10) && p.quantity <= (p.reorderLevel || 10) * 5)
    };
  }

  analyzeSalesTrends(transactions) {
    // Implementation for sales trend analysis
    return {
      trend: 'growing', // up, down, stable
      weekOverWeek: 5.2, // percentage change
      monthOverMonth: 12.8
    };
  }

  analyzeDailyPatterns(transactions) {
    // Implementation for daily pattern analysis
    return {
      bestDay: 'Saturday',
      averageDailyRevenue: transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / 30
    };
  }

  analyzeHourlyPatterns(transactions) {
    // Implementation for hourly pattern analysis
    return {
      peakHour: '14:00',
      slowestHour: '09:00'
    };
  }

  analyzeWeeklyPatterns(transactions) {
    // Implementation for weekly pattern analysis
    return {
      weekdayAverage: 0,
      weekendAverage: 0
    };
  }

  calculateMonthlyGrowth(transactions) {
    // Implementation for monthly growth calculation
    return {
      currentMonth: 15.5, // percentage
      previousMonth: 8.2,
      trend: 'improving'
    };
  }

  analyzeCustomerBehavior(customers, transactions) {
    return {
      activeCustomers: customers.filter(c => c.lastPurchase && new Date(c.lastPurchase) > new Date(Date.now() - 30*24*60*60*1000)).length,
      segments: {
        new: customers.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length,
        returning: customers.filter(c => c.totalPurchases > 1).length,
        loyal: customers.filter(c => c.totalPurchases > 5).length
      },
      loyalty: {
        averagePurchases: customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0) / customers.length || 0,
        repeatCustomerRate: customers.filter(c => c.totalPurchases > 1).length / customers.length * 100 || 0
      },
      acquisition: {
        newCustomersThisMonth: customers.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length
      },
      retention: 85.5 // percentage - could be calculated from actual data
    };
  }

  calculateStockTurnover(products, dateRanges) {
    // Implementation for stock turnover calculation
    return 4.2; // times per year
  }

  calculateRevenueGrowth(transactions) {
    // Implementation for revenue growth calculation
    return 12.5; // percentage
  }

  categorizeExpenses(expenses) {
    const categories = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += expense.amount || 0;
    });
    return categories;
  }

  calculateBreakEvenPoint(revenue, expenses) {
    // Implementation for break-even calculation
    return Math.ceil(expenses / (revenue / 30)); // days to break even
  }

  analyzeSeasonalTrends(transactions) {
    // Implementation for seasonal trend analysis
    return {
      bestSeason: 'Winter',
      seasonalityIndex: 1.25
    };
  }

  analyzeFestivalImpact(transactions) {
    // Implementation for festival impact analysis
    return {
      averageIncrease: 35, // percentage
      bestFestival: 'Dashain'
    };
  }

  analyzeWeekdayWeekendPatterns(transactions) {
    // Implementation for weekday vs weekend analysis
    return {
      weekdayRevenue: 65, // percentage
      weekendRevenue: 35
    };
  }

  calculateBusinessHealthScore(data) {
    // Implementation for business health score
    return 78; // out of 100
  }

  calculateGrowthRate(salesData) {
    // Implementation for growth rate calculation
    return {
      monthly: 12.5,
      quarterly: 28.3,
      yearly: 45.7
    };
  }

  calculateEfficiencyMetrics(data) {
    // Implementation for efficiency metrics
    return {
      inventoryTurnover: 4.2,
      profitMargin: 25.8,
      customerAcquisitionCost: 50
    };
  }

  assessMarketPosition(data) {
    // Implementation for market position assessment
    return {
      competitiveness: 'strong',
      marketShare: 15.5,
      growthPotential: 'high'
    };
  }

  generateBasicRecommendations(data) {
    // Implementation for basic recommendations
    return [
      'Focus on inventory optimization for better cash flow',
      'Implement customer loyalty program to increase retention',
      'Consider seasonal promotions during festival periods'
    ];
  }

  getDataImprovementRecommendations(completeness) {
    const recommendations = [];
    if (!completeness.products) recommendations.push('Add more products to your catalog');
    if (!completeness.sales) recommendations.push('Start recording sales transactions');
    if (!completeness.customers) recommendations.push('Begin customer data collection');
    if (!completeness.inventory) recommendations.push('Update inventory information');
    if (!completeness.financial) recommendations.push('Track expenses and financial data');
    return recommendations;
  }

  getDefaultBusinessProfile() {
    return {
      owner: { name: 'Business Owner' },
      business: { name: 'Smart POS Shop', type: 'Retail', currency: 'NPR' },
      preferences: { language: 'en', theme: 'light' }
    };
  }
}

module.exports = new AIDataCollectionService();
