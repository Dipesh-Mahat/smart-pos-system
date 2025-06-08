/**
 * Professional Reusable Menu Component with Minimize/Maximize
 * Smart POS System
 */

class SmartPOSMenu {
    constructor() {
        this.isMenuOpen = false;
        this.isDesktop = window.innerWidth >= 1024;
        this.init();
    }

    init() {
        this.createMenuHTML();
        this.attachEventListeners();
        this.setActiveMenuItem();
        this.handleResponsive();
    }

    createMenuHTML() {
        // Find or create menu container
        let menuContainer = document.getElementById('menuContainer');
        if (!menuContainer) {
            menuContainer = document.createElement('div');
            menuContainer.id = 'menuContainer';
            document.body.insertBefore(menuContainer, document.body.firstChild);
        }        // Create menu HTML structure
        const menuHTML = 
            '<!-- Menu Toggle Button -->' +
            '<div class="menu-toggle-btn" id="menuToggleBtn">' +
                '<i class="fas fa-bars" id="menuToggleIcon"></i>' +
            '</div>' +
            '<!-- Menu Overlay for Mobile -->' +
            '<div class="menu-overlay" id="menuOverlay"></div>' +
            '<!-- Side Menu -->' +
            '<div class="side-menu" id="sideMenu">' +                '<div class="menu-header">' +
                    '<div class="menu-controls">' +
                        '<div class="close-menu" id="closeMenu" title="Close Menu">' +
                            '<i class="fas fa-times"></i>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="menu-items" id="menuItems">' +
                    '<div class="menu-item" data-page="dashboard">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-tachometer-alt"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="dashboard.html">Dashboard</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="pos">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-cash-register"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="pos.html">POS</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="inventory">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-boxes"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="inventory.html">Inventory</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="products">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-tag"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="products.html">Products</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="customers">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-users"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="customers.html">Customers</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="suppliers">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-truck"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="suppliers.html">Suppliers</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="transactions">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-receipt"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="transactions.html">Transactions</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="report">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-chart-bar"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="report.html">Reports</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="settings">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-cog"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="settings.html">Settings</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="menu-item" data-page="logout">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-sign-out-alt"></i>' +
                        '</div>' +
                        '<div class="menu-text">' +
                            '<a href="#" onclick="smartPOSMenu.logout()">Logout</a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        menuContainer.innerHTML = menuHTML;
    }    attachEventListeners() {
        const menuToggleBtn = document.getElementById('menuToggleBtn');
        const closeMenu = document.getElementById('closeMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        // Toggle menu open/close
        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu
        if (closeMenu) {
            closeMenu.addEventListener('click', () => this.closeMenu());
        }

        // Close menu when clicking overlay
        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => this.closeMenu());
        }

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
            }
        });

        // Handle responsive behavior
        window.addEventListener('resize', () => this.handleResponsive());
    }    toggleMenu() {
        // Toggle open/close for all screen sizes
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }    openMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('active');
            this.isMenuOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    closeMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
            this.isMenuOpen = false;
            document.body.style.overflow = '';
        }
    }

    setActiveMenuItem() {
        // Get current page name from URL
        const currentPage = this.getCurrentPageName();
        
        // Remove active class from all menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => item.classList.remove('active'));

        // Add active class to current page menu item
        const activeMenuItem = document.querySelector('[data-page="' + currentPage + '"]');
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        const page = path.split('/').pop();
        
        // Remove .html extension and return page name
        if (page && page.includes('.html')) {
            return page.replace('.html', '');
        }
        
        // Default to dashboard if no specific page
        return 'dashboard';
    }    handleResponsive() {
        this.isDesktop = window.innerWidth >= 1024;
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const menuToggleBtn = document.getElementById('menuToggleBtn');
        const closeMenu = document.getElementById('closeMenu');

        if (this.isDesktop) {
            // Desktop: Always show menu
            if (sideMenu) {
                sideMenu.classList.add('open');
                sideMenu.classList.remove('mobile');
            }
            if (menuOverlay) {
                menuOverlay.classList.remove('active');
            }
            if (menuToggleBtn) {
                menuToggleBtn.style.display = 'none'; // Hide hamburger on desktop
            }
            if (closeMenu) {
                closeMenu.style.display = 'none'; // Hide close button on desktop
            }
            document.body.style.overflow = '';
            this.isMenuOpen = true;
            
            // Adjust main content margin
            this.adjustMainContentMargin();
        } else {
            // Mobile: Show hamburger and close buttons
            if (sideMenu) {
                sideMenu.classList.add('mobile');
                if (!this.isMenuOpen) {
                    sideMenu.classList.remove('open');
                }
            }
            if (menuToggleBtn) {
                menuToggleBtn.style.display = 'block';
            }
            if (closeMenu) {
                closeMenu.style.display = 'block';
            }
        }
    }    adjustMainContentMargin() {
        const mainContent = document.querySelector('.main-content') || 
                          document.querySelector('main') || 
                          document.querySelector('.content') ||
                          document.querySelector('.container');
        
        if (mainContent && this.isDesktop) {
            mainContent.style.marginLeft = '300px';
            mainContent.style.transition = 'margin-left 0.3s ease';
        } else if (mainContent) {
            mainContent.style.marginLeft = '0';
        }
    }

    logout() {
        // Show confirmation dialog
        if (confirm('Are you sure you want to logout?')) {
            // Clear user session data
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            sessionStorage.clear();
            
            // Redirect to landing page
            window.location.href = '../landing.html';
        }
    }
}

// Initialize menu when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global menu instance
    window.smartPOSMenu = new SmartPOSMenu();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartPOSMenu;
}
