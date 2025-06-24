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
    apiService.get(`/users/suppliers`).then(res => {
        if (res.success) {
            // Find by _id (ObjectId) not code
            const supplier = res.suppliers.find(s => s._id === supplierId);
            if (supplier) {
                document.getElementById('supplierName').textContent = supplier.shopName || supplier.firstName + ' ' + supplier.lastName;
                document.getElementById('supplierContact').innerHTML =
                    `<b>Email:</b> ${supplier.email} <br><b>Phone:</b> ${supplier.contactNumber || ''}`;
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
    apiService.get(`/users/supplier/${supplierId}/products`).then(res => {
        if (res.success && res.products && res.products.length) {
            supplierProducts = res.products;
            renderProducts(res.products);
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
        <div class="supplier-card">
            <h4>${p.name}</h4>
            <div>Price: Rs. ${p.price}</div>
            <div>Stock: ${p.stock}</div>
            <div style="margin-top:10px;">
                <input type="number" min="1" max="${p.stock}" value="1" id="qty_${p._id}" style="width:60px;"> 
                <button class="btn btn-success" onclick="selectProduct('${p._id}')">Select</button>
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
    orderItems.innerHTML = keys.map(pid => {
        const p = selectedProducts[pid];
        return `<div>${p.name} x ${p.quantity} <button type="button" onclick="removeProduct('${pid}')">Remove</button></div>`;
    }).join('');
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
        // TODO: Implement backend order placement
        // Example: apiService.post('/orders', { products: Object.values(selectedProducts), supplierId })
        alert('Order placed for: ' + Object.values(selectedProducts).map(p => `${p.name} x ${p.quantity}`).join(', '));
        selectedProducts = {};
        updateOrderSection();
    };
}

function openAutoOrderModal() {
    document.getElementById('autoOrderModal').style.display = 'flex';
    // Populate product dropdown with selected products
    const productSelect = document.getElementById('productId');
    productSelect.innerHTML = Object.values(selectedProducts).map(p => `<option value="${p._id}">${p.name}</option>`).join('');
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
        data.quantity = +data.quantity;
        data.nextOrderDate = new Date(data.nextOrderDate);
        apiService.post('/auto-orders', data).then(res => {
            if (res.success) {
                closeAutoOrderModal();
                alert('Auto-order set up successfully!');
            } else {
                alert('Failed to set up auto-order');
            }
        });
    };
}
