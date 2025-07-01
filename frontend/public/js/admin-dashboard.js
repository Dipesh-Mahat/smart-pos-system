// Admin Dashboard Main Controller
class AdminDashboard {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.charts = {};
        this.currentFilter = 'all';
        this.currentStatus = 'all';
        this.searchQuery = '';
        this.currentPage = 1;
        this.usersPerPage = 5;
        this.totalPages = 1;
        this.systemHealth = {
            api: { status: 'online', details: 'Response time: 42ms' },
            database: { status: 'online', details: 'Queries: 1.5k/min' },
            memory: { status: 'warning', details: '76% utilized' },
            storage: { status: 'online', details: '48% utilized' }
        };
        
        this.init();
    }    async init() {
        try {
            await this.loadUsers();
            this.setupEventListeners();
            this.initializeCharts();
            this.updateStatistics();
            this.loadRecentActivity();
            this.startRealTimeUpdates();
            this.updateSystemHealth();
            this.setLastLoginTime();
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            this.showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadUsers() {
        try {
            // Fetch real user data from backend API
            const response = await fetch('/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            this.users = (data.users || []).map((user, idx) => ({
                id: user._id || idx + 1,
                name: user.firstName + ' ' + user.lastName,
                email: user.email,
                type: user.role,
                status: user.status,
                avatar: user.avatar || '../images/avatars/user-avatar.png',
                joinDate: user.createdAt,
                lastActive: user.updatedAt,
                revenue: user.revenue || 0,
                transactions: user.transactions || 0
            }));
        } catch (error) {
            this.showMessage('Failed to load users from server', 'error');
            this.users = [];
        }
        this.filteredUsers = [...this.users];
        this.renderUserTable();
    }

    setupEventListeners() {
        // Type filter
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.currentPage = 1; // Reset to first page on filter change
                this.filterUsers();
            });
        }
        
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatus = e.target.value;
                this.currentPage = 1; // Reset to first page on filter change
                this.filterUsers();
            });
        }
        
        // Search input
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.currentPage = 1; // Reset to first page on search
                this.filterUsers();
            });
        }
        
        // Pagination buttons
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderUserTable();
                    this.updatePaginationInfo();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.renderUserTable();
                    this.updatePaginationInfo();
                }
            });
        }
        
        // Load more activities button
        const loadMoreBtn = document.getElementById('loadMoreActivities');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreActivities();
            });
        }
        
        // Quick action buttons
        const exportBtn = document.querySelector('.quick-action-button[title="Export Reports"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showMessage('Generating export...', 'info');
                setTimeout(() => {
                    this.showMessage('Export downloaded successfully!', 'success');
                }, 1500);
            });
        }
        
        // Add user button in quick actions
        const addUserBtn = document.querySelector('.quick-action-button[title="Add New User"]');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                // In production, this would open a modal or redirect to user creation page
                this.showMessage('Add user functionality will be implemented soon', 'info');
            });
        }
        
        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const modal = document.getElementById('actionModal');
        const cancelBtn = document.getElementById('cancelAction');
        const confirmBtn = document.getElementById('confirmAction');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.executeUserAction();
            });
        }

        // Close modal on outside click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }
    }

    filterUsers() {
        this.filteredUsers = this.users.filter(user => {
            const matchesType = this.currentFilter === 'all' || user.type === this.currentFilter;
            const matchesStatus = this.currentStatus === 'all' || user.status === this.currentStatus;
            const matchesSearch = !this.searchQuery || 
                user.name.toLowerCase().includes(this.searchQuery) ||
                user.email.toLowerCase().includes(this.searchQuery);

            return matchesType && matchesStatus && matchesSearch;
        });

        // Calculate total pages
        this.totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage);
        
        // Make sure current page is valid
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }
        
        this.renderUserTable();
        this.updatePaginationInfo();
    }
    
    updatePaginationInfo() {
        const paginationInfo = document.getElementById('paginationInfo');
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        
        if (paginationInfo) {
            paginationInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
        
        if (prevPageBtn) {
            prevPageBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = this.currentPage >= this.totalPages;
        }
    }
    
    loadMoreActivities() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        // Generate some more mock activities
        const newActivities = [
            {
                type: 'system',
                icon: 'fa-server',
                title: 'System Update',
                description: 'Database optimization completed',
                time: '10 minutes ago'
            },
            {
                type: 'user-action',
                icon: 'fa-user-shield',
                title: 'Admin Action',
                description: 'System backup initiated by admin',
                time: '15 minutes ago'
            },
            {
                type: 'alert',
                icon: 'fa-exclamation-triangle',
                title: 'Warning Alert',
                description: 'High memory usage detected',
                time: '25 minutes ago'
            }
        ];
        
        // Create HTML for new activities
        const activitiesHTML = newActivities.map(activity => this.createActivityHTML(activity)).join('');
        
        // Append to activity list
        activityList.innerHTML += activitiesHTML;
        
        // Show message
        this.showMessage('Loaded more activities', 'success');
    }
    
    renderUserTable() {
        const tableBody = document.getElementById('userTableBody');
        if (!tableBody) return;

        // Clear existing content
        tableBody.innerHTML = '';

        if (this.filteredUsers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-users"></i>
                        <p>No users found matching the current filters</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Paginate results
        const start = (this.currentPage - 1) * this.usersPerPage;
        const end = start + this.usersPerPage;
        const paginatedUsers = this.filteredUsers.slice(start, end);

        const tableHTML = paginatedUsers.map(user => `
            <tr>
                <td>
                    <div class="user-info">                        <img src="${user.avatar}" alt="${user.name}" class="user-avatar" 
                             onerror="this.src='../images/avatars/user-avatar.png'">
                        <div class="user-details">
                            <h4>${user.name}</h4>
                            <p>${user.email}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="user-type ${user.type}">
                        ${user.type === 'shop-owner' ? 'Shop Owner' : 'Supplier'}
                    </span>
                </td>
                <td>
                    <span class="user-status ${user.status}">
                        ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                </td>
                <td>${this.formatDate(user.joinDate)}</td>
                <td>${this.formatDate(user.lastActive)}</td>
                <td>
                    <div class="action-buttons">
                        ${this.getUserActionButtons(user)}
                    </div>
                </td>
            </tr>
        `).join('');

        tableBody.innerHTML = tableHTML;
        this.attachActionListeners();
    }

    getUserActionButtons(user) {
        switch (user.status) {
            case 'active':
                return `
                    <button class="action-btn suspend" onclick="adminDashboard.showActionModal(${user.id}, 'suspend')">
                        Suspend
                    </button>
                    <button class="action-btn ban" onclick="adminDashboard.showActionModal(${user.id}, 'ban')">
                        Ban
                    </button>
                `;
            case 'suspended':
                return `
                    <button class="action-btn activate" onclick="adminDashboard.showActionModal(${user.id}, 'activate')">
                        Activate
                    </button>
                    <button class="action-btn ban" onclick="adminDashboard.showActionModal(${user.id}, 'ban')">
                        Ban
                    </button>
                `;
            case 'banned':
                return `
                    <button class="action-btn activate" onclick="adminDashboard.showActionModal(${user.id}, 'activate')">
                        Activate
                    </button>
                `;
            default:
                return '';
        }
    }

    attachActionListeners() {
        // Action buttons are handled by onclick attributes for simplicity
        // In production, you might want to use event delegation
    }

    showActionModal(userId, action) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modal = document.getElementById('actionModal');
        const title = document.getElementById('modalTitle');
        const message = document.getElementById('modalMessage');
        
        if (!modal || !title || !message) return;

        const actionText = {
            'ban': 'ban',
            'suspend': 'suspend',
            'activate': 'activate'
        };

        const actionMessages = {
            'ban': `This will permanently ban ${user.name} from the system. They will lose access to all services and data.`,
            'suspend': `This will temporarily suspend ${user.name}'s account. They can be reactivated later.`,
            'activate': `This will reactivate ${user.name}'s account and restore full access.`
        };

        title.textContent = `${actionText[action].charAt(0).toUpperCase() + actionText[action].slice(1)} User`;
        message.textContent = actionMessages[action];

        // Store action data for execution
        modal.dataset.userId = userId;
        modal.dataset.action = action;

        modal.classList.add('show');
    }

    hideModal() {
        const modal = document.getElementById('actionModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    async executeUserAction() {
        const modal = document.getElementById('actionModal');
        if (!modal) return;

        const userId = parseInt(modal.dataset.userId);
        const action = modal.dataset.action;
        const user = this.users.find(u => u.id === userId);

        if (!user) return;

        try {
            // Show loading state
            const confirmBtn = document.getElementById('confirmAction');
            confirmBtn.innerHTML = '<span class="loading"></span> Processing...';
            confirmBtn.disabled = true;

            // Simulate API call
            await this.simulateAPICall(1000);

            // Update user status
            switch (action) {
                case 'ban':
                    user.status = 'banned';
                    break;
                case 'suspend':
                    user.status = 'suspended';
                    break;
                case 'activate':
                    user.status = 'active';
                    break;
            }

            // Update UI
            this.renderUserTable();
            this.updateStatistics();
            this.hideModal();
            this.showMessage(`User ${action}ed successfully`, 'success');

            // Log activity
            this.logActivity('user-action', `${action}ed user: ${user.name}`, 'now');

        } catch (error) {
            console.error('Failed to execute user action:', error);
            this.showMessage('Failed to execute action', 'error');
        } finally {
            // Reset button state
            const confirmBtn = document.getElementById('confirmAction');
            confirmBtn.innerHTML = 'Confirm';
            confirmBtn.disabled = false;
        }
    }

    simulateAPICall(delay = 1000) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    updateStatistics() {
        const totalUsers = this.users.length;
        const shopOwners = this.users.filter(u => u.type === 'shop-owner').length;
        const suppliers = this.users.filter(u => u.type === 'supplier').length;
        const activeUsers = this.users.filter(u => u.status === 'active').length;
        const totalRevenue = this.users.reduce((sum, user) => sum + user.revenue, 0);
        const totalTransactions = this.users.reduce((sum, user) => sum + user.transactions, 0);

        // Update stat cards
        this.updateStatCard('totalUsers', totalUsers);
        this.updateStatCard('totalShopOwners', shopOwners);
        this.updateStatCard('totalSuppliers', suppliers);
        this.updateStatCard('totalTransactions', totalTransactions);
        this.updateStatCard('totalRevenue', `$${totalRevenue.toLocaleString()}`);

        // Update menu badges
        if (window.adminMenu) {
            window.adminMenu.updateUserCounts(shopOwners, suppliers, totalUsers);
        }
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }    initializeCharts() {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }
        
        try {
            this.initUserGrowthChart();
            this.initRevenueChart();
            this.initUserDistributionChart();
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }    async initUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) {
            console.warn('User growth chart canvas not found');
            return;
        }
        try {
            // Fetch real user growth data from backend
            const res = await fetch('/api/users/admin/user-growth', {
                headers: { 'Authorization': `Bearer ${window.localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch user growth data');
            const data = await res.json();
            this.charts.userGrowth = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        {
                            label: 'Total Users',
                            data: data.datasets[0].data,
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Shop Owners',
                            data: data.datasets[1].data,
                            borderColor: '#2ecc71',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Suppliers',
                            data: data.datasets[2].data,
                            borderColor: '#9b59b6',
                            backgroundColor: 'rgba(155, 89, 182, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'User Growth Over Time' }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            });
        } catch (error) {
            console.error('Error creating user growth chart:', error);
        }
    }

    async initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        try {
            // Fetch real monthly revenue data from backend
            const res = await fetch('/api/users/admin/monthly-revenue', {
                headers: { 'Authorization': `Bearer ${window.localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch monthly revenue data');
            const data = await res.json();
            this.charts.revenue = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Revenue ($)',
                        data: data.data,
                        backgroundColor: [
                            'rgba(52, 152, 219, 0.8)',
                            'rgba(46, 204, 113, 0.8)',
                            'rgba(155, 89, 182, 0.8)',
                            'rgba(241, 196, 15, 0.8)',
                            'rgba(230, 126, 34, 0.8)',
                            'rgba(231, 76, 60, 0.8)'
                        ],
                        borderColor: [
                            '#3498db',
                            '#2ecc71',
                            '#9b59b6',
                            '#f1c40f',
                            '#e67e22',
                            '#e74c3c'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Monthly Revenue' }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating revenue chart:', error);
        }
    }

    async initUserDistributionChart() {
        const ctx = document.getElementById('userDistributionChart');
        if (!ctx) return;
        try {
            // Fetch real user distribution data from backend
            const res = await fetch('/api/users/admin/user-distribution', {
                headers: { 'Authorization': `Bearer ${window.localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch user distribution data');
            const data = await res.json();
            this.charts.userDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.data,
                        backgroundColor: [
                            '#3498db',
                            '#9b59b6'
                        ],
                        borderColor: [
                            '#2980b9',
                            '#8e44ad'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1.5,
                    plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: 'User Distribution' }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating user distribution chart:', error);
        }
    }

    loadRecentActivity() {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        const activities = [
            {
                type: 'user-action',
                icon: 'fas fa-user-times',
                title: 'User Suspended',
                description: 'Suspended user: Mike Wilson for policy violation',
                time: '5 minutes ago',
                iconClass: 'user-action'
            },
            {
                type: 'system-action',
                icon: 'fas fa-database',
                title: 'Database Backup',
                description: 'Automated database backup completed successfully',
                time: '1 hour ago',
                iconClass: 'system-action'
            },
            {
                type: 'transaction',
                icon: 'fas fa-dollar-sign',
                title: 'Large Transaction',
                description: 'Transaction of $15,000 processed for Fresh Foods Co.',
                time: '2 hours ago',
                iconClass: 'transaction'
            },
            {
                type: 'user-action',
                icon: 'fas fa-user-plus',
                title: 'New Registration',
                description: 'New supplier registered: Premium Grocers Ltd.',
                time: '3 hours ago',
                iconClass: 'user-action'
            }
        ];

        const activityHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.iconClass}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('');

        activityList.innerHTML = activityHTML;
    }

    logActivity(type, description, time) {
        // Add new activity to the beginning of the list
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        const iconMap = {
            'user-action': 'fas fa-user-cog',
            'system-action': 'fas fa-cogs',
            'transaction': 'fas fa-dollar-sign'
        };

        const newActivity = document.createElement('div');
        newActivity.className = 'activity-item';
        newActivity.innerHTML = `
            <div class="activity-icon ${type}">
                <i class="${iconMap[type] || 'fas fa-info-circle'}"></i>
            </div>
            <div class="activity-content">
                <h4>Admin Action</h4>
                <p>${description}</p>
            </div>
            <div class="activity-time">${time}</div>
        `;

        activityList.insertBefore(newActivity, activityList.firstChild);

        // Remove oldest item if more than 10 activities
        const items = activityList.querySelectorAll('.activity-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
    }

    startRealTimeUpdates() {
        // Update statistics every 30 seconds
        setInterval(() => {
            this.updateStatistics();
        }, 30000);

        // Simulate real-time activity updates
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every minute
                this.simulateRandomActivity();
            }
        }, 60000);
    }

    simulateRandomActivity() {
        const activities = [
            'New user registration detected',
            'Payment processed successfully',
            'System health check completed',
            'User logged in from new device',
            'Inventory update synchronized'
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        this.logActivity('system-action', randomActivity, 'just now');
    }

    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('adminMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'adminMessage';
            messageEl.className = 'message';
            document.querySelector('.main-content').insertBefore(
                messageEl, 
                document.querySelector('.dashboard-content')
            );
        }

        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        messageEl.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    updateSystemHealth() {
        // In production, this would be an API call to get system health metrics
        const refreshBtn = document.querySelector('.system-health-section .fa-sync-alt');
        if (refreshBtn) {
            refreshBtn.parentElement.addEventListener('click', () => {
                refreshBtn.classList.add('fa-spin');
                setTimeout(() => {
                    // Simulate system health update
                    this.systemHealth.memory.status = Math.random() > 0.7 ? 'warning' : 'online';
                    this.systemHealth.memory.details = `${Math.floor(65 + Math.random() * 20)}% utilized`;
                    
                    this.updateSystemHealthDisplay();
                    refreshBtn.classList.remove('fa-spin');
                    this.showMessage('System health updated', 'success');
                }, 1000);
            });
        }
        
        this.updateSystemHealthDisplay();
    }
    
    updateSystemHealthDisplay() {
        const statusElements = {
            api: document.querySelector('.health-card:nth-child(1) .status-indicator'),
            database: document.querySelector('.health-card:nth-child(2) .status-indicator'),
            memory: document.querySelector('.health-card:nth-child(3) .status-indicator'),
            storage: document.querySelector('.health-card:nth-child(4) .status-indicator')
        };
        
        const statusTextElements = {
            api: document.querySelector('.health-card:nth-child(1) .status-text'),
            database: document.querySelector('.health-card:nth-child(2) .status-text'),
            memory: document.querySelector('.health-card:nth-child(3) .status-text'),
            storage: document.querySelector('.health-card:nth-child(4) .status-text')
        };
        
        const detailElements = {
            api: document.querySelector('.health-card:nth-child(1) .health-details'),
            database: document.querySelector('.health-card:nth-child(2) .health-details'),
            memory: document.querySelector('.health-card:nth-child(3) .health-details'),
            storage: document.querySelector('.health-card:nth-child(4) .status-text')
        };
        
        const iconElements = {
            api: document.querySelector('.health-card:nth-child(1) .health-icon'),
            database: document.querySelector('.health-card:nth-child(2) .health-icon'),
            memory: document.querySelector('.health-card:nth-child(3) .health-icon'),
            storage: document.querySelector('.health-card:nth-child(4) .health-icon')
        };
        
        for (const [key, data] of Object.entries(this.systemHealth)) {
            if (statusElements[key]) {
                // Update status indicator
                statusElements[key].className = `status-indicator ${data.status}`;
                
                // Update status text
                if (statusTextElements[key]) {
                    statusTextElements[key].textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
                }
                
                // Update details
                if (detailElements[key]) {
                    detailElements[key].textContent = data.details;
                }
                
                // Update icon
                if (iconElements[key]) {
                    iconElements[key].className = `health-icon ${data.status === 'online' ? 'healthy' : data.status}`;
                }
            }
        }
    }
    
    setLastLoginTime() {
        const lastLoginElement = document.getElementById('lastLoginTime');
        if (lastLoginElement) {
            // In production, this would come from the user's session data
            const now = new Date();
            const options = { 
                hour: 'numeric', 
                minute: 'numeric',
                hour12: true
            };
            lastLoginElement.textContent = `Today, ${now.toLocaleTimeString('en-US', options)}`;
        }
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for DOM to be fully ready
    setTimeout(() => {
        try {
            // Initialize navbar only (no menu sidebar)
            window.adminNavbar = new AdminNavbar();
            
            // Wait a bit more for components to render
            setTimeout(() => {
                window.adminDashboard = new AdminDashboard();
            }, 200);
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
        }
    }, 100);
});
