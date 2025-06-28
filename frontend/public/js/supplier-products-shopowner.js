// Shopowner-facing Supplier Products Page JS
// Loads supplier info, products, and allows order/auto-order

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const supplierId = urlParams.get('supplierId');
    if (!supplierId) {
        document.getElementById('productsGrid').innerHTML = '<div class="empty-state">No supplier selected.</div>';
        return;
    }
    loadSupplierInfo(supplierId);
    loadSupplierProducts(supplierId);
    setupOrderForm();
    setupAutoOrderModal(supplierId);
});

let selectedProducts = {};
let supplierProducts = [];

function loadSupplierInfo(supplierId) {
    apiService.get(`/shop/orders/suppliers`).then(res => {
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
    apiService.get(`/shop/suppliers/${supplierId}/products`).then(res => {
        if (res.success && res.products && res.products.length) {
            supplierProducts = res.products;
            renderProducts(res.products);
            
            // Also update supplier info if available
            if (res.supplier) {
                document.getElementById('supplierName').textContent = res.supplier.shopName || res.supplier.firstName + ' ' + res.supplier.lastName;
                document.getElementById('supplierContact').innerHTML =
                    `<b>Email:</b> ${res.supplier.email}`;
            }
        } else {
            document.getElementById('productsGrid').innerHTML = '<div class="empty-state">No products found for this supplier.</div>';
        }
    }).catch(() => {
        document.getElementById('productsGrid').innerHTML = '<div class="empty-state">Failed to load products. Please try again later.</div>';
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
        apiService.post('/shop/orders', orderData).then(res => {
            if (res.success) {
                alert(`Order placed successfully! Order Number: ${res.order.orderNumber}`);
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
    if (!Object.keys(selectedProducts).length) {
        alert('Please select at least one product first.');
        return;
    }
    
    document.getElementById('autoOrderModal').style.display = 'flex';
    
    // Populate product dropdown with selected products
    const productSelect = document.getElementById('productId');
    productSelect.innerHTML = '<option value="">Select a product...</option>' + 
        Object.values(selectedProducts).map(p => `<option value="${p._id}">${p.name}</option>`).join('');
    
    // Set default next order date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('nextOrderDate').value = tomorrow.toISOString().split('T')[0];
}

function closeAutoOrderModal() {
    document.getElementById('autoOrderModal').style.display = 'none';
    document.getElementById('autoOrderForm').reset();
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
        
        apiService.post('/auto-orders', data).then(res => {
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
