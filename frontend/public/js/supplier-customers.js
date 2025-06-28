// Customer Management JavaScript for Smart POS Supplier Dashboard

class CustomerManager {
    constructor() {
        this.customers = [
            {
                id: 1,
                name: 'Maya Tamang',
                email: 'maya.tamang@email.com',
                phone: '+977-984-1234567',
                address: 'Boudha Stupa Area, Kathmandu, Nepal',
                totalOrders: 45,
                totalSpent: 128507.50,
                lastOrder: '2024-01-15',
                status: 'active',
                joinDate: '2023-03-15',
                notes: 'VIP customer, prefers premium products'
            },
            {
                id: 2,
                name: 'Suresh Rai',
                email: 'suresh.rai@email.com',
                phone: '+977-985-2345678',
                address: 'Patan Durbar Square, Lalitpur, Nepal',
                totalOrders: 32,
                totalSpent: 89805.00,
                lastOrder: '2024-01-12',
                status: 'active',
                joinDate: '2023-05-20',
                notes: 'Regular customer, bulk buyer'
            },
            {
                id: 3,
                name: 'Binita Shrestha',
                email: 'binita.shrestha@email.com',
                phone: '+977-986-3456789',
                address: 'Newroad Commercial Area, Kathmandu, Nepal',
                totalOrders: 18,
                totalSpent: 62500.00,
                lastOrder: '2024-01-08',
                status: 'active',
                joinDate: '2023-08-10',
                notes: 'Interested in seasonal products'
            },
            {
                id: 4,
                name: 'Anita Gurung',
                email: 'anita.gurung@email.com',
                phone: '+977-987-4567890',
                address: 'Lakeside Road, Pokhara, Nepal',
                totalOrders: 8,
                totalSpent: 34025.00,
                lastOrder: '2023-12-20',
                status: 'inactive',
                joinDate: '2023-09-05',
                notes: 'Occasional buyer, price sensitive'
            },
            {
                id: 5,
                name: 'Dipak Thapa',
                email: 'robert.brown@email.com',
                phone: '+1 234-567-8905',
                address: '654 Maple Ave, City, State',
                totalOrders: 62,
                totalSpent: 4120.80,
                lastOrder: '2024-01-14',
                status: 'active',
                joinDate: '2023-01-08',
                notes: 'Long-term customer, high value'
            },
            {
                id: 6,
                name: 'Emily Taylor',
                email: 'emily.taylor@email.com',
                phone: '+1 234-567-8906',
                address: '987 Cedar St, City, State',
                totalOrders: 25,
                totalSpent: 1560.40,
                lastOrder: '2024-01-10',
                status: 'active',
                joinDate: '2023-06-12',
                notes: 'Prefers organic products'
            }
        ];

        this.filteredCustomers = [...this.customers];
        this.currentPage = 1;
        this.customersPerPage = 10;
        this.selectedCustomers = new Set();

        this.init();
    }

    init() {
        this.renderCustomerStats();
        this.renderCustomers();
        this.setupEventListeners();
        this.updateCustomerCharts();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('customerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCustomers(e.target.value);
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterByStatus(e.target.dataset.status);
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('sortCustomers');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortCustomers(e.target.value);
            });
        }

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Window click to close modals
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });

        // Add customer button
        const addCustomerBtn = document.getElementById('addCustomerBtn');
        if (addCustomerBtn) {
            addCustomerBtn.addEventListener('click', () => {
                this.openAddCustomerModal();
            });
        }

        // Bulk actions
        const bulkActionSelect = document.getElementById('bulkActions');
        if (bulkActionSelect) {
            bulkActionSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.handleBulkAction(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportCustomers');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportCustomers();
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCustomers');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }
    }

    renderCustomerStats() {
        const totalCustomers = this.customers.length;
        const activeCustomers = this.customers.filter(c => c.status === 'active').length;
        const newCustomers = this.customers.filter(c => {
            const joinDate = new Date(c.joinDate);
            const thisMonth = new Date();
            thisMonth.setMonth(thisMonth.getMonth());
            return joinDate >= thisMonth;
        }).length;

        const totalRevenue = this.customers.reduce((sum, c) => sum + c.totalSpent, 0);

        // Update stats
        document.getElementById('totalCustomers').textContent = totalCustomers;
        document.getElementById('activeCustomers').textContent = activeCustomers;
        document.getElementById('newCustomers').textContent = newCustomers;
        document.getElementById('totalRevenue').textContent = `$${totalRevenue.toLocaleString()}`;
    }

    renderCustomers() {
        const tableBody = document.getElementById('customersTableBody');
        if (!tableBody) return;

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.customersPerPage;
        const endIndex = startIndex + this.customersPerPage;
        const paginatedCustomers = this.filteredCustomers.slice(startIndex, endIndex);

        tableBody.innerHTML = '';

        paginatedCustomers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="customer-checkbox" data-id="${customer.id}" 
                           ${this.selectedCustomers.has(customer.id) ? 'checked' : ''}>
                </td>
                <td>
                    <div class="customer-info">
                        <div class="customer-avatar">
                            ${customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="customer-name">${customer.name}</div>
                            <div class="customer-email">${customer.email}</div>
                        </div>
                    </div>
                </td>
                <td>${customer.phone}</td>
                <td>${customer.totalOrders}</td>
                <td>$${customer.totalSpent.toLocaleString()}</td>
                <td>${this.formatDate(customer.lastOrder)}</td>
                <td>
                    <span class="status-badge ${customer.status}">
                        ${customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="customerManager.viewCustomer(${customer.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="customerManager.editCustomer(${customer.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon danger" onclick="customerManager.deleteCustomer(${customer.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners for checkboxes
        document.querySelectorAll('.customer-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const customerId = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedCustomers.add(customerId);
                } else {
                    this.selectedCustomers.delete(customerId);
                }
                this.updateBulkActionButton();
            });
        });

        this.renderPagination();
        this.updateBulkActionButton();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredCustomers.length / this.customersPerPage);
        const paginationContainer = document.getElementById('customersPagination');
        
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="customerManager.changePage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="customerManager.changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="customerManager.changePage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredCustomers.length / this.customersPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderCustomers();
        }
    }

    filterCustomers(searchTerm) {
        this.filteredCustomers = this.customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm)
        );
        this.currentPage = 1;
        this.renderCustomers();
    }

    filterByStatus(status) {
        if (status === 'all') {
            this.filteredCustomers = [...this.customers];
        } else {
            this.filteredCustomers = this.customers.filter(customer => customer.status === status);
        }
        this.currentPage = 1;
        this.renderCustomers();
    }

    sortCustomers(sortBy) {
        this.filteredCustomers.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'orders':
                    return b.totalOrders - a.totalOrders;
                case 'spent':
                    return b.totalSpent - a.totalSpent;
                case 'recent':
                    return new Date(b.lastOrder) - new Date(a.lastOrder);
                default:
                    return 0;
            }
        });
        this.renderCustomers();
    }

    viewCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        // Populate customer details modal
        document.getElementById('detailCustomerName').textContent = customer.name;
        document.getElementById('detailCustomerEmail').textContent = customer.email;
        document.getElementById('detailCustomerPhone').textContent = customer.phone;
        document.getElementById('detailCustomerAddress').textContent = customer.address;
        document.getElementById('detailCustomerOrders').textContent = customer.totalOrders;
        document.getElementById('detailCustomerSpent').textContent = `$${customer.totalSpent.toLocaleString()}`;
        document.getElementById('detailCustomerJoined').textContent = this.formatDate(customer.joinDate);
        document.getElementById('detailCustomerLast').textContent = this.formatDate(customer.lastOrder);
        document.getElementById('detailCustomerStatus').textContent = customer.status;
        document.getElementById('detailCustomerNotes').textContent = customer.notes || 'No notes available';

        // Show modal
        document.getElementById('customerDetailsModal').style.display = 'flex';
    }

    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        // Populate edit form
        document.getElementById('editCustomerId').value = customer.id;
        document.getElementById('editCustomerName').value = customer.name;
        document.getElementById('editCustomerEmail').value = customer.email;
        document.getElementById('editCustomerPhone').value = customer.phone;
        document.getElementById('editCustomerAddress').value = customer.address;
        document.getElementById('editCustomerStatus').value = customer.status;
        document.getElementById('editCustomerNotes').value = customer.notes;

        // Show modal
        document.getElementById('editCustomerModal').style.display = 'flex';
    }

    openAddCustomerModal() {
        // Clear form
        document.getElementById('addCustomerForm').reset();
        document.getElementById('addCustomerModal').style.display = 'flex';
    }

    deleteCustomer(customerId) {
        if (confirm('Are you sure you want to delete this customer?')) {
            this.customers = this.customers.filter(c => c.id !== customerId);
            this.filteredCustomers = this.filteredCustomers.filter(c => c.id !== customerId);
            this.selectedCustomers.delete(customerId);
            this.renderCustomers();
            this.renderCustomerStats();
            this.showNotification('Customer deleted successfully', 'success');
        }
    }

    toggleSelectAll(selectAll) {
        const checkboxes = document.querySelectorAll('.customer-checkbox');
        this.selectedCustomers.clear();
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
            if (selectAll) {
                this.selectedCustomers.add(parseInt(checkbox.dataset.id));
            }
        });
        
        this.updateBulkActionButton();
    }

    updateBulkActionButton() {
        const bulkActionContainer = document.querySelector('.bulk-actions');
        const selectedCount = this.selectedCustomers.size;
        
        if (selectedCount > 0) {
            bulkActionContainer.style.display = 'flex';
            document.getElementById('selectedCount').textContent = selectedCount;
        } else {
            bulkActionContainer.style.display = 'none';
        }
    }

    handleBulkAction(action) {
        if (this.selectedCustomers.size === 0) {
            this.showNotification('No customers selected', 'warning');
            return;
        }

        switch (action) {
            case 'activate':
                this.bulkUpdateStatus('active');
                break;
            case 'deactivate':
                this.bulkUpdateStatus('inactive');
                break;
            case 'delete':
                this.bulkDeleteCustomers();
                break;
            case 'export':
                this.exportSelectedCustomers();
                break;
        }
    }

    bulkUpdateStatus(status) {
        if (confirm(`Are you sure you want to ${status === 'active' ? 'activate' : 'deactivate'} ${this.selectedCustomers.size} customers?`)) {
            this.customers.forEach(customer => {
                if (this.selectedCustomers.has(customer.id)) {
                    customer.status = status;
                }
            });
            
            this.selectedCustomers.clear();
            this.renderCustomers();
            this.renderCustomerStats();
            this.showNotification(`Customers ${status === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
        }
    }

    bulkDeleteCustomers() {
        if (confirm(`Are you sure you want to delete ${this.selectedCustomers.size} customers?`)) {
            this.customers = this.customers.filter(customer => !this.selectedCustomers.has(customer.id));
            this.filteredCustomers = this.filteredCustomers.filter(customer => !this.selectedCustomers.has(customer.id));
            this.selectedCustomers.clear();
            
            this.renderCustomers();
            this.renderCustomerStats();
            this.showNotification('Customers deleted successfully', 'success');
        }
    }

    exportCustomers() {
        const csvContent = this.generateCSV(this.filteredCustomers);
        this.downloadCSV(csvContent, 'customers_export.csv');
        this.showNotification('Customers exported successfully', 'success');
    }

    exportSelectedCustomers() {
        const selectedCustomers = this.customers.filter(customer => this.selectedCustomers.has(customer.id));
        const csvContent = this.generateCSV(selectedCustomers);
        this.downloadCSV(csvContent, 'selected_customers_export.csv');
        this.showNotification('Selected customers exported successfully', 'success');
    }

    generateCSV(customers) {
        const headers = ['Name', 'Email', 'Phone', 'Address', 'Total Orders', 'Total Spent', 'Status', 'Join Date', 'Last Order'];
        const csvRows = [headers.join(',')];

        customers.forEach(customer => {
            const row = [
                customer.name,
                customer.email,
                customer.phone,
                customer.address,
                customer.totalOrders,
                customer.totalSpent,
                customer.status,
                customer.joinDate,
                customer.lastOrder
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    updateCustomerCharts() {
        // Customer Status Distribution Chart
        const activeCount = this.customers.filter(c => c.status === 'active').length;
        const inactiveCount = this.customers.filter(c => c.status === 'inactive').length;

        // Update the chart percentages
        const activePercentage = (activeCount / this.customers.length * 100).toFixed(1);
        const inactivePercentage = (inactiveCount / this.customers.length * 100).toFixed(1);

        // Update chart display
        const activeElement = document.querySelector('.distribution-item.active .percentage');
        const inactiveElement = document.querySelector('.distribution-item.inactive .percentage');
        
        if (activeElement) activeElement.textContent = `${activePercentage}%`;
        if (inactiveElement) inactiveElement.textContent = `${inactivePercentage}%`;
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize customer manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.customerManager = new CustomerManager();
});
