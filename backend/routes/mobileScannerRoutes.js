/**
 * Mobile Scanner Routes
 * Handles OCR processing, barcode scanning, and item addition (QR code, USB, and connection logic removed)
 */

const express = require('express');
const router = express.Router();
// All session/connection/USB/QR code logic removed
const mobileScannerController = require('../controllers/mobileScannerController');


// Direct barcode processing endpoint (no session/connection/QR/USB logic)
router.post('/process-barcode', async (req, res) => {
    try {
        const { barcode } = req.body;
        if (!barcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode is required'
            });
        }
        // TODO: Replace with actual product lookup from database
        const mockProduct = {
            name: `Product-${barcode}`,
            barcode: barcode,
            price: 9.99,
            category: 'General',
            stock: 50
        };
        res.json({
            success: true,
            product: mockProduct,
            message: `Product found for barcode: ${barcode}`
        });
    } catch (error) {
        console.error('Barcode processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process barcode',
            error: error.message
        });
    }
});

// OCR processing endpoint (direct, no session/connection logic)
router.post('/process-ocr', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required for OCR processing'
            });
        }
        // Mock AI analysis
        const analysis = {
            products: [],
            bills: [],
            text: text
        };
        // Simple pattern matching for demo
        if (text.toLowerCase().includes('product') || text.toLowerCase().includes('item')) {
            analysis.products.push({
                name: text.substring(0, 50),
                confidence: 0.85
            });
        }
        if (text.toLowerCase().includes('total') || text.toLowerCase().includes('$')) {
            analysis.bills.push({
                text: text.substring(0, 100),
                confidence: 0.90
            });
        }
        res.json({
            success: true,
            analysis: analysis
        });
    } catch (error) {
        console.error('OCR processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process OCR',
            error: error.message
        });
    }
});

// Add item endpoint
router.post('/add-item', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        // Mock item addition
        res.json({
            success: true,
            message: `${type} item added successfully`,
            item: data
        });
    } catch (error) {
        console.error('Add item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item',
            error: error.message
        });
    }
});

module.exports = router;
