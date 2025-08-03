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
            // Try multiple ways to find the POS system
            let posSystem = window.posSystem || window.SmartPOSSystem;
            
            // If we can't find it yet, wait a bit and try again
            if (!posSystem) {
                setTimeout(() => {
                    posSystem = window.posSystem || window.SmartPOSSystem;
                    if (posSystem && posSystem.processBarcode) {
                        posSystem.processBarcode(barcode);
                    } else {
                        alert(`Scanned: ${barcode}\nPOS system not ready yet.`);
                    }
                }, 100);
                return;
            }
            
            if (posSystem.processBarcode) {
                posSystem.processBarcode(barcode);
            } else {
                alert(`Scanned barcode: ${barcode}`);
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

        // Apply willReadFrequently to all Canvas elements before Quagga initialization
        // This addresses the Canvas2D performance warning
        HTMLCanvasElement.prototype.getContext = (function(originalGetContext) {
            return function(type, attributes) {
                if (type === '2d') {
                    attributes = attributes || {};
                    attributes.willReadFrequently = true;
                }
                return originalGetContext.call(this, type, attributes);
            };
        })(HTMLCanvasElement.prototype.getContext);
        
        console.log('Starting QuaggaJS with video size:', this.video.videoWidth, 'x', this.video.videoHeight);

        // Simple, reliable Quagga configuration
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: this.video,
                area: {
                    top: "0%",    // top offset
                    right: "0%",  // right offset
                    left: "0%",   // left offset
                    bottom: "0%"  // bottom offset
                },
                singleChannel: false,
                constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    aspectRatio: { min: 1, max: 2 },
                    facingMode: "environment"
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader", 
                    "code_39_reader",
                    "upc_reader",
                    "upc_e_reader"
                ]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error('Quagga init error:', err);
                alert('Scanner initialization failed. Please try refreshing the page or check your camera permissions.');
                return;
            }
            
            console.log('QuaggaJS initialized successfully');
            
            try {
                Quagga.start();
                console.log('QuaggaJS started');
                
                // Handle successful barcode detection
                Quagga.onDetected((result) => {
                    if (result && result.codeResult && result.codeResult.code) {
                        const barcode = result.codeResult.code.trim();
                        console.log('Barcode detected:', barcode);
                        
                        if (barcode && this.onBarcodeScanned) {
                            // Stop scanning immediately
                            try {
                                Quagga.stop();
                            } catch (e) {
                                console.log('Quagga stop error (ignore):', e);
                            }
                            
                            this.closeScanner();
                            this.onBarcodeScanned(barcode);
                        }
                    }
                });
                
                // Configure frequency of processing to improve performance
                let lastProcessedTime = Date.now();
                Quagga.onProcessed((result) => {
                    // Throttle processing to prevent too frequent updates
                    const now = Date.now();
                    if (now - lastProcessedTime < 100) { // Process at most every 100ms
                        return;
                    }
                    lastProcessedTime = now;
                });
                
                
            } catch (startError) {
                console.error('Quagga start error:', startError);
                alert('Failed to start scanner: ' + startError.message);
            }
        });
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
