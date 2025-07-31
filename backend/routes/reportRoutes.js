const express = require('express');
const router = express.Router();
const salesReportController = require('../controllers/salesReportController');

// GET /api/reports/sales/chart?period=day|week|month|year
router.get('/sales/chart', salesReportController.getSalesChart);

module.exports = router;
