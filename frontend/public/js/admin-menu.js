// Admin Menu Component
class AdminMenu {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.setActiveMenuItem();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        return path.substring(path.lastIndexOf('/') + 1);
    }

    render() {
        const menuHTML = `
            <aside class="admin-menu">                <div class="menu-header">
                    <img src="../images/logos/smart-pos-logo.png" alt="Smart POS" class="menu-logo">
                    <div class="menu-title">
                        <h3>Admin Panel</h3>
                        <p>System Management</p>
                    </div>
                </div>
                
                <nav class="menu-nav">
                    <ul class="menu-list">
                        <li class="menu-item">
                            <a href="admin-dashboard.html" class="menu-link" data-page="admin-dashboard.html">
                                <i class="fas fa-tachometer-alt menu-icon"></i>
                                <span class="menu-text">Dashboard</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-users.html" class="menu-link" data-page="admin-users.html">
                                <i class="fas fa-users menu-icon"></i>
                                <span class="menu-text">User Management</span>
                                <span class="menu-badge">2,847</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-shops.html" class="menu-link" data-page="admin-shops.html">
                                <i class="fas fa-store menu-icon"></i>
                                <span class="menu-text">Shop Owners</span>
                                <span class="menu-badge">1,456</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-suppliers.html" class="menu-link" data-page="admin-suppliers.html">
                                <i class="fas fa-truck menu-icon"></i>
                                <span class="menu-text">Suppliers</span>
                                <span class="menu-badge">1,391</span>
                            </a>
                        </li>
                        
                        <li class="menu-divider"></li>
                        
                        <li class="menu-item">
                            <a href="admin-transactions.html" class="menu-link" data-page="admin-transactions.html">
                                <i class="fas fa-exchange-alt menu-icon"></i>
                                <span class="menu-text">Transactions</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-analytics.html" class="menu-link" data-page="admin-analytics.html">
                                <i class="fas fa-chart-bar menu-icon"></i>
                                <span class="menu-text">Analytics</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-revenue.html" class="menu-link" data-page="admin-revenue.html">
                                <i class="fas fa-dollar-sign menu-icon"></i>
                                <span class="menu-text">Revenue</span>
                            </a>
                        </li>
                        
                        <li class="menu-divider"></li>
                        
                        <li class="menu-item">
                            <a href="admin-reports.html" class="menu-link" data-page="admin-reports.html">
                                <i class="fas fa-file-alt menu-icon"></i>
                                <span class="menu-text">Reports</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-support.html" class="menu-link" data-page="admin-support.html">
                                <i class="fas fa-life-ring menu-icon"></i>
                                <span class="menu-text">Support Tickets</span>
                                <span class="menu-badge urgent">23</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-system.html" class="menu-link" data-page="admin-system.html">
                                <i class="fas fa-cogs menu-icon"></i>
                                <span class="menu-text">System Health</span>
                            </a>
                        </li>
                        
                        <li class="menu-divider"></li>
                        
                        <li class="menu-item">
                            <a href="admin-settings.html" class="menu-link" data-page="admin-settings.html">
                                <i class="fas fa-sliders-h menu-icon"></i>
                                <span class="menu-text">Settings</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-security.html" class="menu-link" data-page="admin-security.html">
                                <i class="fas fa-shield-alt menu-icon"></i>
                                <span class="menu-text">Security</span>
                            </a>
                        </li>
                        
                        <li class="menu-item">
                            <a href="admin-logs.html" class="menu-link" data-page="admin-logs.html">
                                <i class="fas fa-clipboard-list menu-icon"></i>
                                <span class="menu-text">System Logs</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                
                <div class="menu-footer">
                    <div class="system-status">
                        <div class="status-indicator online"></div>
                        <div class="status-info">
                            <p class="status-text">System Status</p>
                            <p class="status-value">All Systems Online</p>
                        </div>
                    </div>
                    
                    <div class="quick-actions">
                        <button class="quick-action-btn" title="Emergency Shutdown" id="emergencyBtn">
                            <i class="fas fa-power-off"></i>
                        </button>
                        <button class="quick-action-btn" title="System Backup" id="backupBtn">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="quick-action-btn" title="Send Alert" id="alertBtn">
                            <i class="fas fa-exclamation-triangle"></i>
                        </button>
                    </div>
                </div>
            </aside>
        `;        // Insert menu into the designated element
        const menuContainer = document.getElementById('adminMenu');
        if (menuContainer) {
            menuContainer.innerHTML = menuHTML;
        } else {
            // Fallback: insert at the beginning of main-content  
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.insertAdjacentHTML('afterbegin', menuHTML);
                // Add menu-active class to main-content
                mainContent.classList.add('menu-active');
            }
        }
    }

    attachEventListeners() {
        // Menu item clicks
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all items
                menuLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked item
                e.currentTarget.classList.add('active');
            });
        });

        // Quick action buttons
        const emergencyBtn = document.getElementById('emergencyBtn');
        const backupBtn = document.getElementById('backupBtn');
        const alertBtn = document.getElementById('alertBtn');

        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => this.handleEmergencyShutdown());
        }

        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.handleSystemBackup());
        }

        if (alertBtn) {
            alertBtn.addEventListener('click', () => this.handleSendAlert());
        }

        // Update system status periodically
        this.updateSystemStatus();
        setInterval(() => this.updateSystemStatus(), 30000); // Update every 30 seconds
    }

    setActiveMenuItem() {
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            if (page === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    handleEmergencyShutdown() {
        const confirmed = confirm(
            'EMERGENCY SHUTDOWN\\n\\n' +
            'This will immediately shut down all system services and log out all users.\\n\\n' +
            'Are you sure you want to proceed?'
        );

        if (confirmed) {
            // Show loading state
            const btn = document.getElementById('emergencyBtn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            // Simulate emergency shutdown process
            setTimeout(() => {
                alert('Emergency shutdown initiated. All services are being stopped.');
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                
                // Update system status
                this.updateSystemStatus('offline');
            }, 2000);
        }
    }

    handleSystemBackup() {
        const btn = document.getElementById('backupBtn');
        const originalHTML = btn.innerHTML;
        
        // Show loading state
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        // Simulate backup process
        setTimeout(() => {
            const backupTime = new Date().toLocaleString();
            alert(`System backup completed successfully at ${backupTime}`);
            
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }, 3000);
    }

    handleSendAlert() {
        const message = prompt(
            'Send System Alert\\n\\n' +
            'Enter the alert message to send to all administrators:'
        );

        if (message && message.trim()) {
            const btn = document.getElementById('alertBtn');
            const originalHTML = btn.innerHTML;
            
            // Show loading state
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            // Simulate alert sending
            setTimeout(() => {
                alert(`Alert sent successfully: "${message}"`);
                
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 1500);
        }
    }

    updateSystemStatus(status = 'online') {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusValue = document.querySelector('.status-value');
        
        if (statusIndicator && statusValue) {
            statusIndicator.className = `status-indicator ${status}`;
            
            switch (status) {
                case 'online':
                    statusValue.textContent = 'All Systems Online';
                    break;
                case 'warning':
                    statusValue.textContent = 'System Warning';
                    break;
                case 'offline':
                    statusValue.textContent = 'System Offline';
                    break;
                default:
                    statusValue.textContent = 'Unknown Status';
            }
        }
    }

    updateUserCounts(shopOwners, suppliers, total) {
        const badges = document.querySelectorAll('.menu-badge');
        badges.forEach(badge => {
            const menuItem = badge.closest('.menu-item');
            const link = menuItem.querySelector('.menu-link');
            const page = link.getAttribute('data-page');
            
            switch (page) {
                case 'admin-users.html':
                    badge.textContent = total.toLocaleString();
                    break;
                case 'admin-shops.html':
                    badge.textContent = shopOwners.toLocaleString();
                    break;
                case 'admin-suppliers.html':
                    badge.textContent = suppliers.toLocaleString();
                    break;
            }
        });
    }
}

// AdminMenu class will be initialized by the main dashboard script
