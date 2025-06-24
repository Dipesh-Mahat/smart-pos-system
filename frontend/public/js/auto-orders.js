// Auto-Orders JS for Shopowner
// Assumes apiService is available globally

document.addEventListener('DOMContentLoaded', function() {
    // If supplierId is present in query, pre-select supplier and disable dropdown
    const urlParams = new URLSearchParams(window.location.search);
    const supplierId = urlParams.get('supplierId');
    if (supplierId) {
        // Wait for suppliers to load, then select and disable
        const interval = setInterval(() => {
            const supplierSelect = document.getElementById('supplierId');
            if (supplierSelect && supplierSelect.options.length > 1) {
                supplierSelect.value = supplierId;
                supplierSelect.disabled = true;
                loadProductsForSupplier(supplierId);
                clearInterval(interval);
            }
        }, 100);
    }
    loadAutoOrders();
    setupEventListeners();
    loadSuppliersAndProducts();
});

let autoOrders = [];

function loadAutoOrders() {
    apiService.get('/auto-orders').then(res => {
        if (res.success) {
            autoOrders = res.autoOrders;
            renderAutoOrders();
        } else {
            document.getElementById('autoOrdersGrid').innerHTML = '<div class="empty-state">Failed to load auto-orders.</div>';
        }
    });
}

function renderAutoOrders() {
    const grid = document.getElementById('autoOrdersGrid');
    if (!autoOrders.length) {
        grid.innerHTML = '<div class="empty-state">No auto-orders found.</div>';
        return;
    }
    grid.innerHTML = autoOrders.map(order => `
        <div class="supplier-card">
            <div><b>Supplier:</b> ${order.supplierId?.name || order.supplierId}</div>
            <div><b>Product:</b> ${order.productId?.name || order.productId}</div>
            <div><b>Quantity:</b> ${order.quantity}</div>
            <div><b>Frequency:</b> ${order.frequency}</div>
            <div><b>Next Order:</b> ${new Date(order.nextOrderDate).toLocaleDateString()}</div>
            <div style="margin-top:10px;">
                <button class="btn btn-secondary" onclick="editAutoOrder('${order._id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteAutoOrder('${order._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function setupEventListeners() {
    document.getElementById('autoOrderForm').onsubmit = function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        data.quantity = +data.quantity;
        data.nextOrderDate = new Date(data.nextOrderDate);
        apiService.post('/auto-orders', data).then(res => {
            if (res.success) {
                closeAutoOrderModal();
                loadAutoOrders();
            } else {
                alert('Failed to save auto-order');
            }
        });
    };
}

function openAutoOrderModal() {
    document.getElementById('autoOrderModal').style.display = 'flex';
}
function closeAutoOrderModal() {
    document.getElementById('autoOrderModal').style.display = 'none';
    document.getElementById('autoOrderForm').reset();
}

function editAutoOrder(id) {
    const order = autoOrders.find(o => o._id === id);
    if (!order) return;
    openAutoOrderModal();
    document.getElementById('supplierId').value = order.supplierId?._id || order.supplierId;
    document.getElementById('productId').value = order.productId?._id || order.productId;
    document.getElementById('quantity').value = order.quantity;
    document.getElementById('frequency').value = order.frequency;
    document.getElementById('nextOrderDate').value = order.nextOrderDate.split('T')[0];
    document.getElementById('notes').value = order.notes || '';
    document.getElementById('autoOrderForm').onsubmit = function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        data.quantity = +data.quantity;
        data.nextOrderDate = new Date(data.nextOrderDate);
        apiService.put(`/auto-orders/${id}`, data).then(res => {
            if (res.success) {
                closeAutoOrderModal();
                loadAutoOrders();
            } else {
                alert('Failed to update auto-order');
            }
        });
    };
}

function deleteAutoOrder(id) {
    if (!confirm('Delete this auto-order?')) return;
    apiService.delete(`/auto-orders/${id}`).then(res => {
        if (res.success) {
            loadAutoOrders();
        } else {
            alert('Failed to delete auto-order');
        }
    });
}

function loadSuppliersAndProducts() {
    apiService.get('/users/suppliers').then(res => {
        if (res.success) {
            const supplierSelect = document.getElementById('supplierId');
            supplierSelect.innerHTML = '<option value="">Select Supplier</option>' +
                res.suppliers.map(s => `<option value="${s._id}">${s.shopName || s.firstName + ' ' + s.lastName}</option>`).join('');
            supplierSelect.onchange = function() {
                loadProductsForSupplier(this.value);
            };
        }
    });
}

function loadProductsForSupplier(supplierId) {
    if (!supplierId) {
        document.getElementById('productId').innerHTML = '<option value="">Select Product</option>';
        return;
    }
    apiService.get(`/users/supplier/${supplierId}/products`).then(res => {
        if (res.success) {
            const productSelect = document.getElementById('productId');
            productSelect.innerHTML = '<option value="">Select Product</option>' +
                res.products.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
        }
    });
}
