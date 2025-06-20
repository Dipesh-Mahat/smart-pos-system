// Supplier Products JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Supplier Products page DOM loaded, initializing...');
    initializeProductsPage();
});

// Initialize with empty products array
let productsData = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;

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

// Load products from API or use demo products
function loadProducts() {
    try {
        console.log('Loading products...');
        const apiService = window.apiService || null;
        
        if (apiService) {
            // Show loading state
            const tableBody = document.getElementById('productsTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Loading products...</td></tr>';
            }
            
            // Try to fetch products from API
            apiService.request('/products')
                .then(response => {
                    if (response.success && response.data.products.length > 0) {
                        // Use real products from API
                        productsData = response.data.products;
                    } else {
                        // Fall back to demo products if no real products exist
                        productsData = getDemoProducts();
                    }
                    
                    filteredProducts = [...productsData];
                    loadProductsTable();
                    updateStatistics();
                    console.log('Products loaded from API successfully');
                })
                .catch(error => {
                    console.error('Error loading products:', error);
                    // Fall back to demo products on error
                    productsData = getDemoProducts();
                    filteredProducts = [...productsData];
                    loadProductsTable();
                    updateStatistics();
                    console.log('Products loaded from demo data after API error');
                });
        } else {
            // Use demo products if no API service available
            console.log('No API service, using demo products');
            productsData = getDemoProducts();
            filteredProducts = [...productsData];
            loadProductsTable();
            updateStatistics();
            console.log('Demo products loaded successfully');
        }
    } catch (error) {
        console.error('Error in loadProducts function:', error);
        // Fallback to demo products
        productsData = getDemoProducts();
        filteredProducts = [...productsData];
        loadProductsTable();
        updateStatistics();
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
        
        // Export/Import buttons
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        
        if (exportBtn) exportBtn.addEventListener('click', exportProducts);
        if (importBtn) importBtn.addEventListener('click', importProducts);
        
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

function loadProductsTable() {
    try {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) {
            console.error('Products table body not found');
            return;
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageProducts = filteredProducts.slice(startIndex, endIndex);
        
        tableBody.innerHTML = '';
        
        if (pageProducts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No products found</td></tr>';
        } else {
            pageProducts.forEach(product => {
                const row = createProductRow(product);
                if (row) {
                    tableBody.appendChild(row);
                }
            });
        }
        
        updatePaginationInfo();
        console.log(`Loaded ${pageProducts.length} products for page ${currentPage}`);
    } catch (error) {
        console.error('Error loading products table:', error);
        const tableBody = document.getElementById('productsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Error loading products</td></tr>';
        }
    }
}

function createProductRow(product) {
    const row = document.createElement('tr');
    
    const statusClass = product.status === 'active' ? 'success' : 'danger';
    const stockClass = product.stock <= product.minStock ? 'warning' : 'success';
    const statusText = product.status === 'active' ? 'Active' : 'Inactive';
    
    row.innerHTML = `
        <td>
            <input type="checkbox" class="row-checkbox" data-product-id="${product.id}">
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
    try {
        const totalProducts = productsData.length;
        const activeProducts = productsData.filter(p => p.status === 'active').length;
        const lowStockProducts = productsData.filter(p => p.stock <= p.minStock).length;
        const highStockProducts = productsData.filter(p => p.stock > p.minStock * 3).length; // Well-stocked items
        
        const totalElement = document.getElementById('totalProducts');
        const activeElement = document.getElementById('activeProducts');
        const lowStockElement = document.getElementById('lowStockProducts');
        const topElement = document.getElementById('topProducts');
        
        if (totalElement) totalElement.textContent = totalProducts;
        if (activeElement) activeElement.textContent = activeProducts;
        if (lowStockElement) lowStockElement.textContent = lowStockProducts;
        if (topElement) topElement.textContent = highStockProducts; // Changed from topProducts to wellStocked
        
        console.log('Statistics updated:', { totalProducts, activeProducts, lowStockProducts, highStockProducts });
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
    
    // Check for duplicate SKU in existing products
    if (productsData.filter(p => !p.id.toString().startsWith('demo')).some(p => p.sku === newProduct.sku)) {
        showNotification('SKU already exists. Please use a unique SKU.', 'error');
        return;
    }
    
    const apiService = window.apiService;
    if (apiService) {
        // Show loading state
        showNotification('Adding product...', 'info');
        
        // Add product through API
        apiService.createProduct(newProduct)
            .then(response => {
                if (response.success) {
                    // Hide demo products when adding first real product
                    hideDemoProducts();
                    
                    // Reload products from API
                    loadProducts();
                    closeAddProductModal();
                    showNotification('Product added successfully!', 'success');
                } else {
                    showNotification('Failed to add product: ' + response.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error adding product:', error);
                showNotification('Failed to add product. Please try again.', 'error');
            });
    } else {
        // Fallback for demo mode
        newProduct.id = Date.now(); // Use timestamp as ID
        
        // Hide demo products when adding first real product
        hideDemoProducts();
        
        // Add the new product to the array
        productsData = productsData.filter(p => !p.id.toString().startsWith('demo'));
        productsData.push(newProduct);
        filteredProducts = [...productsData];
        
        loadProductsTable();
        updateStatistics();
        closeAddProductModal();
        
        showNotification('Product added successfully!', 'success');
    }
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

// Placeholder functions for missing handlers to prevent errors
function handleSearch() {
    console.log('Search functionality not implemented yet');
}

function handleFilter() {
    console.log('Filter functionality not implemented yet');
}

function applyFilters() {
    console.log('Apply filters functionality not implemented yet');
}

function exportProducts() {
    console.log('Export functionality not implemented yet');
}

function importProducts() {
    console.log('Import functionality not implemented yet');
}

function handleSelectAll() {
    console.log('Select all functionality not implemented yet');
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

// Demo products module - Wholesale/Mart products for suppliers
function getDemoProducts() {
    return [
        {
            id: 1,
            name: "Coca Cola 500ml (Case of 24)",
            sku: "BVRG-CC-500-24",
            category: "beverages",
            brand: "Coca Cola",
            price: 6000,
            cost: 5000,
            stock: 45,
            minStock: 10,
            status: "active",
            image: "../images/products/coca-cola-case.jpg",
            description: "Wholesale case of 24 Coca Cola 500ml bottles for retail stores"
        },
        {
            id: 2,
            name: "Dairy Milk Chocolate (Box of 48)",
            sku: "CHOC-DM-100-48",
            category: "chocolates",
            brand: "Cadbury",
            price: 12000,
            cost: 10000,
            stock: 25,
            minStock: 5,
            status: "active",
            image: "../images/products/dairy-milk-box.jpg",
            description: "Wholesale box of 48 Dairy Milk chocolate bars for retail distribution"
        },
        {
            id: 3,
            name: "Lay's Potato Chips (Carton of 30)",
            sku: "SNCK-LAYS-200-30",
            category: "snacks",
            brand: "Lay's",
            price: 5500,
            cost: 4500,
            stock: 35,
            minStock: 8,
            status: "active",
            image: "../images/products/lays-carton.jpg",
            description: "Wholesale carton of 30 Lay's potato chips packs for retail stores"
        },
        {
            id: 4,
            name: "Bisleri Water 1L (Crate of 12)",
            sku: "BVRG-BSL-1L-12",
            category: "beverages",
            brand: "Bisleri",
            price: 1200,
            cost: 900,
            stock: 80,
            minStock: 20,
            status: "active",
            image: "../images/products/bisleri-crate.jpg",
            description: "Wholesale crate of 12 Bisleri 1L water bottles"
        },
        {
            id: 5,
            name: "Red Bull Energy Drink (Case of 24)",
            sku: "BVRG-RB-250-24",
            category: "beverages",
            brand: "Red Bull",
            price: 9600,
            cost: 8000,
            stock: 15,
            minStock: 5,
            status: "active",
            image: "../images/products/redbull-case.jpg",
            description: "Wholesale case of 24 Red Bull energy drinks for retail distribution"
        },
        {
            id: 6,
            name: "Maggi Noodles 2-Min (Carton of 48)",
            sku: "INST-MAG-70-48",
            category: "instant-food",
            brand: "Maggi",
            price: 4800,
            cost: 4000,
            stock: 60,
            minStock: 15,
            status: "active",
            image: "../images/products/maggi-carton.jpg",
            description: "Wholesale carton of 48 Maggi 2-minute noodles packs"
        },
        {
            id: 7,
            name: "Parle-G Biscuits (Box of 60)",
            sku: "BISC-PG-56-60",
            category: "biscuits",
            brand: "Parle",
            price: 3600,
            cost: 3000,
            stock: 40,
            minStock: 10,
            status: "active",
            image: "../images/products/parle-g-box.jpg",
            description: "Wholesale box of 60 Parle-G biscuit packs"
        },
        {
            id: 8,
            name: "Tata Salt 1kg (Bag of 25)",
            sku: "GROC-TS-1K-25",
            category: "groceries",
            brand: "Tata",
            price: 1750,
            cost: 1500,
            stock: 30,
            minStock: 8,
            status: "active",
            image: "../images/products/tata-salt-bag.jpg",
            description: "Wholesale bag of 25 Tata Salt 1kg packs"
        },
        {
            id: 9,
            name: "Britannia Good Day Cookies (Box of 36)",
            sku: "COOK-BRG-75-36",
            category: "biscuits",
            brand: "Britannia",
            price: 4320,
            cost: 3600,
            stock: 20,
            minStock: 6,
            status: "active",
            image: "../images/products/good-day-box.jpg",
            description: "Wholesale box of 36 Britannia Good Day cookie packs"
        },
        {
            id: 10,
            name: "Amul Milk 500ml (Crate of 20)",
            sku: "MILK-AM-500-20",
            category: "dairy",
            brand: "Amul",
            price: 2200,
            cost: 1900,
            stock: 50,
            minStock: 12,
            status: "active",
            image: "../images/products/amul-milk-crate.jpg",
            description: "Wholesale crate of 20 Amul milk 500ml packets"
        },
        {
            id: 11,
            name: "Surf Excel Detergent 1kg (Case of 12)",
            sku: "DTGN-SE-1K-12",
            category: "household",
            brand: "Surf Excel",
            price: 4800,
            cost: 4200,
            stock: 25,
            minStock: 5,
            status: "active",
            image: "../images/products/surf-excel-case.jpg",
            description: "Wholesale case of 12 Surf Excel detergent 1kg packs"
        },
        {
            id: 12,
            name: "Fortune Sunflower Oil 1L (Case of 15)",
            sku: "OIL-FRT-1L-15",
            category: "cooking-oil",
            brand: "Fortune",
            price: 2250,
            cost: 1950,
            stock: 2,
            minStock: 8,
            status: "active",
            image: "../images/products/fortune-oil-case.jpg",
            description: "Wholesale case of 15 Fortune sunflower oil 1L bottles - Low Stock!"
        }
    ];
}
