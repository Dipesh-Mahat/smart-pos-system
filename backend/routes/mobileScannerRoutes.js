/**
 * Enhanced Mobile Scanner Routes
 * Handles QR code generation, OCR processing, USB/WiFi connectivity, and real-time scanning
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Simple status endpoint for testing
router.get('/status', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Enhanced Mobile scanner API is running',
        timestamp: new Date().toISOString(),
        features: ['qr-wifi-connection', 'usb-direct-access', 'real-time-scanning']
    });
});

// Check USB connection status
router.get('/usb-status', (req, res) => {
    // This endpoint will be used to check if mobile device is connected via USB
    res.json({
        success: true,
        usbConnected: false, // Will be dynamically checked
        message: 'USB status checked'
    });
});

// Generate session for WiFi/QR scanning
router.post('/create-session', async (req, res) => {
    try {
        const sessionId = uuidv4();
        const { scanType = 'product' } = req.body;
        
        // Store session in memory (in production, use Redis)
        global.scannerSessions = global.scannerSessions || {};
        global.scannerSessions[sessionId] = {
            id: sessionId,
            scanType,
            createdAt: new Date(),
            connected: false,
            deviceInfo: null
        };
        
        res.json({
            success: true,
            sessionId,
            scanType,
            message: 'Scanner session created'
        });
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create scanner session'
        });
    }
});

// Connect mobile device to session
router.post('/connect-session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { deviceInfo } = req.body;
        
        global.scannerSessions = global.scannerSessions || {};
        
        if (!global.scannerSessions[sessionId]) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        global.scannerSessions[sessionId].connected = true;
        global.scannerSessions[sessionId].deviceInfo = deviceInfo;
        global.scannerSessions[sessionId].connectedAt = new Date();
        
        // Emit connection event via Socket.IO if available
        if (req.app.get('io')) {
            req.app.get('io').emit('device-connected', {
                sessionId,
                deviceInfo
            });
        }
        
        res.json({
            success: true,
            message: 'Device connected successfully',
            sessionId
        });
    } catch (error) {
        console.error('Session connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to connect to session'
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'healthy',
        service: 'mobile-scanner'
    });
});

// Enhanced QR Code generation endpoint for WiFi connection
router.post('/generate-qr', async (req, res) => {
    try {
        const QRCode = require('qrcode');
        const os = require('os');
        const { scanType = 'product' } = req.body;
        
        // Create a session for this scanning request
        const sessionId = uuidv4();
        global.scannerSessions = global.scannerSessions || {};
        global.scannerSessions[sessionId] = {
            id: sessionId,
            scanType,
            createdAt: new Date(),
            connected: false
        };
        
        // Get WiFi network IP address
        function getNetworkIP() {
            const interfaces = os.networkInterfaces();
            
            // Look for WiFi interface first (case-insensitive)
            for (const ifaceName in interfaces) {
                const lowerName = ifaceName.toLowerCase();
                if (lowerName.includes('wifi') || 
                    lowerName.includes('wi-fi') ||
                    lowerName.includes('wlan') ||
                    lowerName.includes('wireless') ||
                    lowerName.includes('wlp')) {
                    const addresses = interfaces[ifaceName];
                    for (const addr of addresses) {
                        if (addr.family === 'IPv4' && !addr.internal && 
                            !addr.address.startsWith('169.254') && // Skip link-local
                            addr.address !== '127.0.0.1') { // Skip localhost
                            console.log(`Found WiFi IP: ${addr.address} on interface: ${ifaceName}`);
                            return addr.address;
                        }
                    }
                }
            }
            
            // Fall back to any IPv4 non-internal interface (excluding VirtualBox, VMware, Docker)
            for (const ifaceName in interfaces) {
                const lowerName = ifaceName.toLowerCase();
                if (!lowerName.includes('vmware') && 
                    !lowerName.includes('virtualbox') && 
                    !lowerName.includes('docker') &&
                    !lowerName.includes('loopback')) {
                    const addresses = interfaces[ifaceName];
                    for (const addr of addresses) {
                        if (addr.family === 'IPv4' && !addr.internal && 
                            !addr.address.startsWith('169.254') && // Skip link-local
                            !addr.address.startsWith('192.168.56') && // Skip VirtualBox
                            !addr.address.startsWith('192.168.18') && // Skip VMware
                            !addr.address.startsWith('192.168.211') && // Skip VMware
                            addr.address !== '127.0.0.1') { // Skip localhost
                            console.log(`Found network IP: ${addr.address} on interface: ${ifaceName}`);
                            return addr.address;
                        }
                    }
                }
            }
            
            return '192.168.0.100'; // Default fallback based on current WiFi
        }
        
        // Generate URL based on environment
        let frontendUrl;
        
        if (process.env.NODE_ENV === 'production') {
            // Production - point to deployed frontend
            frontendUrl = 'https://smart-pos-system-lime.vercel.app';
        } else {
            // Development - use network IP for WiFi connectivity
            const networkIP = getNetworkIP();
            frontendUrl = `http://${networkIP}:8080`;
        }
        
        const scannerUrl = `${frontendUrl}/mobile-scanner.html?sessionId=${sessionId}&type=${scanType}&mode=wifi`;
        
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
            sessionId,
            scanType: scanType,
            connectionMode: 'wifi-qr'
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

// Enhanced barcode processing endpoint with session support
router.post('/process-barcode', async (req, res) => {
    try {
        const { barcode, scanType, sessionId, connectionMode } = req.body;
        
        if (!barcode) {
            return res.status(400).json({
                success: false,
                message: 'Barcode is required'
            });
        }
        
        // Verify session if using WiFi mode
        if (connectionMode === 'wifi' && sessionId) {
            global.scannerSessions = global.scannerSessions || {};
            if (!global.scannerSessions[sessionId]) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid session'
                });
            }
        }
        
        // TODO: Replace with actual product lookup from database
        const mockProduct = {
            name: `Product-${barcode}`,
            barcode: barcode,
            price: 9.99,
            category: 'General',
            stock: 50
        };
        
        // Emit scan result via Socket.IO for real-time updates
        if (req.app.get('io') && sessionId) {
            req.app.get('io').emit('scan-result', {
                sessionId,
                barcode,
                product: mockProduct,
                timestamp: new Date()
            });
        }
        
        res.json({
            success: true,
            product: mockProduct,
            scanType: scanType,
            connectionMode: connectionMode || 'direct',
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

// USB direct access endpoint
router.post('/usb-scan', async (req, res) => {
    try {
        const { action, deviceInfo } = req.body;
        
        if (action === 'request-camera') {
            // This will be handled by the frontend USB API
            res.json({
                success: true,
                message: 'Camera access requested',
                connectionMode: 'usb-direct',
                instructions: 'Please allow camera access on your mobile device'
            });
        } else if (action === 'scan-ready') {
            res.json({
                success: true,
                message: 'USB scanning ready',
                connectionMode: 'usb-direct'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid USB action'
            });
        }
    } catch (error) {
        console.error('USB scan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process USB scan request'
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
