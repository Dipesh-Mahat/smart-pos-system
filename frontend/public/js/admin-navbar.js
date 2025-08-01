// Admin Navbar Component
class AdminNavbar {
    constructor() {
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {        const navbarHTML = `
            <nav class="admin-navbar">
                <div class="navbar-container">                    <div class="navbar-brand">
                        <img src="../images/logos/smart-pos-logo.png" alt="Smart POS" class="brand-logo">
                        <span class="brand-text">Smart POS Admin</span>
                    </div>
                    
                    <div class="navbar-center">
                        <div class="search-container">
                            <i class="fas fa-search search-icon"></i>
                            <input type="text" class="navbar-search" placeholder="Search users, transactions...">
                        </div>
                    </div>
                    
                    <div class="navbar-right">
                        <div class="notification-dropdown">
                            <button class="notification-btn" id="notificationBtn">
                                <i class="fas fa-bell"></i>
                                <span class="notification-badge" id="notificationBadge">5</span>
                            </button>
                            <div class="notification-menu" id="notificationMenu">
                                <div class="notification-header">
                                    <h4>Notifications</h4>
                                    <button class="mark-all-read">Mark all as read</button>
                                </div>
                                <div class="notification-list" id="notificationList">
                                    <!-- Notifications will be loaded here -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="admin-profile-dropdown">                            <button class="profile-btn" id="profileBtn">
                                <img src="../images/avatars/admin-avatar.jpg" alt="Admin" class="profile-avatar" onerror="this.src='../images/avatars/user-avatar.png'">
                                <span class="profile-name">System Admin</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="profile-menu" id="profileMenu">
                                <a href="#" class="profile-menu-item">
                                    <i class="fas fa-user-cog"></i>
                                    Admin Settings
                                </a>
                                <a href="#" class="profile-menu-item">
                                    <i class="fas fa-shield-alt"></i>
                                    Security
                                </a>
                                <a href="#" class="profile-menu-item">
                                    <i class="fas fa-chart-line"></i>
                                    System Reports
                                </a>
                                <div class="profile-menu-divider"></div>
                                <a href="#" class="profile-menu-item logout" id="logoutBtn">
                                    <i class="fas fa-sign-out-alt"></i>
                                    Logout
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;        // Insert navbar into the designated element
        const navbarContainer = document.getElementById('adminNavbar');
        if (navbarContainer) {
            navbarContainer.innerHTML = navbarHTML;
        } else {
            // Fallback: insert at the beginning of body
            document.body.insertAdjacentHTML('afterbegin', navbarHTML);
        }
    }

    attachEventListeners() {
        // Toggle notification dropdown
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationMenu = document.getElementById('notificationMenu');
        
        if (notificationBtn && notificationMenu) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationMenu.classList.toggle('show');
                this.loadNotifications();
            });
        }

        // Toggle profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileMenu = document.getElementById('profileMenu');
        
        if (profileBtn && profileMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('show');
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            if (notificationMenu) notificationMenu.classList.remove('show');
            if (profileMenu) profileMenu.classList.remove('show');
        });

        // Search functionality
        const searchInput = document.querySelector('.navbar-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    loadNotifications() {
        const notificationList = document.getElementById('notificationList');
        if (!notificationList) return;

        // Mock notifications data
        const notifications = [
            {
                id: 1,
                type: 'warning',
                title: 'User Report',
                message: 'Shop owner "Sharma General Store" reported suspicious activity',
                time: '5 minutes ago',
                unread: true
            },
            {
                id: 2,
                type: 'info',
                title: 'New Registration',
                message: 'New supplier "Fresh Foods Co." registered',
                time: '1 hour ago',
                unread: true
            },
            {
                id: 3,
                type: 'success',
                title: 'System Update',
                message: 'Database backup completed successfully',
                time: '2 hours ago',
                unread: false
            }
        ];

        const notificationHTML = notifications.map(notification => `
            <div class="notification-item ${notification.unread ? 'unread' : ''}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                    <span class="notification-time">${notification.time}</span>
                </div>
            </div>
        `).join('');

        notificationList.innerHTML = notificationHTML;
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-times-circle';
            default: return 'fa-bell';
        }
    }

    handleSearch(query) {
        if (query.length < 2) return;
        
        // Implement search functionality
        // This would typically make an API call to search users/transactions
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear admin session
            localStorage.removeItem('adminToken');
            sessionStorage.clear();
            
            // Redirect to login page
            window.location.href = '../index.html';
        }
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }
}

// AdminNavbar class will be initialized by the main dashboard script
