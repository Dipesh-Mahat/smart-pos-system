/**
 * Enhanced Barcode Scanner with High Accuracy Settings
 * 
 * This module provides optimized barcode scanning with:
 * - Multi-library support (Quagga2, ZXing, Native BarcodeDetector)
 * - Improved camera configuration for better accuracy
 * - Error correction and validation
 * - Advanced pre-processing for poor lighting conditions
 */

class EnhancedBarcodeScanner {
    constructor(options = {}) {
        this.options = {
            // Default settings optimized for accuracy
            useQuagga: true,
            useZXing: true,
            useNativeDetector: true,
            preferredFormats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf', 'codabar'],
            videoConstraints: {
                facingMode: 'environment',
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                aspectRatio: { ideal: 1.777778 },
                frameRate: { min: 15, ideal: 30 }
            },
            quaggaConfig: {
                numOfWorkers: navigator.hardwareConcurrency || 4,
                locate: true,
                frequency: 10, // Scan every 10ms
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "upc_reader",
                        "upc_e_reader",
                        "i2of5_reader",
                        "2of5_reader"
                    ],
                    multiple: false
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                debug: false
            },
            scanInterval: 50,
            confirmationThreshold: 3, // Require same code 3 times for confirmation
            ...options
        };
        
        this.isScanning = false;
        this.scanTimer = null;
        this.lastDetection = null;
        this.lastDetectionTime = 0;
        this.detectionDelay = 800; // Prevent multiple detections within 0.8 second
        this.video = null;
        this.canvas = null;
        this.canvasContext = null;
        this.detector = null;
        this.scanningLibrary = null;
        this.confidenceThreshold = 0.7;
        this.barcodeConfirmations = new Map(); // Track multiple readings of same barcode for confirmation
    }
    
    /**
     * Initialize the barcode scanner
     * @returns {Promise<boolean>} - Success status
     */
    async initialize() {
        try {
            // Check if BarcodeDetector API is available
            if (this.options.useNativeDetector && 'BarcodeDetector' in window) {
                try {
                    const formats = await BarcodeDetector.getSupportedFormats();
                    const supportedFormats = this.options.preferredFormats.filter(format => 
                        formats.includes(format)
                    );
                    
                    if (supportedFormats.length > 0) {
                        this.detector = new BarcodeDetector({ formats: supportedFormats });
                        this.scanningLibrary = 'native';
                        console.log('Using native BarcodeDetector API');
                        return true;
                    }
                } catch (e) {
                    console.warn('Native BarcodeDetector API not fully supported:', e);
                }
            }
            
            // Load QuaggaJS if available
            if (this.options.useQuagga && typeof Quagga !== 'undefined') {
                this.scanningLibrary = 'quagga';
                console.log('Using QuaggaJS for barcode scanning');
                return true;
            }
            
            // Load ZXing if available
            if (this.options.useZXing && typeof ZXing !== 'undefined') {
                this.scanningLibrary = 'zxing';
                console.log('Using ZXing for barcode scanning');
                return true;
            }
            
            console.warn('No barcode scanning libraries available, falling back to simulation mode');
            this.scanningLibrary = 'simulation';
            return true;
        } catch (error) {
            console.error('Failed to initialize barcode scanner:', error);
            return false;
        }
    }
    
    /**
     * Start the video stream with optimal camera settings
     * @param {HTMLVideoElement} videoElement - Video element to use
     * @returns {Promise<MediaStream|null>} - Media stream or null if failed
     */
    async startVideo(videoElement) {
        if (!videoElement) {
            console.error('Video element is required');
            return null;
        }
        
        this.video = videoElement;
        
        try {
            // Request camera access with optimized constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                video: this.options.videoConstraints,
                audio: false
            });
            
            // Connect stream to video element
            this.video.srcObject = stream;
            this.video.play();
            
            // Create canvas for processing
            this.canvas = document.createElement('canvas');
            
            // Wait for video metadata to load
            await new Promise(resolve => {
                if (this.video.readyState >= 2) {
                    resolve();
                } else {
                    this.video.onloadedmetadata = () => resolve();
                }
            });
            
            // Set canvas dimensions to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.canvasContext = this.canvas.getContext('2d');
            
            return stream;
        } catch (error) {
            console.error('Failed to start video:', error);
            return null;
        }
    }
    
    /**
     * Start barcode scanning
     * @param {Function} onDetection - Callback for barcode detection
     * @returns {boolean} - Success status
     */
    startScanning(onDetection) {
        if (!this.video || !this.canvas || !this.canvasContext) {
            console.error('Video and canvas must be initialized first');
            return false;
        }
        
        if (this.isScanning) {
            console.warn('Scanning already in progress');
            return true;
        }
        
        this.isScanning = true;
        this.barcodeConfirmations.clear();
        
        // Start scanning based on the available library
        switch (this.scanningLibrary) {
            case 'native':
                this.startNativeScanning(onDetection);
                break;
            case 'quagga':
                this.startQuaggaScanning(onDetection);
                break;
            case 'zxing':
                this.startZXingScanning(onDetection);
                break;
            case 'simulation':
                console.warn('Using simulation mode for barcode scanning');
                break;
        }
        
        return true;
    }
    
    /**
     * Start scanning using native BarcodeDetector API with improved accuracy
     * @param {Function} onDetection - Callback for barcode detection
     */
    startNativeScanning(onDetection) {
        if (!this.detector) {
            console.error('BarcodeDetector not initialized');
            return;
        }
        
        const scan = async () => {
            if (!this.isScanning) return;
            
            try {
                // Ensure the video is playing
                if (this.video.paused || this.video.ended) {
                    await this.video.play();
                }
                
                // Draw current video frame to canvas
                this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                // Apply image enhancement for better detection
                this.enhanceImageForBarcode();
                
                // Detect barcodes
                const barcodes = await this.detector.detect(this.canvas);
                
                if (barcodes.length > 0) {
                    // Sort by best quality (largest area)
                    barcodes.sort((a, b) => {
                        const areaA = (a.boundingBox.width * a.boundingBox.height);
                        const areaB = (b.boundingBox.width * b.boundingBox.height);
                        return areaB - areaA;
                    });
                    
                    // Process highest quality barcode
                    const bestBarcode = barcodes[0];
                    this.confirmAndProcessBarcode(bestBarcode.rawValue, bestBarcode.format, onDetection);
                }
            } catch (error) {
                console.error('Barcode detection error:', error);
            }
            
            // Schedule next scan
            this.scanTimer = setTimeout(scan, this.options.scanInterval);
        };
        
        // Start scanning
        scan();
    }
    
    /**
     * Start scanning using QuaggaJS with optimized settings
     * @param {Function} onDetection - Callback for barcode detection
     */
    startQuaggaScanning(onDetection) {
        if (typeof Quagga === 'undefined') {
            console.error('QuaggaJS not loaded');
            return;
        }
        
        try {
            // Configure Quagga with optimized settings
            const config = {
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: this.video,
                    constraints: this.options.videoConstraints
                },
                ...this.options.quaggaConfig
            };
            
            Quagga.init(config, (err) => {
                if (err) {
                    console.error('QuaggaJS initialization error:', err);
                    this.scanningLibrary = 'simulation';
                    this.startSimulatedScanning(onDetection);
                    return;
                }
                
                console.log('QuaggaJS initialized');
                
                // Start Quagga processing
                Quagga.start();
                
                // Handle barcode detection
                Quagga.onDetected((result) => {
                    if (!result || !result.codeResult || !result.codeResult.code) return;
                    
                    const barcode = result.codeResult.code;
                    const format = result.codeResult.format;
                    const confidence = result.codeResult.confidence;
                    
                    // Only process if confidence is high enough
                    if (confidence >= this.confidenceThreshold) {
                        this.confirmAndProcessBarcode(barcode, format, onDetection, confidence);
                    }
                });
            });
            
        } catch (error) {
            console.error('Failed to start QuaggaJS scanning:', error);
            this.scanningLibrary = 'simulation';
            this.startSimulatedScanning(onDetection);
        }
    }
    
    /**
     * Enhance canvas image for better barcode detection
     * Applies preprocessing techniques for challenging environments
     */
    enhanceImageForBarcode() {
        // Skip in simulation mode
        if (this.scanningLibrary === 'simulation') return;
        
        try {
            // Get image data for processing
            const imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imageData.data;
            
            // Apply contrast enhancement
            const contrast = 1.2; // Increase contrast by 20%
            const brightness = 10; // Slightly brighten
            
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            
            for (let i = 0; i < data.length; i += 4) {
                // Apply contrast
                data[i] = factor * (data[i] - 128) + 128 + brightness;       // Red
                data[i + 1] = factor * (data[i + 1] - 128) + 128 + brightness; // Green
                data[i + 2] = factor * (data[i + 2] - 128) + 128 + brightness; // Blue
                
                // Adaptive thresholding for dark environments
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (avg < 70) { // Low light detection
                    data[i] = Math.min(255, data[i] * 1.3);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.3);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.3);
                }
            }
            
            // Put processed image back on canvas
            this.canvasContext.putImageData(imageData, 0, 0);
        } catch (e) {
            console.warn('Image enhancement failed:', e);
            // Continue without enhancement
        }
    }
    
    /**
     * Confirm multiple readings of same barcode for accuracy
     * @param {string} barcode - Detected barcode
     * @param {string} format - Barcode format
     * @param {Function} onDetection - Callback function
     * @param {number} confidence - Detection confidence
     */
    confirmAndProcessBarcode(barcode, format, onDetection, confidence = 1.0) {
        // Reject very short barcodes (likely errors)
        if (barcode.length < 5) return;
        
        const now = Date.now();
        
        // Enforce detection delay to prevent multiple triggers
        if (this.lastDetection === barcode && 
            (now - this.lastDetectionTime) < this.detectionDelay) {
            return;
        }
        
        // Track this barcode detection
        const confirmCount = (this.barcodeConfirmations.get(barcode) || 0) + 1;
        this.barcodeConfirmations.set(barcode, confirmCount);
        
        // Only trigger callback if we've confirmed the same code multiple times
        if (confirmCount >= this.options.confirmationThreshold) {
            this.lastDetection = barcode;
            this.lastDetectionTime = now;
            this.barcodeConfirmations.clear();
            
            // Validate barcode format before passing to callback
            if (this.validateBarcode(barcode, format)) {
                // Call the detection callback with formatted result
                onDetection({
                    barcode,
                    format,
                    confidence,
                    timestamp: now
                });
                
                // Provide visual feedback in UI (if available)
                this.showDetectionFeedback();
            }
        }
    }
    
    /**
     * Validate barcode format
     * @param {string} barcode - The barcode to validate
     * @param {string} format - The detected format
     * @returns {boolean} - Whether the barcode is valid
     */
    validateBarcode(barcode, format) {
        // Basic validation
        if (!barcode || barcode.length < 5) return false;
        
        // Format-specific validation
        switch (format) {
            case 'ean_13':
                return /^\\d{13}$/.test(barcode);
                
            case 'ean_8':
                return /^\\d{8}$/.test(barcode);
                
            case 'upc_a':
                return /^\\d{12}$/.test(barcode);
                
            case 'upc_e':
                return /^\\d{8}$/.test(barcode);
                
            case 'code_39':
                return /^[A-Z0-9\\-\\.\\s\\$\\/\\+\\%]*$/.test(barcode);
                
            case 'code_128':
                // Code 128 can encode all ASCII characters
                return barcode.length > 5;
                
            default:
                // Default validation: ensure reasonable length and no weird characters
                return /^[A-Za-z0-9\\-\\.\\s\\$\\/\\+\\%]*$/.test(barcode) && 
                       barcode.length >= 5 && 
                       barcode.length <= 50;
        }
    }
    
    /**
     * Show visual feedback for successful scan
     */
    showDetectionFeedback() {
        // Flash canvas with green overlay to indicate detection
        if (this.canvas && this.canvasContext) {
            const ctx = this.canvasContext;
            const originalCompositeOperation = ctx.globalCompositeOperation;
            const originalAlpha = ctx.globalAlpha;
            
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Restore original settings
            setTimeout(() => {
                ctx.globalCompositeOperation = originalCompositeOperation;
                ctx.globalAlpha = originalAlpha;
            }, 300);
        }
    }
    
    /**
     * Stop scanning and release resources
     */
    stopScanning() {
        this.isScanning = false;
        
        // Clear scan timer
        if (this.scanTimer) {
            clearTimeout(this.scanTimer);
            this.scanTimer = null;
        }
        
        // Release Quagga if it was being used
        if (this.scanningLibrary === 'quagga' && typeof Quagga !== 'undefined') {
            try {
                Quagga.stop();
            } catch (e) {
                console.warn('Error stopping Quagga:', e);
            }
        }
        
        // Clear detection tracking
        this.lastDetection = null;
        this.barcodeConfirmations.clear();
    }
    
    /**
     * Release all resources and stop camera stream
     */
    destroy() {
        // Stop scanning if active
        this.stopScanning();
        
        // Stop video stream if active
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        // Clean up references
        this.video = null;
        this.canvas = null;
        this.canvasContext = null;
        this.detector = null;
    }
}

// Make available globally
window.EnhancedBarcodeScanner = EnhancedBarcodeScanner;
