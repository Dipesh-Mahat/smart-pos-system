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
                    <video id="scannerVideo" autoplay playsinline></video>
                    <div class="scan-overlay">
                        <div class="scan-line"></div>
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
        
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.currentStream = stream;
            this.video.srcObject = stream;
            
            // Start QuaggaJS scanning
            this.startQuaggaScanner();
            
        } catch (error) {
            alert('Camera access required for barcode scanning. Please allow camera permissions.');
            this.closeScanner();
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

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: this.video,
                constraints: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "upc_reader"
                ]
            }
        }, (err) => {
            if (err) {
                alert('Failed to initialize barcode scanner. Please use manual entry.');
                return;
            }
            
            Quagga.start();
            
            // Handle barcode detection
            Quagga.onDetected((result) => {
                if (result && result.codeResult && result.codeResult.code) {
                    const barcode = result.codeResult.code.trim();
                    
                    if (barcode && this.onBarcodeScanned) {
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
                // Ignore errors
            }
        }
        
        // Stop camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        // Hide modal
        this.modal.classList.remove('active');
    }
}

// Initialize simple scanner immediately
const simpleScanner = new SimpleScanner();
window.simpleScanner = simpleScanner;
window.scanner = simpleScanner; // Alias for compatibility
