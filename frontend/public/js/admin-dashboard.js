// Admin Dashboard Main Controller
class AdminDashboard {
    getApiBaseUrl() {
        if (window.API_BASE_URL) return window.API_BASE_URL;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        return window.location.origin + '/api';
    }
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
        
        // Only initialize if authenticated
        if (this.checkAuthentication()) {
            this.init();
        }
    }

    // Check if user is authenticated as admin
    checkAuthentication() {
        // Try to get user from auth service first
        let user = null;
        
        if (window.authService && typeof window.authService.getUser === 'function') {
            user = window.authService.getUser();
            console.log('Admin dashboard got user from auth service:', user ? {
                role: user.role,
                email: user.email
            } : 'No user found in auth service');
        }
        
        // Fallback to direct localStorage access
        if (!user) {
            // First try the auth service's key
            const userFromLS = localStorage.getItem('neopos_user');
            if (userFromLS) {
                try {
                    user = JSON.parse(userFromLS);
                    console.log('Admin dashboard got user from neopos_user:', {
                        role: user.role,
                        email: user.email
                    });
                } catch (e) {
                    console.error('Error parsing user from neopos_user:', e);
                }
            }
            
            // Then try the regular 'user' key
            if (!user) {
                const regularUser = localStorage.getItem('user');
                if (regularUser) {
                    try {
                        user = JSON.parse(regularUser);
                        console.log('Admin dashboard got user from user key:', {
                            role: user.role,
                            email: user.email
                        });
                    } catch (e) {
                        console.error('Error parsing user from user key:', e);
                    }
                }
            }
        }
        
        // Show debug information about what we found
        console.log('Admin dashboard authentication check result:', {
            userFound: !!user,
            role: user?.role,
            isAdmin: user?.role === 'admin'
        });
        
        // Only allow users with the actual 'admin' role - regardless of how they logged in
        if (user && user.role === 'admin') {
            return true;
        }
        
        // Redirect to login if not authenticated as admin
        alert('Unauthorized access. Please login with admin credentials.');
        window.location.href = '../landing.html';
        return false;
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
            let token = null;
            
            // Try to get token from auth service first
            if (window.authService && typeof window.authService.getToken === 'function') {
                token = window.authService.getToken();
            }
            
            // Fallback to direct localStorage access if needed
            if (!token) {
                token = localStorage.getItem('neopos_auth_token') || 
                        localStorage.getItem('accessToken');
            }
            
            const response = await fetch(`${this.getApiBaseUrl()}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
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
            
            // Check if it's an authorization issue
            if (error.message && error.message.includes('401')) {
                alert('Unauthorized access. Please login again.');
                window.location.href = '../landing.html';
                return;
            }
            
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
            // Get token from auth service or fallback to localStorage
            let token = null;
            if (window.authService && typeof window.authService.getToken === 'function') {
                token = window.authService.getToken();
            }
            if (!token) {
                token = localStorage.getItem('neopos_auth_token') || 
                        localStorage.getItem('accessToken');
            }
            
            const response = await fetch(`${this.getApiBaseUrl()}/admin/dashboard-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
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
            
            // Handle unauthorized access
            if (error.message && error.message.includes('401')) {
                alert('Unauthorized access. Please login again.');
                window.location.href = '../landing.html';
                return;
            }
            
            // Fallback to calculating from users data
            this.updateStatistics();
        }
    }

    // Load real transactions data
    async loadTransactionStats() {
        try {
            // Get token from auth service or fallback to localStorage
            let token = null;
            if (window.authService && typeof window.authService.getToken === 'function') {
                token = window.authService.getToken();
            }
            if (!token) {
                token = localStorage.getItem('neopos_auth_token') || 
                        localStorage.getItem('accessToken');
            }
            
            const response = await fetch(`${this.getApiBaseUrl()}/admin/transaction-stats`, {
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
        // Common buttons for all users
        let commonButtons = `
            <button class="action-btn view" onclick="adminDashboard.viewUserDetails('${user.id}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn edit" onclick="adminDashboard.editUser('${user.id}')">
                <i class="fas fa-edit"></i>
            </button>
        `;
        
        // Status-specific buttons
        switch (user.status) {
            case 'active':
                return commonButtons + `
                    <button class="action-btn suspend" onclick="adminDashboard.showActionModal('${user.id}', 'suspend')">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="action-btn ban" onclick="adminDashboard.showActionModal('${user.id}', 'ban')">
                        <i class="fas fa-ban"></i>
                    </button>
                `;
            case 'suspended':
                return commonButtons + `
                    <button class="action-btn activate" onclick="adminDashboard.showActionModal('${user.id}', 'activate')">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn ban" onclick="adminDashboard.showActionModal('${user.id}', 'ban')">
                        <i class="fas fa-ban"></i>
                    </button>
                `;
            case 'banned':
                return commonButtons + `
                    <button class="action-btn activate" onclick="adminDashboard.showActionModal('${user.id}', 'activate')">
                        <i class="fas fa-play"></i>
                    </button>
                `;
            default:
                return commonButtons;
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
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        try {
            // Show loading state
            const confirmBtn = document.getElementById('confirmAction');
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            confirmBtn.disabled = true;

            // Real API call to backend
            const response = await fetch(`${getApiBaseUrl()}/api/admin/users/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ userId: user.id, action })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to execute action');
            }

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
                case 'delete':
                    // Remove user from the list
                    this.users = this.users.filter(u => u.id !== userId);
                    this.filteredUsers = this.filteredUsers.filter(u => u.id !== userId);
                    break;
            }

            this.renderUserTable();
            this.updateStatistics();
            this.hideModal();
            
            const actionText = action === 'activate' ? 'activated' : 
                               action === 'suspend' ? 'suspended' : 
                               action === 'ban' ? 'banned' : 
                               action === 'delete' ? 'deleted' : action + 'ed';
            
            this.showMessage(`User ${actionText} successfully`, 'success');
            this.logActivity('user-action', `${actionText} user: ${user.name}`, 'now');
            
        } catch (error) {
            console.error('Failed to execute user action:', error);
            this.showMessage(error.message || 'Failed to execute action', 'error');
        } finally {
            const confirmBtn = document.getElementById('confirmAction');
            confirmBtn.innerHTML = 'Confirm';
            confirmBtn.disabled = false;
        }
    }
    
    // View user details
    viewUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const modalHTML = `
            <div class="admin-modal" id="userDetailsModal">
                <div class="modal-backdrop"></div>
                <div class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>User Details</h3>
                            <button class="modal-close" onclick="document.getElementById('userDetailsModal').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="user-details-container">
                            <div class="user-avatar-large">
                                <img src="${user.avatar}" alt="${user.name}" 
                                     onerror="this.src='../images/avatars/user-avatar.png'">
                            </div>
                            <div class="user-info-grid">
                                <div class="info-row">
                                    <div class="info-label">Name</div>
                                    <div class="info-value">${user.name}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Email</div>
                                    <div class="info-value">${user.email}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Role</div>
                                    <div class="info-value">
                                        <span class="user-type ${user.type}">${user.type === 'shop-owner' ? 'Shop Owner' : 'Supplier'}</span>
                                    </div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Status</div>
                                    <div class="info-value">
                                        <span class="user-status ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                                    </div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Joined</div>
                                    <div class="info-value">${this.formatDate(user.joinDate)}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Last Active</div>
                                    <div class="info-value">${this.formatDate(user.lastActive)}</div>
                                </div>
                                ${user.phone ? `
                                <div class="info-row">
                                    <div class="info-label">Phone</div>
                                    <div class="info-value">${user.phone}</div>
                                </div>` : ''}
                                ${user.shopName ? `
                                <div class="info-row">
                                    <div class="info-label">Shop Name</div>
                                    <div class="info-value">${user.shopName}</div>
                                </div>` : ''}
                                ${user.businessName ? `
                                <div class="info-row">
                                    <div class="info-label">Business Name</div>
                                    <div class="info-value">${user.businessName}</div>
                                </div>` : ''}
                            </div>
                            <div class="modal-actions">
                                <button class="btn-secondary" onclick="document.getElementById('userDetailsModal').remove()">Close</button>
                                <button class="btn-primary" onclick="adminDashboard.editUser('${userId}'); document.getElementById('userDetailsModal').remove()">Edit User</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Edit user
    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const modalHTML = `
            <div class="admin-modal" id="editUserModal">
                <div class="modal-backdrop"></div>
                <div class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Edit User</h3>
                            <button class="modal-close" onclick="document.getElementById('editUserModal').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="editUserForm" class="edit-user-form">
                            <input type="hidden" id="userId" value="${user.id}">
                            <div class="form-group">
                                <label for="editFirstName">First Name</label>
                                <input type="text" id="editFirstName" value="${user.name.split(' ')[0]}" required>
                            </div>
                            <div class="form-group">
                                <label for="editLastName">Last Name</label>
                                <input type="text" id="editLastName" value="${user.name.split(' ').slice(1).join(' ')}" required>
                            </div>
                            <div class="form-group">
                                <label for="editEmail">Email</label>
                                <input type="email" id="editEmail" value="${user.email}" required>
                            </div>
                            <div class="form-group">
                                <label for="editRole">Role</label>
                                <select id="editRole" required>
                                    <option value="shopowner" ${user.type === 'shop-owner' ? 'selected' : ''}>Shop Owner</option>
                                    <option value="supplier" ${user.type === 'supplier' ? 'selected' : ''}>Supplier</option>
                                    <option value="admin" ${user.type === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editStatus">Status</label>
                                <select id="editStatus" required>
                                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                    <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>Banned</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editPassword">New Password (leave empty to keep current)</label>
                                <input type="password" id="editPassword">
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-danger" onclick="adminDashboard.showActionModal('${user.id}', 'delete')">
                                    Delete User
                                </button>
                                <div>
                                    <button type="button" class="btn-secondary" onclick="document.getElementById('editUserModal').remove()">
                                        Cancel
                                    </button>
                                    <button type="submit" class="btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add form submit handler
        const form = document.getElementById('editUserForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditUser(form);
        });
    }
    
    // Handle edit user submission
    async handleEditUser(form) {
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
            
            const userId = form.querySelector('#userId').value;
            const userData = {
                firstName: form.querySelector('#editFirstName').value,
                lastName: form.querySelector('#editLastName').value,
                email: form.querySelector('#editEmail').value,
                role: form.querySelector('#editRole').value,
                status: form.querySelector('#editStatus').value,
                password: form.querySelector('#editPassword').value || undefined
            };
            
            // If password is empty, remove it from request
            if (!userData.password) {
                delete userData.password;
            }
            
            // Send user data to backend API
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update user');
            }
            
            this.showMessage('User updated successfully!', 'success');
            document.getElementById('editUserModal').remove();
            
            // Log activity
            this.logActivity('user-action', `Updated user: ${userData.firstName} ${userData.lastName}`, 'now');
            
            // Reload users list
            await this.loadUsers();
            
        } catch (error) {
            console.error('Edit user error:', error);
            this.showMessage(error.message || 'Failed to update user', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Save Changes';
            submitBtn.disabled = false;
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
            const res = await fetch(`${getApiBaseUrl()}/api/users/admin/user-growth`, {
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
            const res = await fetch(`${getApiBaseUrl()}/api/users/admin/monthly-revenue`, {
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
            const res = await fetch(`${getApiBaseUrl()}/api/users/admin/user-distribution`, {
                headers: { 'Authorization': `Bearer ${window.localStorage.getItem('token')}` }
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
            const res = await fetch(`${getApiBaseUrl()}/api/users/admin/user-distribution`, {
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
            const response = await fetch(`${getApiBaseUrl()}/api/users/admin/audit-logs`, {
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
            const response = await fetch(`${getApiBaseUrl()}/api/users/admin/system-health`, {
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
            const response = await fetch(`${getApiBaseUrl()}/api/users/admin/activity-logs`, {
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
            const response = await fetch(`${getApiBaseUrl()}/api/admin/recent-activity`, {
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
        // Clear any existing intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Set up interval to refresh data periodically
        this.updateInterval = setInterval(() => {
            this.refreshDashboardData();
        }, 60000); // Refresh every minute
    }
    
    // Refresh all dashboard data
    async refreshDashboardData() {
        try {
            await Promise.all([
                this.loadDashboardStats(),
                this.loadTransactionStats(),
                this.updateSystemHealth()
            ]);
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        }
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
        const modalHTML = `
            <div class="admin-modal" id="systemSettingsModal">
                <div class="modal-backdrop"></div>
                <div class="modal-overlay">
                    <div class="modal-content settings-modal">
                        <div class="modal-header">
                            <h3>System Settings</h3>
                            <button class="modal-close" onclick="document.getElementById('systemSettingsModal').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="settings-tabs">
                            <button class="tab-btn active" data-tab="general">General</button>
                            <button class="tab-btn" data-tab="security">Security</button>
                            <button class="tab-btn" data-tab="notifications">Notifications</button>
                            <button class="tab-btn" data-tab="backup">Backup & Restore</button>
                        </div>
                        <div class="settings-content">
                            <!-- General Settings Tab -->
                            <div class="tab-content active" id="general-tab">
                                <h4>General System Settings</h4>
                                <form id="generalSettingsForm">
                                    <div class="form-group">
                                        <label for="systemName">System Name</label>
                                        <input type="text" id="systemName" value="Smart POS System">
                                    </div>
                                    <div class="form-group">
                                        <label for="maintenanceMode">Maintenance Mode</label>
                                        <div class="toggle-switch">
                                            <input type="checkbox" id="maintenanceMode">
                                            <label for="maintenanceMode"></label>
                                        </div>
                                        <span class="setting-hint">When enabled, only admins can access the system</span>
                                    </div>
                                    <div class="form-group">
                                        <label for="sessionTimeout">Session Timeout (minutes)</label>
                                        <input type="number" id="sessionTimeout" value="30" min="5" max="240">
                                    </div>
                                    <div class="form-group">
                                        <label for="defaultCurrency">Default Currency</label>
                                        <select id="defaultCurrency">
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="INR" selected>INR (₹)</option>
                                        </select>
                                    </div>
                                    <button type="submit" class="btn-primary">Save Changes</button>
                                </form>
                            </div>
                            
                            <!-- Security Settings Tab -->
                            <div class="tab-content" id="security-tab">
                                <h4>Security Settings</h4>
                                <form id="securitySettingsForm">
                                    <div class="form-group">
                                        <label for="twoFactorAuth">Two-Factor Authentication</label>
                                        <div class="toggle-switch">
                                            <input type="checkbox" id="twoFactorAuth" checked>
                                            <label for="twoFactorAuth"></label>
                                        </div>
                                        <span class="setting-hint">Require 2FA for all admin users</span>
                                    </div>
                                    <div class="form-group">
                                        <label for="passwordPolicy">Password Policy</label>
                                        <select id="passwordPolicy">
                                            <option value="standard">Standard (8+ chars)</option>
                                            <option value="strong" selected>Strong (8+ chars with numbers and symbols)</option>
                                            <option value="very-strong">Very Strong (12+ chars with numbers, symbols and mixed case)</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="passwordExpiry">Password Expiry (days)</label>
                                        <input type="number" id="passwordExpiry" value="90" min="0" max="365">
                                        <span class="setting-hint">0 = never expires</span>
                                    </div>
                                    <div class="form-group">
                                        <label for="loginAttempts">Max Login Attempts</label>
                                        <input type="number" id="loginAttempts" value="5" min="3" max="10">
                                    </div>
                                    <button type="submit" class="btn-primary">Save Changes</button>
                                </form>
                            </div>
                            
                            <!-- Notifications Tab -->
                            <div class="tab-content" id="notifications-tab">
                                <h4>Notification Settings</h4>
                                <form id="notificationSettingsForm">
                                    <div class="form-group">
                                        <label for="emailNotifications">Email Notifications</label>
                                        <div class="toggle-switch">
                                            <input type="checkbox" id="emailNotifications" checked>
                                            <label for="emailNotifications"></label>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="securityAlerts">Security Alerts</label>
                                        <div class="toggle-switch">
                                            <input type="checkbox" id="securityAlerts" checked>
                                            <label for="securityAlerts"></label>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="userRegistrations">New User Registrations</label>
                                        <div class="toggle-switch">
                                            <input type="checkbox" id="userRegistrations" checked>
                                            <label for="userRegistrations"></label>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="systemUpdates">System Updates</label>
                                        <div class="toggle-switch">
                                            <input type="checkbox" id="systemUpdates" checked>
                                            <label for="systemUpdates"></label>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn-primary">Save Changes</button>
                                </form>
                            </div>
                            
                            <!-- Backup Tab -->
                            <div class="tab-content" id="backup-tab">
                                <h4>Backup & Restore</h4>
                                <div class="backup-actions">
                                    <div class="backup-card">
                                        <h5>Create Backup</h5>
                                        <p>Create a complete backup of all system data</p>
                                        <button id="createBackupBtn" class="btn-primary">Create Backup</button>
                                    </div>
                                    <div class="backup-card">
                                        <h5>Restore From Backup</h5>
                                        <p>Restore system from a previous backup</p>
                                        <input type="file" id="backupFile" accept=".zip,.json" style="display:none">
                                        <button id="selectBackupBtn" class="btn-secondary" onclick="document.getElementById('backupFile').click()">Select Backup File</button>
                                    </div>
                                </div>
                                <div class="backup-history">
                                    <h5>Backup History</h5>
                                    <table class="backup-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Size</th>
                                                <th>Type</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="backupHistoryTable">
                                            <tr>
                                                <td>2025-07-30 09:15 AM</td>
                                                <td>24.2 MB</td>
                                                <td>Full Backup</td>
                                                <td>
                                                    <button class="action-btn download"><i class="fas fa-download"></i></button>
                                                    <button class="action-btn delete"><i class="fas fa-trash"></i></button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>2025-07-25 11:30 PM</td>
                                                <td>23.8 MB</td>
                                                <td>Full Backup</td>
                                                <td>
                                                    <button class="action-btn download"><i class="fas fa-download"></i></button>
                                                    <button class="action-btn delete"><i class="fas fa-trash"></i></button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add tab switching functionality
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to current button and content
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
            });
        });
        
        // Handle form submissions
        const forms = document.querySelectorAll('.settings-modal form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings(form);
            });
        });
        
        // Handle backup creation
        const createBackupBtn = document.getElementById('createBackupBtn');
        if (createBackupBtn) {
            createBackupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }
        
        // Load settings from server
        this.loadSettings();
    }
    
    // Load settings from server
    async loadSettings() {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load settings');
            }
            
            const data = await response.json();
            
            // Populate form fields with loaded settings
            if (data.settings) {
                const { general, security, notifications } = data.settings;
                
                // General settings
                if (general) {
                    document.getElementById('systemName').value = general.systemName || 'Smart POS System';
                    document.getElementById('maintenanceMode').checked = general.maintenanceMode || false;
                    document.getElementById('sessionTimeout').value = general.sessionTimeout || 30;
                    document.getElementById('defaultCurrency').value = general.defaultCurrency || 'INR';
                }
                
                // Security settings
                if (security) {
                    document.getElementById('twoFactorAuth').checked = security.twoFactorAuth || true;
                    document.getElementById('passwordPolicy').value = security.passwordPolicy || 'strong';
                    document.getElementById('passwordExpiry').value = security.passwordExpiry || 90;
                    document.getElementById('loginAttempts').value = security.loginAttempts || 5;
                }
                
                // Notification settings
                if (notifications) {
                    document.getElementById('emailNotifications').checked = notifications.email || true;
                    document.getElementById('securityAlerts').checked = notifications.securityAlerts || true;
                    document.getElementById('userRegistrations').checked = notifications.userRegistrations || true;
                    document.getElementById('systemUpdates').checked = notifications.systemUpdates || true;
                }
            }
            
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.showMessage('Failed to load settings', 'error');
        }
    }
    
    // Save settings to server
    async saveSettings(form) {
        try {
            const formId = form.id;
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
            
            let settingsData = {};
            
            // Collect form data based on form ID
            switch (formId) {
                case 'generalSettingsForm':
                    settingsData = {
                        category: 'general',
                        settings: {
                            systemName: document.getElementById('systemName').value,
                            maintenanceMode: document.getElementById('maintenanceMode').checked,
                            sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
                            defaultCurrency: document.getElementById('defaultCurrency').value
                        }
                    };
                    break;
                    
                case 'securitySettingsForm':
                    settingsData = {
                        category: 'security',
                        settings: {
                            twoFactorAuth: document.getElementById('twoFactorAuth').checked,
                            passwordPolicy: document.getElementById('passwordPolicy').value,
                            passwordExpiry: parseInt(document.getElementById('passwordExpiry').value),
                            loginAttempts: parseInt(document.getElementById('loginAttempts').value)
                        }
                    };
                    break;
                    
                case 'notificationSettingsForm':
                    settingsData = {
                        category: 'notifications',
                        settings: {
                            email: document.getElementById('emailNotifications').checked,
                            securityAlerts: document.getElementById('securityAlerts').checked,
                            userRegistrations: document.getElementById('userRegistrations').checked,
                            systemUpdates: document.getElementById('systemUpdates').checked
                        }
                    };
                    break;
            }
            
            // Send settings to server
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settingsData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
            
            this.showMessage('Settings saved successfully', 'success');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showMessage(error.message || 'Failed to save settings', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Save Changes';
            submitBtn.disabled = false;
        }
    }
    
    // Create system backup
    async createBackup() {
        try {
            const backupBtn = document.getElementById('createBackupBtn');
            const originalText = backupBtn.textContent;
            
            backupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            backupBtn.disabled = true;
            
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/backup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to create backup');
            }
            
            const data = await response.json();
            
            // Add new backup to the history table
            const backupHistoryTable = document.getElementById('backupHistoryTable');
            const currentDate = new Date().toLocaleString();
            
            if (backupHistoryTable) {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${currentDate}</td>
                    <td>${data.size || 'Unknown'}</td>
                    <td>Full Backup</td>
                    <td>
                        <button class="action-btn download" onclick="adminDashboard.downloadBackup('${data.id}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn delete" onclick="adminDashboard.deleteBackup('${data.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                backupHistoryTable.prepend(newRow);
            }
            
            this.showMessage('Backup created successfully', 'success');
            
        } catch (error) {
            console.error('Backup creation failed:', error);
            this.showMessage(error.message || 'Failed to create backup', 'error');
        } finally {
            const backupBtn = document.getElementById('createBackupBtn');
            backupBtn.textContent = 'Create Backup';
            backupBtn.disabled = false;
        }
    }

    // Security Logs functionality
    viewSecurityLogs() {
        const modalHTML = `
            <div class="admin-modal" id="securityLogsModal">
                <div class="modal-backdrop"></div>
                <div class="modal-overlay">
                    <div class="modal-content logs-modal">
                        <div class="modal-header">
                            <h3>Security Logs</h3>
                            <button class="modal-close" onclick="document.getElementById('securityLogsModal').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="logs-controls">
                            <div class="search-filter">
                                <input type="text" id="logSearch" placeholder="Search logs...">
                                <select id="logTypeFilter">
                                    <option value="all">All Types</option>
                                    <option value="login">Login Attempts</option>
                                    <option value="action">User Actions</option>
                                    <option value="system">System Events</option>
                                    <option value="security">Security Alerts</option>
                                </select>
                                <select id="logSeverityFilter">
                                    <option value="all">All Severities</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                <button id="searchLogsBtn" class="btn-primary">
                                    <i class="fas fa-search"></i> Search
                                </button>
                            </div>
                            <div class="date-filter">
                                <label>From:</label>
                                <input type="date" id="logStartDate" value="${this.getFormattedDate(-7)}">
                                <label>To:</label>
                                <input type="date" id="logEndDate" value="${this.getFormattedDate(0)}">
                            </div>
                            <button id="exportLogsBtn" class="btn-secondary">
                                <i class="fas fa-download"></i> Export Logs
                            </button>
                        </div>
                        <div class="logs-container">
                            <table class="logs-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>User</th>
                                        <th>IP Address</th>
                                        <th>Event Type</th>
                                        <th>Description</th>
                                        <th>Severity</th>
                                    </tr>
                                </thead>
                                <tbody id="securityLogsTableBody">
                                    <tr>
                                        <td colspan="6" class="text-center">Loading logs...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="logs-pagination">
                            <button id="prevLogsPageBtn" disabled>
                                <i class="fas fa-chevron-left"></i> Previous
                            </button>
                            <span id="logsPageInfo">Page 1 of 1</span>
                            <button id="nextLogsPageBtn" disabled>
                                Next <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event listeners
        document.getElementById('searchLogsBtn').addEventListener('click', () => {
            this.loadSecurityLogs();
        });
        
        document.getElementById('exportLogsBtn').addEventListener('click', () => {
            this.exportSecurityLogs();
        });
        
        document.getElementById('prevLogsPageBtn').addEventListener('click', () => {
            this.securityLogsPage--;
            this.loadSecurityLogs();
        });
        
        document.getElementById('nextLogsPageBtn').addEventListener('click', () => {
            this.securityLogsPage++;
            this.loadSecurityLogs();
        });
        
        // Initialize security logs page counter
        this.securityLogsPage = 1;
        this.securityLogsLimit = 20;
        
        // Load security logs
        this.loadSecurityLogs();
    }
    
    // Get formatted date for input fields
    getFormattedDate(daysOffset = 0) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    }
    
    // Load security logs from server
    async loadSecurityLogs() {
        try {
            const logsTableBody = document.getElementById('securityLogsTableBody');
            logsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Loading logs...</td></tr>`;
            
            // Get filter values
            const searchQuery = document.getElementById('logSearch').value;
            const logType = document.getElementById('logTypeFilter').value;
            const severity = document.getElementById('logSeverityFilter').value;
            const startDate = document.getElementById('logStartDate').value;
            const endDate = document.getElementById('logEndDate').value;
            
            // Build query params
            const params = new URLSearchParams({
                page: this.securityLogsPage,
                limit: this.securityLogsLimit,
                startDate,
                endDate
            });
            
            if (searchQuery) params.append('search', searchQuery);
            if (logType !== 'all') params.append('type', logType);
            if (severity !== 'all') params.append('severity', severity);
            
            // Fetch logs from API
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/security-logs?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load security logs');
            }
            
            const data = await response.json();
            
            // Clear and populate logs table
            logsTableBody.innerHTML = '';
            
            if (data.logs && data.logs.length > 0) {
                data.logs.forEach(log => {
                    const row = document.createElement('tr');
                    row.className = `severity-${log.severity}`;
                    
                    // Format date
                    const logDate = new Date(log.timestamp).toLocaleString();
                    
                    // Create row HTML
                    row.innerHTML = `
                        <td>${logDate}</td>
                        <td>${log.user || 'System'}</td>
                        <td>${log.ipAddress || 'N/A'}</td>
                        <td>${log.type}</td>
                        <td>${log.description}</td>
                        <td>
                            <span class="severity-badge ${log.severity}">${log.severity}</span>
                        </td>
                    `;
                    
                    logsTableBody.appendChild(row);
                });
                
                // Update pagination
                document.getElementById('logsPageInfo').textContent = `Page ${data.page} of ${data.totalPages}`;
                document.getElementById('prevLogsPageBtn').disabled = data.page <= 1;
                document.getElementById('nextLogsPageBtn').disabled = data.page >= data.totalPages;
                
            } else {
                logsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No logs found matching your filters</td></tr>`;
            }
            
        } catch (error) {
            console.error('Failed to load security logs:', error);
            document.getElementById('securityLogsTableBody').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center error">
                        <i class="fas fa-exclamation-circle"></i> 
                        Failed to load logs: ${error.message}
                        <br>
                        <button onclick="adminDashboard.loadSecurityLogs()" class="btn-retry">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    }
    
    // Export security logs
    async exportSecurityLogs() {
        try {
            const exportBtn = document.getElementById('exportLogsBtn');
            const originalText = exportBtn.innerHTML;
            
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            exportBtn.disabled = true;
            
            // Get filter values
            const searchQuery = document.getElementById('logSearch').value;
            const logType = document.getElementById('logTypeFilter').value;
            const severity = document.getElementById('logSeverityFilter').value;
            const startDate = document.getElementById('logStartDate').value;
            const endDate = document.getElementById('logEndDate').value;
            
            // Build query params
            const params = new URLSearchParams({
                export: 'true',
                startDate,
                endDate
            });
            
            if (searchQuery) params.append('search', searchQuery);
            if (logType !== 'all') params.append('type', logType);
            if (severity !== 'all') params.append('severity', severity);
            
            // Request export from API
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${getApiBaseUrl()}/api/admin/security-logs/export?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to export logs');
            }
            
            // Create a download link for the exported file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `security-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            this.showMessage('Logs exported successfully', 'success');
            
        } catch (error) {
            console.error('Failed to export logs:', error);
            this.showMessage(error.message || 'Failed to export logs', 'error');
        } finally {
            const exportBtn = document.getElementById('exportLogsBtn');
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Logs';
            exportBtn.disabled = false;
        }
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
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            submitBtn.disabled = true;
            
            const userData = {
                firstName: form.querySelector('#firstName').value,
                lastName: form.querySelector('#lastName').value,
                email: form.querySelector('#email').value,
                role: form.querySelector('#role').value,
                password: form.querySelector('#password').value
            };

            // Send user data to backend API
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${getApiBaseUrl()}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user');
            }
            
            this.showMessage('User created successfully!', 'success');
            document.getElementById('addUserModal').remove();
            
            // Log activity
            this.logActivity('user-action', `Created new user: ${userData.firstName} ${userData.lastName}`, 'now');
            
            // Reload users list
            await this.loadUsers();

        } catch (error) {
            console.error('Add user error:', error);
            this.showMessage(error.message || 'Failed to create user', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Add User';
            submitBtn.disabled = false;
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
            const response = await fetch(`${getApiBaseUrl()}/api/admin/recent-activity?offset=${currentActivities}&limit=10`, {
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
            const response = await fetch(`${getApiBaseUrl()}/api/users?role=supplier&status=pending`, {
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
            const response = await fetch(`${getApiBaseUrl()}/api/admin/users/${supplierId}/status`, {
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
            const response = await fetch(`${getApiBaseUrl()}/api/admin/users/${supplierId}/status`, {
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

// Expose the dashboard instance globally for inline event handlers
window.adminDashboard = new AdminDashboard();
