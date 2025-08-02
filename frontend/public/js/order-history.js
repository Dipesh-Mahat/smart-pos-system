/**
 * Order History Management
 * Smart POS System - Nepal
 */

class OrderHistoryManager {
    constructor() {
        this.allOrders = [];
        this.filteredOrders = [];
        this.suppliers = [];
        this.currentBillData = null;
        this.billGenerator = new SmartPOSBillGenerator();
        this.init();
    }

    init() {
        // Prevent auto-initialization since we'll do it manually
        window.navbarManualInit = true;
        
        // Authentication check and initialization
        document.addEventListener('DOMContentLoaded', () => {
            // Check if user is authenticated
            if (!window.authService || !window.authService.isLoggedIn()) {
                window.location.href = '../landing.html';
                return;
            }
            
            // Initialize navbar
            if (!window.smartPOSNavbar) {
                const navbar = new SmartPOSNavbar({
                    title: 'Order History',
                    customActions: []
                });
                window.smartPOSNavbar = navbar;
            }
            
            // Initialize the page
            this.loadSuppliers();
            this.loadOrders();
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Modal close events
        document.getElementById('bill-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('bill-modal')) {
                this.closeBillModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeBillModal();
            }
        });
    }

    async loadSuppliers() {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add auth token if available
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('http://localhost:5000/api/shop/orders/suppliers', { headers });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.suppliers) {
                    this.suppliers = data.suppliers;
                    this.populateSupplierFilter();
                }
            } else {
                console.error('Failed to load suppliers');
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
        }
    }

    populateSupplierFilter() {
        const supplierFilter = document.getElementById('supplier-filter');
        this.suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier._id;
            option.textContent = supplier.firstName + ' ' + supplier.lastName + 
                (supplier.companyName ? ` (${supplier.companyName})` : '');
            supplierFilter.appendChild(option);
        });
    }

    async loadOrders() {
        try {
            // Add loading indicator
            document.getElementById('orders-list').innerHTML = '<div class="loading"><div>Loading your order history...</div></div>';
            
            // Use proper API endpoint with authentication headers
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Add auth token if available
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('http://localhost:5000/api/shop/orders', { headers });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const ordersResponse = await response.json();
            console.log('Orders data loaded:', ordersResponse);
            
            // Handle the API response structure
            if (ordersResponse.success && ordersResponse.orders) {
                this.allOrders = ordersResponse.orders;
                
                // Enrich orders with supplier information if needed
                for (let order of this.allOrders) {
                    if (order.supplierId && !order.supplierInfo) {
                        // Find supplier info from our suppliers array
                        const supplier = this.suppliers.find(s => s._id === order.supplierId);
                        if (supplier) {
                            order.supplierInfo = {
                                _id: supplier._id,
                                supplierName: supplier.firstName + ' ' + supplier.lastName,
                                email: supplier.email || 'No email provided',
                                phone: supplier.contactNumber || 'No phone provided',
                                address: supplier.address || 'No address provided'
                            };
                        } else {
                            order.supplierInfo = {
                                _id: order.supplierId,
                                supplierName: 'Unknown Supplier',
                                email: 'No email provided',
                                phone: 'No phone provided',
                                address: 'No address provided'
                            };
                        }
                    }
                }
            } else {
                console.warn('Unexpected data format:', ordersResponse);
                this.allOrders = [];
            }

            // Sort orders by date (newest first)
            this.allOrders.sort((a, b) => {
                const dateA = new Date(a.orderDate || a.createdAt);
                const dateB = new Date(b.orderDate || b.createdAt);
                return dateB - dateA;
            });
            
            this.filteredOrders = [...this.allOrders];
            this.displayOrders();
            
            console.log(`Loaded ${this.allOrders.length} orders successfully`);
            
        } catch (error) {
            console.error('Error loading orders:', error);
            const errorMessage = this.getErrorMessage(error);
            document.getElementById('orders-list').innerHTML = `
                <div class="no-orders">
                    <i style="font-size: 3rem; color: #e74c3c;">⚠️</i>
                    <h3>Error Loading Orders</h3>
                    <p>${errorMessage}</p>
                    <button onclick="orderHistoryManager.loadOrders()" style="
                        background: #3498db; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer; 
                        margin-top: 15px;
                        font-weight: 600;
                    ">
                        <i class="fas fa-refresh"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    getErrorMessage(error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return 'Cannot connect to server. Please ensure the backend server is running on the correct port.';
        } else if (error.message.includes('401')) {
            return 'Authentication failed. Please log in again.';
        } else if (error.message.includes('403')) {
            return 'Access denied. Please check your permissions.';
        } else if (error.message.includes('404')) {
            return 'Orders endpoint not found. Please check the API configuration.';
        } else if (error.message.includes('500')) {
            return 'Server error. Please try again later.';
        } else {
            return `${error.message || 'Unknown error occurred'}. Please check your connection and try again.`;
        }
    }

    displayOrders() {
        const ordersList = document.getElementById('orders-list');
        const ordersCount = document.getElementById('orders-count');

        if (this.filteredOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="no-orders">
                    <i style="font-size: 4rem; color: #bdc3c7;">📦</i>
                    <h3>No orders found</h3>
                    <p>No orders match your current filters. Try adjusting your search criteria or check back later.</p>
                </div>
            `;
            ordersCount.textContent = '0 orders found';
            return;
        }

        ordersCount.textContent = `${this.filteredOrders.length} order${this.filteredOrders.length !== 1 ? 's' : ''} found`;

        const ordersHTML = this.filteredOrders.map((order, index) => {
            // Safely handle date formatting
            let formattedDate;
            try {
                const orderDate = new Date(order.orderDate || order.createdAt || Date.now());
                formattedDate = orderDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                formattedDate = 'Invalid Date';
            }

            const statusClass = `status-${(order.status || 'pending').toLowerCase()}`;
            const statusDisplay = (order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1);
            
            // Calculate order summary safely
            const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
            const orderTotal = parseFloat(order.total || order.totalAmount || 0);
            
            // Generate order ID display
            const orderId = order._id ? order._id.slice(-8).toUpperCase() : `ORD-${(index + 1).toString().padStart(4, '0')}`;
            
            return `
                <div class="order-card" data-order-id="${order._id}">
                    <div class="order-header">
                        <div class="order-info">
                            <h3 class="order-number">Order #${orderId}</h3>
                            <p class="order-date">
                                <i class="fas fa-calendar-alt" style="margin-right: 5px; color: #7f8c8d;"></i>
                                ${formattedDate}
                            </p>
                        </div>
                        <span class="order-status ${statusClass}">${statusDisplay}</span>
                    </div>

                    <div class="order-details">
                        <div class="detail-group">
                            <div class="detail-label">
                                <i class="fas fa-store" style="margin-right: 5px;"></i>
                                Supplier
                            </div>
                            <div class="detail-value supplier-name">${order.supplierInfo?.supplierName || 'Unknown Supplier'}</div>
                        </div>
                        <div class="detail-group">
                            <div class="detail-label">
                                <i class="fas fa-box" style="margin-right: 5px;"></i>
                                Items Count
                            </div>
                            <div class="detail-value">${itemsCount} item${itemsCount !== 1 ? 's' : ''}</div>
                        </div>
                        <div class="detail-group">
                            <div class="detail-label">
                                <i class="fas fa-dollar-sign" style="margin-right: 5px;"></i>
                                Total Amount
                            </div>
                            <div class="detail-value order-total">NPR ${orderTotal.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    ${itemsCount > 0 ? `
                        <div class="order-items">
                            <div class="items-header">
                                <i class="fas fa-list" style="margin-right: 8px;"></i>
                                Order Items
                            </div>
                            <div class="item-row" style="font-weight: 600; color: #2c3e50; background: #f8f9fa; padding: 10px 0; border-radius: 5px;">
                                <div>Product</div>
                                <div style="text-align: right;">Quantity</div>
                                <div style="text-align: right;">Unit Price</div>
                                <div style="text-align: right;">Total</div>
                            </div>
                            ${order.items.slice(0, 3).map(item => {
                                const itemPrice = parseFloat(item.price || item.unitPrice || 0);
                                const itemQuantity = parseInt(item.quantity || 1);
                                const itemTotal = itemPrice * itemQuantity;
                                
                                return `
                                    <div class="item-row">
                                        <div class="item-name" title="${item.productName || item.name || 'Unknown Product'}">
                                            ${(item.productName || item.name || 'Unknown Product').length > 25 ? 
                                                (item.productName || item.name || 'Unknown Product').substring(0, 25) + '...' : 
                                                (item.productName || item.name || 'Unknown Product')
                                            }
                                        </div>
                                        <div class="item-quantity">${itemQuantity}</div>
                                        <div class="item-price">NPR ${itemPrice.toFixed(2)}</div>
                                        <div class="item-total">NPR ${itemTotal.toFixed(2)}</div>
                                    </div>
                                `;
                            }).join('')}
                            ${itemsCount > 3 ? `
                                <div class="item-row" style="font-style: italic; color: #7f8c8d; background: #f8f9fa; border-radius: 5px;">
                                    <div>
                                        <i class="fas fa-ellipsis-h" style="margin-right: 5px;"></i>
                                        and ${itemsCount - 3} more item${itemsCount - 3 !== 1 ? 's' : ''}
                                    </div>
                                    <div></div>
                                    <div></div>
                                    <div></div>
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="order-items">
                            <div style="text-align: center; color: #7f8c8d; padding: 20px; font-style: italic;">
                                <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
                                No items details available for this order
                            </div>
                        </div>
                    `}

                    <div class="order-actions">
                        <button class="action-btn view-btn" onclick="orderHistoryManager.viewOrderBill('${order._id}')" title="View detailed bill">
                            <i class="fas fa-eye"></i> View Bill
                        </button>
                        <button class="action-btn export-btn" onclick="orderHistoryManager.exportOrderBill('${order._id}')" title="Export as PDF">
                            <i class="fas fa-file-pdf"></i> Export PDF
                        </button>
                        <button class="action-btn reorder-btn" onclick="orderHistoryManager.reorderItems('${order._id}')" title="Reorder these items">
                            <i class="fas fa-redo"></i> Reorder
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        ordersList.innerHTML = ordersHTML;
    }

    applyFilters() {
        const supplierFilter = document.getElementById('supplier-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        this.filteredOrders = this.allOrders.filter(order => {
            // Supplier filter
            if (supplierFilter && order.supplierInfo?._id !== supplierFilter) {
                return false;
            }

            // Status filter
            if (statusFilter && (order.status || 'pending') !== statusFilter) {
                return false;
            }

            // Date filters
            const orderDate = new Date(order.orderDate || order.createdAt);
            if (dateFrom && orderDate < new Date(dateFrom)) {
                return false;
            }
            if (dateTo && orderDate > new Date(dateTo + 'T23:59:59')) {
                return false;
            }

            return true;
        });

        this.displayOrders();
    }

    viewOrderBill(orderId) {
        const order = this.allOrders.find(o => o._id === orderId);
        if (!order) {
            alert('Order not found');
            return;
        }

        this.generateOrderBill(order, true);
    }

    exportOrderBill(orderId) {
        const order = this.allOrders.find(o => o._id === orderId);
        if (!order) {
            alert('Order not found');
            return;
        }

        this.generateOrderBill(order, false);
    }

    generateOrderBill(order, showModal = true) {
        // Convert order data to bill format
        const billData = {
            billNo: `ORD-${order._id.slice(-8).toUpperCase()}`,
            date: new Date(order.orderDate || order.createdAt),
            supplier: {
                name: order.supplierInfo?.supplierName || 'Unknown Supplier',
                email: order.supplierInfo?.email || 'No email',
                phone: order.supplierInfo?.phone || order.supplierInfo?.contactNumber || 'No phone',
                address: order.supplierInfo?.address || 'No address'
            },
            customer: {
                name: 'Smart POS Shop',
                email: 'shop@smartpos.com',
                phone: '+977-1-234567',
                address: 'Kathmandu, Nepal'
            },
            items: order.items.map(item => ({
                name: item.productName || item.name || 'Unknown Product',
                quantity: item.quantity || 1,
                cost: item.price || 0,
                sell: item.price || 0,
                unit: item.unit || 'pcs'
            })),
            subtotal: order.subtotal || order.total || 0,
            discount: order.discount || 0,
            deliveryDate: order.deliveryDate || order.orderDate || order.createdAt
        };

        // Create bill using the generator
        const bill = this.billGenerator.createBill(billData);
        const billHTML = this.billGenerator.generateBillHTML(false);

        this.currentBillData = bill;

        if (showModal) {
            // Show in modal
            document.getElementById('bill-content').innerHTML = '';
            document.getElementById('bill-content').appendChild(billHTML);
            document.getElementById('bill-modal').style.display = 'block';
        } else {
            // Export directly to PDF
            this.exportToPDF(billHTML, `Order-${order._id.slice(-8).toUpperCase()}.pdf`);
        }
    }

    exportCurrentBill() {
        if (!this.currentBillData) {
            alert('No bill data available');
            return;
        }

        const billElement = document.querySelector('#bill-content .smart-pos-bill');
        if (billElement) {
            this.exportToPDF(billElement, `Order-${this.currentBillData.billNo}.pdf`);
        }
    }

    printCurrentBill() {
        if (!this.currentBillData) {
            alert('No bill data available');
            return;
        }

        const billElement = document.querySelector('#bill-content .smart-pos-bill');
        if (billElement) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Bill - ${this.currentBillData.billNo}</title>
                        <style>
                            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                            @media print { body { padding: 0; } }
                        </style>
                    </head>
                    <body>
                        ${billElement.outerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    exportToPDF(element, filename) {
        const options = {
            margin: 1,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(options).from(element).save();
    }

    exportAllOrders() {
        if (this.filteredOrders.length === 0) {
            alert('No orders to export');
            return;
        }

        if (confirm(`Export ${this.filteredOrders.length} orders as PDF? This may take a moment.`)) {
            // Create a combined document with all bills
            const combinedHTML = document.createElement('div');
            
            this.filteredOrders.forEach((order, index) => {
                const billData = {
                    billNo: `ORD-${order._id.slice(-8).toUpperCase()}`,
                    date: new Date(order.orderDate || order.createdAt),
                    supplier: {
                        name: order.supplierInfo?.supplierName || 'Unknown Supplier',
                        email: order.supplierInfo?.email || 'No email',
                        phone: order.supplierInfo?.phone || order.supplierInfo?.contactNumber || 'No phone',
                        address: order.supplierInfo?.address || 'No address'
                    },
                    customer: {
                        name: 'Smart POS Shop',
                        email: 'shop@smartpos.com',
                        phone: '+977-1-234567',
                        address: 'Kathmandu, Nepal'
                    },
                    items: order.items.map(item => ({
                        name: item.productName || item.name || 'Unknown Product',
                        quantity: item.quantity || 1,
                        cost: item.price || 0,
                        sell: item.price || 0,
                        unit: item.unit || 'pcs'
                    })),
                    subtotal: order.subtotal || order.total || 0,
                    discount: order.discount || 0,
                    deliveryDate: order.deliveryDate || order.orderDate || order.createdAt
                };

                const bill = this.billGenerator.createBill(billData);
                const billHTML = this.billGenerator.generateBillHTML(true);
                
                combinedHTML.appendChild(billHTML);
                
                // Add page break except for last item
                if (index < this.filteredOrders.length - 1) {
                    const pageBreak = document.createElement('div');
                    pageBreak.style.pageBreakAfter = 'always';
                    combinedHTML.appendChild(pageBreak);
                }
            });

            this.exportToPDF(combinedHTML, `All-Orders-${new Date().toISOString().split('T')[0]}.pdf`);
        }
    }

    reorderItems(orderId) {
        const order = this.allOrders.find(o => o._id === orderId);
        if (!order) {
            alert('Order not found');
            return;
        }

        if (confirm(`Reorder ${order.items.length} items from ${order.supplierInfo?.supplierName || 'this supplier'}?`)) {
            // In a real implementation, this would add items to cart
            alert('Items added to cart! Redirecting to suppliers page...');
            window.location.href = 'suppliers.html';
        }
    }

    closeBillModal() {
        document.getElementById('bill-modal').style.display = 'none';
        this.currentBillData = null;
    }
}

// Global functions for backward compatibility
function applyFilters() {
    window.orderHistoryManager?.applyFilters();
}

function exportAllOrders() {
    window.orderHistoryManager?.exportAllOrders();
}

function exportCurrentBill() {
    window.orderHistoryManager?.exportCurrentBill();
}

function printCurrentBill() {
    window.orderHistoryManager?.printCurrentBill();
}

function closeBillModal() {
    window.orderHistoryManager?.closeBillModal();
}

// Initialize the order history manager
window.orderHistoryManager = new OrderHistoryManager();
