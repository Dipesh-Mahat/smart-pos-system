// Analytics JavaScript for Smart POS Supplier Dashboard

class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.dateRange = {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            end: new Date()
        };

        // Sample analytics data
        this.analyticsData = {
            sales: {
                total: 47825.50,
                growth: 12.5,
                orders: 342,
                avgOrderValue: 139.84
            },
            products: {
                totalProducts: 247,
                topSelling: [
                    { name: 'Wireless Headphones', sales: 156, revenue: 7800 },
                    { name: 'Smartphone Case', sales: 134, revenue: 2680 },
                    { name: 'USB Cable', sales: 98, revenue: 980 },
                    { name: 'Power Bank', sales: 87, revenue: 2175 },
                    { name: 'Screen Protector', sales: 76, revenue: 380 }
                ]
            },
            customers: {
                total: 142,
                newCustomers: 18,
                retention: 85.5,
                avgLifetimeValue: 892.40
            },
            inventory: {
                turnoverRate: 4.2,
                lowStock: 12,
                outOfStock: 5,
                totalValue: 156450
            },
            revenue: {
                daily: [1250, 1380, 1420, 1180, 1650, 1480, 1750, 1920, 1680, 1450, 1550, 1680, 1820, 1750, 1650, 1480, 1750, 1920, 1680, 1450, 1550, 1680, 1820, 1750, 1650, 1480, 1750, 1920, 1680, 1450],
                monthly: [28500, 32100, 29800, 34500, 31200, 35800, 33400, 36900, 34200, 37500, 35100, 38200]
            },
            categories: {
                electronics: { sales: 245, revenue: 24500 },
                accessories: { sales: 187, revenue: 9350 },
                components: { sales: 89, revenue: 4450 },
                tools: { sales: 56, revenue: 2800 }
            }
        };

        this.init();
    }

    init() {
        this.renderOverviewCards();
        this.setupEventListeners();
        this.initializeCharts();
        this.renderTopProducts();
        this.renderRecentActivity();
    }

    setupEventListeners() {
        // Date range picker
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput && endDateInput) {
            startDateInput.value = this.formatDateForInput(this.dateRange.start);
            endDateInput.value = this.formatDateForInput(this.dateRange.end);

            startDateInput.addEventListener('change', () => this.updateDateRange());
            endDateInput.addEventListener('change', () => this.updateDateRange());
        }

        // Export buttons
        const exportBtn = document.getElementById('exportReport');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        // Period filters
        document.querySelectorAll('.period-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-filter').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setPeriod(e.target.dataset.period);
            });
        });

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
    }

    renderOverviewCards() {
        // Update overview statistics
        document.getElementById('totalRevenue').textContent = `$${this.analyticsData.sales.total.toLocaleString()}`;
        document.getElementById('revenueGrowth').textContent = `+${this.analyticsData.sales.growth}%`;
        
        document.getElementById('totalOrders').textContent = this.analyticsData.sales.orders;
        document.getElementById('avgOrderValue').textContent = `$${this.analyticsData.sales.avgOrderValue}`;
        
        document.getElementById('totalCustomers').textContent = this.analyticsData.customers.total;
        document.getElementById('newCustomers').textContent = this.analyticsData.customers.newCustomers;
        
        document.getElementById('inventoryValue').textContent = `$${this.analyticsData.inventory.totalValue.toLocaleString()}`;
        document.getElementById('turnoverRate').textContent = `${this.analyticsData.inventory.turnoverRate}x`;
    }

    initializeCharts() {
        this.createRevenueChart();
        this.createOrdersChart();
        this.createCustomersChart();
        this.createCategoryChart();
        this.createInventoryChart();
    }

    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const labels = this.generateDateLabels(30);
        
        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Revenue',
                    data: this.analyticsData.revenue.daily,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    createOrdersChart() {
        const ctx = document.getElementById('ordersChart');
        if (!ctx) return;

        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        this.charts.orders = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Monthly Orders',
                    data: [85, 92, 78, 105, 89, 112, 98, 125, 108, 135, 118, 142],
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createCustomersChart() {
        const ctx = document.getElementById('customersChart');
        if (!ctx) return;

        this.charts.customers = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['New Customers', 'Returning Customers'],
                datasets: [{
                    data: [this.analyticsData.customers.newCustomers, this.analyticsData.customers.total - this.analyticsData.customers.newCustomers],
                    backgroundColor: ['#f59e0b', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categories = Object.keys(this.analyticsData.categories);
        const revenues = categories.map(cat => this.analyticsData.categories[cat].revenue);

        this.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
                datasets: [{
                    data: revenues,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createInventoryChart() {
        const ctx = document.getElementById('inventoryChart');
        if (!ctx) return;

        this.charts.inventory = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['In Stock', 'Low Stock', 'Out of Stock'],
                datasets: [{
                    label: 'Inventory Status',
                    data: [
                        this.analyticsData.inventory.totalValue - (this.analyticsData.inventory.lowStock + this.analyticsData.inventory.outOfStock) * 1000,
                        this.analyticsData.inventory.lowStock * 1000,
                        this.analyticsData.inventory.outOfStock * 1000
                    ],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000) + 'k';
                            }
                        }
                    }
                }
            }
        });
    }

    renderTopProducts() {
        const container = document.getElementById('topProductsList');
        if (!container) return;

        container.innerHTML = this.analyticsData.products.topSelling.map((product, index) => `
            <div class="top-product-item">
                <div class="product-rank">${index + 1}</div>
                <div class="product-details">
                    <div class="product-name">${product.name}</div>
                    <div class="product-stats">
                        ${product.sales} sales • $${product.revenue.toLocaleString()} revenue
                    </div>
                </div>
                <div class="product-trend">
                    <i class="fas fa-arrow-up text-success"></i>
                </div>
            </div>
        `).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivityList');
        if (!container) return;

        const activities = [
            { type: 'sale', description: 'Order #1234 completed', amount: '$125.50', time: '2 minutes ago' },
            { type: 'inventory', description: 'Low stock alert: USB Cables', amount: '8 left', time: '15 minutes ago' },
            { type: 'customer', description: 'New customer registered', amount: 'John Doe', time: '1 hour ago' },
            { type: 'sale', description: 'Order #1233 completed', amount: '$89.99', time: '2 hours ago' },
            { type: 'inventory', description: 'Stock updated: Power Banks', amount: '+50 units', time: '3 hours ago' }
        ];

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
                <div class="activity-amount">${activity.amount}</div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            sale: 'shopping-cart',
            inventory: 'warehouse',
            customer: 'user',
            order: 'box'
        };
        return icons[type] || 'circle';
    }

    setPeriod(period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        this.dateRange.start = startDate;
        this.dateRange.end = now;

        // Update date inputs
        document.getElementById('startDate').value = this.formatDateForInput(startDate);
        document.getElementById('endDate').value = this.formatDateForInput(now);

        this.refreshAnalytics();
    }

    updateDateRange() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);

        if (startDate <= endDate) {
            this.dateRange.start = startDate;
            this.dateRange.end = endDate;
            this.refreshAnalytics();
        } else {
            this.showNotification('Start date must be before end date', 'error');
        }
    }

    refreshAnalytics() {
        // In a real application, this would fetch new data based on the date range
        this.renderOverviewCards();
        this.updateCharts();
        this.renderTopProducts();
        this.renderRecentActivity();
        this.showNotification('Analytics updated', 'success');
    }

    updateCharts() {
        // Update all charts with new data
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.update();
            }
        });
    }

    exportReport() {
        const reportData = {
            dateRange: {
                start: this.formatDate(this.dateRange.start),
                end: this.formatDate(this.dateRange.end)
            },
            overview: this.analyticsData.sales,
            topProducts: this.analyticsData.products.topSelling,
            customerMetrics: this.analyticsData.customers,
            inventoryMetrics: this.analyticsData.inventory
        };

        // Convert to CSV
        const csvContent = this.generateReportCSV(reportData);
        this.downloadCSV(csvContent, `analytics_report_${this.formatDateForFilename(new Date())}.csv`);
        this.showNotification('Report exported successfully', 'success');
    }

    generateReportCSV(data) {
        let csv = 'Analytics Report\n';
        csv += `Date Range:,${data.dateRange.start} to ${data.dateRange.end}\n\n`;
        
        csv += 'Overview\n';
        csv += 'Total Revenue,$' + data.overview.total + '\n';
        csv += 'Total Orders,' + data.overview.orders + '\n';
        csv += 'Average Order Value,$' + data.overview.avgOrderValue + '\n';
        csv += 'Growth Rate,' + data.overview.growth + '%\n\n';
        
        csv += 'Top Products\n';
        csv += 'Product Name,Sales,Revenue\n';
        data.topProducts.forEach(product => {
            csv += `${product.name},${product.sales},$${product.revenue}\n`;
        });
        
        csv += '\nCustomer Metrics\n';
        csv += 'Total Customers,' + data.customerMetrics.total + '\n';
        csv += 'New Customers,' + data.customerMetrics.newCustomers + '\n';
        csv += 'Retention Rate,' + data.customerMetrics.retention + '%\n';
        csv += 'Average Lifetime Value,$' + data.customerMetrics.avgLifetimeValue + '\n';

        return csv;
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

    generateDateLabels(days) {
        const labels = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            labels.push(date.getDate() + '/' + (date.getMonth() + 1));
        }
        
        return labels;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateForFilename(date) {
        return date.toISOString().split('T')[0].replace(/-/g, '');
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
}

// Initialize analytics manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.analyticsManager = new AnalyticsManager();
});
