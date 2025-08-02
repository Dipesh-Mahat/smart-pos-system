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
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.updateCartDisplay();
        this.initializeBarcodeScanner();
        console.log('Smart POS System initialized');
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
                console.log('Loaded products from database:', this.products.length);
            } else if (data && data.success && Array.isArray(data.products)) {
                // Legacy format support
                this.products = data.products.map(product => ({
                    ...product,
                    id: product._id || product.id // Handle both _id and id
                }));
                console.log('Loaded products from database (legacy format):', this.products.length);
            } else {
                console.warn('Failed to load products from API, no products available');
                // No products available
                this.products = [];
            }
        } catch (error) {
            console.error('Error loading products:', error);
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
            console.error('Product not found for ID:', productId);
            return;
        }
        
        console.log('Adding to cart:', product.name);
        
        // Use consistent ID (prefer _id for database compatibility)
        const itemId = product._id || product.id;
        
        // Check if item already exists in cart
        const existingItem = this.cart.find(item => 
            item.id === itemId || item._id === itemId
        );
        
        if (existingItem) {
            existingItem.quantity += 1;
            console.log('Updated quantity for existing item:', existingItem.name);
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
            console.log('Added new item to cart:', product.name);
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
            console.warn('Camera API not supported');
            return;
        }
    }

    // Direct camera scanning
    async startDirectScan() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } // Use back camera if available
            });
            
            this.setupCameraStream(stream);
        } catch (error) {
            console.error('Camera access denied:', error);
            alert('Camera access is required for barcode scanning. Please allow camera permissions.');
        }
    }

    setupCameraStream(stream) {
        this.currentStream = stream;
        const video = document.getElementById('cameraVideo');
        if (video) {
            video.srcObject = stream;
            video.play();
        }
    }

    closeCameraModal() {
        console.log('Closing camera modal...');
        
        // Stop Quagga if it's running
        try {
            if (typeof Quagga !== 'undefined') {
                Quagga.stop();
                console.log('Quagga stopped');
            }
        } catch (e) {
            console.warn('Error stopping Quagga:', e);
        }
        
        // Stop camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
                console.log('Camera track stopped');
            });
            this.currentStream = null;
        }
        
        // Hide the modal
        const cameraModal = document.getElementById('cameraModal');
        if (cameraModal) {
            cameraModal.classList.remove('active');
            console.log('Camera modal hidden');
        }
        
        // Clear video source
        const video = document.getElementById('cameraVideo');
        if (video) {
            video.srcObject = null;
        }
    }

    // Process barcode using enhanced scanner
    async captureBarcode() {
        try {
            const videoElement = document.getElementById('cameraVideo');
            let canvasElement = document.getElementById('barcodeCanvas');
            
            // Check if video is playing and we have camera access
            if (!videoElement || !videoElement.srcObject || videoElement.paused) {
                console.warn('No camera stream available, starting camera...');
                await this.startDirectScan();
                // Wait a moment for camera to initialize
                setTimeout(() => this.captureBarcode(), 1500);
                return;
            }
            
            // Create canvas if it doesn't exist
            if (!canvasElement) {
                canvasElement = document.createElement('canvas');
                canvasElement.id = 'barcodeCanvas';
                canvasElement.style.display = 'none';
                const cameraContainer = document.querySelector('.camera-container');
                if (cameraContainer) {
                    cameraContainer.appendChild(canvasElement);
                } else {
                    document.body.appendChild(canvasElement);
                }
            }
            
            // Check if QuaggaJS is available directly
            if (typeof Quagga !== 'undefined') {
                console.log('Using QuaggaJS directly for barcode scanning...');
                this.startQuaggaDirectScan();
                return;
            }
            
            // Check if enhanced scanner is available
            if (typeof EnhancedBarcodeScanner !== 'undefined') {
                console.log('Using enhanced barcode scanner...');
                
                // Create a new scanner instance
                const scanner = new EnhancedBarcodeScanner();
                
                // Set the video and canvas manually since we already have them
                scanner.video = videoElement;
                scanner.canvas = canvasElement;
                scanner.canvas.width = videoElement.videoWidth || 640;
                scanner.canvas.height = videoElement.videoHeight || 480;
                scanner.canvasContext = scanner.canvas.getContext('2d');
                
                // Initialize the scanner (this will detect available libraries)
                const initialized = await scanner.initialize();
                if (!initialized) {
                    console.warn('Enhanced scanner failed to initialize, using manual input');
                    this.showManualBarcodeInput();
                    return;
                }
                
                console.log('Enhanced scanner initialized, starting scan...');
                
                // Start scanning with callback
                const scanStarted = scanner.startScanning((barcode, format, confidence) => {
                    console.log(`Barcode detected: ${barcode}, Format: ${format}, Confidence: ${confidence}`);
                    scanner.stopScanning();
                    this.processBarcode(barcode);
                });
                
                if (!scanStarted) {
                    console.warn('Scanner failed to start, using manual input');
                    this.showManualBarcodeInput();
                }
                
                // Auto-stop scanning after 10 seconds to prevent indefinite scanning
                setTimeout(() => {
                    if (scanner.isScanning) {
                        scanner.stopScanning();
                        console.log('Auto-stopped scanning after 10 seconds');
                    }
                }, 10000);
                
            } else {
                console.warn('Enhanced scanner not available, using manual input');
                this.showManualBarcodeInput();
            }
        } catch (error) {
            console.error('Error with barcode scanning:', error);
            this.showManualBarcodeInput();
        }
    }
    
    // Direct QuaggaJS scanning method
    startQuaggaDirectScan() {
        const videoElement = document.getElementById('cameraVideo');
        
        console.log('Initializing QuaggaJS with video element:', videoElement);
        
        // Configure Quagga with optimized settings
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: videoElement,
                constraints: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    facingMode: "environment", // Use back camera
                    frameRate: { min: 15, ideal: 30 }
                }
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader"
                ],
                multiple: false
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error('Quagga initialization failed:', err);
                this.showManualBarcodeInput();
                return;
            }
            
            console.log('Quagga initialized successfully, starting detection...');
            Quagga.start();
            
            // Track detected barcodes to avoid duplicates
            let lastDetectedBarcode = null;
            let lastDetectionTime = 0;
            const detectionCooldown = 2000; // 2 seconds between detections
            
            // Set up detection handler with improved accuracy
            Quagga.onDetected((result) => {
                if (result && result.codeResult && result.codeResult.code) {
                    const barcode = result.codeResult.code.trim();
                    const confidence = result.codeResult.confidence;
                    const currentTime = Date.now();
                    
                    console.log(`Quagga raw detection: ${barcode}, Confidence: ${confidence.toFixed(2)}`);
                    
                    // Prevent duplicate detections of the same barcode within cooldown period
                    if (barcode === lastDetectedBarcode && 
                        (currentTime - lastDetectionTime) < detectionCooldown) {
                        console.log('Ignoring duplicate detection within cooldown period');
                        return;
                    }
                    
                    // Only process if confidence is high enough (increased threshold)
                    if (confidence > 70) {
                        console.log(`High confidence barcode detected: ${barcode}`);
                        
                        // Update tracking variables
                        lastDetectedBarcode = barcode;
                        lastDetectionTime = currentTime;
                        
                        // Stop scanning immediately to prevent multiple detections
                        Quagga.stop();
                        console.log('Quagga stopped after successful detection');
                        
                        // Process the barcode
                        this.processBarcode(barcode);
                    } else {
                        console.log(`Low confidence detection (${confidence.toFixed(2)}), continuing scan...`);
                    }
                }
            });
            
            // Auto-stop after 20 seconds to prevent indefinite scanning
            setTimeout(() => {
                try {
                    Quagga.stop();
                    console.log('Auto-stopped Quagga scanning after 20 seconds');
                } catch (e) {
                    console.warn('Error stopping Quagga:', e);
                }
            }, 20000);
        });
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
        console.log('=== PROCESSING BARCODE ===');
        console.log('Scanned barcode:', barcode);
        console.log('Barcode type:', typeof barcode);
        console.log('Barcode length:', barcode.length);
        console.log('Available products count:', this.products.length);
        
        // Clean and normalize the scanned barcode
        const scannedBarcode = barcode ? barcode.toString().trim() : '';
        console.log('Cleaned scanned barcode:', `"${scannedBarcode}"`);
        
        // Log all available barcodes for debugging
        console.log('All product barcodes in database:');
        this.products.forEach((p, index) => {
            const productBarcode = p.barcode ? p.barcode.toString().trim() : '';
            console.log(`  ${index + 1}. "${productBarcode}" - ${p.name}`);
        });
        
        // Find product by barcode with detailed matching logic
        const product = this.products.find(p => {
            const productBarcode = p.barcode ? p.barcode.toString().trim() : '';
            const isMatch = productBarcode === scannedBarcode;
            
            console.log(`Comparing: "${productBarcode}" === "${scannedBarcode}" = ${isMatch} (${p.name})`);
            return isMatch;
        });
        
        if (product) {
            console.log('PRODUCT FOUND!');
            console.log('Product details:', {
                id: product._id || product.id,
                name: product.name,
                price: product.price,
                barcode: product.barcode,
                category: product.category,
                stock: product.stock
            });
            
            // Add to cart using the correct ID
            this.addToCart(product._id || product.id);
            this.closeCameraModal();
            
            // Show success notification
            this.showNotification(`Added ${product.name} to cart`, 'success');
            
        } else {
            console.log('PRODUCT NOT FOUND');
            console.log('Searched for barcode:', `"${scannedBarcode}"`);
            console.log('No matching product found in database');
            
            // Show detailed error
            this.showBarcodeError(scannedBarcode);
        }
        
        console.log('=== END BARCODE PROCESSING ===');
    }

    showBarcodeError(barcode) {
        const notification = document.createElement('div');
        notification.className = 'barcode-notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <h4>Product Not Found</h4>
                    <p>Barcode: "${barcode}"</p>
                    <p style="font-size: 12px; opacity: 0.8;">Length: ${barcode.length} characters</p>
                    <p style="font-size: 12px; opacity: 0.8;">Try scanning again or enter manually</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Show for longer to give user time to read details
        setTimeout(() => notification.remove(), 5000);
        
        // Focus on manual input for easy entry
        setTimeout(() => {
            const manualInput = document.getElementById('manualBarcode');
            if (manualInput) {
                manualInput.focus();
                manualInput.value = barcode; // Pre-populate with detected barcode
                manualInput.select(); // Select all text for easy editing
            }
        }, 100);
    }

    // Scanner modal method (called by navbar scan button)
    openScannerModal() {
        // Use the product scan dialog from pos.html
        if (typeof showProductScanDialog === 'function') {
            showProductScanDialog();
        } else {
            console.error('Product scan dialog function not found');
        }
    }
    
    // Find product by barcode
    findProductByBarcode(barcode) {
        const scannedBarcode = barcode ? barcode.toString().trim() : '';
        return this.products.find(p => {
            const productBarcode = p.barcode ? p.barcode.toString().trim() : '';
            return productBarcode === scannedBarcode;
        });
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
}
