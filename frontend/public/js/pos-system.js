/**
 * Smart POS System - Advanced Point of Sale
 * Features: Product Search, Barcode Scanning, Mobile Integration, Receipt Printing
 */

class SmartPOSSystem {
    constructor() {
        this.cart = [];
        this.products = this.initializeProducts();
        this.isScanning = false;
        this.mobileConnection = null;
        this.scanner = null;
        this.currentStream = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartDisplay();
        this.initializeBarcodeScanner();
        console.log('Smart POS System initialized');
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

    openMobileScanner() {
        const roomCode = this.generateRoomCode();
        const url = `mobile-scanner.html?room=${roomCode}`;
        
        window.open(url, '_blank');
    }
}
