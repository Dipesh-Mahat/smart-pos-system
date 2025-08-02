// Shopowner-facing Supplier Products Page JS
// Loads supplier info, products, and allows order/auto-order

// Global variables
let selectedProducts = {};
let supplierProducts = [];
let currentSupplierId = null;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const supplierId = urlParams.get('supplierId');
    if (!supplierId) {
        document.getElementById('productsGrid').innerHTML = '<div class="empty-state">No supplier selected.</div>';
        return;
    }
    
    // Set global supplier ID
    currentSupplierId = supplierId;
    
    loadSupplierInfo(supplierId);
    loadSupplierProducts(supplierId);
    setupOrderForm();
    setupAutoOrderModal(supplierId);
});

function loadSupplierInfo(supplierId) {
    apiService.get('/shop/orders/suppliers').then(res => {
        if (res.success) {
            // Find by _id (ObjectId) not code
            const supplier = res.suppliers.find(s => s._id === supplierId);
            if (supplier) {
                document.getElementById('supplierName').textContent = supplier.shopName || supplier.firstName + ' ' + supplier.lastName;
                document.getElementById('supplierContact').innerHTML =
                    `<b>Email:</b> ${supplier.email} <br><b>Phone:</b> ${supplier.phone || 'N/A'}`;
            } else {
                document.getElementById('supplierName').textContent = 'Supplier not found';
                document.getElementById('supplierContact').textContent = '';
            }
        } else {
            document.getElementById('supplierName').textContent = 'Supplier not found';
            document.getElementById('supplierContact').textContent = '';
        }
    });
}

function loadSupplierProducts(supplierId) {
    // Show loading state
    document.getElementById('productsGrid').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #007bff; margin-bottom: 20px;"></i>
            <h3>Loading Products...</h3>
            <p>Please wait while we fetch the supplier's product catalog.</p>
        </div>
    `;
    
    apiService.get('/shop/suppliers/' + supplierId + '/products').then(res => {
        if (res.success && res.data && res.data.products && res.data.products.length) {
            supplierProducts = res.data.products;
            renderProducts(res.data.products);
            
            // Also update supplier info if available
            if (res.data.supplier) {
                document.getElementById('supplierName').textContent = res.data.supplier.name;
                document.getElementById('supplierContact').innerHTML =
                    `<b>Email:</b> ${res.data.supplier.email} <br><b>Phone:</b> ${res.data.supplier.phone || 'N/A'}`;
            }
        } else {
            document.getElementById('productsGrid').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-boxes" style="font-size: 64px; color: #dee2e6; margin-bottom: 20px;"></i>
                    <h3>No Products Available</h3>
                    <p>This supplier hasn't added any products to their catalog yet.</p>
                    <p style="color: #6c757d; font-size: 14px; margin-top: 15px;">
                        <i class="fas fa-info-circle"></i> 
                        Contact the supplier to add products or check back later.
                    </p>
                </div>
            `;
        }
    }).catch(error => {
        console.error('Error loading supplier products:', error);
        document.getElementById('productsGrid').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #dc3545; margin-bottom: 20px;"></i>
                <h3>Error Loading Products</h3>
                <p>Failed to load products. Please check your connection and try again.</p>
                <button class="btn btn-primary" onclick="loadSupplierProducts('${supplierId}')" style="margin-top: 15px;">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    });
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!products.length) {
        grid.innerHTML = '<div class="empty-state">No products found for this supplier.</div>';
        return;
    }
    grid.innerHTML = products.map(p => `
        <div class="supplier-card product-card" style="cursor: default;">
            <div class="product-header">
                <div class="product-image">
                    ${p.imageUrl ? 
                        `<img src="${p.imageUrl}" alt="${p.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">` :
                        `<div style="width: 100%; height: 120px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6c757d;"><i class="fas fa-box fa-2x"></i></div>`
                    }
                </div>
                <h4 style="margin: 15px 0 8px 0; font-size: 18px; font-weight: 600; color: #2c3e50;">${p.name}</h4>
                ${p.description ? `<p style="color: #6c757d; font-size: 14px; margin-bottom: 12px; line-height: 1.4;">${p.description}</p>` : ''}
            </div>
            
            <div class="product-details" style="margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #2c3e50; font-size: 18px;">Rs. ${p.price.toLocaleString()}</span>
                    <span style="background: ${p.stock > p.minStockLevel ? '#d4edda' : '#f8d7da'}; color: ${p.stock > p.minStockLevel ? '#155724' : '#721c24'}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                        Stock: ${p.stock} ${p.unit || 'pcs'}
                    </span>
                </div>
                ${p.category ? `<div style="color: #6c757d; font-size: 13px; margin-bottom: 8px;"><i class="fas fa-tag"></i> ${p.category}</div>` : ''}
            </div>
            
            <div class="product-actions" style="display: flex; align-items: center; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e9ecef;">
                <div style="flex: 1;">
                    <label style="display: block; font-size: 12px; color: #6c757d; margin-bottom: 4px;">Quantity</label>
                    <input type="number" min="1" max="${p.stock}" value="1" id="qty_${p._id}" 
                           style="width: 100%; padding: 8px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 14px; text-align: center;"
                           ${p.stock === 0 ? 'disabled' : ''}>
                </div>
                <button class="btn btn-success" onclick="selectProduct('${p._id}')" 
                        style="padding: 10px 16px; font-size: 14px; ${p.stock === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}" 
                        ${p.stock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i>
                    ${p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');
}

function selectProduct(productId) {
    const qty = parseInt(document.getElementById('qty_' + productId).value) || 1;
    const product = supplierProducts.find(p => p._id === productId);
    if (product) {
        selectedProducts[productId] = { ...product, quantity: qty };
        updateOrderSection();
    }
}

function updateOrderSection() {
    const orderSection = document.getElementById('orderSection');
    const orderItems = document.getElementById('orderItems');
    const keys = Object.keys(selectedProducts);
    if (!keys.length) {
        orderSection.style.display = 'none';
        return;
    }
    orderSection.style.display = 'block';
    
    let total = 0;
    const itemsHtml = keys.map(pid => {
        const p = selectedProducts[pid];
        const itemTotal = p.price * p.quantity;
        total += itemTotal;
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #2c3e50;">${p.name}</div>
                    <div style="font-size: 14px; color: #6c757d;">Rs. ${p.price.toLocaleString()} × ${p.quantity} = Rs. ${itemTotal.toLocaleString()}</div>
                </div>
                <button type="button" onclick="removeProduct('${pid}')" 
                        style="background: #dc3545; color: white; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer;">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
    }).join('');
    
    orderItems.innerHTML = `
        ${itemsHtml}
        <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid #dee2e6;">
            <div style="font-size: 18px; font-weight: 700; color: #2c3e50;">
                Total: Rs. ${total.toLocaleString()}
            </div>
        </div>
    `;
}

function removeProduct(productId) {
    delete selectedProducts[productId];
    updateOrderSection();
}

function setupOrderForm() {
    document.getElementById('orderForm').onsubmit = function(e) {
        e.preventDefault();
        if (!Object.keys(selectedProducts).length) {
            alert('Please select at least one product to order.');
            return;
        }
        
        // Prepare order data
        const urlParams = new URLSearchParams(window.location.search);
        const supplierId = urlParams.get('supplierId');
        
        const items = Object.values(selectedProducts).map(p => ({
            productId: p._id,
            quantity: p.quantity,
            unitPrice: p.price
        }));
        
        const orderData = {
            supplierId: supplierId,
            items: items,
            notes: 'Order placed via supplier products page'
        };
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Placing Order...';
        submitBtn.disabled = true;
        
        // Send order to backend
        apiService.post('/shop/suppliers/' + supplierId + '/orders', orderData).then(res => {
            if (res.success) {
                alert(`Order placed successfully! Order Number: ${res.data.order.orderNumber}`);
                selectedProducts = {};
                updateOrderSection();
                
                // Optionally redirect to orders page
                // window.location.href = 'orders.html';
            } else {
                alert('Failed to place order: ' + (res.error || 'Unknown error'));
            }
        }).catch(error => {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        }).finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    };
}

function openAutoOrderModal() {
    document.getElementById('autoOrderModal').style.display = 'flex';
    
    // Populate product dropdown with all supplier products
    const productSelect = document.getElementById('productId');
    productSelect.innerHTML = '<option value="">Select a product...</option>';
    
    if (supplierProducts && supplierProducts.length > 0) {
        supplierProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product._id;
            option.textContent = `${product.name} - NPR ${product.price}`;
            productSelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No products available';
        option.disabled = true;
        productSelect.appendChild(option);
    }
    
    // Set default next order date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('nextOrderDate').value = tomorrow.toISOString().split('T')[0];
}

function closeAutoOrderModal() {
    document.getElementById('autoOrderModal').style.display = 'none';
    document.getElementById('autoOrderForm').reset();
}

function exportProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    const supplierId = urlParams.get('supplierId');
    
    if (!supplierProducts || !supplierProducts.length) {
        alert('No products available to export.');
        return;
    }
    
    // Convert products to CSV
    let csv = 'Name,Category,Price,Stock,Description\n';
    
    supplierProducts.forEach(p => {
        const row = [
            '"' + p.name + '"',
            '"' + (p.category || '') + '"',
            p.price,
            p.stock,
            '"' + (p.description || '').replace(/"/g, '""') + '"'
        ];
        csv += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'supplier-products-' + supplierId + '.csv');
    document.body.appendChild(a);
    
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function contactSupplier() {
    const urlParams = new URLSearchParams(window.location.search);
    const supplierId = urlParams.get('supplierId');
    
    apiService.get('/shop/orders/suppliers').then(res => {
        if (res.success) {
            const supplier = res.suppliers.find(s => s._id === supplierId);
            if (supplier && supplier.email) {
                window.location.href = 'mailto:' + supplier.email + '?subject=Inquiry about products from ' + (supplier.shopName || 'your company');
            } else {
                alert('Supplier contact information not found.');
            }
        } else {
            alert('Failed to retrieve supplier contact information.');
        }
    }).catch(() => {
        alert('Failed to retrieve supplier contact information. Please try again later.');
    });
}

function setupAutoOrderModal(supplierId) {
    document.getElementById('autoOrderForm').onsubmit = function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        data.supplierId = supplierId;
        data.quantity = parseInt(data.quantity);
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Setting up...';
        submitBtn.disabled = true;
        
        apiService.post('/shop/suppliers/' + supplierId + '/auto-orders', data).then(res => {
            if (res.success) {
                closeAutoOrderModal();
                alert('Auto-order set up successfully! Your products will be automatically ordered based on the schedule.');
            } else {
                alert('Failed to set up auto-order: ' + (res.message || 'Unknown error'));
            }
        }).catch(error => {
            console.error('Error setting up auto-order:', error);
            alert('Failed to set up auto-order. Please try again.');
        }).finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    };
}

// Threshold-based Auto Order Functions
function openThresholdAutoOrderModal() {
    const modal = document.getElementById('thresholdAutoOrderModal');
    const productSelect = document.getElementById('thresholdProductId');
    
    // Clear previous options
    productSelect.innerHTML = '<option value="">Select a product...</option>';
    
    // Populate with supplier's products from global array
    if (supplierProducts && supplierProducts.length > 0) {
        supplierProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product._id;
            option.textContent = `${product.name} - NPR ${product.price}`;
            productSelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No products available';
        option.disabled = true;
        productSelect.appendChild(option);
    }
    
    modal.style.display = 'flex';
    setupThresholdAutoOrderModal(currentSupplierId);
}

function closeThresholdAutoOrderModal() {
    const modal = document.getElementById('thresholdAutoOrderModal');
    modal.style.display = 'none';
    document.getElementById('thresholdAutoOrderForm').reset();
}

function setupThresholdAutoOrderModal(supplierId) {
    document.getElementById('thresholdAutoOrderForm').onsubmit = function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        data.supplierId = supplierId;
        data.quantity = parseInt(data.quantity);
        data.minThreshold = parseInt(data.minThreshold);
        data.type = 'threshold'; // Mark as threshold-based auto order
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Setting up...';
        submitBtn.disabled = true;
        
        apiService.post('/shop/suppliers/' + supplierId + '/threshold-auto-orders', data).then(res => {
            if (res.success) {
                closeThresholdAutoOrderModal();
                alert('Threshold-based auto-order set up successfully! Products will be automatically ordered when stock falls below ' + data.minThreshold + ' units.');
                
                // Add visual indicator to the product card
                addThresholdIndicator(data.productId, data.minThreshold);
            } else {
                alert('Failed to set up threshold auto-order: ' + (res.message || 'Unknown error'));
            }
        }).catch(error => {
            console.error('Error setting up threshold auto-order:', error);
            alert('Failed to set up threshold auto-order. Please try again.');
        }).finally(() => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    };
}

function addThresholdIndicator(productId, threshold) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
        // Add or update threshold indicator
        let indicator = productCard.querySelector('.threshold-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'threshold-indicator';
            indicator.style.cssText = `
                background: #e8f5e8;
                border: 1px solid #4caf50;
                border-radius: 6px;
                padding: 6px 10px;
                margin-top: 10px;
                font-size: 12px;
                color: #2e7d32;
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            productCard.appendChild(indicator);
        }
        
        indicator.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            Auto-order when below ${threshold} units
        `;
    }
}
