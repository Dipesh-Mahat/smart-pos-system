// Supplier Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializePageLoader();
    initializeSidebar();
    initializeNavigation();
    initializeNotifications();
    initializeModals();
    initializeForms();
    initializeDataTables();
    loadDashboardData();
});

// Global variables
let currentSection = 'dashboard';
let sampleProducts = [];
let sampleOrders = [];

// Page Loading
function initializePageLoader() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 1000);
    }
}

// Sidebar functionality
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileToggle = document.getElementById('mobileToggle');
    
    // Desktop sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                // Mobile behavior - show/hide sidebar with overlay
                sidebar.classList.toggle('show');
                toggleSidebarOverlay();
            } else {
                // Desktop behavior - collapse/expand
                sidebar.classList.toggle('collapsed');
            }
        });
    }
    
    // Mobile sidebar toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            toggleSidebarOverlay();
        });
    }

    // Handle mobile overlay
    function toggleSidebarOverlay() {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            });
        }
        overlay.classList.toggle('show');
    }

    // Handle responsive behavior
    function handleResize() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (window.innerWidth <= 768) {
            // Mobile - hide sidebar by default and remove collapsed state
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('show');
            if (overlay) {
                overlay.classList.remove('show');
            }
        } else {
            // Desktop - show sidebar and remove mobile classes
            sidebar.classList.remove('show');
            if (overlay) {
                overlay.classList.remove('show');
            }        }
    }
    
    // Initial setup
    handleResize();

    // Window resize handler
    window.addEventListener('resize', handleResize);
}

// Navigation
function initializeNavigation() {
    const menuLinks = document.querySelectorAll('.menu-link');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all menu items
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            link.closest('.menu-item').classList.add('active');
            
            // Get section from href
            const section = link.getAttribute('href').substring(1);
            showSection(section);
        });
    });
}

// Show different sections
function showSection(section) {
    currentSection = section;
    
    // Hide all sections
    const dashboardContent = document.getElementById('dashboardContent');
    const sectionContents = document.querySelectorAll('.section-content');
    
    dashboardContent.style.display = 'none';
    sectionContents.forEach(content => {
        content.style.display = 'none';
    });
    
    // Update page title
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-subtitle');
    
    switch(section) {
        case 'dashboard':
            dashboardContent.style.display = 'block';
            pageTitle.textContent = 'Dashboard';
            pageSubtitle.textContent = 'Welcome back! Here\'s your business overview';
            break;
        case 'products':
            showProductsSection();
            pageTitle.textContent = 'My Products';
            pageSubtitle.textContent = 'Manage your product catalog';
            break;
        case 'orders':
            showOrdersSection();
            pageTitle.textContent = 'Order Management';
            pageSubtitle.textContent = 'Track and manage your orders';
            break;
        case 'customers':
            showCustomersSection();
            pageTitle.textContent = 'Customers';
            pageSubtitle.textContent = 'Manage your customer relationships';
            break;
        case 'inventory':
            showInventorySection();
            pageTitle.textContent = 'Inventory';
            pageSubtitle.textContent = 'Track your stock levels';
            break;
        case 'analytics':
            showAnalyticsSection();
            pageTitle.textContent = 'Analytics';
            pageSubtitle.textContent = 'View your business insights';
            break;
        case 'profile':
            showProfileSection();
            pageTitle.textContent = 'Profile';
            pageSubtitle.textContent = 'Manage your supplier profile';
            break;
        case 'settings':
            showSettingsSection();
            pageTitle.textContent = 'Settings';
            pageSubtitle.textContent = 'Configure your preferences';
            break;
    }
}

// Products Section
function showProductsSection() {
    const productsSection = document.getElementById('productsSection');
    productsSection.style.display = 'block';
    loadProducts();
}

function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    // Sample products data
    sampleProducts = [
        {
            id: 1,
            name: 'Basmati Rice (5kg)',
            category: 'groceries',
            price: 850,
            stock: 25,
            status: 'active',
            image: '../images/icons/document-icon.png'
        },
        {
            id: 2,
            name: 'Sunflower Oil (1L)',
            category: 'groceries',
            price: 180,
            stock: 8,
            status: 'low-stock',
            image: '../images/icons/document-icon.png'
        },
        {
            id: 3,
            name: 'Sugar (1kg)',
            category: 'groceries',
            price: 65,
            stock: 0,
            status: 'out-of-stock',
            image: '../images/icons/document-icon.png'
        },
        {
            id: 4,
            name: 'Tea Powder (500g)',
            category: 'groceries',
            price: 320,
            stock: 45,
            status: 'active',
            image: '../images/icons/document-icon.png'
        }
    ];
    
    productsGrid.innerHTML = sampleProducts.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-status ${product.status}">
                    ${getStatusText(product.status)}
                </div>
            </div>
            <div class="product-details">
                <h3>${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <div class="product-price">₹${product.price}</div>
                <div class="product-stock">Stock: ${product.stock} units</div>
                <div class="product-actions">
                    <button class="btn-edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-toggle" onclick="toggleProductStatus(${product.id})">
                        <i class="fas fa-${product.status === 'active' ? 'pause' : 'play'}"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    switch(status) {
        case 'active': return 'Active';
        case 'inactive': return 'Inactive';
        case 'out-of-stock': return 'Out of Stock';
        case 'low-stock': return 'Low Stock';
        default: return 'Unknown';
    }
}

// Orders Section
function showOrdersSection() {
    const ordersSection = document.getElementById('ordersSection');
    ordersSection.style.display = 'block';
    loadOrders();
}

function loadOrders() {
    // Sample orders data
    sampleOrders = [
        {
            id: 'ORD001',
            customer: 'Sharma General Store',
            products: 'Rice, Oil, Sugar',
            amount: 2450,
            status: 'pending',
            date: '2024-12-08',
            avatar: '../images/avatars/user-avatar.png'
        },
        {
            id: 'ORD002',
            customer: 'Nepal Mart',
            products: 'Dal, Masala, Soap',
            amount: 1890,
            status: 'approved',
            date: '2024-12-07',
            avatar: '../images/avatars/user-avatar.png'
        },
        {
            id: 'ORD003',
            customer: 'Patel Store',
            products: 'Tea, Biscuits, Noodles',
            amount: 1200,
            status: 'shipped',
            date: '2024-12-06',
            avatar: '../images/avatars/user-avatar.png'
        }
    ];
    
    const ordersContent = document.querySelector('#ordersSection .orders-content');
    ordersContent.innerHTML = `
        <div class="orders-table-container">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Products</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sampleOrders.map(order => `
                        <tr>
                            <td>${order.id}</td>
                            <td>
                                <div class="customer-info">
                                    <img src="${order.avatar}" alt="Customer">
                                    <span>${order.customer}</span>
                                </div>
                            </td>
                            <td>${order.products}</td>
                            <td>₹${order.amount}</td>
                            <td><span class="status-badge ${order.status}">${order.status}</span></td>
                            <td>${formatDate(order.date)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-view" onclick="viewOrder('${order.id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${getOrderActionButton(order.status, order.id)}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getOrderActionButton(status, orderId) {
    switch(status) {
        case 'pending':
            return `<button class="btn-approve" onclick="approveOrder('${orderId}')"><i class="fas fa-check"></i></button>`;
        case 'approved':
            return `<button class="btn-ship" onclick="shipOrder('${orderId}')"><i class="fas fa-truck"></i></button>`;
        default:
            return '';
    }
}

// Other sections (placeholder functions)
function showCustomersSection() {
    const ordersSection = document.getElementById('ordersSection');
    ordersSection.style.display = 'block';
    ordersSection.innerHTML = `
        <div class="section-header">
            <h2>Customer Management</h2>
        </div>
        <div class="coming-soon">
            <i class="fas fa-users fa-3x"></i>
            <h3>Customer Management</h3>
            <p>This feature is coming soon. You'll be able to manage your customer relationships here.</p>
        </div>
    `;
}

function showInventorySection() {
    const ordersSection = document.getElementById('ordersSection');
    ordersSection.style.display = 'block';
    ordersSection.innerHTML = `
        <div class="section-header">
            <h2>Inventory Management</h2>
        </div>
        <div class="coming-soon">
            <i class="fas fa-warehouse fa-3x"></i>
            <h3>Inventory Management</h3>
            <p>Track your stock levels, set reorder points, and manage inventory across multiple locations.</p>
        </div>
    `;
}

function showAnalyticsSection() {
    const ordersSection = document.getElementById('ordersSection');
    ordersSection.style.display = 'block';
    ordersSection.innerHTML = `
        <div class="section-header">
            <h2>Business Analytics</h2>
        </div>
        <div class="coming-soon">
            <i class="fas fa-chart-bar fa-3x"></i>
            <h3>Business Analytics</h3>
            <p>View detailed reports on sales, customer behavior, and business performance.</p>
        </div>
    `;
}

function showProfileSection() {
    const ordersSection = document.getElementById('ordersSection');
    ordersSection.style.display = 'block';
    ordersSection.innerHTML = `
        <div class="section-header">
            <h2>Supplier Profile</h2>
        </div>
        <div class="coming-soon">
            <i class="fas fa-user-circle fa-3x"></i>
            <h3>Profile Management</h3>
            <p>Update your business information, contact details, and profile settings.</p>
        </div>
    `;
}

function showSettingsSection() {
    const ordersSection = document.getElementById('ordersSection');
    ordersSection.style.display = 'block';
    ordersSection.innerHTML = `
        <div class="section-header">
            <h2>Settings</h2>
        </div>
        <div class="coming-soon">
            <i class="fas fa-cog fa-3x"></i>
            <h3>Settings</h3>
            <p>Configure your notification preferences, payment settings, and other options.</p>
        </div>
    `;
}

// Notifications
function initializeNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const closeNotifications = document.getElementById('closeNotifications');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            notificationPanel.classList.toggle('active');
        });
    }
    
    if (closeNotifications) {
        closeNotifications.addEventListener('click', () => {
            notificationPanel.classList.remove('active');
        });
    }
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
            notificationPanel.classList.remove('active');
        }
    });
}

// Modals
function initializeModals() {
    const addProductBtn = document.getElementById('addProductBtn');
    const addProductModal = document.getElementById('addProductModal');
    const closeAddProductModal = document.getElementById('closeAddProductModal');
    const cancelAddProduct = document.getElementById('cancelAddProduct');
    
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            addProductModal.classList.add('active');
        });
    }
    
    if (closeAddProductModal) {
        closeAddProductModal.addEventListener('click', () => {
            addProductModal.classList.remove('active');
        });
    }
    
    if (cancelAddProduct) {
        cancelAddProduct.addEventListener('click', () => {
            addProductModal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    addProductModal?.addEventListener('click', (e) => {
        if (e.target === addProductModal) {
            addProductModal.classList.remove('active');
        }
    });
}

// Forms
function initializeForms() {
    const productForm = document.getElementById('productForm');
    
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAddProduct();
        });
    }
}

function handleAddProduct() {
    const form = document.getElementById('productForm');
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset form and close modal
        form.reset();
        document.getElementById('addProductModal').classList.remove('active');
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Show success message
        showNotification('Product added successfully!', 'success');
        
        // Reload products if on products page
        if (currentSection === 'products') {
            loadProducts();
        }
    }, 1500);
}

// Data Tables
function initializeDataTables() {
    // Add sorting and filtering functionality
    const searchInputs = document.querySelectorAll('.search-input');
    const filterSelects = document.querySelectorAll('.filter-select');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', handleSearch);
    });
    
    filterSelects.forEach(select => {
        select.addEventListener('change', handleFilter);
    });
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    // Implement search functionality
    console.log('Searching for:', searchTerm);
}

function handleFilter(e) {
    const filterValue = e.target.value;
    // Implement filter functionality
    console.log('Filtering by:', filterValue);
}

// Product Actions
function editProduct(productId) {
    console.log('Editing product:', productId);
    showNotification('Edit product feature coming soon!', 'info');
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        console.log('Deleting product:', productId);
        showNotification('Product deleted successfully!', 'success');
        loadProducts();
    }
}

function toggleProductStatus(productId) {
    console.log('Toggling product status:', productId);
    showNotification('Product status updated!', 'success');
    loadProducts();
}

// Order Actions
function viewOrder(orderId) {
    console.log('Viewing order:', orderId);
    showNotification('Order details feature coming soon!', 'info');
}

function approveOrder(orderId) {
    if (confirm('Approve this order?')) {
        console.log('Approving order:', orderId);
        showNotification('Order approved successfully!', 'success');
        loadOrders();
    }
}

function shipOrder(orderId) {
    if (confirm('Mark this order as shipped?')) {
        console.log('Shipping order:', orderId);
        showNotification('Order marked as shipped!', 'success');
        loadOrders();
    }
}

// Dashboard Data
function loadDashboardData() {
    // Simulate loading dashboard stats
    animateStats();
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-info h3');
    
    statNumbers.forEach((stat, index) => {
        const finalValue = parseInt(stat.textContent.replace(/[^\d]/g, ''));
        let currentValue = 0;
        const increment = finalValue / 50;
        const isPrice = stat.textContent.includes('₹');
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            
            if (isPrice) {
                stat.textContent = `₹${Math.round(currentValue).toLocaleString()}`;
            } else {
                stat.textContent = Math.round(currentValue);
            }
        }, 20);
    });
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="close-notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': default: return 'info-circle';
    }
}

function getNotificationColor(type) {
    switch(type) {
        case 'success': return '#38a169';
        case 'error': return '#e53e3e';
        case 'warning': return '#dd6b20';
        case 'info': default: return '#3182ce';
    }
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        setTimeout(() => {
            window.location.href = '../supplier-landing.html';
        }, 1500);
    }
});

// Add animation styles
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .coming-soon {
        text-align: center;
        padding: 80px 20px;
        color: #718096;
    }
    
    .coming-soon i {
        color: #e2e8f0;
        margin-bottom: 20px;
    }
    
    .coming-soon h3 {
        font-size: 1.5rem;
        margin-bottom: 10px;
        color: #2d3748;
    }
    
    .coming-soon p {
        max-width: 400px;
        margin: 0 auto;
        line-height: 1.6;
    }
    
    .product-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        transition: all 0.3s ease;
    }
    
    .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    
    .product-image {
        position: relative;
        height: 150px;
        background: #f7fafc;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .product-image img {
        max-width: 80px;
        max-height: 80px;
        object-fit: contain;
    }
    
    .product-status {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .product-status.active {
        background: rgba(56, 161, 105, 0.1);
        color: #38a169;
    }
    
    .product-status.low-stock {
        background: rgba(221, 107, 32, 0.1);
        color: #dd6b20;
    }
    
    .product-status.out-of-stock {
        background: rgba(229, 62, 62, 0.1);
        color: #e53e3e;
    }
    
    .product-details {
        padding: 15px;
    }
    
    .product-details h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 8px;
    }
    
    .product-category {
        font-size: 0.8rem;
        color: #718096;
        text-transform: capitalize;
        margin-bottom: 10px;
    }
    
    .product-price {
        font-size: 1.2rem;
        font-weight: 700;
        color: #3182ce;
        margin-bottom: 8px;
    }
    
    .product-stock {
        font-size: 0.8rem;
        color: #718096;
        margin-bottom: 15px;
    }
    
    .product-actions {
        display: flex;
        gap: 8px;
    }
    
    .product-actions button {
        flex: 1;
        padding: 8px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    
    .btn-edit {
        background: rgba(49, 130, 206, 0.1);
        color: #3182ce;
    }
    
    .btn-edit:hover {
        background: rgba(49, 130, 206, 0.2);
    }
    
    .btn-delete {
        background: rgba(229, 62, 62, 0.1);
        color: #e53e3e;
    }
    
    .btn-delete:hover {
        background: rgba(229, 62, 62, 0.2);
    }
    
    .btn-toggle {
        background: rgba(113, 128, 150, 0.1);
        color: #718096;
    }
    
    .btn-toggle:hover {
        background: rgba(113, 128, 150, 0.2);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .close-notification {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 4px;
        margin-left: auto;
    }
`;
document.head.appendChild(animationStyles);
