// Global variables
let currentPage = 1;
const itemsPerPage = 10;
let totalProducts = 0;
let products = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the page
    setupEventListeners();
    updateStatistics();
    await loadProducts();
});

function initializeProductsPage() {
    try {
        // Hide loading overlay immediately if it exists
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        console.log('Initializing products page...');
        loadProducts();
        setupEventListeners();
        setupPagination();
        console.log('Products page initialized successfully');
    } catch (error) {
        console.error('Error initializing products page:', error);
        // Ensure loading is hidden even on error
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

async function loadProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/supplier/products', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        products = data.products || [];
        totalProducts = data.total || 0;
        
        renderProducts();
        updatePagination();
        await updateStatistics();
        
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'error');
        document.getElementById('productsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Error loading products</td></tr>';
    }
}

async function updateStatistics() {
    try {
        const response = await fetch('http://localhost:3000/api/supplier/products/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch product statistics');

        const stats = await response.json();
        
        // Update the statistics in the UI
        const totalElement = document.getElementById('totalProducts');
        const activeElement = document.getElementById('activeProducts');
        const lowStockElement = document.getElementById('lowStockProducts');
        const topElement = document.getElementById('topProducts');
        
        if (totalElement) totalElement.textContent = stats.total || 0;
        if (activeElement) activeElement.textContent = stats.active || 0;
        if (lowStockElement) lowStockElement.textContent = stats.lowStock || 0;
        if (topElement) topElement.textContent = stats.wellStocked || 0;

    } catch (error) {
        console.error('Error updating statistics:', error);
        showNotification('Failed to load product statistics', 'error');
    }
}

function setupEventListeners() {
    try {
        // Add Product Button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', openAddProductModal);
        }

        // Modal close buttons
        const closeAddModal = document.getElementById('closeAddModal');
        const closeEditModal = document.getElementById('closeEditModal');
        const cancelAddProduct = document.getElementById('cancelAddProduct');
        const cancelEditProduct = document.getElementById('cancelEditProduct');
        
        if (closeAddModal) closeAddModal.addEventListener('click', closeAddProductModal);
        if (closeEditModal) closeEditModal.addEventListener('click', closeEditProductModal);
        if (cancelAddProduct) cancelAddProduct.addEventListener('click', closeAddProductModal);
        if (cancelEditProduct) cancelEditProduct.addEventListener('click', closeEditProductModal);
        
        // Form submissions
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', handleAddProduct);
        }
        
        // Search and filters
        const productSearch = document.getElementById('productSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const filterBtn = document.getElementById('filterBtn');
        
        if (productSearch) productSearch.addEventListener('input', handleSearch);
        if (categoryFilter) categoryFilter.addEventListener('change', handleFilter);
        if (statusFilter) statusFilter.addEventListener('change', handleFilter);
        if (filterBtn) filterBtn.addEventListener('click', applyFilters);
        
        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', handleSelectAll);
        }

        // Close modals when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-overlay')) {
                closeAllModals();
            }
        });

        console.log('Event listeners set up successfully');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><input type="checkbox" class="product-select" value="${product._id}"></td>
            <td>
                <div class="product-info">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-image">` : ''}
                    <div>
                        <strong>${escapeHtml(product.name)}</strong>
                        <small>${escapeHtml(product.brand || '')}</small>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(product.sku)}</td>
            <td>${escapeHtml(product.category)}</td>
            <td>₹${product.price.toFixed(2)}</td>
            <td>
                <span class="stock-badge ${getStockStatusClass(product)}">
                    ${product.stock}
                </span>
            </td>
            <td>
                <span class="status-badge ${product.status}">
                    ${formatStatus(product.status)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editProduct('${product._id}')" title="Edit Product">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="toggleProductStatus('${product._id}')" title="Toggle Status">
                        <i class="fas fa-toggle-${product.status === 'active' ? 'on' : 'off'}"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteProduct('${product._id}')" title="Delete Product">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function createProductRow(product) {
    const row = document.createElement('tr');
    
    const statusClass = product.status === 'active' ? 'success' : 'danger';
    const stockClass = product.stock <= product.minStock ? 'warning' : 'success';
    const statusText = product.status === 'active' ? 'Active' : 'Inactive';
    
    row.innerHTML = `
        <td>
            <input type="checkbox" class="row-checkbox" data-product-id="${product._id}">
        </td>        <td>
            <div class="product-info">
                <div class="product-image">
                    <div class="image-placeholder">
                        <i class="fas fa-box"></i>
                    </div>
                </div>
                <div class="product-details">
                    <h4>${product.name}</h4>
                    <span class="product-brand">${product.brand || 'No Brand'}</span>
                </div>
            </div>
        </td>
        <td>
            <span class="sku-code">${product.sku}</span>
        </td>
        <td>
            <span class="category-badge category-${product.category}">
                ${capitalizeFirst(product.category)}
            </span>
        </td>
        <td>
            <span class="price">₹${product.price.toLocaleString()}</span>
        </td>
        <td>
            <span class="stock-count stock-${stockClass}">
                ${product.stock}
                ${product.stock <= product.minStock ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
            </span>
        </td>
        <td>
            <span class="status-badge status-${statusClass}">${statusText}</span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="btn-icon btn-edit" onclick="editProduct('${product._id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-view" onclick="viewProduct('${product._id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteProduct('${product._id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

function updateStatistics(stats) {
    try {
        const totalElement = document.getElementById('totalProducts');
        const activeElement = document.getElementById('activeProducts');
        const lowStockElement = document.getElementById('lowStockProducts');
        const topElement = document.getElementById('topProducts');
        
        // If stats are provided from API, use those
        if (stats) {
            if (totalElement) totalElement.textContent = stats.total;
            if (activeElement) activeElement.textContent = stats.active;
            if (lowStockElement) lowStockElement.textContent = stats.lowStock;
            if (topElement) topElement.textContent = stats.wellStocked;
            
            console.log('Statistics updated from API:', stats);
            return;
        }
        
        // Otherwise calculate from local data
        const activeProducts = products.filter(p => p.isActive !== false && p.status !== 'inactive').length;
        const lowStockProducts = products.filter(p => {
            const minLevel = p.minStockLevel || p.minStock || 5;
            return p.stock <= minLevel;
        }).length;
        const highStockProducts = products.filter(p => {
            const minLevel = p.minStockLevel || p.minStock || 5;
            return p.stock > minLevel * 3;
        }).length;
        
        if (totalElement) totalElement.textContent = totalProducts;
        if (activeElement) activeElement.textContent = activeProducts;
        if (lowStockElement) lowStockElement.textContent = lowStockProducts;
        if (topElement) topElement.textContent = highStockProducts;
        
        console.log('Statistics updated from local data:', { totalProducts, activeProducts, lowStockProducts, highStockProducts });
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

function setupPagination() {
    updatePaginationControls();
    
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadProductsTable();
            updatePaginationControls();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            loadProductsTable();
            updatePaginationControls();
        }
    });
}

function updatePagination() {
    const totalPages = Math.ceil(totalProducts / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(currentPage * itemsPerPage, totalProducts);
    
    // Update showing text
    document.getElementById('showingStart').textContent = totalProducts > 0 ? startIndex + 1 : 0;
    document.getElementById('showingEnd').textContent = endIndex;
    document.getElementById('totalRows').textContent = totalProducts;
    
    // Update pagination buttons
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    // Generate page numbers
    const paginationNumbers = document.getElementById('paginationNumbers');
    let numbersHtml = '';
    
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        numbersHtml += `
            <button class="pagination-number ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
        `;
    }
    
    paginationNumbers.innerHTML = numbersHtml;
}

function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
    
    document.getElementById('showingStart').textContent = filteredProducts.length > 0 ? startIndex + 1 : 0;
    document.getElementById('showingEnd').textContent = endIndex;
    document.getElementById('totalRows').textContent = filteredProducts.length;
}

function openAddProductModal() {
    document.getElementById('addProductModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAddProductModal() {
    document.getElementById('addProductModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('addProductForm').reset();
}

function closeEditProductModal() {
    document.getElementById('editProductModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
}

function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newProduct = {
        name: formData.get('productName'),
        sku: formData.get('productSKU'),
        category: formData.get('productCategory'),
        brand: formData.get('productBrand') || '',
        price: parseFloat(formData.get('productPrice')),
        cost: parseFloat(formData.get('productCost')) || 0,
        stock: parseInt(formData.get('productStock')),
        minStockLevel: parseInt(formData.get('productMinStock')) || 10,
        status: 'active',
        description: formData.get('productDescription') || '',
        image: formData.get('productImage') || null
    };
    
    // Validate required fields
    if (!newProduct.name || !newProduct.sku || !newProduct.category || !newProduct.price) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Add product through API
    showNotification('Adding product...', 'info');
    
    // Add product through API
    fetch('http://localhost:3000/api/supplier/products', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProduct)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadProducts();
            closeAddProductModal();
            showNotification('Product added successfully!', 'success');
        } else {
            showNotification('Failed to add product: ' + (data.message || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error adding product:', error);
        showNotification('Failed to add product. Please try again.', 'error');
    });
}

function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // Populate edit form with product data
    populateEditForm(product);
    document.getElementById('editProductModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function viewProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // Display product details in a modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Product Details</h2>
            <div class="product-details-grid">
                <div class="detail-group">
                    <label>Product Name</label>
                    <p>${escapeHtml(product.name)}</p>
                </div>
                <div class="detail-group">
                    <label>SKU</label>
                    <p>${escapeHtml(product.sku)}</p>
                </div>
                <div class="detail-group">
                    <label>Category</label>
                    <p>${capitalizeFirst(escapeHtml(product.category))}</p>
                </div>
                <div class="detail-group">
                    <label>Brand</label>
                    <p>${escapeHtml(product.brand || 'No Brand')}</p>
                </div>
                <div class="detail-group">
                    <label>Price</label>
                    <p>₹${product.price.toLocaleString()}</p>
                </div>
                <div class="detail-group">
                    <label>Cost</label>
                    <p>₹${product.cost.toLocaleString()}</p>
                </div>
                <div class="detail-group">
                    <label>Stock</label>
                    <p class="${getStockStatusClass(product)}">${product.stock}</p>
                </div>
                <div class="detail-group">
                    <label>Minimum Stock</label>
                    <p>${product.minStock || 'Not Set'}</p>
                </div>
                <div class="detail-group">
                    <label>Status</label>
                    <p class="${product.status}">${capitalizeFirst(product.status)}</p>
                </div>
                ${product.description ? `
                <div class="detail-group full-width">
                    <label>Description</label>
                    <p>${escapeHtml(product.description)}</p>
                </div>` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeAllModals()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Animate in
    setTimeout(() => modal.classList.add('active'), 100);
}

function toggleProductStatus(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    
    fetch(`http://localhost:3000/api/supplier/products/${productId}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadProducts();
            showNotification(`Product status changed to ${capitalizeFirst(newStatus)}`, 'success');
        } else {
            showNotification('Failed to update product status: ' + (data.message || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error updating product status:', error);
        showNotification('Failed to update product status. Please try again.', 'error');
    });
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(`http://localhost:3000/api/supplier/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadProducts();
                showNotification('Product deleted successfully!', 'success');
            } else {
                showNotification('Failed to delete product: ' + (data.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            showNotification('Failed to delete product. Please try again.', 'error');
        });
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    currentPage = 1;
    
    fetch(`http://localhost:3000/api/supplier/products?search=${encodeURIComponent(searchTerm)}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        products = data.products || [];
        totalProducts = data.total || 0;
        renderProducts();
        updatePagination();
    })
    .catch(error => {
        console.error('Error searching products:', error);
        showNotification('Error searching products', 'error');
    });
}

function handleFilter() {
    applyFilters();
}

function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    currentPage = 1;
    
    let url = 'http://localhost:3000/api/supplier/products?';
    if (category) url += `category=${encodeURIComponent(category)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        products = data.products || [];
        totalProducts = data.total || 0;
        renderProducts();
        updatePagination();
    })
    .catch(error => {
        console.error('Error filtering products:', error);
        showNotification('Error applying filters', 'error');
    });
}

function handleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.product-select');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

function populateEditForm(product) {
    const editModal = document.getElementById('editProductModal');
    const modalContent = editModal.querySelector('.modal-content');
    
    // Create edit form with pre-filled data
    modalContent.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label for="editProductName">Product Name *</label>
                <input type="text" id="editProductName" name="productName" value="${product.name}" required>
            </div>
            <div class="form-group">
                <label for="editProductSKU">SKU *</label>
                <input type="text" id="editProductSKU" name="productSKU" value="${product.sku}" required>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="editProductCategory">Category *</label>
                <select id="editProductCategory" name="productCategory" required>
                    <option value="">Select Category</option>
                    <option value="groceries" ${product.category === 'groceries' ? 'selected' : ''}>Groceries</option>
                    <option value="beverages" ${product.category === 'beverages' ? 'selected' : ''}>Beverages</option>
                    <option value="snacks" ${product.category === 'snacks' ? 'selected' : ''}>Snacks & Confectionery</option>
                    <option value="personal-care" ${product.category === 'personal-care' ? 'selected' : ''}>Personal Care</option>
                    <option value="household" ${product.category === 'household' ? 'selected' : ''}>Household Items</option>
                    <option value="dairy" ${product.category === 'dairy' ? 'selected' : ''}>Dairy Products</option>
                    <option value="cooking-oil" ${product.category === 'cooking-oil' ? 'selected' : ''}>Cooking Oil</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editProductBrand">Brand</label>
                <input type="text" id="editProductBrand" name="productBrand" value="${product.brand}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="editProductPrice">Price (₹) *</label>
                <input type="number" id="editProductPrice" name="productPrice" step="0.01" min="0" value="${product.price}" required>
            </div>
            <div class="form-group">
                <label for="editProductCost">Cost Price (₹)</label>
                <input type="number" id="editProductCost" name="productCost" step="0.01" min="0" value="${product.cost}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label for="editProductStock">Stock *</label>
                <input type="number" id="editProductStock" name="productStock" min="0" value="${product.stock}" required>
            </div>
            <div class="form-group">
                <label for="editProductMinStock">Minimum Stock Alert</label>
                <input type="number" id="editProductMinStock" name="productMinStock" min="0" value="${product.minStock}">
            </div>
        </div>
        <div class="form-group">
            <label for="editProductDescription">Description</label>
            <textarea id="editProductDescription" name="productDescription" rows="3">${product.description}</textarea>
        </div>
        <div class="form-group">
            <label for="editProductStatus">Status</label>
            <select id="editProductStatus" name="productStatus">
                <option value="active" ${product.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${product.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
        </div>
        <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="closeEditProductModal()">Cancel</button>
            <button type="button" class="btn-primary" onclick="updateProduct(${product.id})">Update Product</button>
        </div>
    `;
}

function updateProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // Get form data
    const updatedProduct = {
        name: document.getElementById('editProductName').value,
        barcode: document.getElementById('editProductSKU').value,
        category: document.getElementById('editProductCategory').value,
        brand: document.getElementById('editProductBrand').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        cost: parseFloat(document.getElementById('editProductCost').value) || 0,
        stock: parseInt(document.getElementById('editProductStock').value),
        minStockLevel: parseInt(document.getElementById('editProductMinStock').value),
        description: document.getElementById('editProductDescription').value
    };
    
    // Update product through API
    
    // Update product through API
    fetch(`http://localhost:3000/api/supplier/products/${product._id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProduct)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadProducts();
            closeEditProductModal();
            showNotification('Product updated successfully!', 'success');
        } else {
            showNotification('Failed to update product: ' + (data.message || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error updating product:', error);
        showNotification('Failed to update product. Please try again.', 'error');
    });
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
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

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper functions
function getStockStatusClass(product) {
    if (!product || typeof product.stock !== 'number') return '';
    if (product.stock <= 0) return 'out-of-stock';
    if (product.stock <= (product.minStock || 5)) return 'low-stock';
    return 'in-stock';
}

function formatStatus(status) {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
