/**
 * Supplier Order Management
 * Smart POS System - Supplier Portal
 */

class OrderManager {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.totalItems = 0;
        this.filters = {};
        this.selectedOrders = new Set();
        this.apiService = window.apiService || {};
        
        this.init();
    }

    async init() {
        try {
            await this.loadOrders();
            await this.loadOrderStats();
            await this.loadOrderInsights();
            this.setupEventListeners();
        } catch (error) {
            console.error("Error initializing order manager:", error);
            this.showNotification("Failed to load order data", "error");
        }
    }

    async loadOrders(page = 1, filters = {}) {
        try {
            this.showLoader();
            
            // Build query parameters for API request
            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', this.itemsPerPage);
            
            // Add filters if provided
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            
            // Make API request to get order data
            const response = await this.apiService.request(`/supplier/orders?${queryParams.toString()}`);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load order data');
            }
            
            this.orders = response.data.orders;
            this.filteredOrders = this.orders;
            this.currentPage = page;
            this.totalPages = response.data.pagination.pages;
            this.totalItems = response.data.pagination.total;
            this.filters = filters;
            
            this.renderOrdersTable();
            this.renderPagination();
            
            // Update order counts in statistics
            const stats = response.data.stats;
            if (stats) {
                this.updateOrderStatistics(stats);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
            this.showNotification("Failed to load orders", "error");
        } finally {
            this.hideLoader();
        }
    }
    
    async loadOrderStats() {
        try {
            const response = await this.apiService.request('/supplier/orders/stats');
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load order statistics');
            }
            
            this.updateOrderStatistics(response.data.stats);
        } catch (error) {
            console.error("Error loading order statistics:", error);
        }
    }
    
    async loadOrderInsights() {
        try {
            // Load insights data
            this.updateOrderStatistics();
            this.setupEventListeners();
        } catch (error) {
            console.error("Error loading order insights:", error);
        }
    }

    setupEventListeners() {
        // Search and filters
        const orderSearch = document.getElementById('orderSearch');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        const filterBtn = document.getElementById('filterBtn');
        
        if (orderSearch) orderSearch.addEventListener('input', () => this.handleOrderSearch());
        if (statusFilter) statusFilter.addEventListener('change', () => this.handleOrderFilter());
        if (dateFilter) dateFilter.addEventListener('change', () => this.handleOrderFilter());
        if (filterBtn) filterBtn.addEventListener('click', () => this.applyOrderFilters());
        
        // Action buttons
        const exportBtn = document.getElementById('exportOrdersBtn');
        const newOrderBtn = document.getElementById('newOrderBtn');
        const bulkActionsBtn = document.getElementById('bulkActionsBtn');
        
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportOrders());
        if (newOrderBtn) newOrderBtn.addEventListener('click', () => this.createNewOrder());
        if (bulkActionsBtn) bulkActionsBtn.addEventListener('click', () => this.showBulkActions());
        
        // Select all checkbox
        const selectAllOrders = document.getElementById('selectAllOrders');
        if (selectAllOrders) selectAllOrders.addEventListener('change', () => this.handleSelectAllOrders());
    }
}

// Initialize the order manager when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new OrderManager();
});

// Standalone functions (keeping them separate for now)
function setupOrdersEventListeners() {
    // Search and filters
    document.getElementById('orderSearch').addEventListener('input', handleOrderSearch);
    document.getElementById('statusFilter').addEventListener('change', handleOrderFilter);
    document.getElementById('dateFilter').addEventListener('change', handleOrderFilter);
    document.getElementById('filterBtn').addEventListener('click', applyOrderFilters);
    
    // Action buttons
    document.getElementById('exportOrdersBtn').addEventListener('click', exportOrders);
    document.getElementById('newOrderBtn').addEventListener('click', createNewOrder);
    document.getElementById('bulkActionsBtn').addEventListener('click', showBulkActions);
    
    // Select all checkbox
    document.getElementById('selectAllOrders').addEventListener('change', handleSelectAllOrders);
}

function loadOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    const startIndex = (currentOrderPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const pageOrders = filteredOrders.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    
    pageOrders.forEach(order => {
        const row = createOrderRow(order);
        tableBody.appendChild(row);
    });
    
    updateOrdersPaginationInfo();
}

function createOrderRow(order) {
    const row = document.createElement('tr');
    
    const statusClass = getStatusClass(order.status);
    const statusText = capitalizeFirst(order.status);
    const formattedDate = formatDate(order.orderDate);
    const productSummary = order.products.length > 1 
        ? `${order.products[0].name} +${order.products.length - 1} more`
        : order.products[0].name;
    
    row.innerHTML = `
        <td>
            <input type="checkbox" class="row-checkbox" data-order-id="${order.id}">
        </td>
        <td>
            <div class="order-id">
                <strong>${order.id}</strong>
            </div>
        </td>
        <td>
            <div class="customer-info">
                <div class="customer-name">${order.customerName}</div>
                <div class="customer-email">${order.customerEmail}</div>
            </div>
        </td>
        <td>
            <div class="product-summary">
                <span class="product-name">${productSummary}</span>
                <span class="product-count">${order.products.length} item(s)</span>
            </div>
        </td>
        <td>
            <span class="amount">₹${order.totalAmount.toLocaleString()}</span>
        </td>
        <td>
            <span class="status-badge status-${statusClass}">${statusText}</span>
        </td>
        <td>
            <span class="order-date">${formattedDate}</span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon btn-view" onclick="viewOrder('${order.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon btn-edit" onclick="editOrder('${order.id}')" title="Edit Order">
                    <i class="fas fa-edit"></i>
                </button>
                <div class="dropdown">
                    <button class="btn-icon btn-more" onclick="toggleOrderActions('${order.id}')" title="More Actions">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu" id="actions-${order.id}">
                        <button onclick="updateOrderStatus('${order.id}', 'processing')">Mark as Processing</button>
                        <button onclick="updateOrderStatus('${order.id}', 'shipped')">Mark as Shipped</button>
                        <button onclick="updateOrderStatus('${order.id}', 'delivered')">Mark as Delivered</button>
                        <button onclick="generateInvoice('${order.id}')">Generate Invoice</button>
                        <button onclick="printShippingLabel('${order.id}')">Print Label</button>
                        <hr>
                        <button onclick="cancelOrder('${order.id}')" class="danger">Cancel Order</button>
                    </div>
                </div>
            </div>
        </td>
    `;
    
    return row;
}

function updateOrderStatistics() {
    const pending = ordersData.filter(o => o.status === 'pending').length;
    const processing = ordersData.filter(o => o.status === 'processing').length;
    const shipped = ordersData.filter(o => o.status === 'shipped').length;
    const completed = ordersData.filter(o => o.status === 'delivered').length;
    
    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('processingOrders').textContent = processing;
    document.getElementById('shippedOrders').textContent = shipped;
    document.getElementById('completedOrders').textContent = completed;
}

function setupOrdersPagination() {
    updateOrdersPaginationControls();
    
    document.getElementById('prevPageOrders').addEventListener('click', () => {
        if (currentOrderPage > 1) {
            currentOrderPage--;
            loadOrdersTable();
            updateOrdersPaginationControls();
        }
    });
    
    document.getElementById('nextPageOrders').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
        if (currentOrderPage < totalPages) {
            currentOrderPage++;
            loadOrdersTable();
            updateOrdersPaginationControls();
        }
    });
}

function updateOrdersPaginationControls() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const startIndex = (currentOrderPage - 1) * ordersPerPage;
    const endIndex = Math.min(startIndex + ordersPerPage, filteredOrders.length);
    
    document.getElementById('showingStartOrders').textContent = startIndex + 1;
    document.getElementById('showingEndOrders').textContent = endIndex;
    document.getElementById('totalOrderRows').textContent = filteredOrders.length;
    
    document.getElementById('prevPageOrders').disabled = currentOrderPage === 1;
    document.getElementById('nextPageOrders').disabled = currentOrderPage === totalPages;
    
    // Generate page numbers
    const paginationNumbers = document.getElementById('paginationNumbersOrders');
    paginationNumbers.innerHTML = '';
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentOrderPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentOrderPage = i;
            loadOrdersTable();
            updateOrdersPaginationControls();
        });
        paginationNumbers.appendChild(pageBtn);
    }
}

function updateOrdersPaginationInfo() {
    const startIndex = (currentOrderPage - 1) * ordersPerPage;
    const endIndex = Math.min(startIndex + ordersPerPage, filteredOrders.length);
    
    document.getElementById('showingStartOrders').textContent = filteredOrders.length > 0 ? startIndex + 1 : 0;
    document.getElementById('showingEndOrders').textContent = endIndex;
    document.getElementById('totalOrderRows').textContent = filteredOrders.length;
}

function handleOrderSearch() {
    applyOrderFilters();
}

function handleOrderFilter() {
    applyOrderFilters();
}

function applyOrderFilters() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    filteredOrders = ordersData.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm) ||
                            order.customerName.toLowerCase().includes(searchTerm) ||
                            order.products.some(p => p.name.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || order.status === statusFilter;
        
        let matchesDate = true;
        if (dateFilter) {
            const today = new Date();
            const orderDate = order.orderDate;
            
            switch (dateFilter) {
                case 'today':
                    matchesDate = isSameDay(orderDate, today);
                    break;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    matchesDate = orderDate >= weekAgo;
                    break;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    matchesDate = orderDate >= monthAgo;
                    break;
            }
        }
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    currentOrderPage = 1;
    loadOrdersTable();
    updateOrdersPaginationControls();
}

function handleSelectAllOrders() {
    const selectAll = document.getElementById('selectAllOrders');
    const checkboxes = document.querySelectorAll('#ordersTableBody .row-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function viewOrder(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;
    
    // Create and show order details modal
    showOrderDetailsModal(order);
}

function editOrder(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;
    
    showNotification(`Edit functionality for order ${orderId} would be implemented here`, 'info');
}

function updateOrderStatus(orderId, newStatus) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;
    
    order.status = newStatus;
    filteredOrders = [...ordersData];
    
    loadOrdersTable();
    updateOrderStatistics();
    hideOrderActions(orderId);
    
    showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
}

function toggleOrderActions(orderId) {
    // Hide all other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.id !== `actions-${orderId}`) {
            menu.classList.remove('show');
        }
    });
    
    // Toggle current dropdown
    const menu = document.getElementById(`actions-${orderId}`);
    menu.classList.toggle('show');
}

function hideOrderActions(orderId) {
    const menu = document.getElementById(`actions-${orderId}`);
    if (menu) {
        menu.classList.remove('show');
    }
}

function cancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        updateOrderStatus(orderId, 'cancelled');
    }
}

function generateInvoice(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;
    
    showNotification(`Generating invoice for order ${orderId}...`, 'info');
    
    // Simulate invoice generation
    setTimeout(() => {
        showNotification(`Invoice generated successfully for order ${orderId}`, 'success');
    }, 2000);
}

function printShippingLabel(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;
    
    showNotification(`Printing shipping label for order ${orderId}...`, 'info');
}

function bulkUpdateStatus(status) {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        showNotification('Please select orders to update', 'warning');
        return;
    }
    
    selectedOrders.forEach(orderId => {
        const order = ordersData.find(o => o.id === orderId);
        if (order) {
            order.status = status;
        }
    });
    
    filteredOrders = [...ordersData];
    loadOrdersTable();
    updateOrderStatistics();
    
    showNotification(`${selectedOrders.length} orders updated to ${status}`, 'success');
}

function generateInvoices() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        showNotification('Please select orders to generate invoices', 'warning');
        return;
    }
    
    showNotification(`Generating ${selectedOrders.length} invoices...`, 'info');
}

function printShippingLabels() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        showNotification('Please select orders to print labels', 'warning');
        return;
    }
    
    showNotification(`Printing ${selectedOrders.length} shipping labels...`, 'info');
}

function getSelectedOrders() {
    const checkboxes = document.querySelectorAll('#ordersTableBody .row-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.orderId);
}

function exportOrders() {
    const headers = ['Order ID', 'Customer', 'Total Amount', 'Status', 'Order Date'];
    const csvContent = [
        headers.join(','),
        ...filteredOrders.map(order => [
            order.id,
            order.customerName,
            order.totalAmount,
            order.status,
            formatDate(order.orderDate)
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Orders exported successfully!', 'success');
}

function createNewOrder() {
    showNotification('New order creation form would be implemented here', 'info');
}

function showBulkActions() {
    const selectedOrders = getSelectedOrders();
    if (selectedOrders.length === 0) {
        showNotification('Please select orders for bulk actions', 'warning');
        return;
    }
    
    showNotification(`${selectedOrders.length} orders selected. Use quick actions below.`, 'info');
}

function showOrderDetailsModal(order) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay active" id="orderDetailsModal">
            <div class="modal-container large">
                <div class="modal-header">
                    <h3>Order Details - ${order.id}</h3>
                    <button class="modal-close" onclick="closeOrderDetailsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="order-details-grid">
                        <div class="order-info-section">
                            <h4>Order Information</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Order ID</label>
                                    <span>${order.id}</span>
                                </div>
                                <div class="info-item">
                                    <label>Status</label>
                                    <span class="status-badge status-${getStatusClass(order.status)}">${capitalizeFirst(order.status)}</span>
                                </div>
                                <div class="info-item">
                                    <label>Order Date</label>
                                    <span>${formatDate(order.orderDate)}</span>
                                </div>
                                <div class="info-item">
                                    <label>Total Amount</label>
                                    <span class="amount">₹${order.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div class="customer-info-section">
                            <h4>Customer Information</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Name</label>
                                    <span>${order.customerName}</span>
                                </div>
                                <div class="info-item">
                                    <label>Email</label>
                                    <span>${order.customerEmail}</span>
                                </div>
                                <div class="info-item">
                                    <label>Payment Method</label>
                                    <span>${order.paymentMethod}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="shipping-section">
                        <h4>Shipping Address</h4>
                        <p>${order.shippingAddress}</p>
                    </div>
                    <div class="products-section">
                        <h4>Products</h4>
                        <div class="products-list">
                            ${order.products.map(product => `
                                <div class="product-item">
                                    <span class="product-name">${product.name}</span>
                                    <span class="product-quantity">Qty: ${product.quantity}</span>
                                    <span class="product-price">₹${product.price.toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ${order.notes ? `
                        <div class="notes-section">
                            <h4>Notes</h4>
                            <p>${order.notes}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeOrderDetailsModal()">Close</button>
                    <button class="btn-primary" onclick="editOrder('${order.id}')">Edit Order</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

function closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Utility functions
function getStatusClass(status) {
    const statusClasses = {
        'pending': 'warning',
        'processing': 'info',
        'shipped': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
    };
    return statusClasses[status] || 'secondary';
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});
