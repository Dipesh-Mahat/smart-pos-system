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
            name: "Basmati Rice 5kg (Bag of 10)",
            sku: "RICE-BASMATI-5KG-10",
            category: "groceries",
            brand: "Himalayan Gold",
            price: 8500,
            cost: 7000,
            stock: 45,
            minStock: 10,
            status: "active",
            image: "../images/products/basmati-rice-bag.jpg",
            description: "Wholesale bag of 10 premium Basmati rice 5kg packs for retail stores"
        },
        {
            id: 2,
            name: "Nepali Tea 250g (Box of 20)",
            sku: "TEA-NEPALI-250G-20",
            category: "beverages",
            brand: "Ilam Tea",
            price: 3600,
            cost: 2400,
            stock: 25,
            minStock: 5,
            status: "active",
            image: "../images/products/nepali-tea-box.jpg",
            description: "Wholesale box of 20 Nepali black tea 250g packets from Ilam"
        },
        {
            id: 3,
            name: "Wai Wai Noodles (Carton of 48)",
            sku: "NOODLES-WAIWAI-48",
            category: "snacks",
            brand: "Wai Wai",
            price: 1440,
            cost: 1056,
            stock: 35,
            minStock: 8,
            status: "active",
            image: "../images/products/waiwai-carton.jpg",
            description: "Wholesale carton of 48 Wai Wai instant noodles for retail stores"
        },
        {
            id: 4,
            name: "DDC Milk 1L (Crate of 12)",
            sku: "MILK-DDC-1L-12",
            category: "dairy",
            brand: "DDC",
            price: 1020,
            cost: 840,
            stock: 80,
            minStock: 20,
            status: "active",
            image: "../images/products/ddc-milk-crate.jpg",
            description: "Wholesale crate of 12 DDC fresh pasteurized milk 1L bottles"
        },
        {
            id: 5,
            name: "Lux Soap 100g (Box of 48)",
            sku: "SOAP-LUX-100G-48",
            category: "personal-care",
            brand: "Lux",
            price: 2160,
            cost: 1680,
            stock: 15,
            minStock: 5,
            status: "active",
            image: "../images/products/lux-soap-box.jpg",
            description: "Wholesale box of 48 Lux beauty soap bars with rose fragrance"
        },
        {
            id: 6,
            name: "Teer Detergent 1kg (Case of 12)",
            sku: "DETERGENT-TEER-1KG-12",
            category: "household",
            brand: "Teer",
            price: 3360,
            cost: 2640,
            stock: 60,
            minStock: 15,
            status: "active",
            image: "../images/products/teer-detergent-case.jpg",
            description: "Wholesale case of 12 Teer washing powder 1kg packs"
        },
        {
            id: 7,
            name: "Masala Dal 1kg (Bag of 20)",
            sku: "DAL-MASALA-1KG-20",
            category: "groceries",
            brand: "Local Producer",
            price: 3200,
            cost: 2600,
            stock: 40,
            minStock: 10,
            status: "active",
            image: "../images/products/masala-dal-bag.jpg",
            description: "Wholesale bag of 20 mixed lentils with traditional Nepali spices"
        },
        {
            id: 8,
            name: "Khukri Rum 375ml (Case of 12)",
            sku: "RUM-KHUKRI-375ML-12",
            category: "beverages",
            brand: "Khukri",
            price: 11760,
            cost: 9600,
            stock: 30,
            minStock: 8,
            status: "active",
            image: "../images/products/khukri-rum-case.jpg",
            description: "Wholesale case of 12 Khukri premium aged rum 375ml bottles"
        },
        {
            id: 9,
            name: "Everest Spices Mixed (Box of 24)",
            sku: "SPICE-EVEREST-MIX-24",
            category: "groceries",
            brand: "Everest",
            price: 2880,
            cost: 2280,
            stock: 20,
            minStock: 6,
            status: "active",
            image: "../images/products/everest-spices-box.jpg",
            description: "Wholesale box of 24 assorted Everest spice packets"
        },
        {
            id: 10,
            name: "Golmaal Biscuits (Carton of 60)",
            sku: "BISCUIT-GOLMAAL-60",
            category: "snacks",
            brand: "Shivam",
            price: 1800,
            cost: 1500,
            stock: 50,
            minStock: 12,
            status: "active",
            image: "../images/products/golmaal-biscuits-carton.jpg",
            description: "Wholesale carton of 60 popular Golmaal biscuit packets"
        },
        {
            id: 11,
            name: "Mustard Oil 1L (Case of 15)",
            sku: "OIL-MUSTARD-1L-15",
            category: "cooking-oil",
            brand: "Dhara",
            price: 2250,
            cost: 1950,
            stock: 25,
            minStock: 5,
            status: "active",
            image: "../images/products/mustard-oil-case.jpg",
            description: "Wholesale case of 15 pure mustard oil 1L bottles for cooking"
        },
        {
            id: 12,
            name: "CG Salt 1kg (Bag of 25)",
            sku: "SALT-CG-1KG-25",
            category: "groceries",
            brand: "CG",
            price: 1375,
            cost: 1125,
            stock: 2,
            minStock: 8,
            status: "active",
            image: "../images/products/cg-salt-bag.jpg",
            description: "Wholesale bag of 25 CG iodized salt 1kg packets - Low Stock!"
        }
    ];
}
