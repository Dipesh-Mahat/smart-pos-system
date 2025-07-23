const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const { createDynamicRateLimiter } = require('../middleware/rateLimiter');
const {
  getAIBusinessDashboard,
  getSpecificAIAnalysis,
  getAIProductRecommendations,
  getAISalesForecasting,
  getAIInventoryInsights,
  getAICustomerAnalysis,
  getAIPricingRecommendations,
  generateAIBusinessReport
} = require('../controllers/aiBusinessIntelligenceController');

// Apply authentication to all routes
router.use(authenticateJWT);

// Apply rate limiting for AI operations (more restrictive due to AI API costs)
const aiRateLimit = createDynamicRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // Limited requests due to AI API costs
});

router.use(aiRateLimit);

/**
 * @swagger
 * components:
 *   schemas:
 *     AIInsight:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *         confidence:
 *           type: string
 *           enum: [low, medium, high]
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *         insights:
 *           type: array
 *           items:
 *             type: string
 *     
 *     DataQuality:
 *       type: object
 *       properties:
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         level:
 *           type: string
 *           enum: [poor, fair, good, excellent]
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *     
 *     QuickAction:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         action:
 *           type: string
 *         category:
 *           type: string
 */

/**
 * @swagger
 * /api/ai-intelligence/dashboard:
 *   get:
 *     summary: Get comprehensive AI business intelligence dashboard
 *     tags: [AI Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: exclude
 *         schema:
 *           type: string
 *         description: Comma-separated list of categories to exclude from analysis
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated list of categories to include (excludes all others)
 *     responses:
 *       200:
 *         description: AI business intelligence dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     aiInsights:
 *                       type: object
 *                       properties:
 *                         insights:
 *                           type: object
 *                         dataQuality:
 *                           $ref: '#/components/schemas/DataQuality'
 *                         aiProvider:
 *                           type: string
 *                     inventoryContext:
 *                       type: object
 *                     festivalContext:
 *                       type: object
 *                     quickActions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/QuickAction'
 *                 analysisQuality:
 *                   $ref: '#/components/schemas/DataQuality'
 *       500:
 *         description: AI analysis failed
 */
router.get('/dashboard', getAIBusinessDashboard);

/**
 * @swagger
 * /api/ai-intelligence/analysis/{category}:
 *   get:
 *     summary: Get specific AI analysis category
 *     tags: [AI Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sales_prediction, inventory_optimization, product_performance, customer_behavior, festival_preparation, pricing_strategy, business_insights]
 *         description: Specific analysis category to retrieve
 *     responses:
 *       200:
 *         description: Specific AI analysis results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                     analysis:
 *                       $ref: '#/components/schemas/AIInsight'
 *                     dataQuality:
 *                       $ref: '#/components/schemas/DataQuality'
 *                     aiProvider:
 *                       type: string
 *       400:
 *         description: Invalid analysis category
 *       500:
 *         description: Analysis failed
 */
router.get('/analysis/:category', getSpecificAIAnalysis);

/**
 * @swagger
 * /api/ai-intelligence/recommendations/products:
 *   get:
 *     summary: Get AI-powered product recommendations
 *     tags: [AI Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [general, festival, trending, seasonal]
 *           default: general
 *         description: Type of product recommendations
 *     responses:
 *       200:
 *         description: AI product recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     confidence:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 */
router.get('/recommendations/products', getAIProductRecommendations);

/**
 * @swagger
 * /api/ai-intelligence/forecasting/sales:
 *   get:
 *     summary: Get AI-powered sales forecasting
 *     tags: [AI Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           default: "30"
 *         description: Forecast timeframe in days
 *       - in: query
 *         name: includeSeasonality
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           default: "true"
 *         description: Include seasonal/festival factors in forecast
 *     responses:
 *       200:
 *         description: Sales forecasting results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     timeframe:
 *                       type: string
 *                     predictions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     seasonalFactors:
 *                       type: object
 *                       nullable: true
 *                     confidence:
 *                       type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/forecasting/sales', getAISalesForecasting);

/**
 * @swagger
 * /api/ai-intelligence/insights/inventory:
 *   get:
 *     summary: Get AI-powered inventory insights
 *     tags: [AI Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory insights and optimization recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     optimization:
 *                       $ref: '#/components/schemas/AIInsight'
 *                     currentStatus:
 *                       type: object
 *                     aiRecommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     productPerformance:
 *                       $ref: '#/components/schemas/AIInsight'
 *                     actionPriority:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/insights/inventory', getAIInventoryInsights);

/**
 * @swagger
 * /api/ai-intelligence/insights/customers:
 *   get:
 *     summary: Get AI-powered customer behavior analysis
 *     tags: [AI Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer behavior analysis and insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     behaviorPatterns:
 *                       type: array
 *                       items:
 *                         type: string
 *                     demographics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     preferences:
 *                       type: array
 *                       items:
 *                         type: string
 *                     loyaltyInsights:
 *                       type: array
 *                       items:
 *                         type: string
 *                     engagementSuggestions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     confidence:
 *                       type: string
 */
router.get('/insights/customers', getAICustomerAnalysis);

/**
 * @swagger
 * /api/ai-intelligence/recommendations/pricing:
 *   get:
 *     summary: Get AI-powered pricing recommendations
 *     tags: [AI Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pricing strategy recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     strategies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     optimizations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     seasonalAdjustments:
 *                       type: object
 *                       properties:
 *                         currentFactor:
 *                           type: number
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             type: string
 *                         upcomingFestivals:
 *                           type: array
 *                           items:
 *                             type: object
 *                     profitImpact:
 *                       type: string
 *                     confidence:
 *                       type: string
 */
router.get('/recommendations/pricing', getAIPricingRecommendations);

/**
 * @swagger
 * /api/ai-intelligence/reports/business:
 *   get:
 *     summary: Generate comprehensive AI business report
 *     tags: [AI Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *           default: json
 *         description: Report format
 *       - in: query
 *         name: includeCharts
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *           default: "false"
 *         description: Include visual charts in report
 *     responses:
 *       200:
 *         description: Comprehensive business intelligence report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportId:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     shopId:
 *                       type: string
 *                     reportType:
 *                       type: string
 *                     executiveSummary:
 *                       type: object
 *                     sections:
 *                       type: object
 *                     actionItems:
 *                       type: array
 *                       items:
 *                         type: string
 *                     dataQuality:
 *                       $ref: '#/components/schemas/DataQuality'
 *                     disclaimer:
 *                       type: string
 *       501:
 *         description: PDF format not yet implemented
 *       500:
 *         description: Report generation failed
 */
router.get('/reports/business', generateAIBusinessReport);

module.exports = router;
