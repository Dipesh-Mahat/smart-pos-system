/**
 * Mobile Scanner Routes
 * Handles QR code generation, OCR processing, and mobile scanning
 */

const express = require('express');
const router = express.Router();

// Simple status endpoint for testing
router.get('/status', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Mobile scanner API is running',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'healthy',
        service: 'mobile-scanner'
    });
});

// QR Code generation endpoint
router.post('/generate-qr', async (req, res) => {
    try {
        const QRCode = require('qrcode');
        const { scanType = 'product' } = req.body;
        
        // Generate URL based on environment
        const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
        const baseUrl = isLocal 
            ? `http://localhost:${process.env.PORT || 5000}` 
            : (process.env.NODE_ENV === 'production' 
                ? 'https://smart-pos-system-lime.vercel.app'
                : `http://${req.hostname}`);
        
        const scannerUrl = `${baseUrl}/../frontend/mobile-scanner.html?type=${scanType}&timestamp=${Date.now()}`;
        
        // Generate QR code
        const qrCodeData = await QRCode.toDataURL(scannerUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: '#4f46e5',
                light: '#ffffff'
            }
        });
        
        res.json({
            success: true,
            qrCode: qrCodeData,
            url: scannerUrl,
            scanType: scanType
        });
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code',
            error: error.message
        });
    }
});

// Barcode processing endpoint
router.post('/process-barcode', async (req, res) => {
    try {
        const { barcode, scanType } = req.body;
        
        if (!barcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode is required'
            });
        }
        
        // For now, return a mock response
        res.json({
            success: true,
            product: {
                name: `Product-${barcode}`,
                barcode: barcode,
                price: 9.99
            },
            scanType: scanType,
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

// OCR processing endpoint
router.post('/process-ocr', async (req, res) => {
    try {
        const { text, scanType } = req.body;
        
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
            analysis: analysis,
            scanType: scanType
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
