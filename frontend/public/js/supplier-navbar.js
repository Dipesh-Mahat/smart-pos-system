/**
 * Professional Reusable Navbar Component for Suppliers
 * Smart POS System - Supplier Portal
 * 
 * This component provides:
 * - Consistent header/navbar across all supplier pages
 * - Dynamic page titles
 * - Notification system integration
 * - Profile menu functionality
 * - Responsive design
 * - Professional UI/UX
 */

class SupplierNavbar {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'Smart POS - Supplier Portal',
            showBackButton: options.showBackButton || false,
            backUrl: options.backUrl || null,
            showNotifications: options.showNotifications !== false,
            showProfile: options.showProfile !== false,
            customActions: options.customActions || [],
            userType: 'supplier',
            ...options
        };
        this.notificationCount = 5; // Default notification count for suppliers
        this.init();
    }

    init() {
        // Always ensure body can scroll on navbar initialization
        document.body.style.overflow = '';
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createNavbarHTML();
                this.attachEventListeners();
                this.loadSupplierNotifications();
                this.setupScrollEffects();
                console.log('Supplier Navbar initialized after DOM ready');
            });
        } else {
            this.createNavbarHTML();
            this.attachEventListeners();
            this.loadSupplierNotifications();
            this.setupScrollEffects();
            console.log('Supplier Navbar initialized immediately');
        }
    }

    setupScrollEffects() {
        // Add scroll effect to enhance sticky navbar visual feedback
        let lastScrollTop = 0;
        const navbar = document.querySelector('.supplier-navbar');
        
        if (navbar) {
            window.addEventListener('scroll', () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Add enhanced shadow when scrolled
                if (scrollTop > 10) {
                    navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                    navbar.style.backdropFilter = 'blur(15px)';
                } else {
                    navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                    navbar.style.backdropFilter = 'blur(10px)';
                }
                
                lastScrollTop = scrollTop;
            });
        }
    }

    createNavbarHTML() {
        // Find or create navbar container
        let navbarContainer = document.getElementById('supplierNavbarContainer');
        if (!navbarContainer) {
            navbarContainer = document.createElement('div');
            navbarContainer.id = 'supplierNavbarContainer';
            document.body.insertBefore(navbarContainer, document.body.firstChild);
        }

        // Create navbar HTML structure
        const navbarHTML = this.generateNavbarHTML();
        navbarContainer.innerHTML = navbarHTML;

        // Add navbar styles if not already present
        this.addNavbarStyles();
    }

    generateNavbarHTML() {
        const backButton = this.options.showBackButton ? 
            `<div class="back-button" id="supplierNavbarBackButton">
                <i class="fas fa-arrow-left"></i>
                <span>Back</span>
            </div>` : '';

        const customActions = this.options.customActions.map(action => 
            `<div class="custom-action" data-action="${action.id}" title="${action.title}">
                <i class="fas fa-${action.icon}"></i>
            </div>`
        ).join('');

        const notifications = this.options.showNotifications ? 
            `<div class="supplier-notification-icon" id="supplierNotificationIcon">
                <i class="fas fa-bell"></i>
                <span class="supplier-notification-badge" id="supplierNotificationBadge">${this.notificationCount}</span>
            </div>` : '';

        const profile = this.options.showProfile ? 
            `<div class="supplier-profile-icon" id="supplierProfileIcon">
                <img src="../images/avatars/user-avatar.png" alt="Profile" id="supplierProfileImage">
                <div class="supplier-profile-dropdown" id="supplierProfileDropdown">
                    <div class="profile-dropdown-header">
                        <div class="profile-info">
                            <div class="profile-name">Supplier Account</div>
                            <div class="profile-email">supplier@smartpos.np</div>
                        </div>
                    </div>
                    <div class="profile-dropdown-menu">
                        <a href="supplier-profile.html" class="profile-menu-item">
                            <i class="fas fa-user"></i>
                            <span>My Profile</span>
                        </a>
                        <a href="supplier-settings.html" class="profile-menu-item">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                        <a href="supplier-analytics.html" class="profile-menu-item">
                            <i class="fas fa-chart-line"></i>
                            <span>Analytics</span>
                        </a>
                        <div class="profile-menu-divider"></div>
                        <a href="#" class="profile-menu-item">
                            <i class="fas fa-life-ring"></i>
                            <span>Help & Support</span>
                        </a>
                        <a href="#" class="profile-menu-item" onclick="supplierNavbar.logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </a>
                    </div>
                </div>
            </div>` : '';

        return `
            <header class="supplier-navbar" id="supplierNavbar">
                <div class="navbar-left">
                    <div class="hamburger-menu-icon" id="supplierHamburgerMenuIcon" title="Menu">
                        <i class="fas fa-bars"></i>
                    </div>
                    ${backButton}
                    <div class="navbar-title" id="supplierNavbarTitle">${this.options.title}</div>
                </div>
                <div class="navbar-right">
                    ${customActions}
                    ${notifications}
                    ${profile}
                </div>
            </header>
            
            <!-- Notification Panel -->
            <div class="supplier-notification-panel" id="supplierNotificationPanel">
                <div class="notification-panel-header">
                    <div class="notification-panel-title">Supplier Notifications</div>
                    <div class="close-notification-panel" id="closeSupplierNotificationPanel">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
                <div class="notification-panel-content" id="supplierNotificationPanelContent">
                    <!-- Notifications will be loaded here -->
                </div>
                <div class="notification-panel-footer">
                    <a href="supplier-analytics.html">View All Notifications</a>
                </div>
            </div>
            
            <!-- Notification Overlay -->
            <div class="supplier-notification-overlay" id="supplierNotificationOverlay"></div>
        `;
    }

    addNavbarStyles() {
        if (document.getElementById('supplierNavbarStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'supplierNavbarStyles';
        styles.textContent = `
            /* Supplier Navbar Styles */
            .supplier-navbar {
                background: linear-gradient(to right, #ffffff, #f8f9fa);
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                width: 100%;
                z-index: 1001;
                border-bottom: 1px solid #e9ecef;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            /* Add body padding to accommodate fixed navbar */
            body {
                padding-top: 80px !important;
                box-sizing: border-box;
            }

            .navbar-left {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .navbar-right {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .hamburger-menu-icon {
                width: 40px;
                height: 40px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #2c3e50;
                font-size: 18px;
            }

            .hamburger-menu-icon:hover {
                background: #28a745;
                color: white;
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(40,167,69,0.2);
            }

            .back-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #2c3e50;
                font-size: 14px;
                font-weight: 500;
            }

            .back-button:hover {
                background: #e9ecef;
                transform: translateX(-2px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .navbar-title {
                font-size: 24px;
                font-weight: 700;
                color: #1a1a1a;
                letter-spacing: 0.5px;
            }

            .custom-action {
                width: 40px;
                height: 40px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #2c3e50;
            }

            .custom-action:hover {
                background: #28a745;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(40,167,69,0.2);
            }

            .supplier-notification-icon {
                position: relative;
                width: 40px;
                height: 40px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #2c3e50;
            }

            .supplier-notification-icon:hover {
                background: #28a745;
                color: white;
                transform: scale(1.05);
            }

            .supplier-notification-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #dc3545;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                border: 2px solid white;
            }

            .supplier-profile-icon {
                position: relative;
                cursor: pointer;
            }

            .supplier-profile-icon img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #e9ecef;
                transition: all 0.3s ease;
            }

            .supplier-profile-icon:hover img {
                border-color: #28a745;
                transform: scale(1.05);
            }

            .supplier-profile-dropdown {
                position: absolute;
                top: 50px;
                right: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                border: 1px solid #e9ecef;
                min-width: 250px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                z-index: 1000;
            }

            .supplier-profile-dropdown.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .profile-dropdown-header {
                padding: 20px;
                background: linear-gradient(135deg, #28a745, #1e7e34);
                color: white;
                border-radius: 12px 12px 0 0;
            }

            .profile-name {
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 4px;
            }

            .profile-email {
                font-size: 12px;
                opacity: 0.9;
            }

            .profile-dropdown-menu {
                padding: 8px 0;
            }

            .profile-menu-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 20px;
                color: #2c3e50;
                text-decoration: none;
                transition: all 0.3s ease;
                font-size: 14px;
            }

            .profile-menu-item:hover {
                background: #f8f9fa;
                color: #28a745;
            }

            .profile-menu-item i {
                width: 16px;
                color: #6c757d;
            }

            .profile-menu-item:hover i {
                color: #28a745;
            }

            .profile-menu-divider {
                height: 1px;
                background: #e9ecef;
                margin: 8px 0;
            }

            /* Notification Panel */
            .supplier-notification-panel {
                position: fixed;
                top: 0;
                right: -400px;
                width: 400px;
                height: 100vh;
                background: white;
                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                z-index: 1001;
                transition: right 0.3s ease;
                display: flex;
                flex-direction: column;
            }

            .supplier-notification-panel.active {
                right: 0;
            }

            .notification-panel-header {
                padding: 20px;
                background: linear-gradient(135deg, #28a745, #1e7e34);
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .notification-panel-title {
                font-size: 18px;
                font-weight: 600;
            }

            .close-notification-panel {
                width: 32px;
                height: 32px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .close-notification-panel:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .notification-panel-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }

            .notification-panel-footer {
                padding: 16px 20px;
                border-top: 1px solid #e9ecef;
                text-align: center;
            }

            .notification-panel-footer a {
                color: #28a745;
                text-decoration: none;
                font-weight: 500;
            }

            .supplier-notification-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .supplier-notification-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            /* Notification Items */
            .notification-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px;
                border-bottom: 1px solid #f1f3f4;
                transition: all 0.3s ease;
            }

            .notification-item:hover {
                background: #f8f9fa;
            }

            .notification-item.unread {
                background: #d4edda;
                border-left: 4px solid #28a745;
            }

            .notification-item.critical {
                background: #f8d7da;
                border-left: 4px solid #dc3545;
            }

            .notification-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 14px;
                flex-shrink: 0;
            }

            .notification-icon.warning {
                background: #ffc107;
            }

            .notification-icon.critical {
                background: #dc3545;
            }

            .notification-icon.info {
                background: #17a2b8;
            }

            .notification-icon.success {
                background: #28a745;
            }

            .notification-content {
                flex: 1;
            }

            .notification-title {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 4px;
                font-size: 14px;
            }

            .notification-message {
                color: #6c757d;
                font-size: 13px;
                line-height: 1.4;
                margin-bottom: 4px;
            }

            .notification-time {
                color: #999;
                font-size: 11px;
            }

            /* Responsive Design */
            @media screen and (max-width: 768px) {
                .supplier-navbar {
                    padding: 12px 16px;
                }

                body {
                    padding-top: 70px !important;
                }

                .navbar-title {
                    font-size: 18px;
                }

                .back-button span {
                    display: none;
                }

                .supplier-notification-panel {
                    width: 100%;
                    right: -100%;
                    top: 70px;
                    height: calc(100vh - 70px);
                }

                .supplier-profile-dropdown {
                    right: -20px;
                    min-width: 220px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    attachEventListeners() {
        // Hamburger menu icon
        const hamburgerMenuIcon = document.getElementById('supplierHamburgerMenuIcon');
        if (hamburgerMenuIcon) {
            hamburgerMenuIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.supplierMenu && typeof window.supplierMenu.toggleMenuFromNavbar === 'function') {
                    window.supplierMenu.toggleMenuFromNavbar();
                }
            });
        }

        // Back button
        const backButton = document.getElementById('supplierNavbarBackButton');
        if (backButton) {
            backButton.addEventListener('click', () => {
                if (this.options.backUrl) {
                    window.location.href = this.options.backUrl;
                } else {
                    window.history.back();
                }
            });
        }

        // Notification icon
        const notificationIcon = document.getElementById('supplierNotificationIcon');
        const notificationPanel = document.getElementById('supplierNotificationPanel');
        const notificationOverlay = document.getElementById('supplierNotificationOverlay');
        const closeNotificationPanel = document.getElementById('closeSupplierNotificationPanel');

        if (notificationIcon && notificationPanel) {
            notificationIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotificationPanel();
            });

            closeNotificationPanel?.addEventListener('click', () => {
                this.closeNotificationPanel();
            });

            notificationOverlay?.addEventListener('click', () => {
                this.closeNotificationPanel();
            });
        }

        // Profile dropdown
        const profileIcon = document.getElementById('supplierProfileIcon');
        const profileDropdown = document.getElementById('supplierProfileDropdown');

        if (profileIcon && profileDropdown) {
            profileIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleProfileDropdown();
            });

            document.addEventListener('click', (e) => {
                if (!profileIcon.contains(e.target)) {
                    this.closeProfileDropdown();
                }
            });
        }

        // Custom actions
        document.querySelectorAll('.custom-action').forEach(action => {
            action.addEventListener('click', () => {
                const actionId = action.dataset.action;
                this.handleCustomAction(actionId);
            });
        });
    }

    loadSupplierNotifications() {
        const content = document.getElementById('supplierNotificationPanelContent');
        if (!content) return;

        // Sample notifications for suppliers
        const notifications = [
            {
                type: 'success',
                icon: 'shopping-cart',
                title: 'New Order Received',
                message: 'Order #ORD001 from Sharma General Store - NPR 2,450',
                time: '5 minutes ago',
                unread: true
            },
            {
                type: 'critical',
                icon: 'exclamation-triangle',
                title: 'Low Stock Alert',
                message: 'Basmati Rice (5kg) - Only 5 units remaining',
                time: '15 minutes ago',
                unread: true
            },
            {
                type: 'info',
                icon: 'truck',
                title: 'Order Shipped',
                message: 'Order #ORD002 has been dispatched to Nepal Mart',
                time: '1 hour ago',
                unread: false
            },
            {
                type: 'warning',
                icon: 'clock',
                title: 'Payment Pending',
                message: 'Payment for Order #ORD003 is overdue by 3 days',
                time: '2 hours ago',
                unread: true
            },
            {
                type: 'success',
                icon: 'check-circle',
                title: 'Product Added',
                message: 'Sunflower Oil (1L) added to catalog successfully',
                time: '3 hours ago',
                unread: false
            }
        ];

        content.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.unread ? 'unread' : ''} ${notification.type === 'critical' ? 'critical' : ''}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${notification.icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
            </div>
        `).join('');
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('supplierNotificationPanel');
        const overlay = document.getElementById('supplierNotificationOverlay');
        
        panel?.classList.toggle('active');
        overlay?.classList.toggle('active');
        
        if (panel?.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('supplierNotificationPanel');
        const overlay = document.getElementById('supplierNotificationOverlay');
        
        panel?.classList.remove('active');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggleProfileDropdown() {
        const dropdown = document.getElementById('supplierProfileDropdown');
        dropdown?.classList.toggle('active');
    }

    closeProfileDropdown() {
        const dropdown = document.getElementById('supplierProfileDropdown');
        dropdown?.classList.remove('active');
    }

    handleCustomAction(actionId) {
        // Emit custom event for handling by parent application
        window.dispatchEvent(new CustomEvent('supplierNavbarAction', { 
            detail: { actionId }
        }));
    }

    updateTitle(newTitle) {
        this.options.title = newTitle;
        const titleElement = document.getElementById('supplierNavbarTitle');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }

    updateNotificationCount(count) {
        this.notificationCount = count;
        const badge = document.getElementById('supplierNotificationBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Use auth service for logout if available
            if (window.authService) {
                window.authService.logout();
            } else {
                // Fallback to basic logout
                localStorage.clear();
                sessionStorage.clear();
                
                // Redirect to supplier landing page
                window.location.href = '../supplier-landing.html';
            }
        }
    }

    destroy() {
        const container = document.getElementById('supplierNavbarContainer');
        const styles = document.getElementById('supplierNavbarStyles');
        
        container?.remove();
        styles?.remove();
    }
}

// Global instance and convenience functions
let supplierNavbar = null;

function initSupplierNavbar(options = {}) {
    // Destroy existing instance if any
    if (supplierNavbar) {
        supplierNavbar.destroy();
    }
    
    // Create new instance
    supplierNavbar = new SupplierNavbar(options);
    
    // Make it globally accessible
    window.supplierNavbar = supplierNavbar;
    
    return supplierNavbar;
}

// Auto-initialize on DOM load if not manually initialized
document.addEventListener('DOMContentLoaded', () => {
    // Only auto-initialize if not already done
    if (!supplierNavbar && !window.supplierNavbarManualInit) {
        // Auto-detect page and set appropriate title
        const pageTitle = document.title.replace('Smart POS - ', '') || 'Supplier Dashboard';
        initSupplierNavbar({ title: pageTitle });
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupplierNavbar, initSupplierNavbar };
}
