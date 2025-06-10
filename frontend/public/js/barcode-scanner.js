/**
 * Barcode Scanner Integration Library
 * 
 * This module provides integration with popular barcode scanning libraries
 * and fallback to the built-in BarcodeDetector API when available.
 * 
 * Supported barcode formats:
 * - QR Code
 * - EAN-13
 * - EAN-8
 * - Code-128
 * - Code-39
 * - UPC-A
 * - UPC-E
 * - ITF
 * - Codabar
 */

class BarcodeScanner {
    constructor(options = {}) {
        this.options = {
            useQuagga: true,
            useZXing: true,
            useNativeDetector: true,
            preferredFormats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf', 'codabar'],
            videoConstraints: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            scanInterval: 100,
            ...options
        };
        
        this.isScanning = false;
        this.scanTimer = null;
        this.lastDetection = null;
        this.lastDetectionTime = 0;
        this.detectionDelay = 1000; // Prevent multiple detections within 1 second
        this.video = null;
        this.canvas = null;
        this.canvasContext = null;
        this.detector = null;
        this.scanningLibrary = null;
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
            
            // Fallback to simulation mode
            console.warn('No barcode scanning libraries available, falling back to simulation mode');
            this.scanningLibrary = 'simulation';
            return true;
        } catch (error) {
            console.error('Failed to initialize barcode scanner:', error);
            return false;
        }
    }
    
    /**
     * Start the video stream
     * @param {HTMLVideoElement} videoElement - Video element to use
     * @returns {Promise<MediaStream|null>} - Media stream or null if failed
     */
    async startVideo(videoElement) {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: this.options.videoConstraints,
                audio: false
            });
            
            this.video = videoElement;
            this.video.srcObject = stream;
            
            // Create canvas for processing
            this.canvas = document.createElement('canvas');
            this.canvasContext = this.canvas.getContext('2d');
            
            return stream;
        } catch (error) {
            console.error('Camera access error:', error);
            return null;
        }
    }
    
    /**
     * Start scanning for barcodes
     * @param {Function} onDetection - Callback for barcode detection
     * @returns {boolean} - Success status
     */
    startScanning(onDetection) {
        if (!this.video || !this.canvas || this.isScanning) {
            return false;
        }
        
        this.isScanning = true;
        
        // Set up canvas dimensions based on video
        const setupCanvas = () => {
            if (this.video.videoWidth && this.video.videoHeight) {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            } else {
                // Retry if video dimensions not available yet
                setTimeout(setupCanvas, 100);
            }
        };
        
        setupCanvas();
        
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
            default:
                this.startSimulatedScanning(onDetection);
                break;
        }
        
        return true;
    }
    
    /**
     * Start scanning using native BarcodeDetector API
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
                // Draw current video frame to canvas
                this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
                
                // Detect barcodes
                const barcodes = await this.detector.detect(this.canvas);
                
                if (barcodes.length > 0) {
                    this.handleDetection(barcodes[0], onDetection);
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
     * Start scanning using QuaggaJS
     * @param {Function} onDetection - Callback for barcode detection
     */
    startQuaggaScanning(onDetection) {
        if (typeof Quagga === 'undefined') {
            console.error('QuaggaJS not loaded');
            return;
        }
        
        try {
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: this.video,
                    constraints: {
                        width: this.canvas.width,
                        height: this.canvas.height,
                        facingMode: "environment"
                    }
                },
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "upc_reader",
                        "upc_e_reader"
                    ]
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: 2,
                frequency: 10,
                debug: false
            }, (err) => {
                if (err) {
                    console.error('QuaggaJS initialization error:', err);
                    // Fall back to simulation
                    this.scanningLibrary = 'simulation';
                    this.startSimulatedScanning(onDetection);
                    return;
                }
                
                Quagga.start();
                
                Quagga.onDetected((result) => {
                    if (result && result.codeResult) {
                        const barcode = {
                            format: result.codeResult.format,
                            rawValue: result.codeResult.code,
                            boundingBox: result.box || null
                        };
                        
                        this.handleDetection(barcode, onDetection);
                    }
                });
            });
        } catch (error) {
            console.error('QuaggaJS scanning error:', error);
            // Fall back to simulation
            this.scanningLibrary = 'simulation';
            this.startSimulatedScanning(onDetection);
        }
    }
    
    /**
     * Start scanning using ZXing
     * @param {Function} onDetection - Callback for barcode detection
     */
    startZXingScanning(onDetection) {
        if (typeof ZXing === 'undefined') {
            console.error('ZXing not loaded');
            return;
        }
        
        const codeReader = new ZXing.BrowserMultiFormatReader();
        
        try {
            codeReader.decodeFromVideoDevice(null, this.video, (result, err) => {
                if (result) {
                    const barcode = {
                        format: result.getBarcodeFormat(),
                        rawValue: result.getText(),
                        boundingBox: null
                    };
                    
                    this.handleDetection(barcode, onDetection);
                }
            });
        } catch (error) {
            console.error('ZXing scanning error:', error);
            // Fall back to simulation
            this.scanningLibrary = 'simulation';
            this.startSimulatedScanning(onDetection);
        }
    }
    
    /**
     * Start simulated barcode scanning (for development/testing)
     * @param {Function} onDetection - Callback for barcode detection
     */
    startSimulatedScanning(onDetection) {
        console.warn('Using simulated barcode scanning');
        
        const scan = () => {
            if (!this.isScanning) return;
            
            // Draw current video frame to canvas
            this.canvasContext.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Schedule next scan
            this.scanTimer = setTimeout(scan, this.options.scanInterval);
        };
        
        // Start scanning
        scan();
    }
    
    /**
     * Handle barcode detection and apply throttling
     * @param {Object} barcode - Detected barcode
     * @param {Function} onDetection - Callback for barcode detection
     */
    handleDetection(barcode, onDetection) {
        const now = Date.now();
        
        // Throttle detections to prevent duplicates
        if (now - this.lastDetectionTime < this.detectionDelay) {
            return;
        }
        
        // Check if this is the same barcode as the last one
        if (this.lastDetection && this.lastDetection.rawValue === barcode.rawValue) {
            // Only trigger if it's been a while since we last saw this barcode
            if (now - this.lastDetectionTime < 3000) {
                return;
            }
        }
        
        // Draw bounding box if available
        this.highlightDetection(barcode);
        
        // Update tracking
        this.lastDetection = barcode;
        this.lastDetectionTime = now;
        
        // Trigger callback
        if (typeof onDetection === 'function') {
            onDetection(barcode);
        }
    }
    
    /**
     * Highlight the detected barcode in the video
     * @param {Object} barcode - Detected barcode
     */
    highlightDetection(barcode) {
        if (!barcode.boundingBox || !this.canvas || !this.canvasContext) {
            return;
        }
        
        const box = barcode.boundingBox;
        
        // Draw rectangle around barcode
        this.canvasContext.strokeStyle = '#00FF00';
        this.canvasContext.lineWidth = 3;
        this.canvasContext.strokeRect(box.x, box.y, box.width, box.height);
        
        // Add label
        this.canvasContext.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.canvasContext.fillRect(box.x, box.y, box.width, box.height);
        
        // Add text
        this.canvasContext.fillStyle = '#FFFFFF';
        this.canvasContext.font = '16px Arial';
        this.canvasContext.fillText(
            barcode.rawValue,
            box.x + 10,
            box.y > 20 ? box.y - 10 : box.y + box.height + 20
        );
    }
    
    /**
     * Generate a simulated barcode detection for testing
     * @param {Object} options - Simulation options
     * @returns {Object} - Simulated barcode detection
     */
    simulateDetection(options = {}) {
        // Sample barcode formats
        const formats = ['ean_13', 'code_128', 'qr_code', 'upc_a'];
        
        // Sample barcode values
        const samples = {
            ean_13: ['9843201234567', '5901234123457', '4001724819264'],
            code_128: ['ABC-123-456', 'PROD-789', 'ITEM-2023-XY'],
            qr_code: ['https://example.com/product/123', 'SKU:ABC123XYZ', 'ID:45678'],
            upc_a: ['042100005264', '036000291452', '812345678901']
        };
        
        const format = options.format || formats[Math.floor(Math.random() * formats.length)];
        const formatSamples = samples[format] || samples.ean_13;
        const value = options.value || formatSamples[Math.floor(Math.random() * formatSamples.length)];
        
        // Generate random bounding box if video dimensions available
        let boundingBox = null;
        if (this.canvas && this.canvas.width && this.canvas.height) {
            const width = this.canvas.width * (0.2 + Math.random() * 0.3); // 20-50% of width
            const height = width / 2;
            const x = (this.canvas.width - width) * Math.random();
            const y = (this.canvas.height - height) * Math.random();
            
            boundingBox = { x, y, width, height };
        }
        
        return {
            format,
            rawValue: value,
            boundingBox
        };
    }
    
    /**
     * Trigger a simulated barcode detection
     * @param {Function} onDetection - Callback for barcode detection
     * @param {Object} options - Simulation options
     */
    triggerSimulation(onDetection, options = {}) {
        if (!this.isScanning) {
            return;
        }
        
        const barcode = this.simulateDetection(options);
        this.handleDetection(barcode, onDetection);
    }
    
    /**
     * Stop scanning for barcodes
     */
    stopScanning() {
        this.isScanning = false;
        
        if (this.scanTimer) {
            clearTimeout(this.scanTimer);
            this.scanTimer = null;
        }
        
        // Clean up based on the scanning library
        if (this.scanningLibrary === 'quagga' && typeof Quagga !== 'undefined') {
            try {
                Quagga.stop();
            } catch (e) {
                console.warn('Error stopping Quagga:', e);
            }
        } else if (this.scanningLibrary === 'zxing' && typeof ZXing !== 'undefined') {
            try {
                // Clean up ZXing resources if needed
            } catch (e) {
                console.warn('Error cleaning up ZXing:', e);
            }
        }
    }
    
    /**
     * Stop the video stream
     */
    stopVideo() {
        if (this.video && this.video.srcObject) {
            const stream = this.video.srcObject;
            const tracks = stream.getTracks();
            
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stopScanning();
        this.stopVideo();
        
        this.video = null;
        this.canvas = null;
        this.canvasContext = null;
        this.detector = null;
    }
}

// Export the scanner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarcodeScanner;
} else {
    window.BarcodeScanner = BarcodeScanner;
}
