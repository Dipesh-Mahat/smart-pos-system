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
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        document.getElementById('cameraModal').classList.remove('active');
    }

    // Process barcode using enhanced scanner
    async captureBarcode() {
        try {
            // Check if enhanced scanner is available
            if (typeof EnhancedBarcodeScanner !== 'undefined') {
                // Use the enhanced scanner for real barcode detection
                const scanner = new EnhancedBarcodeScanner({
                    videoElement: document.getElementById('cameraVideo'),
                    canvasElement: document.getElementById('cameraCanvas')
                });
                
                // Initialize scanner
                const initialized = await scanner.initialize();
                if (!initialized) {
                    console.warn('Enhanced scanner failed to initialize, using manual input');
                    this.showManualBarcodeInput();
                    return;
                }
                
                // Start scanning with callback
                scanner.startScanning((barcode, format, confidence) => {
                    console.log(`Barcode detected: ${barcode}, Format: ${format}, Confidence: ${confidence}`);
                    scanner.stopScanning();
                    scanner.destroy();
                    this.processBarcode(barcode);
                });
                
            } else {
                console.warn('Enhanced scanner not available, using manual input');
                this.showManualBarcodeInput();
            }
        } catch (error) {
            console.error('Error with enhanced scanner:', error);
            this.showManualBarcodeInput();
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
        console.log('Processing barcode:', barcode);
        console.log('Available products:', this.products.length);
        
        // Find product by barcode (exact match, case-sensitive)
        const product = this.products.find(p => {
            const productBarcode = p.barcode ? p.barcode.toString().trim() : '';
            const scannedBarcode = barcode ? barcode.toString().trim() : '';
            console.log(`Comparing product barcode "${productBarcode}" with scanned "${scannedBarcode}"`);
            return productBarcode === scannedBarcode;
        });
        
        if (product) {
            console.log('Product found:', product.name);
            this.addToCart(product.id || product._id);
            this.closeCameraModal();
            
            // Show success notification
            this.showNotification(`Added ${product.name} to cart`, 'success');
        } else {
            console.log('Product not found for barcode:', barcode);
            console.log('Available barcodes:', this.products.map(p => p.barcode));
            this.showBarcodeError(barcode);
        }
    }

    showBarcodeError(barcode) {
        const notification = document.createElement('div');
        notification.className = 'barcode-notification error';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <h4>Product Not Found</h4>
                    <p>Barcode: ${barcode}</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
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
