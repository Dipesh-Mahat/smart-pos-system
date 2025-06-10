// Inventory Management JavaScript for Smart POS Supplier Dashboard

class InventoryManager {
    constructor() {
        this.inventory = [
            {
                id: 1,
                name: 'Wireless Bluetooth Headphones',
                sku: 'WBH-001',
                category: 'electronics',
                currentStock: 45,
                minStock: 10,
                maxStock: 100,
                costPrice: 25.00,
                sellingPrice: 49.99,
                supplier: 'TechCorp Ltd',
                location: 'A1-B2',
                lastUpdated: '2024-01-15',
                status: 'in-stock'
            },
            {
                id: 2,
                name: 'USB-C Charging Cable',
                sku: 'UCC-002',
                category: 'accessories',
                currentStock: 8,
                minStock: 15,
                maxStock: 200,
                costPrice: 3.50,
                sellingPrice: 9.99,
                supplier: 'Cable Solutions',
                location: 'B2-C1',
                lastUpdated: '2024-01-14',
                status: 'low-stock'
            },
            {
                id: 3,
                name: 'Smartphone Screen Protector',
                sku: 'SSP-003',
                category: 'accessories',
                currentStock: 120,
                minStock: 20,
                maxStock: 300,
                costPrice: 1.25,
                sellingPrice: 4.99,
                supplier: 'ProTech Accessories',
                location: 'C1-D3',
                lastUpdated: '2024-01-13',
                status: 'in-stock'
            },
            {
                id: 4,
                name: 'Laptop Cooling Pad',
                sku: 'LCP-004',
                category: 'accessories',
                currentStock: 0,
                minStock: 5,
                maxStock: 50,
                costPrice: 15.00,
                sellingPrice: 29.99,
                supplier: 'CoolTech Solutions',
                location: 'D3-E1',
                lastUpdated: '2024-01-12',
                status: 'out-of-stock'
            },
            {
                id: 5,
                name: 'Gaming Mouse',
                sku: 'GM-005',
                category: 'electronics',
                currentStock: 32,
                minStock: 8,
                maxStock: 80,
                costPrice: 18.00,
                sellingPrice: 39.99,
                supplier: 'Gaming Gear Co',
                location: 'E1-F2',
                lastUpdated: '2024-01-11',
                status: 'in-stock'
            },
            {
                id: 6,
                name: 'Mechanical Keyboard',
                sku: 'MK-006',
                category: 'electronics',
                currentStock: 3,
                minStock: 5,
                maxStock: 40,
                costPrice: 45.00,
                sellingPrice: 89.99,
                supplier: 'KeyTech Industries',
                location: 'F2-G1',
                lastUpdated: '2024-01-10',
                status: 'low-stock'
            },
            {
                id: 7,
                name: 'Tablet Stand',
                sku: 'TS-007',
                category: 'accessories',
                currentStock: 25,
                minStock: 10,
                maxStock: 60,
                costPrice: 8.50,
                sellingPrice: 19.99,
                supplier: 'Stand Solutions',
                location: 'G1-H3',
                lastUpdated: '2024-01-09',
                status: 'in-stock'
            },
            {
                id: 8,
                name: 'Power Bank 10000mAh',
                sku: 'PB-008',
                category: 'electronics',
                currentStock: 0,
                minStock: 12,
                maxStock: 100,
                costPrice: 12.00,
                sellingPrice: 24.99,
                supplier: 'Power Solutions Inc',
                location: 'H3-I1',
                lastUpdated: '2024-01-08',
                status: 'out-of-stock'
            }
        ];

        this.filteredInventory = [...this.inventory];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.selectedItems = new Set();

        this.init();
    }

    init() {
        this.renderInventoryStats();
        this.renderInventory();
        this.setupEventListeners();
        this.updateStockAlerts();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('inventorySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterInventory();
            });
        }

        // Filter dropdowns
        const filters = ['categoryFilter', 'stockStatusFilter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.filterInventory();
                });
            }
        });

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

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
    }

    renderInventoryStats() {
        const totalProducts = this.inventory.length;
        const lowStockItems = this.inventory.filter(item => 
            item.currentStock <= item.minStock && item.currentStock > 0
        ).length;
        const outOfStockItems = this.inventory.filter(item => item.currentStock === 0).length;
        const inventoryValue = this.inventory.reduce((total, item) => 
            total + (item.currentStock * item.costPrice), 0
        );

        // Update stats
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('outOfStockItems').textContent = outOfStockItems;
        document.getElementById('inventoryValue').textContent = `$${inventoryValue.toLocaleString()}`;
    }

    renderInventory() {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedItems = this.filteredInventory.slice(startIndex, endIndex);

        tableBody.innerHTML = '';

        paginatedItems.forEach(item => {
            const stockStatus = this.getStockStatus(item);
            const stockStatusClass = stockStatus.toLowerCase().replace(' ', '-');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="item-checkbox" data-id="${item.id}" 
                           ${this.selectedItems.has(item.id) ? 'checked' : ''}>
                </td>
                <td>
                    <div class="product-info">
                        <div class="product-name">${item.name}</div>
                        <div class="product-sku">SKU: ${item.sku}</div>
                    </div>
                </td>
                <td><span class="category-badge">${item.category}</span></td>
                <td>
                    <div class="stock-info">
                        <span class="current-stock">${item.currentStock}</span>
                        <div class="stock-range">Min: ${item.minStock} | Max: ${item.maxStock}</div>
                    </div>
                </td>
                <td>
                    <span class="stock-status ${stockStatusClass}">
                        ${stockStatus}
                    </span>
                </td>
                <td>$${item.costPrice.toFixed(2)}</td>
                <td>$${item.sellingPrice.toFixed(2)}</td>
                <td>${item.location}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="inventoryManager.adjustStock(${item.id})" title="Adjust Stock">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="inventoryManager.viewItem(${item.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon danger" onclick="inventoryManager.deleteItem(${item.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners for checkboxes
        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedItems.add(itemId);
                } else {
                    this.selectedItems.delete(itemId);
                }
                this.updateBulkActionButton();
            });
        });

        this.renderPagination();
        this.updateBulkActionButton();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredInventory.length / this.itemsPerPage);
        const paginationContainer = document.getElementById('inventoryPagination');
        
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="inventoryManager.changePage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="inventoryManager.changePage(${i})">
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
                    onclick="inventoryManager.changePage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredInventory.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderInventory();
        }
    }

    filterInventory() {
        const searchTerm = document.getElementById('inventorySearch')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const stockStatusFilter = document.getElementById('stockStatusFilter')?.value || '';

        this.filteredInventory = this.inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                                item.sku.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            const matchesStockStatus = !stockStatusFilter || this.getStockStatus(item).toLowerCase().replace(' ', '-') === stockStatusFilter;

            return matchesSearch && matchesCategory && matchesStockStatus;
        });

        this.currentPage = 1;
        this.renderInventory();
    }

    getStockStatus(item) {
        if (item.currentStock === 0) return 'Out of Stock';
        if (item.currentStock <= item.minStock) return 'Low Stock';
        return 'In Stock';
    }

    adjustStock(itemId) {
        const item = this.inventory.find(i => i.id === itemId);
        if (!item) return;

        // Show stock adjustment modal
        document.getElementById('adjustItemName').textContent = item.name;
        document.getElementById('adjustCurrentStock').textContent = item.currentStock;
        document.getElementById('adjustItemId').value = item.id;
        document.getElementById('stockAdjustment').value = '';
        document.getElementById('adjustmentReason').value = '';

        this.showModal('adjustStockModal');
    }

    viewItem(itemId) {
        const item = this.inventory.find(i => i.id === itemId);
        if (!item) return;

        // Populate item details modal
        document.getElementById('detailItemName').textContent = item.name;
        document.getElementById('detailItemSku').textContent = item.sku;
        document.getElementById('detailItemCategory').textContent = item.category;
        document.getElementById('detailCurrentStock').textContent = item.currentStock;
        document.getElementById('detailMinStock').textContent = item.minStock;
        document.getElementById('detailMaxStock').textContent = item.maxStock;
        document.getElementById('detailCostPrice').textContent = `$${item.costPrice.toFixed(2)}`;
        document.getElementById('detailSellingPrice').textContent = `$${item.sellingPrice.toFixed(2)}`;
        document.getElementById('detailSupplier').textContent = item.supplier;
        document.getElementById('detailLocation').textContent = item.location;
        document.getElementById('detailLastUpdated').textContent = this.formatDate(item.lastUpdated);

        this.showModal('itemDetailsModal');
    }

    deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item from inventory?')) {
            this.inventory = this.inventory.filter(i => i.id !== itemId);
            this.filteredInventory = this.filteredInventory.filter(i => i.id !== itemId);
            this.selectedItems.delete(itemId);
            this.renderInventory();
            this.renderInventoryStats();
            this.showNotification('Item deleted successfully', 'success');
        }
    }

    updateBulkActionButton() {
        const bulkActionContainer = document.querySelector('.bulk-actions');
        const selectedCount = this.selectedItems.size;
        
        if (selectedCount > 0 && bulkActionContainer) {
            bulkActionContainer.style.display = 'flex';
            const countElement = document.getElementById('selectedCount');
            if (countElement) countElement.textContent = selectedCount;
        } else if (bulkActionContainer) {
            bulkActionContainer.style.display = 'none';
        }
    }

    showLowStockItems() {
        document.getElementById('stockStatusFilter').value = 'low-stock';
        this.filterInventory();
        this.showNotification('Showing low stock items', 'info');
    }

    showOutOfStockItems() {
        document.getElementById('stockStatusFilter').value = 'out-of-stock';
        this.filterInventory();
        this.showNotification('Showing out of stock items', 'info');
    }

    generateStockReport() {
        const report = {
            totalItems: this.inventory.length,
            lowStockItems: this.inventory.filter(item => 
                item.currentStock <= item.minStock && item.currentStock > 0
            ),
            outOfStockItems: this.inventory.filter(item => item.currentStock === 0),
            totalValue: this.inventory.reduce((total, item) => 
                total + (item.currentStock * item.costPrice), 0
            )
        };

        // Generate CSV report
        const csvContent = this.generateInventoryReportCSV(report);
        this.downloadCSV(csvContent, 'inventory_report.csv');
        this.showNotification('Stock report generated successfully', 'success');
    }

    generateInventoryReportCSV(report) {
        const headers = ['Name', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Max Stock', 'Status', 'Cost Price', 'Selling Price', 'Value'];
        const csvRows = [headers.join(',')];

        this.inventory.forEach(item => {
            const row = [
                item.name,
                item.sku,
                item.category,
                item.currentStock,
                item.minStock,
                item.maxStock,
                this.getStockStatus(item),
                item.costPrice,
                item.sellingPrice,
                (item.currentStock * item.costPrice).toFixed(2)
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    exportInventory() {
        const csvContent = this.generateInventoryReportCSV({});
        this.downloadCSV(csvContent, 'inventory_export.csv');
        this.showNotification('Inventory exported successfully', 'success');
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

    updateStockAlerts() {
        const lowStockItems = this.inventory.filter(item => 
            item.currentStock <= item.minStock && item.currentStock > 0
        );
        const outOfStockItems = this.inventory.filter(item => item.currentStock === 0);

        // Update alerts in UI
        if (lowStockItems.length > 0 || outOfStockItems.length > 0) {
            this.showStockAlerts(lowStockItems, outOfStockItems);
        }
    }

    showStockAlerts(lowStockItems, outOfStockItems) {
        let alertMessage = '';
        
        if (outOfStockItems.length > 0) {
            alertMessage += `${outOfStockItems.length} items are out of stock. `;
        }
        
        if (lowStockItems.length > 0) {
            alertMessage += `${lowStockItems.length} items are running low on stock.`;
        }

        if (alertMessage) {
            // Create alert notification
            const alertDiv = document.createElement('div');
            alertDiv.className = 'stock-alert warning';
            alertDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>${alertMessage}</span>
                <button onclick="this.parentElement.remove()" class="close-alert">
                    <i class="fas fa-times"></i>
                </button>
            `;

            // Insert at top of main content
            const mainContent = document.querySelector('.main-content');
            if (mainContent && !document.querySelector('.stock-alert')) {
                mainContent.insertBefore(alertDiv, mainContent.firstChild);
            }
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
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

// Global functions for modal and quick actions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function exportInventory() {
    if (window.inventoryManager) {
        window.inventoryManager.exportInventory();
    }
}

function showLowStockItems() {
    if (window.inventoryManager) {
        window.inventoryManager.showLowStockItems();
    }
}

function showOutOfStockItems() {
    if (window.inventoryManager) {
        window.inventoryManager.showOutOfStockItems();
    }
}

function generateStockReport() {
    if (window.inventoryManager) {
        window.inventoryManager.generateStockReport();
    }
}

// Initialize inventory manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.inventoryManager = new InventoryManager();
});
