/**
 * Customer Management JavaScript for Smart POS Supplier Dashboard
 * Production-ready version that loads data from database
 */

class CustomerManager {
    constructor() {
        // Customer data
        this.customers = [];
        this.selectedCustomers = new Set();
        
        // Pagination
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        
        // UI state
        this.searchDebounceTimer = null;
        this.loadingState = false;
        
        // Bind methods
        this.handleSearch = this.handleSearch.bind(this);
        this.handleCustomerAction = this.handleCustomerAction.bind(this);
        this.handleCustomerSelection = this.handleCustomerSelection.bind(this);
        this.changePage = this.changePage.bind(this);
        
        // Initialize the manager
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadCustomerStats();
        await this.loadCustomers();
    }

    setupEventListeners() {
        // Search input handling
        const searchInput = document.getElementById('customerSearch');
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 500);
        });

        // Filter handling
        document.getElementById('statusFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('typeFilter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('regionFilter')?.addEventListener('change', () => this.applyFilters());

        // Pagination handling
        document.getElementById('prevPageCustomers')?.addEventListener('click', () => this.changePage(this.currentPage - 1));
        document.getElementById('nextPageCustomers')?.addEventListener('click', () => this.changePage(this.currentPage + 1));
        document.getElementById('pageSizeCustomers')?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value, 10);
            this.loadCustomers();
        });

        // Bulk selection handling
        document.getElementById('selectAllCustomers')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('table input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (checkbox !== e.target) {
                    checkbox.checked = e.target.checked;
                    this.handleCustomerSelection(checkbox);
                }
            });
        });

        // Filter and clear buttons
        document.getElementById('filterBtn')?.addEventListener('click', () => this.applyFilters());
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => this.clearFilters());

        // Export customers
        document.getElementById('exportCustomersBtn')?.addEventListener('click', () => this.exportCustomers());

        // Add customer modal
        document.getElementById('addCustomerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        // Edit customer modal
        document.getElementById('editCustomerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateCustomer();
        });
    }

    async loadCustomerStats() {
        try {
            const response = await fetch('/api/supplier/customers/stats', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to load customer stats');

            const stats = await response.json();
            
            // Update stats in the UI
            document.getElementById('totalCustomers').textContent = stats.total || '0';
            document.getElementById('activeCustomers').textContent = stats.active || '0';
            document.getElementById('newCustomers').textContent = stats.newThisMonth || '0';
            document.getElementById('avgOrderValue').textContent = `₹${this.formatAmount(stats.avgOrderValue || 0)}`;
            
            // Update change indicators
            document.getElementById('totalCustomersChange').textContent = stats.totalChange || 'No change';
            document.getElementById('activeCustomersChange').textContent = stats.activeRate || '0% active rate';
            document.getElementById('newCustomersChange').textContent = stats.newChange || 'No new customers';
            document.getElementById('avgOrderValueChange').textContent = stats.avgChange || 'No change';
        } catch (error) {
            console.error('Error loading customer stats:', error);
            this.showNotification('Failed to load customer statistics', 'error');
        }
    }

    async loadCustomers() {
        try {
            this.showLoadingState(true);
            
            // Build query parameters
            const params = new URLSearchParams({
                page: this.currentPage.toString(),
                limit: this.pageSize.toString(),
                status: document.getElementById('statusFilter')?.value || '',
                type: document.getElementById('typeFilter')?.value || '',
                region: document.getElementById('regionFilter')?.value || '',
                search: document.getElementById('customerSearch')?.value || ''
            });

            const response = await fetch(`/api/supplier/customers?${params}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to load customers');

            const data = await response.json();
            this.customers = data.customers || [];
            this.totalPages = Math.ceil((data.total || 0) / this.pageSize);
            
            this.renderCustomers();
            this.updatePagination();
        } catch (error) {
            console.error('Error loading customers:', error);
            this.showNotification('Failed to load customers', 'error');
            this.showEmptyState('Failed to load customers. Please try again.');
        } finally {
            this.showLoadingState(false);
        }
    }

    renderCustomers() {
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) return;

        if (this.customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center">No customers found</td></tr>';
            return;
        }

        tbody.innerHTML = this.customers.map(customer => this.createCustomerRow(customer)).join('');
    }

    createCustomerRow(customer) {
        return `
            <tr data-customer-id="${customer._id}">
                <td>
                    <input type="checkbox" class="customer-select" value="${customer._id}" onchange="customerManager.handleCustomerSelection(this)">
                </td>
                <td>
                    <div class="customer-name">
                        <strong>${customer.storeName || 'N/A'}</strong>
                    </div>
                </td>
                <td>
                    <div class="contact-person">
                        ${customer.contactName || customer.name || 'N/A'}
                    </div>
                </td>
                <td>
                    <div class="customer-email">
                        ${customer.email || 'N/A'}
                    </div>
                </td>
                <td>
                    <div class="customer-phone">
                        ${customer.phone || 'N/A'}
                    </div>
                </td>
                <td>
                    <span class="type-badge ${(customer.type || 'retail').toLowerCase()}">
                        ${this.formatCustomerType(customer.type)}
                    </span>
                </td>
                <td class="text-center">${customer.totalOrders || 0}</td>
                <td class="text-right">₹${this.formatAmount(customer.totalSpent || 0)}</td>
                <td>${this.formatDate(customer.lastOrder)}</td>
                <td>
                    <span class="status-badge ${(customer.status || 'active').toLowerCase()}">
                        ${this.capitalizeFirst(customer.status || 'active')}
                    </span>
                </td>
                <td class="actions-cell">
                    ${this.getActionButtons(customer)}
                </td>
            </tr>
        `;
    }

    getActionButtons(customer) {
        return `
            <div class="action-buttons">
                <button onclick="customerManager.viewCustomer('${customer._id}')" title="View Details" class="btn-icon">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="customerManager.editCustomer('${customer._id}')" title="Edit Customer" class="btn-icon">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="customerManager.toggleCustomerStatus('${customer._id}')" title="Toggle Status" class="btn-icon">
                    <i class="fas fa-toggle-${(customer.status || 'active') === 'active' ? 'on' : 'off'}"></i>
                </button>
            </div>
        `;
    }

    async viewCustomer(customerId) {
        try {
            const response = await fetch(`/api/supplier/customers/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to load customer details');

            const customer = await response.json();
            this.showCustomerDetailsModal(customer);
        } catch (error) {
            console.error('Error loading customer details:', error);
            this.showNotification('Failed to load customer details', 'error');
        }
    }

    showCustomerDetailsModal(customer) {
        const content = `
            <div class="customer-details-view">
                <div class="detail-header">
                    <div class="customer-avatar-large">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="customer-title">
                        <h2>${customer.storeName || customer.name}</h2>
                        <p>${customer.contactName || 'N/A'}</p>
                        <span class="status-badge ${(customer.status || 'active').toLowerCase()}">
                            ${this.capitalizeFirst(customer.status || 'active')}
                        </span>
                    </div>
                </div>
                
                <div class="detail-sections">
                    <div class="detail-section">
                        <h3>Contact Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Email:</label>
                                <span>${customer.email || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Phone:</label>
                                <span>${customer.phone || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Type:</label>
                                <span>${this.formatCustomerType(customer.type)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Address:</label>
                                <span>${customer.address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Business Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Credit Limit:</label>
                                <span>₹${this.formatAmount(customer.creditLimit || 0)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Payment Terms:</label>
                                <span>${customer.paymentTerms || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Total Orders:</label>
                                <span>${customer.totalOrders || 0}</span>
                            </div>
                            <div class="detail-item">
                                <label>Total Spent:</label>
                                <span>₹${this.formatAmount(customer.totalSpent || 0)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Recent Activity</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Last Order:</label>
                                <span>${this.formatDate(customer.lastOrder)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Join Date:</label>
                                <span>${this.formatDate(customer.createdAt)}</span>
                            </div>
                            <div class="detail-item">
                                <label>Average Order Value:</label>
                                <span>₹${this.formatAmount(customer.totalOrders ? (customer.totalSpent / customer.totalOrders) : 0)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${customer.notes ? `
                        <div class="detail-section">
                            <h3>Notes</h3>
                            <p>${customer.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.getElementById('customerDetailsContent').innerHTML = content;
        this.openModal('customerDetailsModal');
    }

    async editCustomer(customerId) {
        try {
            const response = await fetch(`/api/supplier/customers/${customerId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to load customer details');

            const customer = await response.json();
            this.showEditCustomerModal(customer);
        } catch (error) {
            console.error('Error loading customer for edit:', error);
            this.showNotification('Failed to load customer details', 'error');
        }
    }

    showEditCustomerModal(customer) {
        // Populate edit form
        const form = document.getElementById('editCustomerForm');
        if (form) {
            form.querySelector('[name="customerId"]').value = customer._id;
            form.querySelector('[name="storeName"]').value = customer.storeName || '';
            form.querySelector('[name="contactName"]').value = customer.contactName || customer.name || '';
            form.querySelector('[name="email"]').value = customer.email || '';
            form.querySelector('[name="phone"]').value = customer.phone || '';
            form.querySelector('[name="customerType"]').value = customer.type || 'retail';
            form.querySelector('[name="region"]').value = customer.region || '';
            form.querySelector('[name="address"]').value = customer.address || '';
            form.querySelector('[name="creditLimit"]').value = customer.creditLimit || 0;
            form.querySelector('[name="paymentTerms"]').value = customer.paymentTerms || '';
            form.querySelector('[name="notes"]').value = customer.notes || '';
        }

        this.openModal('editCustomerModal');
    }

    async saveCustomer() {
        try {
            const form = document.getElementById('addCustomerForm');
            const formData = new FormData(form);
            
            // Basic validation
            const required = ['storeName', 'customerType', 'contactName', 'email', 'phone'];
            for (let field of required) {
                if (!formData.get(field)) {
                    this.showNotification(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                    return;
                }
            }

            const customerData = {
                storeName: formData.get('storeName'),
                contactName: formData.get('contactName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                type: formData.get('customerType'),
                region: formData.get('region'),
                address: formData.get('address'),
                creditLimit: parseFloat(formData.get('creditLimit')) || 0,
                paymentTerms: formData.get('paymentTerms'),
                notes: formData.get('notes')
            };

            const response = await fetch('/api/supplier/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(customerData)
            });

            if (!response.ok) throw new Error('Failed to save customer');

            await this.loadCustomers();
            await this.loadCustomerStats();
            
            this.showNotification('Customer added successfully', 'success');
            this.closeModal('addCustomerModal');
            form.reset();
        } catch (error) {
            console.error('Error saving customer:', error);
            this.showNotification('Failed to save customer', 'error');
        }
    }

    async updateCustomer() {
        try {
            const form = document.getElementById('editCustomerForm');
            const formData = new FormData(form);
            const customerId = formData.get('customerId');
            
            if (!customerId) {
                this.showNotification('Customer ID is missing', 'error');
                return;
            }

            // Basic validation
            const required = ['storeName', 'customerType', 'contactName', 'email', 'phone'];
            for (let field of required) {
                if (!formData.get(field)) {
                    this.showNotification(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                    return;
                }
            }

            const customerData = {
                storeName: formData.get('storeName'),
                contactName: formData.get('contactName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                type: formData.get('customerType'),
                region: formData.get('region'),
                address: formData.get('address'),
                creditLimit: parseFloat(formData.get('creditLimit')) || 0,
                paymentTerms: formData.get('paymentTerms'),
                notes: formData.get('notes')
            };

            const response = await fetch(`/api/supplier/customers/${customerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(customerData)
            });

            if (!response.ok) throw new Error('Failed to update customer');

            await this.loadCustomers();
            await this.loadCustomerStats();
            
            this.showNotification('Customer updated successfully', 'success');
            this.closeModal('editCustomerModal');
        } catch (error) {
            console.error('Error updating customer:', error);
            this.showNotification('Failed to update customer', 'error');
        }
    }

    async toggleCustomerStatus(customerId) {
        try {
            const response = await fetch(`/api/supplier/customers/${customerId}/toggle-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to update customer status');

            await this.loadCustomers();
            await this.loadCustomerStats();
            this.showNotification('Customer status updated successfully', 'success');
        } catch (error) {
            console.error('Error updating customer status:', error);
            this.showNotification('Failed to update customer status', 'error');
        }
    }

    handleCustomerSelection(checkbox) {
        const customerId = checkbox.value;
        if (checkbox.checked) {
            this.selectedCustomers.add(customerId);
        } else {
            this.selectedCustomers.delete(customerId);
        }
        
        // Enable/disable bulk actions button if it exists
        const bulkActionsBtn = document.getElementById('bulkActionsBtn');
        if (bulkActionsBtn) {
            bulkActionsBtn.disabled = this.selectedCustomers.size === 0;
        }
    }

    async handleSearch(query) {
        this.currentPage = 1;
        await this.loadCustomers();
    }

    async applyFilters() {
        this.currentPage = 1;
        await this.loadCustomers();
    }

    clearFilters() {
        document.getElementById('customerSearch').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('regionFilter').value = '';
        this.applyFilters();
    }

    async exportCustomers() {
        try {
            const response = await fetch('/api/supplier/customers/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    status: document.getElementById('statusFilter')?.value,
                    type: document.getElementById('typeFilter')?.value,
                    region: document.getElementById('regionFilter')?.value,
                    search: document.getElementById('customerSearch')?.value
                })
            });

            if (!response.ok) throw new Error('Failed to export customers');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Customers exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting customers:', error);
            this.showNotification('Failed to export customers', 'error');
        }
    }

    showLoadingState(loading) {
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) return;

        if (loading) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center">
                        <div class="loading-spinner"></div>
                        <p>Loading customers...</p>
                    </td>
                </tr>
            `;
        }
    }

    showEmptyState(message) {
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-users" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                        <p>${message}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    updatePagination() {
        document.getElementById('currentPageCustomers').textContent = this.currentPage;
        document.getElementById('totalPagesCustomers').textContent = this.totalPages;
        document.getElementById('prevPageCustomers').disabled = this.currentPage === 1;
        document.getElementById('nextPageCustomers').disabled = this.currentPage === this.totalPages;
    }

    async changePage(newPage) {
        if (newPage < 1 || newPage > this.totalPages) return;
        this.currentPage = newPage;
        await this.loadCustomers();
    }

    // Utility methods
    formatAmount(amount) {
        return new Intl.NumberFormat('en-IN').format(amount || 0);
    }

    formatDate(date) {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatCustomerType(type) {
        const types = {
            'retail': 'Retail Store',
            'wholesale': 'Wholesale',
            'online': 'Online Store'
        };
        return types[type] || this.capitalizeFirst(type || 'retail');
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                type === 'error' ? 'exclamation-circle' : 
                                type === 'warning' ? 'exclamation-triangle' : 
                                'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global functions for modal handling (called from HTML)
function openModal(modalId) {
    window.customerManager?.openModal(modalId);
}

function closeModal(modalId) {
    window.customerManager?.closeModal(modalId);
}

function saveCustomer() {
    window.customerManager?.saveCustomer();
}

function updateCustomer() {
    window.customerManager?.updateCustomer();
}

function exportCustomers() {
    window.customerManager?.exportCustomers();
}

// Initialize the customer manager
document.addEventListener('DOMContentLoaded', () => {
    window.customerManager = new CustomerManager();
});
