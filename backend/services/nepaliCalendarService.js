/**
 * Nepali Calendar Service
 * Handles Nepali date conversion, festival detection, and cultural event management
 */

const axios = require('axios');

class NepaliCalendarService {
  constructor() {
    // Major Nepali festivals with approximate dates (these can be made dynamic with API)
    this.majorFestivals = {
      // Dashain (September/October) - Biggest festival
      'dashain': {
        name: 'Dashain',
        englishName: 'Dashain Festival',
        duration: 15, // days
        category: 'major',
        businessImpact: 'extreme', // 4-5x demand
        recommendations: [
          'Electronics and mobile accessories',
          'Gift items and decorations',
          'Food items and spices',
          'Household essentials and cleaning supplies'
        ],
        seasonalFactor: 4.5,
        peakDays: [10, 11, 12], // Ghatasthapana, Dashami, Ekadashi
        preparationDays: 30
      },
      
      // Tihar (October/November) - Festival of lights
      'tihar': {
        name: 'Tihar',
        englishName: 'Festival of Lights',
        duration: 5,
        category: 'major',
        businessImpact: 'high', // 3x demand
        recommendations: [
          'Stock diyas, candles, lights',
          'Flower garlands and marigolds',
          'Sweets and dry fruits',
          'Electrical decorations'
        ],
        seasonalFactor: 3.2,
        peakDays: [3, 4], // Gai Tihar, Govardhan Puja
        preparationDays: 20
      },
      
      // Holi (March) - Festival of colors
      'holi': {
        name: 'Holi',
        englishName: 'Festival of Colors',
        duration: 2,
        category: 'major',
        businessImpact: 'high', // 2.5x demand
        recommendations: [
          'Colors (abir, gulal)',
          'Water balloons and pichkari',
          'Traditional sweets',
          'Protective clothing'
        ],
        seasonalFactor: 2.5,
        peakDays: [1, 2],
        preparationDays: 15
      },
      
      // Buddha Jayanti (May)
      'buddha_jayanti': {
        name: 'Buddha Jayanti',
        englishName: 'Buddha Birthday',
        duration: 1,
        category: 'religious',
        businessImpact: 'medium',
        recommendations: [
          'Incense and candles',
          'Flowers for offerings',
          'Religious books',
          'Meditation items'
        ],
        seasonalFactor: 1.8,
        peakDays: [1],
        preparationDays: 7
      },
      
      // Teej (August/September) - Women's festival
      'teej': {
        name: 'Teej',
        englishName: 'Haritalika Teej',
        duration: 3,
        category: 'cultural',
        businessImpact: 'high',
        recommendations: [
          'Red bangles and accessories',
          'Henna (mehndi) and cosmetics',
          'Beauty products and makeup',
          'Traditional sweets and snacks'
        ],
        seasonalFactor: 2.8,
        peakDays: [1, 2],
        preparationDays: 15
      },
      
      // Chhath (October/November)
      'chhath': {
        name: 'Chhath',
        englishName: 'Chhath Puja',
        duration: 4,
        category: 'religious',
        businessImpact: 'medium',
        recommendations: [
          'Fresh fruits for offerings',
          'Plastic baskets and containers',
          'Incense and candles',
          'Puja accessories and materials'
        ],
        seasonalFactor: 2.2,
        peakDays: [3, 4],
        preparationDays: 10
      }
    };

    // Monthly seasonal patterns
    this.monthlyPatterns = {
      'Baishakh': { // April-May
        season: 'spring',
        generalFactor: 1.1,
        recommendations: ['New Year items', 'Spring clothing', 'Fresh produce']
      },
      'Jestha': { // May-June
        season: 'summer',
        generalFactor: 1.0,
        recommendations: ['Summer clothing', 'Cooling items', 'Cold beverages']
      },
      'Ashadh': { // June-July
        season: 'monsoon',
        generalFactor: 0.9,
        recommendations: ['Monsoon gear', 'Umbrellas', 'Waterproof items']
      },
      'Shrawan': { // July-August
        season: 'monsoon',
        generalFactor: 1.2,
        recommendations: ['Religious items', 'Teej preparations', 'Traditional foods']
      },
      'Bhadra': { // August-September
        season: 'post-monsoon',
        generalFactor: 1.3,
        recommendations: ['Festival preparations', 'New clothes', 'Electronics']
      },
      'Ashwin': { // September-October
        season: 'autumn',
        generalFactor: 2.5, // Dashain month
        recommendations: ['Dashain items', 'Gifts', 'Premium products']
      },
      'Kartik': { // October-November
        season: 'autumn',
        generalFactor: 2.0, // Tihar month
        recommendations: ['Tihar items', 'Lights', 'Decorations']
      },
      'Mangsir': { // November-December
        season: 'winter',
        generalFactor: 1.1,
        recommendations: ['Winter clothing', 'Warm items', 'Year-end sales']
      },
      'Poush': { // December-January
        season: 'winter',
        generalFactor: 0.8,
        recommendations: ['Winter essentials', 'Warm food items']
      },
      'Magh': { // January-February
        season: 'winter',
        generalFactor: 0.9,
        recommendations: ['Winter clothing', 'Heating items']
      },
      'Falgun': { // February-March
        season: 'spring',
        generalFactor: 1.4, // Holi preparations
        recommendations: ['Holi colors', 'Spring items', 'New season prep']
      },
      'Chaitra': { // March-April
        season: 'spring',
        generalFactor: 1.2,
        recommendations: ['New Year prep', 'Spring cleaning', 'Fresh starts']
      }
    };
  }

  /**
   * Convert English date to Nepali date
   * Uses a simple algorithm (can be enhanced with proper API)
   */
  async englishToNepali(englishDate) {
    try {
      // For now, using a basic conversion
      // In production, use proper Nepali calendar API
      const date = new Date(englishDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      // Basic conversion (approximate)
      const nepaliYear = year + 57; // Rough conversion
      const nepaliMonthNames = [
        'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
        'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
      ];
      
      // Adjust for Nepali calendar offset
      let adjustedMonth = month + 8;
      let adjustedYear = nepaliYear;
      
      if (adjustedMonth > 12) {
        adjustedMonth -= 12;
        adjustedYear += 1;
      }
      
      return {
        year: adjustedYear,
        month: adjustedMonth,
        monthName: nepaliMonthNames[adjustedMonth - 1],
        day: day,
        formatted: `${adjustedYear}/${adjustedMonth}/${day}`,
        monthPattern: this.monthlyPatterns[nepaliMonthNames[adjustedMonth - 1]]
      };
    } catch (error) {
      console.error('Error converting to Nepali date:', error);
      return null;
    }
  }

  /**
   * Get upcoming festivals within specified days
   */
  getUpcomingFestivals(days = 30) {
    const today = new Date();
    const upcomingFestivals = [];
    
    // This is a simplified version - in production, use proper festival calendar API
    const currentMonth = today.getMonth() + 1;
    
    // Festival timing approximations (these should come from proper API)
    const festivalTiming = {
      'dashain': { month: 10, startDay: 15 }, // Mid October
      'tihar': { month: 11, startDay: 5 },   // Early November
      'holi': { month: 3, startDay: 15 },    // Mid March
      'buddha_jayanti': { month: 5, startDay: 15 },
      'teej': { month: 9, startDay: 1 },     // Early September
      'chhath': { month: 11, startDay: 15 }  // Mid November
    };
    
    for (const [festivalKey, festival] of Object.entries(this.majorFestivals)) {
      const timing = festivalTiming[festivalKey];
      if (timing) {
        const festivalDate = new Date(today.getFullYear(), timing.month - 1, timing.startDay);
        const daysUntil = Math.ceil((festivalDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= days) {
          upcomingFestivals.push({
            ...festival,
            key: festivalKey,
            daysUntil,
            estimatedDate: festivalDate,
            preparationPhase: daysUntil <= festival.preparationDays
          });
        }
      }
    }
    
    return upcomingFestivals.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  /**
   * Get festival-specific product recommendations
   */
  getFestivalRecommendations(festivalKey) {
    const festival = this.majorFestivals[festivalKey];
    if (!festival) return null;
    
    return {
      festival: festival.name,
      seasonalFactor: festival.seasonalFactor,
      businessImpact: festival.businessImpact,
      recommendations: festival.recommendations,
      preparationDays: festival.preparationDays,
      peakDays: festival.peakDays,
      suggestedActions: this.generateFestivalActions(festival)
    };
  }

  /**
   * Generate specific actions for festival preparation
   */
  generateFestivalActions(festival) {
    const actions = [];
    
    switch (festival.businessImpact) {
      case 'extreme':
        actions.push(
          'Increase inventory by 300-400%',
          'Arrange additional suppliers',
          'Extend business hours',
          'Hire temporary staff',
          'Set up festival displays'
        );
        break;
      case 'high':
        actions.push(
          'Increase inventory by 200-250%',
          'Confirm supplier availability',
          'Plan special promotions',
          'Update product displays'
        );
        break;
      case 'medium':
        actions.push(
          'Increase inventory by 50-80%',
          'Stock specific festival items',
          'Plan themed displays'
        );
        break;
    }
    
    return actions;
  }

  /**
   * Get current seasonal factor based on Nepali date
   */
  async getCurrentSeasonalFactor() {
    try {
      const nepaliDate = await this.englishToNepali(new Date());
      if (!nepaliDate) return 1.0;
      
      const monthPattern = nepaliDate.monthPattern;
      const upcomingFestivals = this.getUpcomingFestivals(15);
      
      let baseFactor = monthPattern ? monthPattern.generalFactor : 1.0;
      
      // Check for immediate festival impact
      const immediateFestival = upcomingFestivals.find(f => f.daysUntil <= 7);
      if (immediateFestival) {
        baseFactor = Math.max(baseFactor, immediateFestival.seasonalFactor);
      }
      
      return baseFactor;
    } catch (error) {
      console.error('Error getting seasonal factor:', error);
      return 1.0;
    }
  }

  /**
   * Get comprehensive festival intelligence for dashboard
   */
  async getFestivalIntelligence() {
    try {
      const nepaliDate = await this.englishToNepali(new Date());
      const upcomingFestivals = this.getUpcomingFestivals(60);
      const currentSeasonalFactor = await this.getCurrentSeasonalFactor();
      
      const immediatePreparation = upcomingFestivals.filter(f => f.preparationPhase);
      const nextMajorFestival = upcomingFestivals.find(f => f.category === 'major');
      
      return {
        nepaliDate,
        currentSeasonalFactor,
        upcomingFestivals,
        immediatePreparation,
        nextMajorFestival,
        monthlyPattern: nepaliDate?.monthPattern,
        recommendations: this.generateCurrentRecommendations(nepaliDate, upcomingFestivals)
      };
    } catch (error) {
      console.error('Error getting festival intelligence:', error);
      return {
        error: 'Failed to get festival intelligence',
        fallbackFactor: 1.0
      };
    }
  }

  /**
   * Generate current business recommendations
   */
  generateCurrentRecommendations(nepaliDate, upcomingFestivals) {
    const recommendations = [];
    
    if (nepaliDate?.monthPattern) {
      recommendations.push(...nepaliDate.monthPattern.recommendations);
    }
    
    const immediatePrep = upcomingFestivals.filter(f => f.preparationPhase);
    immediatePrep.forEach(festival => {
      recommendations.push(`Prepare for ${festival.name}: ${festival.recommendations[0]}`);
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Calculate festival-adjusted inventory quantity
   */
  calculateFestivalAdjustedQuantity(baseQuantity, productCategory, festivalContext = null) {
    try {
      let adjustmentFactor = 1.0;
      
      if (festivalContext) {
        // Use specific festival factor
        adjustmentFactor = festivalContext.seasonalFactor || 1.0;
      } else {
        // Use current seasonal context
        // This would be called from smart inventory service
        adjustmentFactor = 1.0; // Will be set by getCurrentSeasonalFactor
      }
      
      // Category-specific adjustments
      const categoryMultipliers = {
        'electronics': 1.2,
        'cosmetics': 1.8,
        'accessories': 2.0,
        'food': 1.3,
        'decorations': 3.0,
        'religious': 2.5,
        'household': 1.4,
        'beverages': 1.1,
        'snacks': 1.5,
        'stationery': 1.0
      };
      
      const categoryMultiplier = categoryMultipliers[productCategory?.toLowerCase()] || 1.0;
      
      const finalQuantity = Math.ceil(baseQuantity * adjustmentFactor * categoryMultiplier);
      
      return {
        originalQuantity: baseQuantity,
        adjustmentFactor,
        categoryMultiplier,
        finalQuantity,
        reasoning: `Festival factor: ${adjustmentFactor}x, Category: ${categoryMultiplier}x`
      };
    } catch (error) {
      console.error('Error calculating festival adjustment:', error);
      return {
        originalQuantity: baseQuantity,
        finalQuantity: baseQuantity,
        error: 'Calculation failed'
      };
    }
  }
}

module.exports = new NepaliCalendarService();
