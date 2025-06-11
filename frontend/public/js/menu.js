/**
 * Professional Reusable Menu Component with Minimize/Maximize
 * Smart POS System
 */

class SmartPOSMenu {
    constructor() {
        this.isMenuOpen = false;
        this.isDesktop = window.innerWidth >= 1024;
        this.init();
    }    init() {
        // Always ensure body can scroll on page load
        document.body.style.overflow = '';
        
        this.createMenuHTML();
        this.attachEventListeners();
        this.setActiveMenuItem();
        this.handleResponsive();
        
        // Restore menu state immediately to prevent animation flicker
        this.restoreMenuState();
        
        // Notify navbar that menu is ready
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('menuReady'));
        }, 100);
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
            '<div class="menu-overlay" id="menuOverlay"></div>' +            '<!-- Side Menu -->' +
            '<div class="side-menu" id="sideMenu">' +                '<div class="menu-items" id="menuItems">' +
                    '<a href="dashboard.html" class="menu-item" data-page="dashboard">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-tachometer-alt"></i>' +
                        '</div>' +
                        '<div class="menu-text">Dashboard</div>' +
                    '</a>' +
                    '<a href="pos.html" class="menu-item" data-page="pos">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-cash-register"></i>' +
                        '</div>' +
                        '<div class="menu-text">POS</div>' +
                    '</a>' +
                    '<a href="inventory.html" class="menu-item" data-page="inventory">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-boxes"></i>' +
                        '</div>' +
                        '<div class="menu-text">Inventory</div>' +
                    '</a>' +
                    '<a href="products.html" class="menu-item" data-page="products">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-tag"></i>' +
                        '</div>' +
                        '<div class="menu-text">Products</div>' +
                    '</a>' +
                    '<a href="customers.html" class="menu-item" data-page="customers">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-users"></i>' +
                        '</div>' +
                        '<div class="menu-text">Customers</div>' +
                    '</a>' +
                    '<a href="suppliers.html" class="menu-item" data-page="suppliers">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-truck"></i>' +
                        '</div>' +
                        '<div class="menu-text">Suppliers</div>' +                    '</a>' +
                    '<a href="transactions.html" class="menu-item" data-page="transactions">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-receipt"></i>' +
                        '</div>' +
                        '<div class="menu-text">Transactions</div>' +
                    '</a>' +
                    '<a href="report.html" class="menu-item" data-page="report">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-chart-bar"></i>' +
                        '</div>' +
                        '<div class="menu-text">Reports</div>' +
                    '</a>' +
                    '<a href="settings.html" class="menu-item" data-page="settings">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-cog"></i>' +
                        '</div>' +
                        '<div class="menu-text">Settings</div>' +
                    '</a>' +
                    '<a href="#" class="menu-item" data-page="logout" onclick="smartPOSMenu.logout(); return false;">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-sign-out-alt"></i>' +
                        '</div>' +
                        '<div class="menu-text">Logout</div>' +
                    '</a>' +
                '</div>' +
            '</div>';
        
        menuContainer.innerHTML = menuHTML;
    }    attachEventListeners() {        const menuOverlay = document.getElementById('menuOverlay');

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
        // Toggle open/close for all screen sizes with animation
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu(true); // true = show animation
        }
    }

    // Public method to toggle menu from navbar
    toggleMenuFromNavbar() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu(true); // true = show animation
        }
    }

    openMenu(withAnimation = false) {
        // Prevent multiple simultaneous calls
        if (this.isMenuOpen) {
            return;
        }
        
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            // Set state first to prevent race conditions
            this.isMenuOpen = true;
            
            // Add or remove animation class based on parameter
            if (withAnimation) {
                sideMenu.classList.add('with-animation');
            } else {
                sideMenu.classList.remove('with-animation');
            }
            
            sideMenu.classList.add('open');
            menuOverlay.classList.add('active');
            
            // Only prevent scrolling on mobile devices when overlay covers content
            if (!this.isDesktop) {
                document.body.style.overflow = 'hidden';
            } else {
                // On desktop, always allow scrolling
                document.body.style.overflow = '';
            }
            
            // Adjust main content margin when menu opens
            this.adjustMainContentMargin();
            
            // Save state and notify navbar
            this.saveMenuState();
            this.notifyNavbarStateChange();
        } else {
            this.isMenuOpen = false; // Reset state on failure
        }
    }    closeMenu() {
        // Prevent multiple simultaneous calls
        if (!this.isMenuOpen) {
            return;
        }
        
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            // Set state first to prevent race conditions
            this.isMenuOpen = false;
            
            // Remove both open and animation classes
            sideMenu.classList.remove('open');
            sideMenu.classList.remove('with-animation');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            // Remove main content margin when menu closes
            this.adjustMainContentMargin();
            
            // Save state and notify navbar
            this.saveMenuState();
            this.notifyNavbarStateChange();
        } else {
            this.isMenuOpen = true; // Reset state on failure
        }
    }    restoreMenuState() {
        // Always ensure body can scroll initially
        document.body.style.overflow = '';
        
        // Check if menu should be restored to open state
        const savedState = localStorage.getItem('menuState');
        if (savedState === 'open') {
            // Restore open state without animation immediately
            this.restoreMenuOpenState();
        } else {
            // Ensure menu starts closed
            this.isMenuOpen = false;
            this.ensureMenuClosed();
        }
    }

    restoreMenuOpenState() {
        // Direct state restoration without animations
        this.isMenuOpen = true;
        
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            // Remove any animation class first
            sideMenu.classList.remove('with-animation');
            
            // Add open classes immediately
            sideMenu.classList.add('open');
            menuOverlay.classList.add('active');
            
            // Handle overflow based on screen size
            if (!this.isDesktop) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
            
            // Adjust main content margin
            this.adjustMainContentMargin();
            
            // Notify navbar about state
            this.notifyNavbarStateChange();
        }
    }

    ensureMenuClosed() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            sideMenu.classList.remove('open', 'with-animation');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
            this.adjustMainContentMargin();
        }
    }saveMenuState() {
        // Save current menu state for persistence across pages
        localStorage.setItem('menuState', this.isMenuOpen ? 'open' : 'closed');
    }    notifyNavbarStateChange() {
        // Notify navbar about menu state change
        window.dispatchEvent(new CustomEvent('menuStateChanged', { 
            detail: { isOpen: this.isMenuOpen } 
        }));
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
        
        // Don't automatically close menu on page load
        // Let restoreMenuState() handle the initial state
        
        // On window resize, respect current menu state
        if (this.isMenuOpen) {
            // If menu is open, ensure proper styling for current screen size
            const sideMenu = document.getElementById('sideMenu');
            const menuOverlay = document.getElementById('menuOverlay');
            
            if (sideMenu) {
                sideMenu.classList.add('open');
                // Don't add animation class during responsive handling
                sideMenu.classList.remove('with-animation');
            }
            if (menuOverlay) {
                menuOverlay.classList.add('active');
            }
            
            // Handle overflow based on screen size
            if (!this.isDesktop) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        } else {
            // If menu is closed, ensure it's properly hidden
            const sideMenu = document.getElementById('sideMenu');
            const menuOverlay = document.getElementById('menuOverlay');
            
            if (sideMenu) {
                sideMenu.classList.remove('open');
                sideMenu.classList.remove('with-animation');
            }
            if (menuOverlay) {
                menuOverlay.classList.remove('active');
            }
            
            document.body.style.overflow = '';
        }
        
        // Always adjust main content margin based on current state
        this.adjustMainContentMargin();
    }adjustMainContentMargin() {
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
    }    logout() {
        // Show confirmation dialog
        if (confirm('Are you sure you want to logout?')) {
            // Use auth service for logout if available
            if (window.authService) {
                window.authService.logout();
            } else {
                // Fallback to basic logout
                localStorage.clear();
                sessionStorage.clear();
                
                // Redirect to landing page
                window.location.href = '../landing.html';
            }
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
