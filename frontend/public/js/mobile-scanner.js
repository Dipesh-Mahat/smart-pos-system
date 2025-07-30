/**
 * Mobile Scanner with Barcode and Bill OCR Support
 * Smart POS System - Mobile Scanner Interface
 */

class MobileScanner {
    constructor() {
        this.scanMode = 'barcode'; // 'barcode' or 'bill'
        this.stream = null;
        this.isFlashOn = false;
        this.roomCode = null;
        this.scannedItems = [];
        this.barcodeScanner = null;
        this.billScanner = null;
        this.isMobile = this.isMobileDevice();
        this.deviceId = null;
        this.init();
    }

    init() {
        this.extractRoomCode();
        this.setupUI();
        this.updateConnectionStatus();
        this.requestCamera();
        this.setupQRCodeHandling();
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);
    }

    extractRoomCode() {
        const urlParams = new URLSearchParams(window.location.search);
        this.roomCode = urlParams.get('room') || 'MOBILE';
        this.scanMode = urlParams.get('mode') || 'barcode'; // Get scan mode from URL
        document.getElementById('roomCode').textContent = `Room: ${this.roomCode}`;
        this.updateScanModeUI();
    }

    setupUI() {
        // Add mode toggle buttons
        const scannerContainer = document.querySelector('.scanner-container');
        const modeToggle = document.createElement('div');
        modeToggle.className = 'mode-toggle';
        modeToggle.innerHTML = `
            <div class="mode-buttons">
                <button class="mode-btn ${this.scanMode === 'barcode' ? 'active' : ''}" data-mode="barcode">
                    <i class="fas fa-barcode"></i> Product Scanner
                </button>
                <button class="mode-btn ${this.scanMode === 'bill' ? 'active' : ''}" data-mode="bill">
                    <i class="fas fa-receipt"></i> Bill Scanner
                </button>
            </div>
        `;
        
        // Insert after room info
        const roomInfo = document.getElementById('roomInfo');
        roomInfo.parentNode.insertBefore(modeToggle, roomInfo.nextSibling);

        // Add event listeners for mode toggle
        modeToggle.addEventListener('click', (e) => {
            const modeBtn = e.target.closest('.mode-btn');
            if (modeBtn) {
                this.switchScanMode(modeBtn.dataset.mode);
            }
        });
    }

    switchScanMode(mode) {
        this.scanMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.updateScanModeUI();
        this.showNotification(`Switched to ${mode === 'barcode' ? 'Product' : 'Bill'} Scanner`, 'success');
    }

    updateScanModeUI() {
        const scanButton = document.getElementById('scanButton');
        const manualInput = document.querySelector('.manual-input h3');
        const scannedItems = document.querySelector('.scanned-items h3');
        
        if (this.scanMode === 'barcode') {
            scanButton.innerHTML = '<i class="fas fa-barcode"></i> Scan Product';
            manualInput.innerHTML = '<i class="fas fa-keyboard"></i> Manual Product Entry';
            scannedItems.innerHTML = '<i class="fas fa-list"></i> Scanned Products';
            document.getElementById('manualBarcode').placeholder = "Enter product barcode";
        } else {
            scanButton.innerHTML = '<i class="fas fa-receipt"></i> Scan Bill';
            manualInput.innerHTML = '<i class="fas fa-keyboard"></i> Manual Bill Entry';
            scannedItems.innerHTML = '<i class="fas fa-list"></i> Scanned Bills';
            document.getElementById('manualBarcode').placeholder = "Enter bill number or ID";
        }
    }

    async updateConnectionStatus() {
        const statusDot = document.getElementById('statusDot');
        const connectionStatus = document.getElementById('connectionStatus');

        // First attempt to connect
        statusDot.classList.add('connecting');
        connectionStatus.textContent = 'Connecting to POS Terminal...';

        // Simulate connection process
        setTimeout(() => {
            this.showNotification('Finding POS terminal...', 'info');
        }, 500);

        setTimeout(() => {
            this.showNotification(`Authenticating with room code: ${this.roomCode}`, 'info');
        }, 1200);

        setTimeout(async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            // Connect to room using the connection module
            if (typeof mobileScannerConnection !== 'undefined') {
                this.deviceId = mobileScannerConnection.connectDevice(
                    this.roomCode, 
                    {
                        type: 'mobile',
                        scanMode: this.scanMode,
                        browser: navigator.userAgent,
                        os: navigator.platform,
                        capabilities: {
                            camera: !!navigator.mediaDevices,
                            vibration: 'vibrate' in navigator,
                            barcode: true,
                            ocr: true
                        }
                    },
                    token
                );
                this.setupReconnectionHandling();
            }

            // Connection established
            if (this.deviceId) {
                statusDot.classList.remove('connecting');
                statusDot.classList.add('connected');
                connectionStatus.textContent = 'Connected to POS Terminal';
                this.showNotification('Connected to POS Terminal', 'success');

                if ('vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200]);
                }

                // Auto-start camera and scanning UI
                await this.requestCamera();
            } else {
                statusDot.classList.remove('connecting');
                statusDot.className = 'status-dot';
                connectionStatus.textContent = 'Connection failed';
                this.showNotification('Failed to connect. Invalid room code or authentication token.', 'error');
            }
        }, 2000);
    }

    setupReconnectionHandling() {
        if (typeof mobileScannerConnection !== 'undefined') {
            mobileScannerConnection.on('message_to_device', (data) => {
                if (data.deviceId === this.deviceId || data.deviceId === 'all') {
                    if (data.messageType === 'barcode_processed') {
                        const success = data.messageData.success;
                        if (success) {
                            this.showNotification(`Product added: ${data.messageData.product.name}`, 'success');
                        } else {
                            this.showNotification(`Error: ${data.messageData.error}`, 'error');
                        }
                    } else if (data.messageType === 'bill_processed') {
                        const success = data.messageData.success;
                        if (success) {
                            this.showNotification(`Bill processed: ${data.messageData.items.length} items found`, 'success');
                        } else {
                            this.showNotification(`Bill error: ${data.messageData.error}`, 'error');
                        }
                    }
                }
            });
        }
    }

    async requestCamera() {
        try {
            // Initialize the barcode scanner
            this.barcodeScanner = new BarcodeScanner({
                videoConstraints: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                scanInterval: 150
            });
            
            const initialized = await this.barcodeScanner.initialize();
            if (!initialized) {
                throw new Error('Failed to initialize barcode scanner');
            }
            
            const video = document.getElementById('mobileVideo');
            this.stream = await this.barcodeScanner.startVideo(video);
            
            if (!this.stream) {
                throw new Error('Failed to start video stream');
            }
            
            // Show video and overlay
            document.getElementById('noCamera').style.display = 'none';
            video.style.display = 'block';
            document.querySelector('.scan-overlay').style.display = 'block';
            
            // Enable buttons
            document.getElementById('scanButton').disabled = false;
            document.getElementById('flashButton').disabled = false;
            
            this.showNotification('Camera ready for scanning', 'success');
        } catch (error) {
            console.error('Camera access denied:', error);
            this.showNotification('Camera access denied: ' + error.message, 'error');
        }
    }

    captureBarcode() {
        if (!this.barcodeScanner) {
            this.showNotification('Scanner not initialized', 'error');
            return;
        }
        
        if (!this.isMobile) {
            this.showDesktopScannerDialog();
            return;
        }
        
        if (this.scanMode === 'barcode') {
            this.scanProduct();
        } else {
            this.scanBill();
        }
    }

    scanProduct() {
        const scanOverlay = document.querySelector('.scan-overlay');
        scanOverlay.classList.add('scanning');
        
        this.showNotification('Scanning for product barcode...', 'info');
        
        this.barcodeScanner.startScanning((barcode) => {
            console.log('Product barcode detected:', barcode);
            
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
            
            this.barcodeScanner.stopScanning();
            scanOverlay.classList.remove('scanning');
            
            this.showScanResult(true, barcode.rawValue, 'product');
            this.processProductBarcode(barcode.rawValue);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (scanOverlay.classList.contains('scanning')) {
                this.barcodeScanner.stopScanning();
                scanOverlay.classList.remove('scanning');
                this.showScanResult(false);
                this.showNotification('No barcode detected. Try again or use manual entry.', 'error');
            }
        }, 10000);
    }

    scanBill() {
        const scanOverlay = document.querySelector('.scan-overlay');
        scanOverlay.classList.add('scanning');
        
        this.showNotification('Scanning bill for OCR...', 'info');
        
        // For bill scanning, we capture a photo instead of continuous scanning
        setTimeout(() => {
            if (scanOverlay.classList.contains('scanning')) {
                this.captureBillPhoto();
                scanOverlay.classList.remove('scanning');
            }
        }, 3000); // Give 3 seconds to position the bill
    }

    async captureBillPhoto() {
        try {
            const video = document.getElementById('mobileVideo');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            // Convert to blob
            canvas.toBlob(async (blob) => {
                this.showNotification('Processing bill image...', 'info');
                await this.processBillImage(blob);
            }, 'image/jpeg', 0.8);
            
        } catch (error) {
            console.error('Error capturing bill photo:', error);
            this.showNotification('Failed to capture bill image', 'error');
        }
    }

    async processBillImage(imageBlob) {
        try {
            // Convert blob to base64 for processing
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageData = e.target.result;
                
                // Process with our custom bill format OCR
                const billData = await this.processCustomBillFormat(imageData);
                
                if (billData && billData.items && billData.items.length > 0) {
                    this.showScanResult(true, `${billData.items.length} items found`, 'bill');
                    this.processBillData(billData);
                    
                    if ('vibrate' in navigator) {
                        navigator.vibrate([100, 50, 100]);
                    }
                } else {
                    this.showScanResult(false);
                    this.showNotification('No items found in bill. Check image quality.', 'error');
                }
            };
            reader.readAsDataURL(imageBlob);
            
        } catch (error) {
            console.error('Error processing bill image:', error);
            this.showNotification('Failed to process bill image', 'error');
        }
    }

    async processCustomBillFormat(imageData) {
        // Smart POS Custom Bill Format OCR
        // This processes bills in our specific format
        
        try {
            // In a real implementation, you would send this to your OCR service
            // For now, we'll simulate the OCR processing
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
            
            // Mock OCR result based on Smart POS bill format
            const mockBillData = {
                billNumber: 'SP' + Math.floor(100000 + Math.random() * 900000),
                date: new Date().toLocaleDateString(),
                supplier: 'Smart Suppliers Ltd.',
                items: [
                    {
                        name: 'Coca Cola 500ml',
                        quantity: 24,
                        unit: 'pcs',
                        costPrice: 15.50,
                        sellingPrice: 25.00,
                        barcode: '9843201234567',
                        category: 'Beverages'
                    },
                    {
                        name: 'Dairy Milk Chocolate',
                        quantity: 30,
                        unit: 'pcs',
                        costPrice: 22.00,
                        sellingPrice: 33.00,
                        barcode: '9843201234568',
                        category: 'Chocolates'
                    },
                    {
                        name: 'Potato Chips',
                        quantity: 18,
                        unit: 'pcs',
                        costPrice: 14.75,
                        sellingPrice: 21.90,
                        barcode: '9843201234571',
                        category: 'Snacks'
                    }
                ],
                total: {
                    items: 3,
                    quantity: 72,
                    cost: 1584.50,
                    selling: 2388.00
                }
            };
            
            return mockBillData;
            
        } catch (error) {
            console.error('OCR processing error:', error);
            return null;
        }
    }

    showScanResult(success, result = '', type = 'barcode') {
        const scanOverlay = document.querySelector('.scan-overlay');
        if (!scanOverlay) return;
        
        const resultEl = document.createElement('div');
        resultEl.className = `scan-result ${success ? 'success' : 'error'}`;
        
        if (success) {
            if (type === 'barcode') {
                resultEl.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <p>Barcode detected!</p>
                    <p style="font-size: 12px;">${result}</p>
                `;
            } else {
                resultEl.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <p>Bill processed!</p>
                    <p style="font-size: 12px;">${result}</p>
                `;
            }
        } else {
            resultEl.innerHTML = `
                <i class="fas fa-times-circle"></i>
                <p>Scan failed</p>
                <p style="font-size: 12px;">Try again or use manual entry</p>
            `;
        }
        
        scanOverlay.appendChild(resultEl);
        
        setTimeout(() => {
            resultEl.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            resultEl.classList.remove('show');
            setTimeout(() => resultEl.remove(), 300);
        }, 3000);
    }

    processProductBarcode(barcode) {
        // Product database
        const products = {
            '9843201234567': { name: 'Coca Cola 500ml', price: 275, category: 'Beverages' },
            '9843201234568': { name: 'Dairy Milk Chocolate', price: 330, category: 'Chocolates' },
            '9843201234569': { name: 'KitKat Chocolate', price: 250, category: 'Chocolates' },
            '9843201234570': { name: 'Snickers Chocolate', price: 380, category: 'Chocolates' },
            '9843201234571': { name: 'Potato Chips', price: 219, category: 'Snacks' },
            '9843201234572': { name: 'Water Bottle 1L', price: 138, category: 'Beverages' }
        };

        const product = products[barcode];
        
        if (product) {
            this.addScannedItem('product', barcode, product);
            this.sendToPOS('barcode', { barcode, product });
            this.showNotification(`Added: ${product.name}`, 'success');
        } else {
            this.showNotification(`Product not found: ${barcode}`, 'error');
        }
    }

    processBillData(billData) {
        this.addScannedItem('bill', billData.billNumber, billData);
        this.sendToPOS('bill', billData);
        this.showNotification(`Bill processed: ${billData.items.length} items`, 'success');
    }

    addScannedItem(type, identifier, data) {
        const item = {
            type,
            identifier,
            data,
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.scannedItems.unshift(item);
        this.updateScannedItemsDisplay();
    }

    updateScannedItemsDisplay() {
        const container = document.getElementById('scannedItemsList');
        
        if (this.scannedItems.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #6c757d; padding: 20px;">
                    No items scanned yet
                </div>
            `;
            return;
        }

        container.innerHTML = this.scannedItems.map(item => {
            if (item.type === 'product') {
                return `
                    <div class="scanned-item">
                        <div class="item-info">
                            <h4>${item.data.name}</h4>
                            <p>${item.data.category} • ${item.timestamp}</p>
                            <p>Barcode: ${item.identifier}</p>
                        </div>
                        <div class="item-price">NPR ${item.data.price}</div>
                    </div>
                `;
            } else {
                return `
                    <div class="scanned-item">
                        <div class="item-info">
                            <h4>Bill ${item.identifier}</h4>
                            <p>${item.data.items.length} items • ${item.timestamp}</p>
                            <p>Total: NPR ${item.data.total.cost}</p>
                        </div>
                        <div class="item-price">
                            <small>Bill Scan</small>
                        </div>
                    </div>
                `;
            }
        }).join('');
    }

    sendToPOS(type, data) {
        const statusDot = document.getElementById('statusDot');
        const connectionStatus = document.getElementById('connectionStatus');
        
        if (statusDot && connectionStatus) {
            const originalClass = statusDot.className;
            const originalText = connectionStatus.textContent;
            
            statusDot.className = 'status-dot sending';
            connectionStatus.textContent = 'Sending data to POS...';
            
            setTimeout(() => {
                statusDot.className = 'status-dot connected';
                connectionStatus.textContent = 'Connected to POS Terminal';
            }, 1000);
        }
        
        // Send to POS terminal
        if (typeof mobileScannerConnection !== 'undefined' && this.deviceId) {
            const success = mobileScannerConnection.processScanFromMobile(
                this.roomCode, 
                this.deviceId, 
                {
                    type,
                    data,
                    timestamp: Date.now(),
                    scanMode: this.scanMode
                }
            );
            
            if (success) {
                this.showNotification(`${type === 'barcode' ? 'Product' : 'Bill'} sent to POS terminal`, 'success');
                if ('vibrate' in navigator) {
                    navigator.vibrate(200);
                }
            } else {
                this.showNotification('Failed to send to POS terminal', 'error');
            }
        }
    }

    addManualBarcode() {
        const barcodeInput = document.getElementById('manualBarcode');
        const value = barcodeInput.value.trim();
        
        if (value) {
            if (this.scanMode === 'barcode') {
                this.processProductBarcode(value);
            } else {
                // For manual bill entry, treat as bill number
                const mockBillData = {
                    billNumber: value,
                    date: new Date().toLocaleDateString(),
                    supplier: 'Manual Entry',
                    items: [],
                    total: { items: 0, quantity: 0, cost: 0, selling: 0 }
                };
                this.processBillData(mockBillData);
            }
            barcodeInput.value = '';
        }
    }

    toggleFlash() {
        if (!this.stream) return;
        
        const track = this.stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.torch) {
            this.isFlashOn = !this.isFlashOn;
            track.applyConstraints({
                advanced: [{ torch: this.isFlashOn }]
            });
            
            const flashButton = document.getElementById('flashButton');
            if (this.isFlashOn) {
                flashButton.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
                flashButton.innerHTML = '<i class="fas fa-lightbulb"></i> Flash ON';
            } else {
                flashButton.style.background = 'linear-gradient(135deg, #ffc107, #e0a800)';
                flashButton.innerHTML = '<i class="fas fa-lightbulb"></i> Flash';
            }
        } else {
            this.showNotification('Flash not supported on this device', 'error');
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showDesktopScannerDialog() {
        this.showNotification('Please use a mobile device for scanning', 'info');
        
        // Open mobile scanner in new tab with current room code
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || this.generateToken();
        const mobileUrl = `${window.location.origin}/mobile-scanner.html?room=${this.roomCode}&mode=${this.scanMode}&token=${token}`;
        
        window.open(mobileUrl, '_blank');
    }

    generateToken() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    setupQRCodeHandling() {
        // QR Button click handler
        const qrButton = document.getElementById('qrButton');
        if (qrButton) {
            qrButton.addEventListener('click', () => {
                this.showQRCodeModal();
            });
        }

        // Close QR modal button click handler
        const closeQrModal = document.getElementById('closeQrModal');
        if (closeQrModal) {
            closeQrModal.addEventListener('click', () => {
                document.getElementById('qrCodeModal').classList.remove('active');
            });
        }

        // Copy URL button click handler
        const copyUrlBtn = document.getElementById('copyUrlBtn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                const urlText = document.getElementById('qrCodeUrl').textContent;
                navigator.clipboard.writeText(urlText)
                    .then(() => {
                        this.showNotification('URL copied to clipboard', 'success');
                    })
                    .catch(err => {
                        this.showNotification('Failed to copy URL', 'error');
                    });
            });
        }
    }

    showQRCodeModal() {
        const qrCodeModal = document.getElementById('qrCodeModal');
        const qrCodeImage = document.getElementById('qrCodeImage');
        const qrCodeUrl = document.getElementById('qrCodeUrl');
        
        // Get current URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const currentUrl = new URL(window.location.href);
        
        // Generate QR code for the current URL
        if (typeof qrcode !== 'undefined') {
            // Clear previous QR code
            qrCodeImage.innerHTML = '';
            
            // Generate new QR code
            const qr = qrcode(0, 'M');
            qr.addData(currentUrl.href);
            qr.make();
            
            // Create QR code element
            const qrImg = qr.createImgTag(5);
            qrCodeImage.innerHTML = qrImg;
            
            // Display URL
            qrCodeUrl.textContent = currentUrl.href;
            
            // Show modal
            qrCodeModal.classList.add('active');
            
            this.showNotification('QR Code generated', 'success');
        } else {
            this.showNotification('QR Code library not loaded', 'error');
        }
    }
}

// Add CSS for mode toggle
const style = document.createElement('style');
style.textContent = `
    .mode-toggle {
        background: rgba(255, 255, 255, 0.1);
        padding: 15px;
        border-radius: 12px;
        margin-bottom: 20px;
    }

    .mode-buttons {
        display: flex;
        gap: 10px;
    }

    .mode-btn {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        background: transparent;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .mode-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
    }

    .mode-btn.active {
        background: rgba(255, 255, 255, 0.2);
        border-color: white;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);

// Export for use
window.MobileScanner = MobileScanner;
