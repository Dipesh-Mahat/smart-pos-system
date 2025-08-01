document.addEventListener('DOMContentLoaded', async () => {
    await loadSupplierData();
});

async function loadSupplierData() {
    try {
        // Fetch top products
        const topProducts = await fetchTopProducts();
        updateTopProductsList(topProducts);

        // Fetch inventory insights
        const inventoryInsights = await fetchInventoryInsights();
        updateInventoryInsights(inventoryInsights);

        // Fetch customer activity
        const customerActivity = await fetchCustomerActivity();
        updateCustomerActivity(customerActivity);

        // Fetch sales trends
        const salesTrends = await fetchSalesTrends();
        updateSalesTrends(salesTrends);
    } catch (error) {
        console.error('Error loading supplier analytics:', error);
        showErrorMessage('Failed to load analytics data');
    }
}

async function fetchTopProducts() {
    const response = await fetch('/api/supplier/analytics/top-products', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch top products');
    return await response.json();
}

async function fetchInventoryInsights() {
    const response = await fetch('/api/supplier/analytics/inventory', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch inventory insights');
    return await response.json();
}

async function fetchCustomerActivity() {
    const response = await fetch('/api/supplier/analytics/customer-activity', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch customer activity');
    return await response.json();
}

async function fetchSalesTrends() {
    const response = await fetch('/api/supplier/analytics/sales-trends', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) throw new Error('Failed to fetch sales trends');
    return await response.json();
}

function updateTopProductsList(products) {
    const listContainer = document.querySelector('#topProductsList');
    if (!listContainer || !products.length) return;

    const productsList = products.map(product => `
        <li class="analytics-list-item">
            <div class="item-info">
                <div class="item-icon">
                    <i class="fas fa-box"></i>
                </div>
                <div class="item-details">
                    <h4>${escapeHtml(product.name)}</h4>
                    <p>${product.category}</p>
                </div>
            </div>
            <div class="item-value">
                <div class="value">${product.sales}</div>
                <div class="change ${product.trend >= 0 ? '' : 'negative'}">
                    ${product.trend >= 0 ? '+' : ''}${product.trend}%
                </div>
            </div>
        </li>
    `).join('');

    listContainer.innerHTML = productsList;
}

function updateInventoryInsights(insights) {
    const listContainer = document.querySelector('#inventoryInsightsList');
    if (!listContainer || !insights.length) return;

    const insightsList = insights.map(item => `
        <li class="analytics-list-item">
            <div class="item-info">
                <div class="item-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="item-details">
                    <h4>${escapeHtml(item.name)}</h4>
                    <p>${item.status}</p>
                </div>
            </div>
            <div class="item-value">
                <div class="value">${item.quantity}</div>
                <div class="change">Stock level</div>
            </div>
        </li>
    `).join('');

    listContainer.innerHTML = insightsList;
}

function updateCustomerActivity(activities) {
    const listContainer = document.querySelector('#customerActivityList');
    if (!listContainer || !activities.length) return;

    const activitiesList = activities.map(activity => `
        <li class="analytics-list-item">
            <div class="item-info">
                <div class="item-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="item-details">
                    <h4>${escapeHtml(activity.customer)}</h4>
                    <p>${activity.action}</p>
                </div>
            </div>
            <div class="item-value">
                <div class="value">${activity.value}</div>
                <div class="change">${activity.time}</div>
            </div>
        </li>
    `).join('');

    listContainer.innerHTML = activitiesList;
}

function updateSalesTrends(trends) {
    const listContainer = document.querySelector('#salesTrendsList');
    if (!listContainer || !trends.length) return;

    const trendsList = trends.map(trend => `
        <li class="analytics-list-item">
            <div class="item-info">
                <div class="item-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="item-details">
                    <h4>${trend.period}</h4>
                    <p>${trend.category}</p>
                </div>
            </div>
            <div class="item-value">
                <div class="value">$${trend.revenue.toFixed(2)}</div>
                <div class="change ${trend.growth >= 0 ? '' : 'negative'}">
                    ${trend.growth >= 0 ? '+' : ''}${trend.growth}%
                </div>
            </div>
        </li>
    `).join('');

    listContainer.innerHTML = trendsList;
}

function showErrorMessage(message) {
    // Implementation depends on your UI components
    console.error(message);
    // You could show a toast notification or alert here
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
