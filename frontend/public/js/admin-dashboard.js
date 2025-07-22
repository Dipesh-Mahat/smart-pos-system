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
        
        this.checkAuthentication();
        this.init();
    }

    // Check if user is authenticated as admin
    checkAuthentication() {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        
        if (!token || userRole !== 'admin') {
            // Redirect to login page or show login modal
            this.showLoginModal();
            return false;
        }
        return true;
    }

    // Show admin login modal
    showLoginModal() {
        // Add blur to background content only
        const container = document.querySelector('.container');
        if (container) {
            container.style.filter = 'blur(8px)';
            container.style.pointerEvents = 'none';
        }

        const modal = document.createElement('div');
        modal.className = 'admin-login-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-overlay">
                <div class="login-modal-content">
                    <div class="login-brand">
                        <img src="../images/logos/smart-pos-logo.png" alt="Smart POS" class="login-logo">
                        <h1>Smart POS Admin</h1>
                    </div>
                    <div class="login-header">
                        <h2>Admin Portal</h2>
                        <p>Sign in to access the administrative dashboard</p>
                    </div>
                    <form id="adminLoginForm" class="admin-login-form">
                        <div class="form-group">
                            <div class="input-wrapper">
                                <i class="fas fa-envelope input-icon"></i>
                                <input type="email" id="adminEmail" required placeholder="Email Address" autocomplete="email">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="input-wrapper">
                                <i class="fas fa-lock input-icon"></i>
                                <input type="password" id="adminPassword" required placeholder="Password" autocomplete="current-password">
                                <button type="button" class="password-toggle" onclick="this.previousElementSibling.type = this.previousElementSibling.type === 'password' ? 'text' : 'password'; this.innerHTML = this.previousElementSibling.type === 'password' ? '<i class=\\'fas fa-eye\\'></i>' : '<i class=\\'fas fa-eye-slash\\'></i>'">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <button type="submit" class="login-btn">
                            <span class="btn-text">
                                <i class="fas fa-sign-in-alt"></i>
                                Access Admin Dashboard
                            </span>
                            <span class="btn-loading" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i>
                                Authenticating...
                            </span>
                        </button>
                        <div class="login-footer">
                            <div class="security-notice">
                                <i class="fas fa-shield-alt"></i>
                                <span>Secure Admin Access (Bypass Mode)</span>
                            </div>
                        </div>
                    </form>
                    <div id="loginError" class="error-message" style="display: none;"></div>
                </div>
            </div>
        `;

        // Add styles with enhanced blur effect
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#adminLoginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAdminLogin(form, modal);
        });
    }

    // Handle admin login - BYPASS MODE (No server authentication)
    async handleAdminLogin(form, modal) {
        const email = form.querySelector('#adminEmail').value.trim();
        const password = form.querySelector('#adminPassword').value;
        const submitBtn = form.querySelector('.login-btn');
        const errorDiv = modal.querySelector('#loginError');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        // Basic validation
        if (!email || !password) {
            errorDiv.textContent = 'Please enter both email and password';
            errorDiv.style.display = 'block';
            return;
        }

        // Show loading state briefly for UX
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;
        errorDiv.style.display = 'none';

        // Simulate loading for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // BYPASS: Grant access to anyone with any credentials
            // This bypasses all server authentication
            const mockUser = {
                id: 'admin-001',
                email: email,
                firstName: 'System',
                lastName: 'Administrator',
                role: 'admin',
                username: 'admin'
            };

            const mockToken = 'bypass-admin-token-' + Date.now();

            // Store admin token and user info (bypass mode)
            localStorage.setItem('adminToken', mockToken);
            localStorage.setItem('authToken', mockToken);
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('adminUser', JSON.stringify(mockUser));

            // Remove blur and modal
            const container = document.querySelector('.container');
            if (container) {
                container.style.filter = 'none';
                container.style.pointerEvents = 'auto';
            }
            modal.remove();
            
            this.showMessage('Welcome back, Admin! (Bypass Mode)', 'success');
            
            // Re-initialize dashboard with proper auth
            window.location.reload();
            return true;

        } catch (error) {
            console.error('Admin login error:', error);
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        } finally {
            // Reset button state
            btnText.style.display = 'flex';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    async init() {
        try {
            await this.loadUsers();
            await this.loadDashboardStats(); // Load real stats from database
            await this.loadTransactionStats(); // Load transaction stats
            this.setupEventListeners();
            this.initializeCharts();
            this.updateStatistics();
            this.loadRecentActivity();
            this.startRealTimeUpdates();
            this.updateSystemHealth();
            this.setLastLoginTime();
            this.loadPendingSuppliers(); // Load pending supplier applications
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            this.showMessage('Failed to load dashboard data', 'error');
        }
    }

    async loadUsers() {
        try {
            // Show loading state
            const userTableBody = document.getElementById('userTableBody');
            if (userTableBody) {
                userTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading users...</td></tr>';
            }

            // Fetch real user data from backend API
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized access. Please login again.');
                }
                throw new Error(`Failed to fetch users: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.users) {
                this.users = data.users.map((user) => ({
                    id: user._id,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
                    email: user.email,
                    type: user.role === 'shopowner' ? 'shop-owner' : user.role,
                    status: user.status || 'active',
                    joinDate: new Date(user.createdAt || Date.now()).toLocaleDateString(),
                    lastActive: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
                    shopName: user.shopName,
                    businessName: user.businessName,
                    phone: user.phone || user.contactNumber,
                    avatar: user.avatar || '../images/avatars/user-avatar.png'
                }));

                // Update statistics
                this.updateRealTimeStatistics();
            } else {
                throw new Error('Invalid response format');
            }

        } catch (error) {
            console.error('Failed to load users:', error);
            this.showMessage(error.message || 'Failed to load users', 'error');
            
            // Show error in table
            const userTableBody = document.getElementById('userTableBody');
            if (userTableBody) {
                userTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center error">
                            <i class="fas fa-exclamation-circle"></i> 
                            Error loading users: ${error.message}
                            <br>
                            <button onclick="adminDashboard.loadUsers()" class="btn-retry">
                                <i class="fas fa-refresh"></i> Retry
                            </button>
                        </td>
                    </tr>
                `;
            }
        }
        this.filteredUsers = [...this.users];
        this.renderUserTable();
    }

    // Update statistics from real data
    updateRealTimeStatistics() {
        const totalUsers = this.users.length;
        const shopOwners = this.users.filter(u => u.type === 'shop-owner').length;
        const suppliers = this.users.filter(u => u.type === 'supplier').length;

        // Update DOM elements
        const totalUsersEl = document.getElementById('totalUsers');
        const totalShopOwnersEl = document.getElementById('totalShopOwners');
        const totalSuppliersEl = document.getElementById('totalSuppliers');

        if (totalUsersEl) totalUsersEl.textContent = totalUsers.toLocaleString();
        if (totalShopOwnersEl) totalShopOwnersEl.textContent = shopOwners.toLocaleString();
        if (totalSuppliersEl) totalSuppliersEl.textContent = suppliers.toLocaleString();
    }

    // Load real statistics from database
    async loadDashboardStats() {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch('/api/admin/dashboard-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Update stat cards with real data
                this.updateStatCard('totalUsers', data.stats.totalUsers || 0);
                this.updateStatCard('totalShopOwners', data.stats.totalShopOwners || 0);
                this.updateStatCard('totalSuppliers', data.stats.totalSuppliers || 0);
                this.updateStatCard('totalTransactions', data.stats.totalTransactions || 0);
                this.updateStatCard('totalRevenue', `Rs. ${(data.stats.totalRevenue || 0).toLocaleString()}`);
                this.updateStatCard('totalProducts', data.stats.totalProducts || 0);
                this.updateStatCard('totalOrders', data.stats.totalOrders || 0);
                this.updateStatCard('totalCustomers', data.stats.totalCustomers || 0);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            // Fallback to calculating from users data
            this.updateStatistics();
        }
    }

    // Load real transactions data
    async loadTransactionStats() {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch('/api/admin/transaction-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update transaction statistics
                    this.updateStatCard('monthlyRevenue', `Rs. ${(data.stats.monthlyRevenue || 0).toLocaleString()}`);
                    this.updateStatCard('dailyTransactions', data.stats.dailyTransactions || 0);
                    this.updateStatCard('averageOrderValue', `Rs. ${(data.stats.averageOrderValue || 0).toLocaleString()}`);
                }
            }
        } catch (error) {
            console.error('Failed to load transaction stats:', error);
        }
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
                this.exportReports();
            });
        }

        // System Settings button
        const settingsBtn = document.querySelector('.quick-action-button[title="System Settings"]');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSystemSettings();
            });
        }

        // Security Logs button
        const securityBtn = document.querySelector('.quick-action-button[title="Security Logs"]');
        if (securityBtn) {
            securityBtn.addEventListener('click', () => {
                this.viewSecurityLogs();
            });
        }
        
        // Add user button in quick actions
        const addUserBtn = document.querySelector('.quick-action-button[title="Add New User"]');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.openAddUserModal();
            });
        }

        // SECTION ACTION BUTTONS
        
        // System Health Section
        const refreshStatusBtn = document.querySelector('.system-health-section .section-action[title="Refresh Status"]');
        if (refreshStatusBtn) {
            refreshStatusBtn.addEventListener('click', () => {
                this.refreshSystemStatus();
            });
        }
        
        const viewLogsBtn = document.querySelector('.system-health-section .section-action[title="View Detailed Logs"]');
        if (viewLogsBtn) {
            viewLogsBtn.addEventListener('click', () => {
                this.viewDetailedLogs();
            });
        }
        
        // User Management Section
        const exportUsersBtn = document.querySelector('.user-management-section .section-action[title="Export Users"]');
        if (exportUsersBtn) {
            exportUsersBtn.addEventListener('click', () => {
                this.exportUsers();
            });
        }
        
        const addNewUserBtn = document.querySelector('.user-management-section .section-action[title="Add New User"]');
        if (addNewUserBtn) {
            addNewUserBtn.addEventListener('click', () => {
                this.openAddUserModal();
            });
        }
        
        const userSettingsBtn = document.querySelector('.user-management-section .section-action[title="User Settings"]');
        if (userSettingsBtn) {
            userSettingsBtn.addEventListener('click', () => {
                this.openUserSettings();
            });
        }
        
        // Supplier Management Section
        const viewAllSuppliersBtn = document.querySelector('.supplier-management-section .section-action[title="View All Suppliers"]');
        if (viewAllSuppliersBtn) {
            viewAllSuppliersBtn.addEventListener('click', () => {
                this.viewAllSuppliers();
            });
        }
        
        // Activity Section
        const filterActivitiesBtn = document.querySelector('.activity-section .section-action[title="Filter Activities"]');
        if (filterActivitiesBtn) {
            filterActivitiesBtn.addEventListener('click', () => {
                this.filterActivities();
            });
        }
        
        const viewAllActivitiesBtn = document.querySelector('.activity-section .section-action[title="View All Activities"]');
        if (viewAllActivitiesBtn) {
            viewAllActivitiesBtn.addEventListener('click', () => {
                this.viewAllActivities();
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

        const userId = modal.dataset.userId;
        const action = modal.dataset.action;
        const user = this.users.find(u => u.id == userId);
        if (!user) return;

        try {
            // Show loading state
            const confirmBtn = document.getElementById('confirmAction');
            confirmBtn.innerHTML = '<span class="loading"></span> Processing...';
            confirmBtn.disabled = true;

            // Real API call to backend
            const response = await fetch('/api/users/admin/bulk-action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ userIds: [user.id], action })
            });
            if (!response.ok) throw new Error('Failed to execute action');

            // Update user status locally
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

            this.renderUserTable();
            this.updateStatistics();
            this.hideModal();
            this.showMessage(`User ${action}d successfully`, 'success');
            this.logActivity('user-action', `${action}d user: ${user.name}`, 'now');
        } catch (error) {
            console.error('Failed to execute user action:', error);
            this.showMessage('Failed to execute action', 'error');
        } finally {
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

    // Fetch and display audit logs
    async loadAuditLogs() {
        try {
            const response = await fetch('/api/users/admin/audit-logs', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            const data = await response.json();
            // Render logs in the UI (implement renderAuditLogs)
            this.renderAuditLogs(data.logs);
        } catch (error) {
            this.showMessage('Failed to load audit logs', 'error');
        }
    }

    // Fetch and display system health
    async updateSystemHealth() {
        try {
            const response = await fetch('/api/users/admin/system-health', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch system health');
            const data = await response.json();
            // Render health in the UI (implement renderSystemHealth)
            this.renderSystemHealth(data.health);
        } catch (error) {
            this.showMessage('Failed to load system health', 'error');
        }
    }

    // Fetch and display activity logs
    async loadRecentActivity() {
        try {
            const response = await fetch('/api/users/admin/activity-logs', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch activity logs');
            const data = await response.json();
            // Render activities in the UI (implement renderActivityLogs)
            this.renderActivityLogs(data.logs);
        } catch (error) {
            this.showMessage('Failed to load activity logs', 'error');
        }
    }

    // Load recent activity from the server
    async loadRecentActivity() {
        try {
            const activityList = document.getElementById('activityList');
            if (!activityList) return;
            
            activityList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading activity...</div>';
            
            // Fetch real activity data from API
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch('/api/admin/recent-activity', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch activities: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.activities && data.activities.length > 0) {
                // Render activities
                activityList.innerHTML = data.activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon ${activity.type}">
                            <i class="${this.getActivityIcon(activity.type)}"></i>
                        </div>
                        <div class="activity-content">
                            <p class="activity-text">${activity.text}</p>
                            <span class="activity-time">${activity.formattedTime}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                // No activities found
                activityList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>No recent activity</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load activities:', error);
            const activityList = document.getElementById('activityList');
            if (activityList) {
                activityList.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error loading activities</p>
                        <button onclick="adminDashboard.loadRecentActivity()" class="btn-retry">Try Again</button>
                    </div>
                `;
            }
        }
    }

    logActivity(type, description, time) {
        // Add new activity to the beginning of the list
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        const iconMap = this.getActivityIcon(type);

        const newActivity = document.createElement('div');
        newActivity.className = 'activity-item';
        newActivity.innerHTML = `
            <div class="activity-icon ${type}">
                <i class="${iconMap}"></i>
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

    // Get appropriate icon for activity type
    getActivityIcon(type) {
        const icons = {
            'login': 'fas fa-sign-in-alt',
            'user': 'fas fa-user',
            'transaction': 'fas fa-money-bill-wave',
            'system': 'fas fa-server',
            'security': 'fas fa-shield-alt',
            'user-action': 'fas fa-user-cog',
            'system-action': 'fas fa-cogs'
        };
        
        return icons[type] || 'fas fa-info-circle';
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

    async updateSystemHealth() {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch('/admin/system-health', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.health) {
                    this.systemHealth = {
                        api: { status: data.health.api, details: 'API is running' },
                        database: { status: data.health.database, details: 'Database connected' },
                        memory: { 
                            status: data.health.memory.heapUsed > (data.health.memory.heapTotal * 0.8) ? 'warning' : 'online',
                            details: `${Math.round((data.health.memory.heapUsed / data.health.memory.heapTotal) * 100)}% utilized`
                        },
                        storage: { status: 'online', details: data.health.storage }
                    };
                }
            }
        } catch (error) {
            console.error('Failed to fetch system health:', error);
            // Use default values if API fails
            this.systemHealth = {
                api: { status: 'warning', details: 'API check failed' },
                database: { status: 'warning', details: 'Database check failed' },
                memory: { status: 'warning', details: 'Memory check failed' },
                storage: { status: 'warning', details: 'Storage check failed' }
            };
        }

        // Setup refresh button
        const refreshBtn = document.querySelector('.system-health-section .fa-sync-alt');
        if (refreshBtn && !refreshBtn.hasAttribute('data-listener')) {
            refreshBtn.setAttribute('data-listener', 'true');
            refreshBtn.parentElement.addEventListener('click', async () => {
                refreshBtn.classList.add('fa-spin');
                await this.updateSystemHealth();
                refreshBtn.classList.remove('fa-spin');
                this.showMessage('System health updated', 'success');
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

    // Export Reports functionality
    async exportReports() {
        try {
            this.showMessage('Generating export...', 'info');
            
            // Simulate export generation
            const exportData = {
                users: this.users,
                stats: {
                    totalUsers: this.users.length,
                    shopOwners: this.users.filter(u => u.type === 'shop-owner').length,
                    suppliers: this.users.filter(u => u.type === 'supplier').length
                },
                timestamp: new Date().toISOString()
            };

            // Convert to CSV format
            const csvContent = this.convertToCSV(exportData.users);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `admin-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showMessage('Export downloaded successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showMessage('Export failed. Please try again.', 'error');
        }
    }

    convertToCSV(data) {
        const headers = ['Name', 'Email', 'Type', 'Status', 'Join Date', 'Last Active'];
        const csvRows = [headers.join(',')];
        
        data.forEach(user => {
            const row = [
                user.name || 'N/A',
                user.email || 'N/A',
                user.type || 'N/A',
                user.status || 'N/A',
                user.joinDate || 'N/A',
                user.lastActive || 'N/A'
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    // System Settings functionality
    openSystemSettings() {
        this.showMessage('Opening system settings...', 'info');
        // In a real app, this would open settings panel or navigate to settings page
        setTimeout(() => {
            this.showMessage('System settings panel will be implemented in next version', 'info');
        }, 1000);
    }

    // Security Logs functionality
    viewSecurityLogs() {
        this.showMessage('Loading security logs...', 'info');
        // In a real app, this would show security audit logs
        setTimeout(() => {
            this.showMessage('Security logs viewer will be implemented in next version', 'info');
        }, 1000);
    }

    // Add User Modal functionality
    openAddUserModal() {
        // Create and show add user modal
        const modalHTML = `
            <div class="admin-modal" id="addUserModal">
                <div class="modal-backdrop"></div>
                <div class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Add New User</h3>
                            <button class="modal-close" onclick="document.getElementById('addUserModal').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="addUserForm" class="add-user-form">
                            <div class="form-group">
                                <label for="firstName">First Name</label>
                                <input type="text" id="firstName" required>
                            </div>
                            <div class="form-group">
                                <label for="lastName">Last Name</label>
                                <input type="text" id="lastName" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" required>
                            </div>
                            <div class="form-group">
                                <label for="role">Role</label>
                                <select id="role" required>
                                    <option value="shopowner">Shop Owner</option>
                                    <option value="supplier">Supplier</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input type="password" id="password" required>
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('addUserModal').remove()">
                                    Cancel
                                </button>
                                <button type="submit" class="btn-primary">
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add form submit handler
        const form = document.getElementById('addUserForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUser(form);
        });
    }

    async handleAddUser(form) {
        try {
            const formData = new FormData(form);
            const userData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                role: formData.get('role'),
                password: formData.get('password')
            };

            this.showMessage('Creating user...', 'info');
            
            // In a real app, this would send to backend
            // For now, just simulate success
            setTimeout(() => {
                this.showMessage('User created successfully!', 'success');
                document.getElementById('addUserModal').remove();
                this.loadUsers(); // Reload users
            }, 1500);

        } catch (error) {
            console.error('Add user error:', error);
            this.showMessage('Failed to create user', 'error');
        }
    }

    // Load recent activity
    loadRecentActivity() {
        try {
            const activityList = document.getElementById('activityList');
            if (!activityList) return;
            
            activityList.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading activity...</div>';
            
            // Generate mock activities for demonstration
            const activities = [
                {
                    type: 'login',
                    text: 'System Administrator logged in from 192.168.1.105',
                    time: '2 minutes ago'
                },
                {
                    type: 'user',
                    text: 'New shop owner account created: Smart Electronics Shop',
                    time: '15 minutes ago'
                },
                {
                    type: 'transaction',
                    text: 'Large transaction processed: Rs. 75,500',
                    time: '1 hour ago'
                },
                {
                    type: 'security',
                    text: 'Failed login attempt for admin@smartpos.com',
                    time: '3 hours ago'
                },
                {
                    type: 'system',
                    text: 'System backup completed successfully',
                    time: 'Yesterday, 2:45 PM'
                },
                {
                    type: 'user',
                    text: 'User status changed: TechSupplier (Approved)',
                    time: 'Yesterday, 11:30 AM'
                },
                {
                    type: 'security',
                    text: 'Password reset for user: john.doe@example.com',
                    time: '2 days ago'
                }
            ];
            
            if (activities.length === 0) {
                activityList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>No recent activity</p>
                    </div>
                `;
                return;
            }
            
            // Render activities
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="${this.getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-text">${activity.text}</p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Failed to load activities:', error);
            const activityList = document.getElementById('activityList');
            if (activityList) {
                activityList.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error loading activities</p>
                        <button onclick="adminDashboard.loadRecentActivity()" class="btn-retry">Try Again</button>
                    </div>
                `;
            }
        }
    }
    
    // Get appropriate icon for activity type
    getActivityIcon(type) {
        const icons = {
            login: 'fas fa-sign-in-alt',
            user: 'fas fa-user',
            transaction: 'fas fa-money-bill-wave',
            system: 'fas fa-server',
            security: 'fas fa-shield-alt'
        };
        
        return icons[type] || 'fas fa-info-circle';
    }
    
    // Load more activities
    // Load more activities from server
    async loadMoreActivities() {
        try {
            const activityList = document.getElementById('activityList');
            if (!activityList) return;
            
            // Get current activity count to use as offset
            const currentActivities = activityList.querySelectorAll('.activity-item').length;
            
            // Show loading indicator at the end of the list
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading more...';
            activityList.appendChild(loadingIndicator);
            
            // Fetch more activities from server with offset
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch(`/api/admin/recent-activity?offset=${currentActivities}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Remove loading indicator
            loadingIndicator.remove();
            
            if (!response.ok) {
                throw new Error(`Failed to fetch more activities: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.activities && data.activities.length > 0) {
                // Add more activities to the list
                const activityHTML = data.activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon ${activity.type}">
                            <i class="${this.getActivityIcon(activity.type)}"></i>
                        </div>
                        <div class="activity-content">
                            <p class="activity-text">${activity.text}</p>
                            <span class="activity-time">${activity.formattedTime}</span>
                        </div>
                    </div>
                `).join('');
                
                activityList.insertAdjacentHTML('beforeend', activityHTML);
                
                // If we got fewer activities than requested, there are no more
                if (data.activities.length < 10) {
                    const loadMoreBtn = document.getElementById('loadMoreActivities');
                    if (loadMoreBtn) {
                        loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> All activities loaded';
                        loadMoreBtn.disabled = true;
                    }
                }
            } else {
                // No more activities
                const loadMoreBtn = document.getElementById('loadMoreActivities');
                if (loadMoreBtn) {
                    loadMoreBtn.innerHTML = '<i class="fas fa-check"></i> No more activities';
                    loadMoreBtn.disabled = true;
                }
            }
        } catch (error) {
            console.error('Failed to load more activities:', error);
            this.showMessage('Failed to load more activities', 'error');
            
            // Reset button state
            const loadMoreBtn = document.getElementById('loadMoreActivities');
            if (loadMoreBtn) {
                loadMoreBtn.innerHTML = '<i class="fas fa-redo"></i> Try loading more';
                loadMoreBtn.disabled = false;
            }
        }
    }
    
    // Export Users functionality
    exportUsers() {
        try {
            this.showMessage('Generating user export...', 'info');
            
            // Convert to CSV format
            const csvContent = this.convertToCSV(this.users);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `user-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showMessage('User data exported successfully!', 'success');
        } catch (error) {
            console.error('Export users error:', error);
            this.showMessage('Failed to export users', 'error');
        }
    }

    // View all suppliers functionality
    viewAllSuppliers() {
        // Set filter to show only suppliers
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.value = 'supplier';
            this.currentFilter = 'supplier';
            this.currentPage = 1; // Reset to first page
            this.filterUsers();
        }
        
        // Scroll to user management section
        const userSection = document.querySelector('.user-management-section');
        if (userSection) {
            userSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // View all activities functionality
    viewAllActivities() {
        this.showMessage('Loading all activities...', 'info');
        setTimeout(() => {
            this.showMessage('Activities view will be implemented in next version', 'info');
        }, 1000);
    }

    // User settings functionality
    openUserSettings() {
        this.showMessage('Opening user settings...', 'info');
        setTimeout(() => {
            this.showMessage('User settings panel will be implemented in next version', 'info');
        }, 1000);
    }

    // Filter activities functionality
    filterActivities() {
        this.showMessage('Opening activity filters...', 'info');
        setTimeout(() => {
            this.showMessage('Activity filters will be implemented in next version', 'info');
        }, 1000);
    }

    // Refresh status functionality for system health
    refreshSystemStatus() {
        this.showMessage('Refreshing system status...', 'info');
        
        // Simulate refreshing system health
        setTimeout(() => {
            // Update health cards with random data
            const apiResponseTime = Math.floor(Math.random() * 100) + 20;
            const dbQueriesPerMin = Math.floor(Math.random() * 2000) + 500;
            const memoryUsage = Math.floor(Math.random() * 30) + 60;
            const storageUsage = Math.floor(Math.random() * 30) + 30;
            
            const healthCards = document.querySelectorAll('.health-card');
            if (healthCards.length > 0) {
                // API Server
                const apiCard = healthCards[0];
                apiCard.querySelector('.health-details').textContent = `Response time: ${apiResponseTime}ms`;
                
                // Database
                const dbCard = healthCards[1];
                dbCard.querySelector('.health-details').textContent = `Queries: ${dbQueriesPerMin}/min`;
                
                // Memory
                const memoryCard = healthCards[2];
                memoryCard.querySelector('.health-details').textContent = `${memoryUsage}% utilized`;
                
                // Storage
                const storageCard = healthCards[3];
                storageCard.querySelector('.health-details').textContent = `${storageUsage}% utilized`;
            }
            
            this.showMessage('System status refreshed', 'success');
        }, 1500);
    }

    // View detailed logs functionality
    viewDetailedLogs() {
        this.showMessage('Loading system logs...', 'info');
        setTimeout(() => {
            this.showMessage('System logs viewer will be implemented in next version', 'info');
        }, 1000);
    }

    // Load pending supplier applications
    async loadPendingSuppliers() {
        try {
            const supplierApplicationsEl = document.getElementById('supplierApplications');
            if (!supplierApplicationsEl) return;
            
            supplierApplicationsEl.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Loading applications...</div>';
            
            // Fetch supplier applications from server
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch('/api/users?role=supplier&status=pending', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch supplier applications: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.users) {
                const pendingSuppliers = data.users.filter(user => 
                    user.role === 'supplier' && (user.status === 'pending' || !user.status)
                );
                
                if (pendingSuppliers.length === 0) {
                    supplierApplicationsEl.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-clipboard-check"></i>
                            <p>No pending supplier applications</p>
                        </div>
                    `;
                    return;
                }
                
                // Render supplier applications
                supplierApplicationsEl.innerHTML = pendingSuppliers.map(supplier => `
                    <div class="supplier-application-card" data-id="${supplier._id}">
                        <div class="supplier-header">
                            <img src="${supplier.avatar || '../images/avatars/user-avatar.png'}" alt="${supplier.businessName || 'Supplier'}" class="supplier-avatar">
                            <div class="supplier-info">
                                <h4>${supplier.businessName || 'New Supplier'}</h4>
                                <p>${supplier.email}</p>
                                <span class="supplier-join-date">Applied: ${new Date(supplier.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div class="supplier-actions">
                            <button class="btn-approve" onclick="adminDashboard.approveSupplier('${supplier._id}')">
                                <i class="fas fa-check"></i> Approve
                            </button>
                            <button class="btn-reject" onclick="adminDashboard.rejectSupplier('${supplier._id}')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                            <button class="btn-details" onclick="adminDashboard.viewSupplierDetails('${supplier._id}')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Failed to load supplier applications:', error);
            const supplierApplicationsEl = document.getElementById('supplierApplications');
            if (supplierApplicationsEl) {
                supplierApplicationsEl.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error loading supplier applications</p>
                        <button onclick="adminDashboard.loadPendingSuppliers()" class="btn-retry">Try Again</button>
                    </div>
                `;
            }
        }
    }

    // Approve supplier application
    async approveSupplier(supplierId) {
        try {
            this.showMessage('Processing supplier approval...', 'info');
            
            // Call API to approve supplier
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch(`/api/admin/users/${supplierId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'active' })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to approve supplier: ${response.status}`);
            }
            
            this.showMessage('Supplier approved successfully!', 'success');
            this.loadPendingSuppliers(); // Refresh the list
            this.loadUsers(); // Refresh user count
            
            // Add to audit log
            this.logAdminAction('Approved supplier application');
            
            // Refresh dashboard stats
            this.loadDashboardStats();
        } catch (error) {
            console.error('Failed to approve supplier:', error);
            this.showMessage('Failed to approve supplier', 'error');
        }
    }

    // Reject supplier application
    async rejectSupplier(supplierId) {
        try {
            this.showMessage('Processing supplier rejection...', 'info');
            
            // Call API to reject supplier
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            const response = await fetch(`/api/admin/users/${supplierId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'rejected' })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to reject supplier: ${response.status}`);
            }
            
            this.showMessage('Supplier application rejected', 'success');
            this.loadPendingSuppliers(); // Refresh the list
            
            // Add to audit log
            this.logAdminAction('Rejected supplier application');
            
            // Refresh dashboard stats
            this.loadDashboardStats();
        } catch (error) {
            console.error('Failed to reject supplier:', error);
            this.showMessage('Failed to reject supplier', 'error');
        }
    }

    // View supplier details
    viewSupplierDetails(supplierId) {
        const supplier = this.users.find(u => u.id === supplierId);
        if (!supplier) {
            this.showMessage('Supplier details not found', 'error');
            return;
        }
        
        // Log this action
        this.logAdminAction('Viewed supplier details', { supplierId });
        
        // Create modal for supplier details
        const modalHTML = `
            <div class="admin-modal" id="supplierDetailsModal">
                <div class="modal-backdrop"></div>
                <div class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Supplier Details</h3>
                            <button class="modal-close" onclick="document.getElementById('supplierDetailsModal').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="supplier-details-content">
                            <div class="supplier-profile">
                                <img src="${supplier.avatar || '../images/avatars/user-avatar.png'}" alt="${supplier.name}" class="supplier-profile-img">
                                <h4>${supplier.businessName || supplier.name}</h4>
                                <p class="supplier-email">${supplier.email}</p>
                                <p class="supplier-phone">${supplier.phone || 'No phone provided'}</p>
                            </div>
                            <div class="supplier-info-grid">
                                <div class="info-item">
                                    <span class="info-label">Status</span>
                                    <span class="info-value status-${supplier.status}">${supplier.status}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Join Date</span>
                                    <span class="info-value">${supplier.joinDate}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Last Active</span>
                                    <span class="info-value">${supplier.lastActive}</span>
                                </div>
                            </div>
                            <div class="supplier-actions-footer">
                                <button class="btn-secondary" onclick="document.getElementById('supplierDetailsModal').remove()">Close</button>
                                <button class="btn-primary" onclick="adminDashboard.approveSupplier('${supplier.id}'); document.getElementById('supplierDetailsModal').remove();">Approve</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Log admin action to the server
    async logAdminAction(action, details = {}) {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
            // Send to the server endpoint for logging in the audit trail
            await fetch('/api/admin/audit-log', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action, details })
            });
        } catch (error) {
            console.error('Failed to log admin action:', error);
            // Don't show error to user as this is a background task
        }
    }

    // Export Users functionality
    exportUsers() {
        try {
            this.showMessage('Generating user export...', 'info');
            
            // Convert to CSV format
            const csvContent = this.convertToCSV(this.users);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `user-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showMessage('User data exported successfully!', 'success');
        } catch (error) {
            console.error('Export users error:', error);
            this.showMessage('Failed to export users', 'error');
        }
    }

    // View all suppliers functionality
    viewAllSuppliers() {
        // Set filter to show only suppliers
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.value = 'supplier';
            this.currentFilter = 'supplier';
            this.currentPage = 1; // Reset to first page
            this.filterUsers();
        }
        
        // Scroll to user management section
        const userSection = document.querySelector('.user-management-section');
        if (userSection) {
            userSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // View all activities functionality
    viewAllActivities() {
        this.showMessage('Loading all activities...', 'info');
        setTimeout(() => {
            this.showMessage('Activities view will be implemented in next version', 'info');
        }, 1000);
    }

    // User settings functionality
    openUserSettings() {
        this.showMessage('Opening user settings...', 'info');
        setTimeout(() => {
            this.showMessage('User settings panel will be implemented in next version', 'info');
        }, 1000);
    }

    // Filter activities functionality
    filterActivities() {
        this.showMessage('Opening activity filters...', 'info');
        setTimeout(() => {
            this.showMessage('Activity filters will be implemented in next version', 'info');
        }, 1000);
    }

    // Refresh status functionality for system health
    refreshSystemStatus() {
        this.showMessage('Refreshing system status...', 'info');
        
        // Simulate refreshing system health
        setTimeout(() => {
            // Update health cards with random data
            const apiResponseTime = Math.floor(Math.random() * 100) + 20;
            const dbQueriesPerMin = Math.floor(Math.random() * 2000) + 500;
            const memoryUsage = Math.floor(Math.random() * 30) + 60;
            const storageUsage = Math.floor(Math.random() * 30) + 30;
            
            const healthCards = document.querySelectorAll('.health-card');
            if (healthCards.length > 0) {
                // API Server
                const apiCard = healthCards[0];
                apiCard.querySelector('.health-details').textContent = `Response time: ${apiResponseTime}ms`;
                
                // Database
                const dbCard = healthCards[1];
                dbCard.querySelector('.health-details').textContent = `Queries: ${dbQueriesPerMin}/min`;
                
                // Memory
                const memoryCard = healthCards[2];
                memoryCard.querySelector('.health-details').textContent = `${memoryUsage}% utilized`;
                
                // Storage
                const storageCard = healthCards[3];
                storageCard.querySelector('.health-details').textContent = `${storageUsage}% utilized`;
            }
            
            this.showMessage('System status refreshed', 'success');
        }, 1500);
    }

    // View detailed logs functionality
    viewDetailedLogs() {
        this.showMessage('Loading system logs...', 'info');
        setTimeout(() => {
            this.showMessage('System logs viewer will be implemented in next version', 'info');
        }, 1000);
    }
}
