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
            document.body.insertBefore(menuContainer, document.body.firstChild);        }        // Create menu HTML structure
        const menuHTML = 
            '<!-- Menu Overlay for Mobile -->' +
            '<div class="menu-overlay" id="menuOverlay"></div>' +
            '<!-- Side Menu -->' +
            '<div class="side-menu" id="sideMenu">' +                '<div class="menu-header">' +
                    '<div class="menu-controls">' +
                        '<div class="minimize-menu" id="minimizeMenu" title="Minimize Menu">' +
                            '<i class="fas fa-angle-double-left"></i>' +
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
        const minimizeMenu = document.getElementById('minimizeMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        // Minimize menu
        if (minimizeMenu) {
            minimizeMenu.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Minimize button clicked');
                this.closeMenu();
            });
            console.log('Minimize menu event listener attached');
        } else {
            console.error('Minimize menu element not found!');
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
            this.openMenu();        }
    }    // Public method to toggle menu from navbar
    toggleMenuFromNavbar() {
        console.log('toggleMenuFromNavbar called, isMenuOpen:', this.isMenuOpen);
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }    openMenu() {
        console.log('Opening menu...');
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('active');
            this.isMenuOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Adjust main content margin when menu opens
            this.adjustMainContentMargin();
            
            // Notify navbar about menu state change
            this.notifyNavbarStateChange();
            console.log('Menu opened successfully');
        } else {
            console.error('Menu elements not found:', { sideMenu, menuOverlay });
        }
    }

    closeMenu() {
        console.log('Closing menu...');
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
            this.isMenuOpen = false;
            document.body.style.overflow = '';
            
            // Remove main content margin when menu closes
            this.adjustMainContentMargin();
            
            // Notify navbar about menu state change
            this.notifyNavbarStateChange();
            console.log('Menu closed successfully');
        } else {
            console.error('Menu elements not found:', { sideMenu, menuOverlay });
        }
    }

    notifyNavbarStateChange() {
        // Update hamburger menu visibility in navbar
        const hamburgerMenu = document.getElementById('navbarHamburgerMenu');
        if (hamburgerMenu) {
            if (this.isMenuOpen) {
                hamburgerMenu.style.display = 'none';
            } else {
                hamburgerMenu.style.display = 'flex';
            }
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
        return 'dashboard';    }    handleResponsive() {
        this.isDesktop = window.innerWidth >= 1024;
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const minimizeMenu = document.getElementById('minimizeMenu');

        // Always start with menu closed (hamburger visible)
        if (sideMenu) {
            sideMenu.classList.remove('open');
        }
        if (menuOverlay) {
            menuOverlay.classList.remove('active');
        }
        
        // Reset menu state to closed
        this.isMenuOpen = false;
        document.body.style.overflow = '';
        
        // Remove main content margin since menu starts closed
        this.adjustMainContentMargin();
    }    adjustMainContentMargin() {
        const mainContent = document.querySelector('.main-content') || 
                          document.querySelector('main') || 
                          document.querySelector('.content') ||
                          document.querySelector('.container');
        
        if (mainContent) {
            if (this.isDesktop && this.isMenuOpen) {
                mainContent.style.marginLeft = '300px';
            } else {
                mainContent.style.marginLeft = '0';
            }
            mainContent.style.transition = 'margin-left 0.3s ease';
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
    // Create global menu instance only if it doesn't exist
    if (!window.smartPOSMenu) {
        window.smartPOSMenu = new SmartPOSMenu();
        console.log('SmartPOSMenu initialized');
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartPOSMenu;
}
