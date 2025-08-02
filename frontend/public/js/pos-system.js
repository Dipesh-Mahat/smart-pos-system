/**
 * Smart POS System - Advanced Point of Sale
 * Features: Product Search, Barcode Scanning, Mobile Integration, Receipt Printing
 */

class SmartPOSSystem {
    constructor() {
        this.cart = [];
        this.products = [];
        this.isScanning = false;
        this.scanner = null;
        this.currentStream = null;
        this.quaggaRunning = false; // Track Quagga state
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.updateCartDisplay();
        this.initializeBarcodeScanner();
    }    // Load products from API
    async loadProducts() {
        const loadingElement = document.getElementById('productsLoading');
        const productsListElement = document.getElementById('productsList');
        // Show loading state
        if (loadingElement) loadingElement.style.display = 'flex';
        if (productsListElement) productsListElement.style.display = 'none';

        try {
            // Use the API service to fetch real products from the database
            const data = await window.apiService.request('/shop/products');
            
            // Handle the correct API response format: {products: [...], pagination: {...}}
            if (data && data.products && Array.isArray(data.products)) {
                // Normalize the product data - convert _id to id for consistency
                this.products = data.products.map(product => ({
                    ...product,
                    id: product._id // Add id field using _id value
                }));
            } else if (data && data.success && Array.isArray(data.products)) {
                // Legacy format support
                this.products = data.products.map(product => ({
                    ...product,
                    id: product._id || product.id // Handle both _id and id
                }));
            } else {
                // No products available
                this.products = [];
            }
        } catch (error) {
            // No products available
            this.products = [];
        }
        
        this.displayAllProducts();
        
        // Complete loading state
        if (loadingElement) loadingElement.style.display = 'none';
        if (productsListElement) productsListElement.style.display = 'grid';
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }

        // Scan button event listeners
        const scanBtn = document.getElementById('scanBtn');
        const mobileScanBtn = document.getElementById('mobileScanBtn');
        
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                this.startScanning();
            });
        }
        
        if (mobileScanBtn) {
            mobileScanBtn.addEventListener('click', () => {
                this.startScanning();
            });
        }

        // Category buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        if (categoryButtons.length) {
            categoryButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remove active class from all buttons
                    categoryButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    e.currentTarget.classList.add('active');
                    
                    const category = e.currentTarget.textContent;
                    if (category === 'All Products') {
                        this.displayAllProducts();
                    } else {
                        this.filterByCategory(category);
                    }
                });
            });
        }

        // View options
        const viewButtons = document.querySelectorAll('.view-btn');
        if (viewButtons.length) {
            viewButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    // Remove active class from all buttons
                    viewButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    e.currentTarget.classList.add('active');
                    
                    const productsList = document.getElementById('productsList');
                    if (e.currentTarget.title === 'List View') {
                        productsList.classList.add('list-view');
                    } else {
                        productsList.classList.remove('list-view');
                    }
                });
            });
        }
    }
    
    // Start barcode scanning using simple scanner
    startScanning() {
        if (window.simpleScanner) {
            window.simpleScanner.startScanner((barcode) => {
                this.processBarcode(barcode);
            });
        } else {
            alert('Scanner not available');
        }
    }

    // Product search functionality
    searchProducts(query) {
        const productsContainer = document.getElementById('productsList');
        if (!productsContainer) return;

        if (!query.trim()) {
            this.displayAllProducts();
            return;
        }

        const filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase()) ||
            product.barcode.includes(query)
        );

        this.displayProducts(filteredProducts);
    }

    filterByCategory(category) {
        const filteredProducts = this.products.filter(product =>
            product.category === category
        );
        this.displayProducts(filteredProducts);
    }

    displayAllProducts() {
        this.displayProducts(this.products);
    }

    displayProducts(products) {
        const productsContainer = document.getElementById('productsList');
        if (!productsContainer) return;

        if (products.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <p>No products found</p>
                </div>
            `;
            return;
        }

        productsContainer.innerHTML = '';
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            // Use _id or id for adding to cart
            productCard.addEventListener('click', () => this.addToCart(product._id || product.id));
            
            const iconClass = this.getCategoryIcon(product.category);
            
            productCard.innerHTML = `
                <div class="product-img">
                    <i class="${iconClass}"></i>
                </div>
                <div class="product-category">${product.category}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-stock">In stock: ${product.stock}</div>
                <div class="product-footer">
                    <div class="product-price">NPR ${product.price}</div>
                    <button class="add-to-cart">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            `;
            
            productsContainer.appendChild(productCard);
        });
    }
    
    getCategoryIcon(category) {
        switch(category.toLowerCase()) {
            case 'beverages':
                return 'fas fa-glass-whiskey';
            case 'chocolates':
                return 'fas fa-candy-cane';
            case 'snacks':
                return 'fas fa-cookie';
            case 'food':
                return 'fas fa-utensils';
            case 'household':
                return 'fas fa-home';
            case 'personal care':
                return 'fas fa-pump-soap';
            default:
                return 'fas fa-box';
        }
    }

    // Cart functionality
    addToCart(productId) {
        // Find product by either id or _id field
        const product = this.products.find(p => 
            p.id === productId || p._id === productId
        );
        
        if (!product) {
            return;
        }
        
        // Use consistent ID (prefer _id for database compatibility)
        const itemId = product._id || product.id;
        
        // Check if item already exists in cart
        const existingItem = this.cart.find(item => 
            item.id === itemId || item._id === itemId
        );
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: itemId,
                _id: itemId, // Keep both for compatibility
                name: product.name,
                price: product.price,
                quantity: 1,
                category: product.category,
                barcode: product.barcode
            });
        }
        
        this.updateCartDisplay();
        this.showAddedToCartNotification(product);
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.updateCartDisplay();
    }
    
    updateItemQuantity(index, change) {
        if (!this.cart[index]) return;
        
        this.cart[index].quantity += change;
        
        if (this.cart[index].quantity <= 0) {
            this.removeFromCart(index);
        } else {
            this.updateCartDisplay();
        }
    }

    updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cartItems');
        const totalElement = document.getElementById('total');
        const cartCountElement = document.getElementById('cartCount');
        
        if (!cartItemsContainer) return;
        
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <p>Add products by clicking on them</p>
                </div>
            `;
            totalElement.textContent = 'NPR 0';
            cartCountElement.textContent = '0';
            return;
        }
        
        let total = 0;
        cartItemsContainer.innerHTML = '';
        
        this.cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            
            const iconClass = this.getCategoryIcon(item.category);
            
            cartItemElement.innerHTML = `
                <div class="cart-item-left">
                    <div class="cart-item-img">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-quantity">
                            <div class="quantity-controls">
                                <button class="qty-btn" onclick="posSystem.updateItemQuantity(${index}, -1)">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn" onclick="posSystem.updateItemQuantity(${index}, 1)">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="item-price">NPR ${itemTotal}</div>
                <button class="remove-item" onclick="posSystem.removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            cartItemsContainer.appendChild(cartItemElement);
        });
        
        totalElement.textContent = `NPR ${Math.round(total)}`;
        cartCountElement.textContent = this.cart.length.toString();
    }
    
    showAddedToCartNotification(product) {
        const notification = document.createElement('div');
        notification.className = 'barcode-notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>Product Added!</h4>
                    <p>${product.name} - NPR ${product.price}</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }

    // Initialize barcode scanner
    initializeBarcodeScanner() {
        // Check if browser supports camera API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return;
        }
    }

    // Direct camera scanning
    async startDirectScan() {
        try {
            // Request camera with specific constraints
            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { min: 15, ideal: 30 }
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.setupCameraStream(stream);
            
        } catch (error) {
            // Try with basic constraints as fallback
            try {
                const basicStream = await navigator.mediaDevices.getUserMedia({ 
                    video: true 
                });
                this.setupCameraStream(basicStream);
            } catch (basicError) {
                this.showScanNotification('Camera access required for barcode scanning', 'error');
                this.showManualBarcodeInput();
            }
        }
    }

    setupCameraStream(stream) {
        this.currentStream = stream;
        const video = document.getElementById('cameraVideo');
        
        if (video) {
            video.srcObject = stream;
            video.play().catch(error => {
                this.showScanNotification('Failed to start camera preview', 'error');
            });
        }
    }

    closeCameraModal() {
        // Stop Quagga if it's running
        try {
            if (typeof Quagga !== 'undefined' && this.quaggaRunning) {
                Quagga.stop();
                this.quaggaRunning = false;
            }
        } catch (e) {
            this.quaggaRunning = false; // Reset state even if error
        }
        
        // Stop camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
            });
            this.currentStream = null;
        }
        
        // Hide the modal
        const cameraModal = document.getElementById('cameraModal');
        if (cameraModal) {
            cameraModal.classList.remove('active');
        }
        
        // Clear video source
        const video = document.getElementById('cameraVideo');
        if (video) {
            video.srcObject = null;
        }
    }

    // Simple and fast barcode capture
    async captureBarcode() {
        try {
            // Get camera modal elements
            const cameraModal = document.getElementById('cameraModal');
            const videoElement = document.getElementById('cameraVideo');
            
            // Show camera modal first
            if (cameraModal) {
                cameraModal.classList.add('active');
            }
            
            // Check if QuaggaJS is available
            if (typeof Quagga === 'undefined') {
                this.showManualBarcodeInput();
                return;
            }
            
            // Get camera permissions and start scanning immediately
            this.updateScanningStatus('Starting camera...');
            
            // Start QuaggaJS scanner directly on video element
            this.startFastQuaggaScan();
            
        } catch (error) {
            this.showManualBarcodeInput();
        }
    }
    
    // Fast and simple QuaggaJS scanning
    startFastQuaggaScan() {
        const videoElement = document.getElementById('cameraVideo');
        
        // Show scanning indicators
        this.showScanningIndicator(true);
        this.updateScanningStatus('Initializing camera...');
        
        // Simple Quagga configuration for fast scanning
        const config = {
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: videoElement,
                constraints: {
                    width: { min: 480, ideal: 640, max: 1280 },
                    height: { min: 320, ideal: 480, max: 720 },
                    facingMode: "environment"
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: false
            },
            numOfWorkers: 1,
            frequency: 10,
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "upc_reader"
                ],
                multiple: false
            },
            locate: true
        };
        
        Quagga.init(config, (err) => {
            if (err) {
                this.showScanningIndicator(false);
                this.updateScanningStatus('Camera error - try manual entry');
                return;
            }
            Quagga.start();
            this.quaggaRunning = true; // Set flag when Quagga starts
            this.updateScanningStatus('Point at barcode and hold steady');
            
            // Simple detection handler
            Quagga.onDetected((result) => {
                if (result && result.codeResult && result.codeResult.code) {
                    const barcode = result.codeResult.code.trim();
                    const confidence = result.codeResult.confidence || 0;
                    
                    // Accept any detection with reasonable confidence
                    if (confidence > 50) {
                        // Stop scanning immediately
                        Quagga.stop();
                        this.quaggaRunning = false; // Update flag
                        this.showScanningIndicator(false);
                        this.updateScanningStatus('Scanned successfully!');
                        
                        // Process barcode
                        setTimeout(() => {
                            this.processBarcode(barcode);
                        }, 300);
                    }
                }
            });
            
            // Auto-stop after 15 seconds
            setTimeout(() => {
                try {
                    if (this.quaggaRunning) {
                        Quagga.stop();
                        this.quaggaRunning = false;
                        this.showScanningIndicator(false);
                        this.updateScanningStatus('Try again or enter barcode manually');
                    }
                } catch (e) {
                    this.quaggaRunning = false; // Reset flag on error
                }
            }, 15000);
        });
    }
    
    // Show scanning indicator with proper alignment
    showScanningIndicator(show) {
        const cameraContainer = document.querySelector('.camera-container');
        let scanOverlay = document.querySelector('.scan-overlay');
        
        if (!cameraContainer) {
            console.warn('Camera container not found');
            return;
        }
        
        if (show) {
            // Create scan overlay if it doesn't exist
            if (!scanOverlay) {
                scanOverlay = document.createElement('div');
                scanOverlay.className = 'scan-overlay';
                cameraContainer.appendChild(scanOverlay);
            }
            
            // Simple, working scan overlay
            scanOverlay.innerHTML = `
                <div class="scan-line active"></div>
                <div class="scan-corners scanning-active">
                    <div class="corner top-left"></div>
                    <div class="corner top-right"></div>
                    <div class="corner bottom-left"></div>
                    <div class="corner bottom-right"></div>
                </div>
                <div class="scan-status" id="scanStatus">Ready to scan</div>
            `;
            
            scanOverlay.style.display = 'block';
            
        } else {
            if (scanOverlay) {
                scanOverlay.style.display = 'none';
            }
        }
    }
    
    // Update scanning status
    updateScanningStatus(message) {
        const statusElement = document.getElementById('scanStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    // Show manual barcode input as fallback
    showManualBarcodeInput() {
        const barcodeInput = document.getElementById('manualBarcode');
        if (barcodeInput) {
            barcodeInput.focus();
            barcodeInput.placeholder = 'Enter barcode manually...';
        } else {
            // Create a simple prompt for barcode input
            const barcode = prompt('Enter product barcode:');
            if (barcode && barcode.trim()) {
                this.processBarcode(barcode.trim());
            }
        }
    }

    processManualBarcode() {
        const barcodeInput = document.getElementById('manualBarcode');
        if (!barcodeInput) return;
        
        const barcode = barcodeInput.value.trim();
        if (barcode) {
            this.processBarcode(barcode);
            barcodeInput.value = '';
        }
    }

    processBarcode(barcode) {
        if (!barcode || typeof barcode !== 'string') {
            this.showScanNotification('Invalid barcode scanned', 'error');
            return;
        }

        // Clean and normalize the scanned barcode
        const scannedBarcode = barcode.trim();
        
        if (scannedBarcode.length === 0) {
            this.showScanNotification('Empty barcode detected', 'error');
            return;
        }

        // Find product by barcode
        const product = this.products.find(p => {
            const productBarcode = p.barcode ? p.barcode.toString().trim() : '';
            return productBarcode === scannedBarcode;
        });
        
        if (product) {
            // Check stock availability
            if (product.stock <= 0) {
                this.showScanNotification(`${product.name} is out of stock`, 'error');
                this.closeCameraModal();
                return;
            }
            
            // Add to cart using the correct ID
            const productId = product._id || product.id;
            this.addToCart(productId);
            this.closeCameraModal();
            
            // Show success notification
            this.showScanNotification(`Added ${product.name} to cart`, 'success');
            
        } else {
            this.closeCameraModal();
            this.showBarcodeNotFound(scannedBarcode);
        }
    }

    showBarcodeNotFound(barcode) {
        // Show user-friendly notification
        this.showScanNotification(`Product not found for barcode: ${barcode}`, 'error');
        
        // Offer manual entry option
        setTimeout(() => {
            const useManualEntry = confirm(`Product with barcode "${barcode}" not found in inventory.\n\nWould you like to enter the barcode manually to double-check?`);
            if (useManualEntry) {
                this.showManualBarcodeInput(barcode);
            }
        }, 1000);
    }

    showManualBarcodeInput(prefillBarcode = '') {
        const barcodeInput = document.getElementById('manualBarcode');
        if (barcodeInput) {
            barcodeInput.value = prefillBarcode;
            barcodeInput.focus();
            barcodeInput.select();
        } else {
            // Fallback to prompt if manual input field doesn't exist
            const barcode = prompt('Enter product barcode:', prefillBarcode);
            if (barcode && barcode.trim()) {
                this.processBarcode(barcode.trim());
            }
        }
    }

    processManualBarcode() {
        const barcodeInput = document.getElementById('manualBarcode');
        if (!barcodeInput) return;
        
        const barcode = barcodeInput.value.trim();
        if (barcode) {
            this.processBarcode(barcode);
            barcodeInput.value = '';
        }
    }
    
    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `scan-notification ${type}`;
        
        notification.innerHTML = `
            <div class="scan-notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Bill Scanning Methods
    async startBillScan() {
        console.log('Starting bill scanning mode...');
        
        try {
            // Request camera with specific constraints for bill scanning
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { min: 720, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { min: 15, ideal: 30 }
                }
            };
            
            console.log('Requesting camera access for bill scanning...');
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera access granted for bill scanning');
            
            this.setupBillScanStream(stream);
            this.updateBillScanStatus('Position the bill within the frame');
            
        } catch (error) {
            console.error('Error accessing camera for bill scanning:', error);
            this.updateBillScanStatus('Camera access failed - check permissions');
        }
    }

    setupBillScanStream(stream) {
        const videoElement = document.getElementById('billScanVideo');
        if (videoElement) {
            videoElement.srcObject = stream;
            this.currentBillStream = stream;
            
            videoElement.onloadedmetadata = () => {
                console.log('Bill scan video metadata loaded');
                this.updateBillScanStatus('Hold the bill steady within the frame');
            };
        }
    }

    updateBillScanStatus(message) {
        const statusElement = document.getElementById('billScanStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log('Bill scan status:', message);
    }

    async captureBillScan() {
        console.log('📸 Capturing bill scan...');
        
        try {
            const videoElement = document.getElementById('billScanVideo');
            const canvas = document.getElementById('billScanCanvas');
            
            if (videoElement && canvas) {
                const context = canvas.getContext('2d');
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                
                // Draw the current video frame to canvas
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                
                // Convert to image data for processing
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                
                this.updateBillScanStatus('Processing bill image...');
                
                // Here you could integrate with OCR services or image processing
                // For now, we'll simulate bill processing
                setTimeout(() => {
                    this.processBillImage(imageData);
                }, 1500);
            }
        } catch (error) {
            console.error('Error capturing bill:', error);
            this.updateBillScanStatus('Failed to capture bill');
        }
    }

    processBillImage(imageData) {
        console.log('Processing bill image data...');
        
        // This is where you would integrate with OCR services
        // For now, we'll show a success message
        this.updateBillScanStatus('Bill captured successfully!');
        
        // Show notification
        this.showScanNotification('Bill scanned successfully! (Processing feature coming soon)', 'success');
        
        // Close modal after a delay
        setTimeout(() => {
            this.closeBillScanModal();
        }, 2000);
    }

    closeBillScanModal() {
        console.log('🚪 Closing bill scan modal...');
        
        // Stop camera stream
        if (this.currentBillStream) {
            this.currentBillStream.getTracks().forEach(track => {
                track.stop();
                console.log('Bill scan camera track stopped');
            });
            this.currentBillStream = null;
        }
        
        // Clear video element
        const videoElement = document.getElementById('billScanVideo');
        if (videoElement) {
            videoElement.srcObject = null;
        }
        
        // Reset status
        this.updateBillScanStatus('Position the bill within the frame');
        
        console.log('Bill scan modal closed and camera stopped');
    }

    showManualBillEntry() {
        console.log('Showing manual bill entry...');
        
        // Close the bill scan modal
        document.getElementById('billScanModal').classList.remove('active');
        this.closeBillScanModal();
        
        // Show a simple prompt for now (you can enhance this with a custom modal)
        const billData = prompt('Enter bill details (item1:price1, item2:price2, etc.):\nExample: Coffee:2.50, Sandwich:5.00');
        
        if (billData) {
            this.processManualBillData(billData);
        }
    }

    processManualBillData(billData) {
        console.log('Processing manual bill data:', billData);
        
        try {
            // Parse the bill data (simple format: item:price, item:price)
            const items = billData.split(',').map(item => {
                const [name, price] = item.trim().split(':');
                return {
                    name: name?.trim(),
                    price: parseFloat(price?.trim()) || 0
                };
            }).filter(item => item.name && item.price > 0);
            
            if (items.length > 0) {
                // Add items to cart
                items.forEach(item => {
                    // Create a temporary product object
                    const tempProduct = {
                        id: 'manual_' + Date.now() + '_' + Math.random(),
                        name: item.name,
                        price: item.price,
                        category: 'Manual Entry',
                        stock: 1
                    };
                    this.addToCart(tempProduct);
                });
                
                this.showScanNotification(`Added ${items.length} items from manual bill entry`, 'success');
            } else {
                this.showScanNotification('No valid items found in bill data', 'error');
            }
        } catch (error) {
            console.error('Error processing manual bill data:', error);
            this.showScanNotification('Error processing bill data', 'error');
        }
    }
}

// Make SmartPOSSystem available globally
window.SmartPOSSystem = SmartPOSSystem;
