// Simple Barcode Scanner
class SimpleScanner {
    constructor() {
        this.isScanning = false;
        this.currentStream = null;
        this.modal = null;
        this.video = null;
        this.onBarcodeScanned = null;
        
        // Test if QuaggaJS is available
        this.checkQuaggaAvailability();
        
        this.init();
    }

    checkQuaggaAvailability() {
        if (typeof Quagga === 'undefined') {
            console.error('QuaggaJS not loaded! Make sure the script is included.');
            setTimeout(() => {
                if (typeof Quagga === 'undefined') {
                    console.error('QuaggaJS still not available after delay');
                }
            }, 2000);
        } else {
            console.log('QuaggaJS is available');
        }
    }

    init() {
        // Wait for DOM to be ready before creating modal
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createModal();
                this.setupEventListeners();
            });
        } else {
            this.createModal();
            this.setupEventListeners();
        }
    }

    createModal() {
        // Remove any existing modal first
        const existingModal = document.getElementById('scannerModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create scanner modal
        this.modal = document.createElement('div');
        this.modal.className = 'camera-modal';
        this.modal.id = 'scannerModal';
        
        this.modal.innerHTML = `
            <div class="camera-modal-content">
                <div class="camera-header">
                    <h3><i class="fas fa-camera"></i> Scan Barcode</h3>
                    <button class="close-camera" onclick="window.simpleScanner.closeScanner()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="camera-container">
                    <video id="scannerVideo" autoplay playsinline muted></video>
                    <div class="scan-overlay">
                        <div class="scan-line"></div>
                        <div class="scan-corners">
                            <div class="corner top-left"></div>
                            <div class="corner top-right"></div>
                            <div class="corner bottom-left"></div>
                            <div class="corner bottom-right"></div>
                        </div>
                    </div>
                    <div class="camera-status" id="cameraStatus" style="display: none;">
                        <i class="fas fa-spinner fa-spin"></i> Initializing camera...
                    </div>
                </div>
                <div class="manual-entry">
                    <p>Can't scan? Enter barcode manually:</p>
                    <input type="text" id="manualBarcodeInput" placeholder="Enter barcode...">
                    <button onclick="window.simpleScanner.processManualBarcode()">Add Product</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Get video element reference
        this.video = document.getElementById('scannerVideo');
        if (!this.video) {
            console.error('Failed to create video element!');
        } else {
            console.log('Video element created successfully');
        }
    }

    setupEventListeners() {
        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeScanner();
            }
        });

        // Handle manual barcode input
        const manualInput = document.getElementById('manualBarcodeInput');
        if (manualInput) {
            manualInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.processManualBarcode();
                }
            });
        }
    }

    async startScanner(callback) {
        if (this.isScanning) return;
        
        this.onBarcodeScanned = callback;
        this.isScanning = true;
        
        // Show modal
        this.modal.classList.add('active');
        
        // Show camera status
        const cameraStatus = document.getElementById('cameraStatus');
        if (cameraStatus) {
            cameraStatus.style.display = 'flex';
            cameraStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting camera...';
        }
        
        try {
            // Simple camera constraints that work better
            const constraints = {
                video: {
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 30, max: 30 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.currentStream = stream;
            this.video.srcObject = stream;
            
            // Force video to show immediately
            this.video.play();
            
            if (cameraStatus) {
                cameraStatus.innerHTML = '<i class="fas fa-check"></i> Camera ready!';
                setTimeout(() => {
                    cameraStatus.style.display = 'none';
                }, 1500);
            }
            
            // Fix video orientation - force no transform for all cameras
            this.video.style.transform = 'none';
            this.video.style.objectFit = 'cover';
            
            // Start scanning immediately when video is ready
            this.video.addEventListener('loadedmetadata', () => {
                console.log('Video ready - starting scanner');
                setTimeout(() => this.startQuaggaScanner(), 1000);
            });
            
        } catch (error) {
            console.error('Camera error:', error);
            if (cameraStatus) {
                cameraStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Camera failed';
                cameraStatus.style.color = '#ef476f';
            }
            
            alert('Camera access failed. Please:\n1. Allow camera permissions\n2. Make sure camera is not used by another app\n3. Try refreshing the page');
        }
    }

    // Alias method for compatibility
    startScan() {
        console.log('🚀 Starting scanner...');
        
        // Ensure modal is created before starting scan
        if (!this.modal) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.startScan();
                });
                return;
            } else {
                this.createModal();
                this.setupEventListeners();
            }
        }
        
        this.startScanner((barcode) => {
            console.log('📱 Scanner callback received barcode:', barcode);
            
            // Try multiple ways to find the POS system
            let posSystem = window.posSystem || window.SmartPOSSystem;
            
            console.log('🔍 Looking for POS system...', {
                posSystem: !!posSystem,
                windowPosSystem: !!window.posSystem,
                windowSmartPOSSystem: !!window.SmartPOSSystem
            });
            
            // If we can't find it yet, wait a bit and try again
            if (!posSystem) {
                console.log('⏳ POS system not found, waiting...');
                setTimeout(() => {
                    posSystem = window.posSystem || window.SmartPOSSystem;
                    console.log('🔄 Retry - POS system found:', !!posSystem);
                    
                    if (posSystem && posSystem.processBarcode) {
                        console.log('✅ Processing barcode with POS system:', barcode);
                        posSystem.processBarcode(barcode);
                    } else {
                        console.error('❌ POS system still not ready');
                        alert(`Scanned: ${barcode}\n\nPOS system not ready yet. Please try again.`);
                    }
                }, 100);
                return;
            }
            
            if (posSystem && posSystem.processBarcode) {
                console.log('✅ Processing barcode immediately:', barcode);
                posSystem.processBarcode(barcode);
            } else {
                console.error('❌ POS system found but no processBarcode method');
                alert(`Scanned barcode: ${barcode}\n\nCannot add to cart - POS system error.`);
            }
        });
    }

    startQuaggaScanner() {
        // Check if Quagga is loaded
        if (typeof Quagga === 'undefined') {
            console.error('QuaggaJS not loaded');
            alert('Barcode scanner library not loaded. Please refresh the page and try again.');
            return;
        }

        // Make sure video is ready
        if (!this.video || this.video.videoWidth === 0) {
            console.log('Video not ready, retrying in 500ms...');
            setTimeout(() => this.startQuaggaScanner(), 500);
            return;
        }

        console.log('Starting QuaggaJS with video size:', this.video.videoWidth, 'x', this.video.videoHeight);

        // Simple, reliable Quagga configuration
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: this.video
            },
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader", 
                    "code_39_reader",
                    "upc_reader",
                    "upc_e_reader"
                ]
            }
        }, (err) => {
            if (err) {
                console.error('Quagga init error:', err);
                alert('Scanner initialization failed: ' + err.message + '\n\nPlease use manual barcode entry.');
                return;
            }
            
            console.log('QuaggaJS initialized successfully');
            
            try {
                Quagga.start();
                console.log('QuaggaJS started and listening for barcodes...');
                
                // Show visual feedback that scanning is active
                const scanLine = document.querySelector('.scan-line');
                if (scanLine) {
                    scanLine.classList.add('active');
                }
                
                // Handle successful barcode detection
                Quagga.onDetected((result) => {
                    if (result && result.codeResult && result.codeResult.code) {
                        const barcode = result.codeResult.code.trim();
                        console.log('🎯 BARCODE DETECTED:', barcode);
                        
                        if (barcode && this.onBarcodeScanned) {
                            // Stop scanning immediately to prevent multiple scans
                            console.log('Stopping scanner and processing barcode...');
                            
                            try {
                                Quagga.stop();
                                console.log('Quagga stopped');
                            } catch (e) {
                                console.log('Quagga stop error (ignore):', e);
                            }
                            
                            // Close scanner modal  
                            this.closeScanner();
                            
                            // Process the barcode
                            console.log('Calling barcode callback with:', barcode);
                            this.onBarcodeScanned(barcode);
                        }
                    }
                });
                
                // Add some debug info for failed detections
                Quagga.onProcessed((result) => {
                    if (result && result.boxes) {
                        // Only log every 30th frame to avoid spam
                        if (Math.random() < 0.03) {
                            console.log('Scanner processing... looking for barcodes');
                        }
                    }
                });
                
            } catch (startError) {
                console.error('Quagga start error:', startError);
                alert('Failed to start scanner: ' + startError.message);
            }
        });
    }

    processManualBarcode() {
        const input = document.getElementById('manualBarcodeInput');
        const barcode = input.value.trim();
        
        console.log('📝 Manual barcode entered:', barcode);
        
        if (barcode && this.onBarcodeScanned) {
            console.log('✅ Processing manual barcode...');
            this.closeScanner();
            this.onBarcodeScanned(barcode);
            input.value = '';
        } else {
            console.log('❌ No barcode entered or no callback available');
            alert('Please enter a barcode');
        }
    }

    closeScanner() {
        this.isScanning = false;
        
        // Stop Quagga
        if (typeof Quagga !== 'undefined') {
            try {
                Quagga.stop();
            } catch (e) {
                console.log('Quagga stop error (ignore):', e);
            }
        }
        
        // Stop camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped camera track:', track.label);
            });
            this.currentStream = null;
        }
        
        // Reset video element
        if (this.video) {
            this.video.srcObject = null;
            this.video.style.transform = 'none'; // Reset any transforms
        }
        
        // Hide modal
        this.modal.classList.remove('active');
        
        // Clear callback
        this.onBarcodeScanned = null;
    }

    // Debug method to check camera capabilities
    async getCameraInfo() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            console.log('Available cameras:', videoDevices);
            return videoDevices;
        } catch (error) {
            console.error('Error getting camera info:', error);
            return [];
        }
    }
}

// Initialize simple scanner immediately
const simpleScanner = new SimpleScanner();
window.simpleScanner = simpleScanner;
window.scanner = simpleScanner; // Alias for compatibility
