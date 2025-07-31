const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const { createDynamicRateLimiter } = require('../middleware/rateLimiter');
const {
  getFestivalDashboard,
  getUpcomingFestivals,
  getFestivalRecommendations,
  convertToNepaliDate,
  updateAutoOrdersWithFestivalFactors,
  getFestivalPreparationChecklist
} = require('../controllers/festivalIntelligenceController');

// Apply authentication to all routes
router.use(authenticateJWT);

// Apply rate limiting for festival intelligence operations
const festivalRateLimit = createDynamicRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // Reasonable limit for festival data requests
});

router.use(festivalRateLimit);

/**
 * @swagger
 * components:
 *   schemas:
 *     NepaliDate:
 *       type: object
 *       properties:
 *         year:
 *           type: number
 *         month:
 *           type: number
 *         monthName:
 *           type: string
 *         day:
 *           type: number
 *         formatted:
 *           type: string
 *     Festival:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         englishName:
 *           type: string
 *         duration:
 *           type: number
 *         category:
 *           type: string
 *           enum: [major, religious, cultural]
 *         businessImpact:
 *           type: string
 *           enum: [low, medium, high, extreme]
 *         seasonalFactor:
 *           type: number
 *         daysUntil:
 *           type: number
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/festival-intelligence/dashboard:
 *   get:
 *     summary: Get comprehensive festival intelligence dashboard
 *     tags: [Festival Intelligence]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Festival dashboard data
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
 *                     nepaliDate:
 *                       $ref: '#/components/schemas/NepaliDate'
 *                     currentSeasonalFactor:
 *                       type: number
 *                     upcomingFestivals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Festival'
 *                     immediatePreparation:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Festival'
 *                     nextMajorFestival:
 *                       $ref: '#/components/schemas/Festival'
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     inventoryImpact:
 *                       type: object
 *                     actionItems:
 *                       type: array
 */
router.get('/dashboard', getFestivalDashboard);

/**
 * @swagger
 * /api/festival-intelligence/festivals/upcoming:
 *   get:
 *     summary: Get upcoming festivals within specified timeframe
 *     tags: [Festival Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 60
 *           minimum: 1
 *           maximum: 365
 *         description: Number of days to look ahead for festivals
 *     responses:
 *       200:
 *         description: List of upcoming festivals
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
 *                     festivals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Festival'
 *                     count:
 *                       type: number
 *                     timeframe:
 *                       type: string
 */
router.get('/festivals/upcoming', getUpcomingFestivals);

/**
 * @swagger
 * /api/festival-intelligence/festivals/{festivalKey}/recommendations:
 *   get:
 *     summary: Get specific festival recommendations
 *     tags: [Festival Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: festivalKey
 *         required: true
 *         schema:
 *           type: string
 *           enum: [dashain, tihar, holi, buddha_jayanti, teej, chhath]
 *         description: Festival identifier
 *     responses:
 *       200:
 *         description: Festival-specific recommendations
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
 *                     festival:
 *                       type: string
 *                     seasonalFactor:
 *                       type: number
 *                     businessImpact:
 *                       type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     suggestedActions:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: Festival not found
 */
router.get('/festivals/:festivalKey/recommendations', getFestivalRecommendations);

/**
 * @swagger
 * /api/festival-intelligence/festivals/{festivalKey}/checklist:
 *   get:
 *     summary: Get festival preparation checklist
 *     tags: [Festival Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: festivalKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Festival identifier
 *     responses:
 *       200:
 *         description: Festival preparation checklist
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
 *                     festival:
 *                       type: string
 *                     seasonalFactor:
 *                       type: number
 *                     preparationDays:
 *                       type: number
 *                     checklist:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           item:
 *                             type: string
 *                           completed:
 *                             type: boolean
 *                           priority:
 *                             type: string
 *                           description:
 *                             type: string
 *                     readinessScore:
 *                       type: number
 */
router.get('/festivals/:festivalKey/checklist', getFestivalPreparationChecklist);

/**
 * @swagger
 * /api/festival-intelligence/date/convert:
 *   get:
 *     summary: Convert English date to Nepali date
 *     tags: [Festival Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: English date to convert (YYYY-MM-DD). Defaults to today if not provided.
 *     responses:
 *       200:
 *         description: Date conversion result
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
 *                     englishDate:
 *                       type: string
 *                       format: date
 *                     nepaliDate:
 *                       $ref: '#/components/schemas/NepaliDate'
 *       400:
 *         description: Invalid date format
 */
router.get('/date/convert', convertToNepaliDate);

/**
 * @swagger
 * /api/festival-intelligence/auto-orders/apply-festival-factors:
 *   patch:
 *     summary: Apply festival seasonal factors to auto-orders
 *     tags: [Festival Intelligence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - festivalKey
 *             properties:
 *               festivalKey:
 *                 type: string
 *                 description: Festival identifier
 *               applyToAll:
 *                 type: boolean
 *                 default: false
 *                 description: Apply to all auto-orders or specific products
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific product IDs (required if applyToAll is false)
 *     responses:
 *       200:
 *         description: Festival factors applied successfully
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
 *                     festival:
 *                       type: string
 *                     seasonalFactor:
 *                       type: number
 *                     updatedAutoOrders:
 *                       type: number
 *                     message:
 *                       type: string
 *       404:
 *         description: Festival not found
 */
router.patch('/auto-orders/apply-festival-factors', updateAutoOrdersWithFestivalFactors);

module.exports = router;
