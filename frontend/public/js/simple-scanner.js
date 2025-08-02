// Simple Barcode Scanner
class SimpleScanner {
    constructor() {
        this.isScanning = false;
        this.currentStream = null;
        this.modal = null;
        this.video = null;
        this.onBarcodeScanned = null;
        this.init();
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
        this.video = document.getElementById('scannerVideo');
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
            cameraStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting camera access...';
        }
        
        try {
            // Debug: Show available cameras
            await this.getCameraInfo();
            
            // Try multiple camera configurations for best compatibility
            let stream = null;
            const cameraConfigs = [
                // First try: rear camera with high resolution
                {
                    video: {
                        facingMode: { exact: 'environment' },
                        width: { ideal: 1920, min: 640 },
                        height: { ideal: 1080, min: 480 },
                        aspectRatio: { ideal: 16/9 }
                    }
                },
                // Fallback: rear camera with medium resolution
                {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 720, min: 480 }
                    }
                },
                // Last resort: any available camera
                {
                    video: {
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 720, min: 480 }
                    }
                }
            ];

            for (let i = 0; i < cameraConfigs.length; i++) {
                const config = cameraConfigs[i];
                try {
                    if (cameraStatus) {
                        cameraStatus.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Trying camera configuration ${i + 1}...`;
                    }
                    
                    stream = await navigator.mediaDevices.getUserMedia(config);
                    console.log('Camera config successful:', config);
                    break;
                } catch (err) {
                    console.log(`Camera config ${i + 1} failed:`, err);
                    if (cameraStatus && i === cameraConfigs.length - 1) {
                        cameraStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Camera access failed';
                    }
                }
            }

            if (!stream) {
                throw new Error('No camera available');
            }
            
            this.currentStream = stream;
            this.video.srcObject = stream;
            
            if (cameraStatus) {
                cameraStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting camera...';
            }
            
            // Wait for video to load and set proper orientation
            this.video.onloadedmetadata = () => {
                console.log('Video metadata loaded');
                
                // Ensure video plays and is properly oriented
                this.video.play().then(() => {
                    console.log('Video playing successfully');
                    
                    if (cameraStatus) {
                        cameraStatus.innerHTML = '<i class="fas fa-check"></i> Camera ready - point at barcode';
                        setTimeout(() => {
                            cameraStatus.style.display = 'none';
                        }, 2000);
                    }
                    
                    // Fix video display orientation
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        const settings = videoTrack.getSettings();
                        console.log('Camera settings:', settings);
                        
                        // Apply CSS transform based on camera type
                        if (settings.facingMode === 'user') {
                            // Front camera - horizontal flip for mirror effect
                            this.video.style.transform = 'scaleX(-1)';
                            console.log('Applied front camera mirror transform');
                        } else {
                            // Back camera - no transform needed
                            this.video.style.transform = 'none';
                            console.log('Using back camera - no transform');
                        }
                    }
                    
                    // Start QuaggaJS scanning after video is ready
                    setTimeout(() => this.startQuaggaScanner(), 500);
                    
                }).catch(err => {
                    console.error('Video play error:', err);
                    if (cameraStatus) {
                        cameraStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Video play failed';
                    }
                });
            };
            
            this.video.onerror = (err) => {
                console.error('Video error:', err);
                if (cameraStatus) {
                    cameraStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Video error';
                }
            };
            
        } catch (error) {
            console.error('Camera access error:', error);
            if (cameraStatus) {
                cameraStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Camera access denied';
                cameraStatus.style.color = '#ef476f';
            }
            
            setTimeout(() => {
                alert('Camera access is required for barcode scanning. Please:\n\n1. Allow camera permissions when prompted\n2. Make sure no other app is using the camera\n3. Try refreshing the page\n\nYou can also enter barcodes manually below.');
                if (cameraStatus) cameraStatus.style.display = 'none';
            }, 1000);
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
        if (typeof Quagga === 'undefined') {
            alert('Barcode scanner not available. Please use manual entry.');
            return;
        }

        // Wait for video to be ready
        if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
            setTimeout(() => this.startQuaggaScanner(), 100);
            return;
        }

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: this.video,
                constraints: {
                    width: { min: 640, ideal: 1280 },
                    height: { min: 480, ideal: 720 },
                    facingMode: "environment",
                    aspectRatio: { ideal: 16/9 }
                },
                singleChannel: false // Use color information for better detection
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10, // Scan frequency
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader", 
                    "ean_8_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader"
                ]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error('Quagga initialization error:', err);
                alert('Failed to initialize barcode scanner. Please use manual entry.');
                return;
            }
            
            console.log('Quagga initialized successfully');
            Quagga.start();
            
            // Handle barcode detection with confidence check
            Quagga.onDetected((result) => {
                if (result && result.codeResult && result.codeResult.code) {
                    const barcode = result.codeResult.code.trim();
                    const confidence = result.codeResult.decodedCodes.reduce((sum, code) => sum + code.error, 0) / result.codeResult.decodedCodes.length;
                    
                    // Only accept barcodes with reasonable confidence
                    if (barcode && confidence < 0.3 && this.onBarcodeScanned) {
                        console.log('Barcode detected:', barcode, 'Confidence:', confidence);
                        Quagga.stop();
                        this.closeScanner();
                        this.onBarcodeScanned(barcode);
                    }
                }
            });
        });
    }

    processManualBarcode() {
        const input = document.getElementById('manualBarcodeInput');
        const barcode = input.value.trim();
        
        if (barcode && this.onBarcodeScanned) {
            this.closeScanner();
            this.onBarcodeScanned(barcode);
            input.value = '';
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
