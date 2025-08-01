/**
 * Smart POS System - Advanced Point of Sale
 * Features: Product Search, Barcode Scanning, Mobile Integration, Receipt Printing
 */

class SmartPOSSystem {
    constructor() {
        this.cart = [];
        this.products = [];
        this.isScanning = false;
        this.mobileConnection = null;
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
                console.warn('Failed to load products from API, using demo data as fallback');
                // Use demo products as a fallback only if API fails
                this.products = getDemoProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            // Use demo products as a fallback only if API fails
            this.products = getDemoProducts();
        }
        
        this.displayAllProducts();
        
        // Complete loading state
        if (loadingElement) loadingElement.style.display = 'none';
        if (productsListElement) productsListElement.style.display = 'grid';
    }

    // Initialize product database with barcodes
    initializeProducts() {
        return [
            {
                id: 1,
                name: 'Coca Cola 500ml',
                price: 275,
                barcode: '9843201234567',
                category: 'Beverages',
                stock: 25,
                image: '../images/products/coca-cola.jpg'
            },
            {
                id: 2,
                name: 'Dairy Milk Chocolate',
                price: 330,
                barcode: '9843201234568',
                category: 'Chocolates',
                stock: 15,
                image: '../images/products/dairy-milk.jpg'
            },
            {
                id: 3,
                name: 'KitKat Chocolate',
                price: 250,
                barcode: '9843201234569',
                category: 'Chocolates',
                stock: 20,
                image: '../images/products/kitkat.jpg'
            },
            {
                id: 4,
                name: 'Snickers Chocolate',
                price: 380,
                barcode: '9843201234570',
                category: 'Chocolates',
                stock: 12,
                image: '../images/products/snickers.jpg'
            },
            {
                id: 5,
                name: 'Potato Chips',
                price: 219,
                barcode: '9843201234571',
                category: 'Snacks',
                stock: 30,
                image: '../images/products/chips.jpg'
            },
            {
                id: 6,
                name: 'Water Bottle 1L',
                price: 138,
                barcode: '9843201234572',
                category: 'Beverages',
                stock: 50,
                image: '../images/products/water.jpg'
            },
            {
                id: 7,
                name: 'Energy Drink',
                price: 495,
                barcode: '9843201234573',
                category: 'Beverages',
                stock: 18,
                image: '../images/products/energy-drink.jpg'
            },
            {
                id: 8,
                name: 'Sandwich',
                price: 659,
                barcode: '9843201234574',
                category: 'Food',
                stock: 8,
                image: '../images/products/sandwich.jpg'
            },
            {
                id: 9,
                name: 'Coffee',
                price: 248,
                barcode: '9843201234575',
                category: 'Beverages',
                stock: 22,
                image: '../images/products/coffee.jpg'
            },
            {
                id: 10,
                name: 'Fruit Juice',
                price: 413,
                barcode: '9843201234576',
                category: 'Beverages',
                stock: 16,
                image: '../images/products/juice.jpg'
            }
        ];
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
            productCard.addEventListener('click', () => this.addToCart(product.id));
            
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
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Check if item already exists in cart
        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                category: product.category
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
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
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
            subtotalElement.textContent = 'NPR 0';
            taxElement.textContent = 'NPR 0';
            totalElement.textContent = 'NPR 0';
            cartCountElement.textContent = '0';
            return;
        }
        
        let subtotal = 0;
        cartItemsContainer.innerHTML = '';
        
        this.cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
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
        
        const tax = subtotal * 0.08;
        const total = subtotal + tax;
        
        subtotalElement.textContent = `NPR ${Math.round(subtotal)}`;
        taxElement.textContent = `NPR ${Math.round(tax)}`;
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

    // Process barcode (mock implementation - in real app would use barcode detection library)
    captureBarcode() {
        // In a real implementation, you would use a library like QuaggaJS or ZXing
        // For now, we'll simulate scanning
        const mockBarcodes = this.products.map(p => p.barcode);
        const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
        
        this.processBarcode(randomBarcode);
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
        const product = this.products.find(p => p.barcode === barcode);
        
        if (product) {
            this.addToCart(product.id);
            this.closeCameraModal();
        } else {
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

    // Mobile connection methods
    connectMobile(method) {
        const roomCode = this.generateRoomCode();
        
        switch(method) {
            case 'wifi':
                this.showWiFiConnection(roomCode);
                break;
            case 'bluetooth':
                this.showBluetoothConnection(roomCode);
                break;
            case 'usb':
                this.showUSBConnection(roomCode);
                break;
        }
    }
    
    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    showWiFiConnection(roomCode) {
        const modal = document.createElement('div');
        modal.className = 'mobile-scanner-modal active';
        modal.id = 'wifiConnectionModal';
        modal.innerHTML = `
            <div class="mobile-scanner-content">
                <div class="scanner-header">
                    <h3><i class="fas fa-wifi"></i> WiFi Connection</h3>
                    <button class="close-modal" onclick="document.getElementById('wifiConnectionModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="scanner-body">
                    <div class="qr-section">
                        <div class="qr-code-large">
                            <i class="fas fa-qrcode"></i>
                        </div>
                        <p>Scan this QR code with your mobile camera</p>
                    </div>
                    
                    <div class="or-divider">OR</div>
                    
                    <div class="manual-section">
                        <p>Open this URL on your mobile device:</p>
                        <div class="url-box">
                            <input type="text" value="http://localhost:3000/mobile-scanner.html?room=${roomCode}" readonly>
                            <button onclick="this.previousElementSibling.select(); document.execCommand('copy'); alert('URL copied!')">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        
                        <p>Or use this room code:</p>
                        <div class="room-code">${roomCode}</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showBluetoothConnection(roomCode) {
        const modal = document.createElement('div');
        modal.className = 'mobile-scanner-modal active';
        modal.id = 'bluetoothConnectionModal';
        modal.innerHTML = `
            <div class="mobile-scanner-content">
                <div class="scanner-header">
                    <h3><i class="fab fa-bluetooth"></i> Bluetooth Connection</h3>
                    <button class="close-modal" onclick="document.getElementById('bluetoothConnectionModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="scanner-body">
                    <div class="manual-section">
                        <p>Bluetooth Pairing Instructions:</p>
                        <ol style="padding-left: 20px; color: var(--gray-700);">
                            <li>Enable Bluetooth on your mobile device</li>
                            <li>Search for: <strong>SmartPOS_${roomCode}</strong></li>
                            <li>Pair with the device (PIN: 1234)</li>
                            <li>Open SmartPOS mobile app</li>
                            <li>Start scanning barcodes</li>
                        </ol>
                        
                        <button class="checkout-btn" style="margin-top: 20px;" onclick="alert('Bluetooth pairing initiated')">
                            <i class="fab fa-bluetooth"></i> Start Pairing
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showUSBConnection(roomCode) {
        const modal = document.createElement('div');
        modal.className = 'mobile-scanner-modal active';
        modal.id = 'usbConnectionModal';
        modal.innerHTML = `
            <div class="mobile-scanner-content">
                <div class="scanner-header">
                    <h3><i class="fas fa-usb"></i> USB Connection</h3>
                    <button class="close-modal" onclick="document.getElementById('usbConnectionModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="scanner-body">
                    <div class="manual-section">
                        <p>USB Connection Steps:</p>
                        <ol style="padding-left: 20px; color: var(--gray-700);">
                            <li>Connect your mobile device via USB cable</li>
                            <li>Enable USB Debugging on your mobile</li>
                            <li>Allow file transfer/MTP mode</li>
                            <li>Open SmartPOS mobile app</li>
                            <li>Start scanning barcodes</li>
                        </ol>
                        
                        <div class="room-code" style="margin-top: 20px;">Waiting for USB connection...</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Method to open the mobile scanner connection modal
    // Method to open the scanner modal (called by navbar scan button)
    openScannerModal() {
        // Use the product scan dialog from pos.html
        if (typeof showProductScanDialog === 'function') {
            showProductScanDialog();
        } else {
            console.error('Product scan dialog function not found');
            // Fallback to mobile scanner if product scan dialog not available
            this.openMobileScanner();
        }
    }
    
    openMobileScanner() {
        // Create the modal element if it doesn't exist
        let modal = document.getElementById('mobileScannerModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'mobileScannerModal';
            modal.className = 'mobile-scanner-modal';
            
            modal.innerHTML = `
                <div class="mobile-scanner-content">
                    <div class="mobile-scanner-header">
                        <h3><i class="fas fa-mobile-alt"></i> Mobile Scanner Connection</h3>
                        <button class="close-modal" id="closeMobileScannerModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="connection-steps">
                        <div class="step active" id="step1">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Connect your mobile device</h4>
                                <p>Make sure your mobile device is connected to the same WiFi network as this computer.</p>
                            </div>
                        </div>
                        
                        <div class="step" id="step2">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Scan this QR code</h4>
                                <p>Use your mobile camera to scan this QR code</p>
                                <div class="qr-container" id="qrCodeContainer">
                                    <div class="qr-loading">
                                        <i class="fas fa-spinner fa-spin"></i>
                                        <span>Generating QR code...</span>
                                    </div>
                                </div>
                                <div class="connection-info">
                                    <p>Room code: <strong id="roomCodeDisplay">------</strong></p>
                                    <p>Or open this URL on your mobile device:</p>
                                    <div class="scanner-url">
                                        <input type="text" id="scannerUrlInput" readonly>
                                        <button id="copyUrlButton" title="Copy URL">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="step" id="step3">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Waiting for connection...</h4>
                                <p>The scanner will automatically start when your device connects</p>
                                <div class="connection-status">
                                    <div class="status-spinner">
                                        <i class="fas fa-spinner fa-spin"></i>
                                    </div>
                                    <span id="connectionStatus">Waiting for mobile device...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
        
        // Show the modal
        modal.classList.add('active');
        
        // Set step 1 as active
        this.setActiveStep(1);
        
        // Generate a room code
        const roomCode = this.generateRoomCode();
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        
        // Create connection URL
        const baseUrl = window.location.origin;
        const scannerUrl = `${baseUrl}/mobile-scanner.html?room=${roomCode}`;
        document.getElementById('scannerUrlInput').value = scannerUrl;
        
        // Generate QR code
        this.generateQRCode(scannerUrl);
        
        // Setup copy URL button
        document.getElementById('copyUrlButton').addEventListener('click', () => {
            const urlInput = document.getElementById('scannerUrlInput');
            urlInput.select();
            document.execCommand('copy');
            
            // Show copy success message
            const copyBtn = document.getElementById('copyUrlButton');
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
            }, 2000);
        });
        
        // Setup close button
        document.getElementById('closeMobileScannerModal').addEventListener('click', () => {
            modal.classList.remove('active');
            this.disconnectMobileScanner();
        });
        
        // Move to step 2 after a brief delay
        setTimeout(() => {
            this.setActiveStep(2);
            
            // Initialize connection after QR code is displayed
            this.initializeMobileConnection(roomCode);
        }, 1000);
    }
    
    // Generate a room code for mobile connection
    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    // Set the active step in the connection process
    setActiveStep(stepNumber) {
        // Remove active class from all steps
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => step.classList.remove('active'));
        
        // Add active class to current step
        document.getElementById(`step${stepNumber}`).classList.add('active');
    }
    
    // Generate QR code for mobile connection
    generateQRCode(url) {
        const qrContainer = document.getElementById('qrCodeContainer');
        
        // Clear existing content
        qrContainer.innerHTML = '';
        
        // Use a placeholder image for now
        // In a real implementation, use a QR code library like qrcode.js
        const qrImage = document.createElement('img');
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
        qrImage.alt = 'Scan this QR code with your mobile device';
        qrImage.style.width = '100%';
        qrImage.style.height = '100%';
        
        qrContainer.appendChild(qrImage);
    }
    
    // Initialize mobile connection
    initializeMobileConnection(roomCode) {
        // Move to step 3
        this.setActiveStep(3);
        document.getElementById('connectionStatus').textContent = 'Waiting for mobile device...';
        
        // In a real implementation, this would use WebSockets or a similar technology
        // For demonstration purposes, we'll simulate a connection after a delay
        setTimeout(() => {
            document.getElementById('connectionStatus').textContent = 'Mobile device connected! Scanner ready.';
            document.getElementById('connectionStatus').style.color = '#28a745';
            
            // Start listening for scans
            this.startListeningForScans(roomCode);
        }, 3000);
    }
    
    // Start listening for scans from mobile device
    startListeningForScans(roomCode) {
        console.log(`Listening for scans from room: ${roomCode}`);
        
        // In a real implementation, this would use WebSockets or a similar technology
        // For demonstration purposes, we'll simulate a scan after a delay
        setTimeout(() => {
            // Simulate a barcode scan
            const barcode = '9843201234567';
            this.handleMobileScan(barcode);
        }, 5000);
    }
    
    // Handle a barcode scan from mobile device
    handleMobileScan(barcode) {
        console.log(`Received barcode scan: ${barcode}`);
        
        // Close the mobile scanner modal
        document.getElementById('mobileScannerModal').classList.remove('active');
        
        // Find the product by barcode
        const product = this.findProductByBarcode(barcode);
        
        if (product) {
            // Show the product scan dialog
            this.showProductScanDialog(product);
        } else {
            console.error(`Product not found for barcode: ${barcode}`);
            // Show error notification
            this.showNotification('Product not found', 'error');
        }
    }
    
    // Show product scan dialog
    showProductScanDialog(product) {
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.className = 'smart-scan-overlay';
        
        // Create dialog content
        overlay.innerHTML = `
            <div class="smart-scan-dialog">
                <div class="scan-dialog-header">
                    <h3><i class="fas fa-check-circle"></i> Product Scanned</h3>
                    <button class="close-scan-dialog" id="closeScanDialog">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="scan-dialog-content">
                    <div class="scanned-product">
                        <div class="scanned-product-image">
                            <img src="${product.image || '../images/product-placeholder.jpg'}" alt="${product.name}">
                        </div>
                        <div class="scanned-product-details">
                            <h4>${product.name}</h4>
                            <p class="product-price">NPR ${product.price.toFixed(2)}</p>
                            <p class="product-barcode">Barcode: ${product.barcode}</p>
                        </div>
                    </div>
                    
                    <div class="quantity-selector">
                        <label for="productQuantity">Quantity:</label>
                        <div class="quantity-controls">
                            <button class="qty-btn" id="decreaseQty">-</button>
                            <input type="number" id="productQuantity" value="1" min="1" max="${product.stock || 99}">
                            <button class="qty-btn" id="increaseQty">+</button>
                        </div>
                    </div>
                    
                    <div class="scan-actions">
                        <button class="scan-action-btn primary" id="addToCartBtn">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                        <button class="scan-action-btn secondary" id="scanMoreBtn">
                            <i class="fas fa-qrcode"></i> Scan More Items
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Setup close button
        document.getElementById('closeScanDialog').addEventListener('click', () => {
            overlay.remove();
        });
        
        // Setup quantity controls
        const quantityInput = document.getElementById('productQuantity');
        document.getElementById('decreaseQty').addEventListener('click', () => {
            if (quantityInput.value > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        });
        
        document.getElementById('increaseQty').addEventListener('click', () => {
            if (parseInt(quantityInput.value) < (product.stock || 99)) {
                quantityInput.value = parseInt(quantityInput.value) + 1;
            }
        });
        
        // Setup add to cart button
        document.getElementById('addToCartBtn').addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            this.addToCart(product.id, quantity);
            overlay.remove();
            
            // Show success notification
            this.showNotification(`${product.name} added to cart`);
        });
        
        // Setup scan more button
        document.getElementById('scanMoreBtn').addEventListener('click', () => {
            overlay.remove();
            this.openMobileScanner();
        });
    }
    
    // Find product by barcode
    findProductByBarcode(barcode) {
        return this.products.find(p => p.barcode === barcode);
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
    
    // Disconnect mobile scanner
    disconnectMobileScanner() {
        console.log('Disconnecting mobile scanner');
        // In a real implementation, this would close WebSocket connections
    }
}
