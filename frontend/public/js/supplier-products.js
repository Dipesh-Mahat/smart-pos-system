// Supplier Products JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeProductsPage();
});

// Sample products data
let productsData = [
    {
        id: 1,
        name: "Samsung Galaxy S23",
        sku: "SAM-GS23-128",
        category: "electronics",
        brand: "Samsung",
        price: 79999,
        cost: 65000,
        stock: 25,
        minStock: 5,
        status: "active",
        image: "../images/products/samsung-s23.jpg",
        description: "Latest Samsung Galaxy S23 with 128GB storage"
    },
    {
        id: 2,
        name: "Nike Air Max 270",
        sku: "NIKE-AM270-42",
        category: "sports",
        brand: "Nike",
        price: 12995,
        cost: 8500,
        stock: 3,
        minStock: 10,
        status: "active",
        image: "../images/products/nike-airmax.jpg",
        description: "Comfortable running shoes with air cushioning"
    },
    {
        id: 3,
        name: "Apple MacBook Air M2",
        sku: "APP-MBA-M2-256",
        category: "electronics",
        brand: "Apple",
        price: 114900,
        cost: 95000,
        stock: 8,
        minStock: 3,
        status: "active",
        image: "../images/products/macbook-air.jpg",
        description: "Latest MacBook Air with M2 chip and 256GB SSD"
    },
    {
        id: 4,
        name: "Levi's 501 Jeans",
        sku: "LEVI-501-32W",
        category: "clothing",
        brand: "Levi's",
        price: 3999,
        cost: 2500,
        stock: 15,
        minStock: 8,
        status: "active",
        image: "../images/products/levis-jeans.jpg",
        description: "Classic Levi's 501 original fit jeans"
    },
    {
        id: 5,
        name: "Sony WH-1000XM4",
        sku: "SONY-WH1000XM4",
        category: "electronics",
        brand: "Sony",
        price: 29990,
        cost: 22000,
        stock: 0,
        minStock: 5,
        status: "inactive",
        image: "../images/products/sony-headphones.jpg",
        description: "Wireless noise-canceling headphones"
    }
];

let filteredProducts = [...productsData];
let currentPage = 1;
let itemsPerPage = 10;

function initializeProductsPage() {
    loadProductsTable();
    updateStatistics();
    setupEventListeners();
    setupPagination();
}

function setupEventListeners() {
    // Add Product Button
    document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);
    
    // Modal close buttons
    document.getElementById('closeAddModal').addEventListener('click', closeAddProductModal);
    document.getElementById('closeEditModal').addEventListener('click', closeEditProductModal);
    document.getElementById('cancelAddProduct').addEventListener('click', closeAddProductModal);
    
    // Form submissions
    document.getElementById('addProductForm').addEventListener('submit', handleAddProduct);
    
    // Search and filters
    document.getElementById('productSearch').addEventListener('input', handleSearch);
    document.getElementById('categoryFilter').addEventListener('change', handleFilter);
    document.getElementById('statusFilter').addEventListener('change', handleFilter);
    document.getElementById('filterBtn').addEventListener('click', applyFilters);
    
    // Export/Import buttons
    document.getElementById('exportBtn').addEventListener('click', exportProducts);
    document.getElementById('importBtn').addEventListener('click', importProducts);
    
    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', handleSelectAll);
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });
}

function loadProductsTable() {
    const tableBody = document.getElementById('productsTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    tableBody.innerHTML = '';
    
    pageProducts.forEach(product => {
        const row = createProductRow(product);
        tableBody.appendChild(row);
    });
    
    updatePaginationInfo();
}

function createProductRow(product) {
    const row = document.createElement('tr');
    
    const statusClass = product.status === 'active' ? 'success' : 'danger';
    const stockClass = product.stock <= product.minStock ? 'warning' : 'success';
    const statusText = product.status === 'active' ? 'Active' : 'Inactive';
    
    row.innerHTML = `
        <td>
            <input type="checkbox" class="row-checkbox" data-product-id="${product.id}">
        </td>
        <td>
            <div class="product-info">
                <div class="product-image">
                    <img src="${product.image || '../images/icons/product-placeholder.png'}" alt="${product.name}" onerror="this.src='../images/icons/product-placeholder.png'">
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
                <button class="btn-icon btn-edit" onclick="editProduct(${product.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-view" onclick="viewProduct(${product.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteProduct(${product.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

function updateStatistics() {
    const totalProducts = productsData.length;
    const activeProducts = productsData.filter(p => p.status === 'active').length;
    const lowStockProducts = productsData.filter(p => p.stock <= p.minStock).length;
    const topProducts = productsData.filter(p => p.stock > 50).length;
    
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('activeProducts').textContent = activeProducts;
    document.getElementById('lowStockProducts').textContent = lowStockProducts;
    document.getElementById('topProducts').textContent = topProducts;
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

function updatePaginationControls() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length);
    
    document.getElementById('showingStart').textContent = startIndex + 1;
    document.getElementById('showingEnd').textContent = endIndex;
    document.getElementById('totalRows').textContent = filteredProducts.length;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    // Generate page numbers
    const paginationNumbers = document.getElementById('paginationNumbers');
    paginationNumbers.innerHTML = '';
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            loadProductsTable();
            updatePaginationControls();
        });
        paginationNumbers.appendChild(pageBtn);
    }
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
        id: productsData.length + 1,
        name: formData.get('productName'),
        sku: formData.get('productSKU'),
        category: formData.get('productCategory'),
        brand: formData.get('productBrand') || '',
        price: parseFloat(formData.get('productPrice')),
        cost: parseFloat(formData.get('productCost')) || 0,
        stock: parseInt(formData.get('productStock')),
        minStock: parseInt(formData.get('productMinStock')) || 10,
        status: 'active',
        description: formData.get('productDescription') || '',
        image: '../images/icons/product-placeholder.png'
    };
    
    // Validate required fields
    if (!newProduct.name || !newProduct.sku || !newProduct.category || !newProduct.price) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Check for duplicate SKU
    if (productsData.some(p => p.sku === newProduct.sku)) {
        showNotification('SKU already exists. Please use a unique SKU.', 'error');
        return;
    }
    
    productsData.push(newProduct);
    filteredProducts = [...productsData];
    
    loadProductsTable();
    updateStatistics();
    closeAddProductModal();
    
    showNotification('Product added successfully!', 'success');
}

function editProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    // Populate edit form with product data
    populateEditForm(product);
    document.getElementById('editProductModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function viewProduct(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    // You can implement a view modal here
    showNotification(`Viewing product: ${product.name}`, 'info');
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        productsData = productsData.filter(p => p.id !== productId);
        filteredProducts = filteredProducts.filter(p => p.id !== productId);
        
        loadProductsTable();
        updateStatistics();
        showNotification('Product deleted successfully!', 'success');
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    applyFilters();
}

function handleFilter() {
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredProducts = productsData.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.sku.toLowerCase().includes(searchTerm) ||
                            product.category.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        
        let matchesStatus = true;
        if (statusFilter === 'low-stock') {
            matchesStatus = product.stock <= product.minStock;
        } else if (statusFilter) {
            matchesStatus = product.status === statusFilter;
        }
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    currentPage = 1;
    loadProductsTable();
    updatePaginationControls();
}

function handleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.row-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function exportProducts() {
    // Simple CSV export
    const headers = ['Name', 'SKU', 'Category', 'Brand', 'Price', 'Stock', 'Status'];
    const csvContent = [
        headers.join(','),
        ...productsData.map(product => [
            product.name,
            product.sku,
            product.category,
            product.brand,
            product.price,
            product.stock,
            product.status
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Products exported successfully!', 'success');
}

function importProducts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            // For demo purposes, just show a message
            showNotification('Import functionality would be implemented here', 'info');
        }
    };
    input.click();
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
                    <option value="electronics" ${product.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                    <option value="clothing" ${product.category === 'clothing' ? 'selected' : ''}>Clothing</option>
                    <option value="home" ${product.category === 'home' ? 'selected' : ''}>Home & Garden</option>
                    <option value="sports" ${product.category === 'sports' ? 'selected' : ''}>Sports</option>
                    <option value="books" ${product.category === 'books' ? 'selected' : ''}>Books</option>
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
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    // Get form data
    product.name = document.getElementById('editProductName').value;
    product.sku = document.getElementById('editProductSKU').value;
    product.category = document.getElementById('editProductCategory').value;
    product.brand = document.getElementById('editProductBrand').value;
    product.price = parseFloat(document.getElementById('editProductPrice').value);
    product.cost = parseFloat(document.getElementById('editProductCost').value) || 0;
    product.stock = parseInt(document.getElementById('editProductStock').value);
    product.minStock = parseInt(document.getElementById('editProductMinStock').value);
    product.description = document.getElementById('editProductDescription').value;
    product.status = document.getElementById('editProductStatus').value;
    
    filteredProducts = [...productsData];
    loadProductsTable();
    updateStatistics();
    closeEditProductModal();
    
    showNotification('Product updated successfully!', 'success');
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
