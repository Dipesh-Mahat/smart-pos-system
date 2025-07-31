/**
 * Professional Reusable Navbar Component
 * Smart POS System - Nepal
 * 
 * This component provides:
 * - Consistent header/navbar across all pages
 * - Dynamic page titles
 * - Notification system integration
 * - Profile menu functionality
 * - Responsive design
 * - Professional UI/UX
 */

class SmartPOSNavbar {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'Smart POS - Nepal',
            showBackButton: options.showBackButton || false,
            backUrl: options.backUrl || null,
            showNotifications: options.showNotifications !== false,
            showProfile: options.showProfile !== false,
            customActions: options.customActions || [],
            ...options
        };
        this.notificationCount = 0; // Start with no notifications (will show dot based on actual unread count)
        this.init();
    }    init() {
        // Always ensure body can scroll on navbar initialization
        document.body.style.overflow = '';
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createNavbarHTML();
                this.attachEventListeners();
                this.loadNotifications();
                this.setupScrollEffects();
                console.log('Navbar initialized after DOM ready');
            });
        } else {
            this.createNavbarHTML();
            this.attachEventListeners();
            this.loadNotifications();
            this.setupScrollEffects();
            console.log('Navbar initialized immediately');
        }
    }

    setupScrollEffects() {
        // Add scroll effect to enhance sticky navbar visual feedback
        let lastScrollTop = 0;
        const navbar = document.querySelector('.smart-pos-navbar');
        
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
        let navbarContainer = document.getElementById('navbarContainer');
        if (!navbarContainer) {
            navbarContainer = document.createElement('div');
            navbarContainer.id = 'navbarContainer';
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
            `<div class="back-button" id="navbarBackButton">
                <i class="fas fa-arrow-left"></i>
                <span>Back</span>
            </div>` : '';

        const customActions = this.options.customActions.map(action => 
            `<div class="custom-action" data-action="${action.id}" title="${action.title}">
                <i class="fas fa-${action.icon}"></i>
            </div>`
        ).join('');

        const notifications = this.options.showNotifications ? 
            `<div class="navbar-notification-icon" id="navbarNotificationIcon">
                <i class="fas fa-bell"></i>
                <span class="navbar-notification-dot" id="navbarNotificationDot"></span>
            </div>` : '';        const profile = this.options.showProfile ? 
            `<div class="navbar-profile-icon" id="navbarProfileIcon">
                <img src="../images/avatars/user-avatar.png" alt="Profile" id="navbarProfileImage" onerror="this.src='../images/avatars/user-avatar.png'">
                <div class="profile-dropdown" id="navbarProfileDropdown">
                    <div class="profile-dropdown-header">
                        <div class="profile-info">
                            <div class="profile-name" id="navbarProfileName">Loading...</div>
                            <div class="profile-email" id="navbarProfileEmail">Loading...</div>
                        </div>
                    </div>
                    <div class="profile-dropdown-menu">
                        <a href="user-profile.html" class="profile-menu-item">
                            <i class="fas fa-user"></i>
                            <span>My Profile</span>
                        </a>
                        <a href="settings.html" class="profile-menu-item">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                        <div class="profile-menu-divider"></div>
                        <a href="support.html" class="profile-menu-item">
                            <i class="fas fa-life-ring"></i>
                            <span>Help & Support</span>
                        </a>
                        <a href="#" class="profile-menu-item" onclick="smartPOSNavbar.logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </a>
                    </div>                </div>
            </div>` : '';        return `
            <header class="smart-pos-navbar" id="smartPOSNavbar">
                <div class="navbar-left">
                    <div class="hamburger-menu-icon" id="hamburgerMenuIcon" title="Menu">
                        <i class="fas fa-bars"></i>
                    </div>
                    ${backButton}
                    <div class="navbar-title" id="navbarTitle">${this.options.title}</div>
                </div>
                <div class="navbar-right">
                    ${customActions}
                    <div class="scan-button" id="navbarScanButton" title="Quick Scan">
                        <i class="fas fa-qrcode"></i>
                        <span class="scan-label">Scan</span>
                    </div>
                    ${notifications}
                    ${profile}
                </div>
            </header>
            
            <!-- Notification Panel -->
            <div class="navbar-notification-panel" id="navbarNotificationPanel">
                <div class="notification-panel-header">
                    <div class="notification-panel-title">Notifications</div>
                    <div class="close-notification-panel" id="closeNotificationPanel">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
                <div class="notification-panel-content" id="notificationPanelContent">
                    <!-- Notifications will be loaded here -->
                </div>
                <div class="notification-panel-footer">
                    <a href="notifications.html">View All Notifications</a>
                </div>
            </div>
            
            <!-- Notification Overlay -->
            <div class="navbar-notification-overlay" id="navbarNotificationOverlay"></div>
        `;
    }

    addNavbarStyles() {
        if (document.getElementById('smartPOSNavbarStyles')) return;

        const styles = document.createElement('style');
        styles.id = 'smartPOSNavbarStyles';
        styles.textContent = `
            /* Smart POS Navbar Styles */            .smart-pos-navbar {
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
            }            /* Add body padding to accommodate fixed navbar */
            body {
                padding-top: 80px !important;
                box-sizing: border-box;
            }.navbar-left {                display: flex;
                align-items: center;
                gap: 16px;
            }            .navbar-right {
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
                background: #007bff;
                color: white;
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(0,123,255,0.2);
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
                background: #007bff;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,123,255,0.2);
            }

            .navbar-notification-icon {
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
                font-size: 18px;
            }

            .navbar-notification-icon:hover {
                background: #007bff;
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,123,255,0.2);
            }

            .scan-button {
                position: relative;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: linear-gradient(135deg, #28a745, #20c997);
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: white;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
            }

            .scan-button:hover {
                background: linear-gradient(135deg, #20c997, #28a745);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            }

            .scan-button i {
                font-size: 16px;
            }

            .scan-label {
                font-size: 14px;
                font-weight: 600;
            }

            @media (max-width: 768px) {
                .scan-label {
                    display: none;
                }
                
                .scan-button {
                    padding: 10px;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    justify-content: center;
                }
            }

            .navbar-profile-icon {
                position: relative;
                cursor: pointer;
            }

            .navbar-profile-icon img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid #e9ecef;
                transition: all 0.3s ease;
            }

            .navbar-profile-icon:hover img {
                border-color: #007bff;
                transform: scale(1.05);
            }

            .profile-dropdown {
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

            .profile-dropdown.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .profile-dropdown-header {
                padding: 20px;
                background: linear-gradient(135deg, #007bff, #0056b3);
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
                color: #007bff;
            }

            .profile-menu-item i {
                width: 16px;
                color: #6c757d;
            }

            .profile-menu-item:hover i {
                color: #007bff;
            }

            .profile-menu-divider {
                height: 1px;
                background: #e9ecef;
                margin: 8px 0;
            }

            /* Notification Panel */
            .navbar-notification-panel {
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

            .navbar-notification-panel.active {
                right: 0;
            }

            .notification-panel-header {
                padding: 20px;
                background: linear-gradient(135deg, #007bff, #0056b3);
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
                color: #007bff;
                text-decoration: none;
                font-weight: 500;
            }

            .navbar-notification-overlay {
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

            .navbar-notification-overlay.active {
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
                background: #fff3cd;
                border-left: 4px solid #ffc107;
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
            }            /* Responsive Design */
            @media screen and (max-width: 768px) {
                .smart-pos-navbar {
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

                .navbar-notification-panel {
                    width: 100%;
                    right: -100%;
                    top: 70px;
                    height: calc(100vh - 70px);
                }

                .profile-dropdown {
                    right: -20px;
                    min-width: 220px;
                }
            }
            
            /* Notification dot indicator */
            .navbar-notification-dot {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 8px;
                height: 8px;
                background: #dc3545;
                border-radius: 50%;
                border: 2px solid white;
                display: none;
                animation: pulse-dot 2s infinite;
            }
            
            .navbar-notification-dot.show {
                display: block;
            }
            
            @keyframes pulse-dot {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 0.8;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            /* Hide old notification badge completely */
            .navbar-notification-badge {
                display: none !important;
            }
        `;
        document.head.appendChild(styles);    }    attachEventListeners() {
        // Load user profile data after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.loadUserProfile();
        }, 50);
        
        // Hamburger menu icon
        const hamburgerMenuIcon = document.getElementById('hamburgerMenuIcon');
        if (hamburgerMenuIcon) {
            hamburgerMenuIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.smartPOSMenu && typeof window.smartPOSMenu.toggleMenuFromNavbar === 'function') {
                    window.smartPOSMenu.toggleMenuFromNavbar();
                }
            });
        }

        // Back button
        const backButton = document.getElementById('navbarBackButton');
        if (backButton) {
            backButton.addEventListener('click', () => {
                if (this.options.backUrl) {
                    window.location.href = this.options.backUrl;
                } else {
                    window.history.back();
                }
            });
        }

        // Scan button
        const scanButton = document.getElementById('navbarScanButton');
        if (scanButton) {
            scanButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleScanButtonClick();
            });
        }

        // Notification icon
        const notificationIcon = document.getElementById('navbarNotificationIcon');
        const notificationPanel = document.getElementById('navbarNotificationPanel');
        const notificationOverlay = document.getElementById('navbarNotificationOverlay');
        const closeNotificationPanel = document.getElementById('closeNotificationPanel');

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
        const profileIcon = document.getElementById('navbarProfileIcon');
        const profileDropdown = document.getElementById('navbarProfileDropdown');

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

    loadUserProfile() {
        // Check if auth service is available
        if (window.authService && window.authService.isLoggedIn()) {
            const user = window.authService.getUser();
            if (user) {
                // Update profile name and email with real user data
                const profileNameElement = document.getElementById('navbarProfileName');
                const profileEmailElement = document.getElementById('navbarProfileEmail');
                
                if (profileNameElement) {
                    // Use fullName if available, otherwise construct from firstName and lastName
                    const displayName = user.fullName || 
                                       (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName) ||
                                       user.username || 
                                       'User';
                    profileNameElement.textContent = displayName;
                }
                
                if (profileEmailElement) {
                    profileEmailElement.textContent = user.email || 'No email';
                }
                
                console.log('User profile loaded:', { name: user.fullName || user.username, email: user.email });
            } else {
                console.warn('User data not found in auth service');
                // Set fallback values
                const profileNameElement = document.getElementById('navbarProfileName');
                const profileEmailElement = document.getElementById('navbarProfileEmail');
                
                if (profileNameElement) profileNameElement.textContent = 'Guest User';
                if (profileEmailElement) profileEmailElement.textContent = 'Not logged in';
            }
        } else {
            console.warn('Auth service not available or user not logged in');
            // Set fallback values
            const profileNameElement = document.getElementById('navbarProfileName');
            const profileEmailElement = document.getElementById('navbarProfileEmail');
            
            if (profileNameElement) profileNameElement.textContent = 'Guest User';
            if (profileEmailElement) profileEmailElement.textContent = 'Not logged in';
        }
    }

    // Public method to refresh user profile (can be called from outside)
    refreshUserProfile() {
        this.loadUserProfile();
    }

    loadNotifications() {
        const content = document.getElementById('notificationPanelContent');
        if (!content) return;

        // Sample notifications for Nepali POS system
        const notifications = [
            {
                type: 'critical',
                icon: 'exclamation-circle',
                title: 'Critical Stock Alert',
                message: 'Wai Wai Noodles - Only 2 packets left in stock',
                time: '2 minutes ago',
                unread: true
            },
            {
                type: 'warning',
                icon: 'exclamation-triangle',
                title: 'Low Stock Warning',
                message: 'Dettol Soap - 8 units remaining, consider restocking',
                time: '15 minutes ago',
                unread: true
            },
            {
                type: 'success',
                icon: 'check-circle',
                title: 'Sale Completed',
                message: 'Transaction #TXN-2024-1125 - NPR 450 processed successfully',
                time: '30 minutes ago',
                unread: false
            },
            {
                type: 'info',
                icon: 'credit-card',
                title: 'Mobile Recharge',
                message: 'Ncell Recharge Card Rs.100 processed successfully',
                time: '1 hour ago',
                unread: false
            },
            {
                type: 'warning',
                icon: 'exclamation-triangle',
                title: 'Daily Backup Reminder',
                message: 'Remember to backup your sales data at end of day',
                time: '2 hours ago',
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
        
        // Count unread notifications and show dot if any
        const unreadCount = notifications.filter(n => n.unread).length;
        this.updateNotificationCount(unreadCount);
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('navbarNotificationPanel');
        const overlay = document.getElementById('navbarNotificationOverlay');
        
        panel?.classList.toggle('active');
        overlay?.classList.toggle('active');
        
        if (panel?.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            // When notification panel is opened, hide the red dot (mark as viewed)
            this.showNotificationDot(false);
            this.notificationCount = 0;
        } else {
            document.body.style.overflow = '';
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('navbarNotificationPanel');
        const overlay = document.getElementById('navbarNotificationOverlay');
        
        panel?.classList.remove('active');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    toggleProfileDropdown() {
        const dropdown = document.getElementById('navbarProfileDropdown');
        dropdown?.classList.toggle('active');
    }

    closeProfileDropdown() {
        const dropdown = document.getElementById('navbarProfileDropdown');
        dropdown?.classList.remove('active');
    }

    handleCustomAction(actionId) {
        // Emit custom event for handling by parent application
        window.dispatchEvent(new CustomEvent('navbarAction', { 
            detail: { actionId }        }));
    }

    updateTitle(newTitle) {
        this.options.title = newTitle;
        const titleElement = document.getElementById('navbarTitle');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }

    updateNotificationCount(count) {
        this.notificationCount = count;
        const dot = document.getElementById('navbarNotificationDot');
        const badge = document.getElementById('navbarNotificationBadge');
        
        if (dot) {
            // Show red dot if there are any notifications, hide if none
            if (count > 0) {
                dot.classList.add('show');
            } else {
                dot.classList.remove('show');
            }
        }
        
        // Always hide the old badge system
        if (badge) {
            badge.style.display = 'none';
        }
    }

    // Logout function with custom confirmation
    async logout() {
        const confirmLogout = await customConfirm({
            title: 'Logout Confirmation',
            message: 'Are you sure you want to logout? You will need to sign in again to access your account.',
            confirmText: 'Logout',
            cancelText: 'Cancel',
            type: 'warning'
        });

        if (confirmLogout) {
            try {
                // Use auth service for logout if available
                if (window.authService && typeof window.authService.logout === 'function') {
                    window.authService.logout();
                } else {
                    // Fallback to basic logout
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Redirect to landing page
                    window.location.href = '../landing.html';
                }
            } catch (error) {
                console.error('Error during logout:', error);
                // Still proceed with logout even if there's an error
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../landing.html';
            }
        }
    }

    // Helper function to show/hide notification dot
    showNotificationDot(show = true) {
        const dot = document.getElementById('navbarNotificationDot');
        if (dot) {
            if (show) {
                dot.classList.add('show');
            } else {
                dot.classList.remove('show');
            }
        }
    }

    // Helper function to check if there are unread notifications
    hasUnreadNotifications() {
        return this.notificationCount > 0;
    }

    handleScanButtonClick() {
        // Open scan options dialog
        this.showSmartScanDialog();
    }

    showSmartScanDialog() {
        // Remove any existing scan dialog
        const existingDialog = document.getElementById('smartScanDialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Create scan dialog overlay
        const overlay = document.createElement('div');
        overlay.id = 'smartScanDialog';
        overlay.className = 'smart-scan-overlay';

        // Create dialog content
        const dialog = document.createElement('div');
        dialog.className = 'smart-scan-dialog';

        dialog.innerHTML = `
            <div class="scan-dialog-header">
                <h3><i class="fas fa-qrcode"></i> Smart Scanner</h3>
                <button class="close-scan-dialog" id="closeScanDialog">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="scan-dialog-content">
                <p>Choose what you want to scan:</p>
                <div class="scan-options">
                    <div class="scan-option" data-scan-type="barcode">
                        <div class="scan-option-icon">
                            <i class="fas fa-barcode"></i>
                        </div>
                        <div class="scan-option-content">
                            <h4>Product Scanner</h4>
                            <p>Scan product barcodes for quick checkout or inventory</p>
                        </div>
                        <div class="scan-option-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                    <div class="scan-option" data-scan-type="bill">
                        <div class="scan-option-icon">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div class="scan-option-content">
                            <h4>Bill Scanner</h4>
                            <p>Scan supplier bills and invoices for inventory updates</p>
                        </div>
                        <div class="scan-option-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Add CSS for the dialog
        this.addScanDialogStyles();

        // Show with animation
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);

        // Setup event listeners for scan options
        const closeBtn = overlay.querySelector('#closeScanDialog');
        closeBtn?.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            }
        });
        // Scan option clicks: redirect to scanner page with correct mode
        overlay.querySelectorAll('.scan-option').forEach(option => {
            option.addEventListener('click', () => {
                const scanType = option.dataset.scanType;
                window.location.href = `/frontend/mobile-scanner.html?mode=${scanType}`;
            });
        });
    }

    addScanDialogStyles() {
        if (document.getElementById('smartScanDialogStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'smartScanDialogStyles';
        styles.textContent = `
            .smart-scan-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .smart-scan-overlay.show {
                opacity: 1;
            }
            
            .smart-scan-dialog {
                background: white;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .smart-scan-overlay.show .smart-scan-dialog {
                transform: scale(1);
            }
            
            .scan-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid #e9ecef;
            }
            
            .scan-dialog-header h3 {
                margin: 0;
                color: #2c3e50;
                font-size: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .close-scan-dialog {
                background: none;
                border: none;
                font-size: 18px;
                color: #6c757d;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .close-scan-dialog:hover {
                background: #f8f9fa;
                color: #2c3e50;
            }
            
            .scan-dialog-content {
                padding: 24px;
            }
            
            .scan-dialog-content p {
                margin: 0 0 20px 0;
                color: #6c757d;
            }
            
            .scan-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .scan-option {
                display: flex;
                align-items: center;
                padding: 16px;
                border: 2px solid #e9ecef;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                gap: 16px;
            }
            
            .scan-option:hover {
                border-color: #007bff;
                background: #f8f9ff;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
            }
            
            .scan-option-icon {
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #007bff, #0056b3);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 20px;
            }
            
            .scan-option[data-scan-type="bill"] .scan-option-icon {
                background: linear-gradient(135deg, #28a745, #1e7e34);
            }
            
            .scan-option-content {
                flex: 1;
            }
            
            .scan-option-content h4 {
                margin: 0 0 4px 0;
                color: #2c3e50;
                font-size: 16px;
            }
            
            .scan-option-content p {
                margin: 0;
                color: #6c757d;
                font-size: 14px;
            }
            
            .scan-option-arrow {
                color: #007bff;
                font-size: 16px;
            }
            
            .scan-connection-info {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 16px;
                text-align: center;
            }
            
            .connection-status {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                color: #6c757d;
                font-size: 14px;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #dc3545;
                animation: pulse 2s infinite;
            }
            
            .status-dot.connecting {
                background: #ffc107;
                animation: pulse 1s infinite;
            }
            
            .status-dot.connected {
                background: #28a745;
                animation: none;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        
        document.head.appendChild(styles);
    }

    setupScanDialogEvents(overlay) {
        // Close dialog events
        const closeBtn = overlay.querySelector('#closeScanDialog');
        closeBtn?.addEventListener('click', () => {
            this.closeScanDialog(overlay);
        });
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeScanDialog(overlay);
            }
        });
        
        // Scan option clicks
        const scanOptions = overlay.querySelectorAll('.scan-option');
        scanOptions.forEach(option => {
            option.addEventListener('click', () => {
                const scanType = option.dataset.scanType;
                this.openMobileScanner(scanType);
                this.closeScanDialog(overlay);
            });
        });
        
        // ESC key to close
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeScanDialog(overlay);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    closeScanDialog(overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }


    openMobileScanner(scanType) {
        // Generate room code and token
        const roomCode = 'SC' + Math.floor(100000 + Math.random() * 900000);
        const token = this.generateSecureToken();
        
        // Create mobile scanner URL - ensure we use the correct path relative to the server root
        const baseUrl = window.location.origin;
        // Get the correct path by removing the current path and adding mobile-scanner.html
        // This ensures it works regardless of which page we're currently on
        const returnUrl = encodeURIComponent(window.location.href);
        const mobileUrl = `${baseUrl}/frontend/mobile-scanner.html?room=${encodeURIComponent(roomCode)}&mode=${scanType}&token=${encodeURIComponent(token)}&returnUrl=${returnUrl}`;
        
        // Check if user is on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // On mobile, redirect to scanner
            window.location.href = mobileUrl;
        } else {
            // On desktop, show QR code for connecting mobile
            this.showDesktopScannerDialog(roomCode, mobileUrl, scanType, token);
        }
    }
}

/**
 * Legacy Compatible Smart POS Navbar
 * This class extends the SmartPOSNavbar to provide compatibility with older versions
 */
class LegacyCompatibleSmartPOSNavbar extends SmartPOSNavbar {
    handleCustomAction(actionId) {
        // Emit event in legacy format with 'action' instead of 'actionId'
        window.dispatchEvent(new CustomEvent('navbarAction', { 
            detail: { action: actionId }  // Legacy format
        }));
    }
}

// Global instance and convenience functions
let smartPOSNavbar = null;

function initSmartPOSNavbar(optionsOrTitle = {}, legacyActions = null) {
    // Destroy existing instance if any
    if (smartPOSNavbar) {
        smartPOSNavbar.destroy();
    }
    
    let options;
    let isLegacyAPI = false;
    
    // Check if this is the legacy API call: initSmartPOSNavbar('Title', [actions])
    if (typeof optionsOrTitle === 'string' && Array.isArray(legacyActions)) {
        // Legacy API - convert to new format
        isLegacyAPI = true;
        options = {
            title: optionsOrTitle,
            customActions: legacyActions.map(action => ({
                id: action.action,  // Map legacy 'action' to 'id'
                icon: action.icon,
                title: action.label || action.title
            }))
        };
    } else {
        // New API - use options object directly
        options = optionsOrTitle;
    }
    
    // Create new instance with modified SmartPOSNavbar for legacy compatibility
    if (isLegacyAPI) {
        smartPOSNavbar = new LegacyCompatibleSmartPOSNavbar(options);
    } else {
        smartPOSNavbar = new SmartPOSNavbar(options);
    }
    
    // Make it globally accessible
    window.smartPOSNavbar = smartPOSNavbar;
    
    return smartPOSNavbar;
}

// Auto-initialize on DOM load if not manually initialized
document.addEventListener('DOMContentLoaded', () => {
    // Only auto-initialize if not already done
    if (!smartPOSNavbar && !window.navbarManualInit) {
        // Auto-detect page and set appropriate title
        const pageTitle = document.title.replace('Smart POS - ', '') || 'Dashboard';
        initSmartPOSNavbar({ title: pageTitle });
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SmartPOSNavbar, initSmartPOSNavbar };
}
