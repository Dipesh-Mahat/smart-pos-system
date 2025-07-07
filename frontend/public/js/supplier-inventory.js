/**
 * Supplier Inventory Management
 * Smart POS System - Supplier Portal
 */

class InventoryManager {
    constructor() {
        this.inventory = [];
        this.filteredInventory = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.selectedItems = new Set();
        this.totalPages = 1;
        this.apiService = window.apiService || {};
        
        this.init();
    }

    async init() {
        try {
            await this.loadInventoryData();
            this.setupEventListeners();
            this.loadLowStockAlerts();
        } catch (error) {
            console.error("Error initializing inventory manager:", error);
            this.showNotification("Failed to load inventory data", "error");
        }
    }
    
    async loadInventoryData(page = 1, filters = {}) {
        try {
            this.showLoader();
            
            // Build query params for API request
            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', this.itemsPerPage);
            
            // Add filters if provided
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.category) queryParams.append('category', filters.category);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.location) queryParams.append('location', filters.location);
            
            // Make API request to get inventory data
            const response = await this.apiService.request(`/supplier/inventory?${queryParams.toString()}`);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load inventory data');
            }
            
            this.inventory = response.data.items;
            this.filteredInventory = this.inventory;
            this.currentPage = page;
            this.totalPages = response.data.pagination.pages;
            
            // Update statistics
            this.updateStatistics(response.data.stats);
            
            this.renderInventory();
        } catch (error) {
            console.error("Error loading inventory data:", error);
            this.showNotification("Failed to load inventory data", "error");
        } finally {
            this.hideLoader();
        }
    }
    
    async loadLowStockAlerts() {
        try {
            const response = await this.apiService.request('/supplier/inventory/alerts/low-stock');
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to load low stock alerts');
            }
            
            this.renderLowStockAlerts(response.data);
        } catch (error) {
            console.error("Error loading low stock alerts:", error);
        }
    }
    
    renderLowStockAlerts(lowStockItems) {
        const alertsList = document.querySelector('.alerts-list');
        const alertCount = document.querySelector('.alert-count');
        
        if (!alertsList || !alertCount) return;
        
        // Set alert count
        alertCount.textContent = `${lowStockItems.length} items`;
        
        // Clear existing alerts
        alertsList.innerHTML = '';
        
        // Display up to 5 low stock items
        const displayItems = lowStockItems.slice(0, 5);
        
        if (displayItems.length === 0) {
            alertsList.innerHTML = '<div class="no-alerts">No low stock items</div>';
            return;
        }
        
        // Create alert items
        displayItems.forEach(item => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.innerHTML = `
                <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <h4>${item.productId.name}</h4>
                    <p>Only ${item.currentStock} units remaining</p>
                </div>
                <button class="btn-restock" onclick="inventoryManager.openRestockModal('${item._id}')">Restock</button>
            `;
            alertsList.appendChild(alertItem);
        });
    }
    
    openRestockModal(itemId) {
        // Find the item
        const item = this.inventory.find(i => i._id === itemId);
        if (!item) return;
        
        // Open the adjust stock modal
        this.adjustStock(itemId);
    }

    updateStatistics(stats) {
        // Update statistics in the UI
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('lowStockItems').textContent = stats.lowStockItems;
        document.getElementById('outOfStockItems').textContent = stats.outOfStockItems;
        document.getElementById('inventoryValue').textContent = `$${stats.inventoryValue.toLocaleString()}`;
        
        // Update insights grid
        const lowStockRateElement = document.querySelector('.insight-item:nth-child(1) span');
        const outOfStockRateElement = document.querySelector('.insight-item:nth-child(2) span');
        
        if (lowStockRateElement) {
            lowStockRateElement.textContent = `${stats.lowStockRate}% of inventory`;
        }
        
        if (outOfStockRateElement) {
            outOfStockRateElement.textContent = `${stats.outOfStockRate}% of inventory`;
        }
        
        // Update low stock count in insights
        const lowStockCount = document.querySelector('.insight-item:nth-child(1) p');
        if (lowStockCount) {
            lowStockCount.textContent = `${stats.lowStockItems} items`;
        }
        
        // Update out of stock count in insights
        const outOfStockCount = document.querySelector('.insight-item:nth-child(2) p');
        if (outOfStockCount) {
            outOfStockCount.textContent = `${stats.outOfStockItems} items`;
        }
        
        // Update total products count in insights
        const totalProductsCount = document.querySelector('.insight-item:nth-child(4) p');
        if (totalProductsCount) {
            totalProductsCount.textContent = `${stats.totalProducts}`;
        }
        
        // Update inventory value in insights
        const inventoryValueElement = document.querySelector('.insight-item:nth-child(3) p');
        if (inventoryValueElement) {
            inventoryValueElement.textContent = `$${stats.inventoryValue.toLocaleString()}`;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('inventorySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this._searchTimer);
                this._searchTimer = setTimeout(() => {
                    this.applyFilters();
                }, 500);
            });
        }

        // Filter dropdowns
        const filters = ['categoryFilter', 'stockStatusFilter', 'locationFilter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.applyFilters();
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
        
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }
    }

    renderInventory() {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;
        
        // Clear existing content
        tableBody.innerHTML = '';
        
        if (this.filteredInventory.length === 0) {
            // Show "no items" message
            const noItemsRow = document.createElement('tr');
            noItemsRow.innerHTML = `
                <td colspan="9" class="no-items">
                    <div>
                        <i class="fas fa-search"></i>
                        <p>No inventory items found</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(noItemsRow);
            
            // Hide pagination
            const paginationContainer = document.getElementById('inventoryPagination');
            if (paginationContainer) paginationContainer.innerHTML = '';
            
            return;
        }

        this.filteredInventory.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="item-checkbox" data-id="${item._id}" 
                           ${this.selectedItems.has(item._id) ? 'checked' : ''}>
                </td>
                <td>
                    <div class="product-info">
                        <div class="product-name">${item.productId.name}</div>
                        <div class="product-sku">SKU: ${item.sku}</div>
                    </div>
                </td>
                <td><span class="category-badge">${item.productId.category}</span></td>
                <td>
                    <div class="stock-info">
                        <span class="current-stock">${item.currentStock}</span>
                        <div class="stock-range">Min: ${item.minStock} | Max: ${item.maxStock}</div>
                    </div>
                </td>
                <td>
                    <span class="stock-status ${item.status}">
                        ${this.formatStockStatus(item.status)}
                    </span>
                </td>
                <td>$${item.costPrice.toFixed(2)}</td>
                <td>$${item.sellingPrice.toFixed(2)}</td>
                <td>${item.location || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="inventoryManager.adjustStock('${item._id}')" title="Adjust Stock">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="inventoryManager.viewItem('${item._id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon danger" onclick="inventoryManager.deleteItem('${item._id}')" title="Delete">
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
                const itemId = e.target.dataset.id;
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
        const paginationContainer = document.getElementById('inventoryPagination');
        
        if (!paginationContainer || this.totalPages <= 1) {
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
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
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
            <button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                    onclick="inventoryManager.changePage(${this.currentPage + 1})" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }
    
    formatStockStatus(status) {
        if (status === 'out-of-stock') return 'Out of Stock';
        if (status === 'low-stock') return 'Low Stock';
        return 'In Stock';
    }

    async changePage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            await this.loadInventoryData(page, this.getCurrentFilters());
        }
    }

    async applyFilters() {
        const filters = this.getCurrentFilters();
        this.currentPage = 1;
        await this.loadInventoryData(1, filters);
    }
    
    getCurrentFilters() {
        return {
            search: document.getElementById('inventorySearch')?.value || '',
            category: document.getElementById('categoryFilter')?.value || '',
            status: document.getElementById('stockStatusFilter')?.value || '',
            location: document.getElementById('locationFilter')?.value || ''
        };
    }
    
    async clearFilters() {
        // Reset filter inputs
        document.getElementById('inventorySearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockStatusFilter').value = '';
        document.getElementById('locationFilter').value = '';
        
        // Load data without filters
        this.currentPage = 1;
        await this.loadInventoryData(1, {});
        
        this.showNotification("Filters cleared", "info");
    }

    async adjustStock(itemId) {
        try {
            const item = this.inventory.find(i => i._id === itemId);
            if (!item) return;
            
            // Show stock adjustment modal
            document.getElementById('adjustItemName').textContent = item.productId.name;
            document.getElementById('adjustCurrentStock').textContent = item.currentStock;
            document.getElementById('adjustItemId').value = item._id;
            document.getElementById('stockAdjustment').value = '';
            document.getElementById('adjustmentReason').value = '';
            
            this.showModal('adjustStockModal');
        } catch (error) {
            console.error("Error preparing stock adjustment:", error);
            this.showNotification("Failed to prepare stock adjustment", "error");
        }
    }

    async saveStockAdjustment() {
        try {
            const itemId = document.getElementById('adjustItemId').value;
            const adjustment = parseFloat(document.getElementById('stockAdjustment').value);
            const reason = document.getElementById('adjustmentReason').value;
            
            if (!itemId || isNaN(adjustment) || adjustment === 0) {
                this.showNotification("Please enter a valid adjustment amount", "error");
                return;
            }
            
            if (!reason) {
                this.showNotification("Please select a reason for adjustment", "error");
                return;
            }
            
            this.showLoader();
            
            const response = await this.apiService.request(`/supplier/inventory/${itemId}/adjust`, {
                method: 'POST',
                body: JSON.stringify({
                    adjustment,
                    reason,
                    notes: `Stock ${adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustment)} units`
                })
            });
            
            if (!response.success) {
                throw new Error(response.message || "Failed to adjust stock");
            }
            
            this.closeModals();
            this.showNotification("Stock adjusted successfully", "success");
            
            // Reload inventory data
            await this.loadInventoryData(this.currentPage, this.getCurrentFilters());
        } catch (error) {
            console.error("Error saving stock adjustment:", error);
            this.showNotification("Failed to adjust stock: " + (error.message || "Unknown error"), "error");
        } finally {
            this.hideLoader();
        }
    }

    async viewItem(itemId) {
        try {
            this.showLoader();
            
            const response = await this.apiService.request(`/supplier/inventory/${itemId}`);
            
            if (!response.success) {
                throw new Error(response.message || "Failed to retrieve item details");
            }
            
            const item = response.data.item;
            
            // Populate item details modal
            document.getElementById('detailItemName').textContent = item.productId.name;
            document.getElementById('detailItemSku').textContent = item.sku;
            document.getElementById('detailItemCategory').textContent = item.productId.category;
            document.getElementById('detailCurrentStock').textContent = item.currentStock;
            document.getElementById('detailMinStock').textContent = item.minStock;
            document.getElementById('detailMaxStock').textContent = item.maxStock;
            document.getElementById('detailCostPrice').textContent = `$${item.costPrice.toFixed(2)}`;
            document.getElementById('detailSellingPrice').textContent = `$${item.sellingPrice.toFixed(2)}`;
            document.getElementById('detailSupplier').textContent = 'Self';
            document.getElementById('detailLocation').textContent = item.location || 'N/A';
            document.getElementById('detailLastUpdated').textContent = this.formatDate(item.lastUpdated);
            
            this.showModal('itemDetailsModal');
        } catch (error) {
            console.error("Error viewing item details:", error);
            this.showNotification("Failed to load item details", "error");
        } finally {
            this.hideLoader();
        }
    }

    async deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item from inventory?')) {
            try {
                this.showLoader();
                
                const response = await this.apiService.request(`/supplier/inventory/${itemId}`, {
                    method: 'DELETE'
                });
                
                if (!response.success) {
                    throw new Error(response.message || "Failed to delete inventory item");
                }
                
                this.showNotification("Item deleted successfully", "success");
                this.selectedItems.delete(itemId);
                
                // Reload inventory data
                await this.loadInventoryData(this.currentPage, this.getCurrentFilters());
            } catch (error) {
                console.error("Error deleting item:", error);
                this.showNotification("Failed to delete item", "error");
            } finally {
                this.hideLoader();
            }
        }
    }
    
    toggleSelectAll(isChecked) {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const itemId = checkbox.dataset.id;
            
            if (isChecked) {
                this.selectedItems.add(itemId);
            } else {
                this.selectedItems.delete(itemId);
            }
        });
        
        this.updateBulkActionButton();
    }
    
    async executeBulkAction() {
        const action = document.getElementById('bulkActionSelect').value;
        
        if (!action || this.selectedItems.size === 0) {
            this.showNotification("Please select an action and at least one item", "error");
            return;
        }
        
        try {
            this.showLoader();
            
            switch (action) {
                case 'adjust-stock':
                    // Open a specialized bulk adjust modal
                    this.showModal('bulkAdjustStockModal');
                    break;
                    
                case 'update-location':
                    const newLocation = prompt("Enter new location for selected items:");
                    if (newLocation === null) return;
                    
                    const updateLocationResponse = await this.apiService.request('/supplier/inventory/bulk-update', {
                        method: 'PUT',
                        body: JSON.stringify({
                            items: Array.from(this.selectedItems),
                            updateType: 'location',
                            updateData: { location: newLocation }
                        })
                    });
                    
                    if (!updateLocationResponse.success) {
                        throw new Error(updateLocationResponse.message || "Failed to update locations");
                    }
                    
                    this.showNotification(`Updated location for ${this.selectedItems.size} items`, "success");
                    await this.loadInventoryData(this.currentPage, this.getCurrentFilters());
                    break;
                    
                case 'export':
                    await this.exportSelectedItems();
                    break;
                    
                default:
                    this.showNotification("Invalid action selected", "error");
            }
        } catch (error) {
            console.error("Error executing bulk action:", error);
            this.showNotification("Failed to execute bulk action", "error");
        } finally {
            this.hideLoader();
        }
    }
    
    async exportSelectedItems() {
        try {
            // Get selected items
            const selectedIds = Array.from(this.selectedItems);
            
            // Get full details of selected items
            const selectedItems = this.inventory.filter(item => selectedIds.includes(item._id));
            
            // Generate CSV
            const headers = ['Product Name', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Status', 'Cost Price', 'Selling Price', 'Location'];
            const rows = [headers];
            
            selectedItems.forEach(item => {
                rows.push([
                    item.productId.name,
                    item.sku,
                    item.productId.category,
                    item.currentStock,
                    item.minStock,
                    this.formatStockStatus(item.status),
                    item.costPrice,
                    item.sellingPrice,
                    item.location || 'N/A'
                ]);
            });
            
            const csvContent = rows.map(row => row.join(',')).join('\n');
            this.downloadCSV(csvContent, 'selected_items_export.csv');
            
            this.showNotification(`Exported ${selectedItems.length} items`, "success");
        } catch (error) {
            console.error("Error exporting selected items:", error);
            this.showNotification("Failed to export selected items", "error");
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
    
    async exportInventory() {
        try {
            this.showLoader();
            
            const response = await this.apiService.request('/supplier/inventory/report');
            
            if (!response.success) {
                throw new Error(response.message || "Failed to generate inventory report");
            }
            
            const reportData = response.data;
            
            // Generate CSV
            const headers = ['Product Name', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Max Stock', 'Status', 'Cost Price', 'Selling Price', 'Value', 'Location', 'Last Updated'];
            const rows = [headers];
            
            reportData.items.forEach(item => {
                rows.push([
                    item.productName,
                    item.sku,
                    item.category,
                    item.currentStock,
                    item.minStock,
                    item.maxStock,
                    item.status,
                    item.costPrice,
                    item.sellingPrice,
                    item.value,
                    item.location,
                    this.formatDate(item.lastUpdated)
                ]);
            });
            
            const csvContent = rows.map(row => row.join(',')).join('\n');
            this.downloadCSV(csvContent, 'inventory_export.csv');
            
            this.showNotification("Inventory exported successfully", "success");
        } catch (error) {
            console.error("Error exporting inventory:", error);
            this.showNotification("Failed to export inventory", "error");
        } finally {
            this.hideLoader();
        }
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
    
    showLoader() {
        let loader = document.querySelector('.page-loader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'page-loader';
            loader.innerHTML = '<div class="loader-spinner"></div>';
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'flex';
    }
    
    hideLoader() {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.style.display = 'none';
        }
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

function applyFilters() {
    if (window.inventoryManager) {
        window.inventoryManager.applyFilters();
    }
}

function clearFilters() {
    if (window.inventoryManager) {
        window.inventoryManager.clearFilters();
    }
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    if (window.inventoryManager && selectAll) {
        window.inventoryManager.toggleSelectAll(selectAll.checked);
    }
}

function executeBulkAction() {
    if (window.inventoryManager) {
        window.inventoryManager.executeBulkAction();
    }
}

// Initialize inventory manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.inventoryManager = new InventoryManager();
});
