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
        
        // Set initial state based on screen size
        if (this.isDesktop) {
            // Desktop: menu open by default
            this.isMenuOpen = true;
            const sideMenu = document.getElementById('sideMenu');
            if (sideMenu) {
                sideMenu.style.transition = 'none';
                sideMenu.classList.add('open');
                sideMenu.style.left = '0';
                sideMenu.style.opacity = '1';
                sideMenu.style.transform = 'translateX(0)';
                sideMenu.style.visibility = 'visible';
                
                // Re-enable transitions after a brief delay
                setTimeout(() => {
                    sideMenu.style.transition = '';
                }, 50);
            }
        } else {
            // Mobile: restore saved state
            this.restoreMenuState();
        }
        
        // Adjust content
        this.adjustMainContentMargin();
        
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
                        '<div class="menu-text">Products</div>' +                    '</a>' +
                    '<a href="suppliers.html" class="menu-item" data-page="suppliers">' +
                        '<div class="menu-icon-folder">' +
                            '<i class="fas fa-truck"></i>' +
                        '</div>' +
                        '<div class="menu-text">Suppliers</div>' +'</a>' +
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
    }    openMenu(withAnimation = false) {
        // Prevent multiple simultaneous calls
        if (this.isMenuOpen) {
            return;
        }
        
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            // Set state first to prevent race conditions
            this.isMenuOpen = true;
            
            // Remove closing class and ensure visibility is set before opening
            sideMenu.classList.remove('closing');
            sideMenu.style.visibility = 'visible';
            
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
            
            // Add closing class for fast transition
            sideMenu.classList.add('closing');
            
            // Remove open and animation classes
            sideMenu.classList.remove('open');
            sideMenu.classList.remove('with-animation');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            // Remove main content margin when menu closes
            this.adjustMainContentMargin();
            
            // Save state and notify navbar
            this.saveMenuState();
            this.notifyNavbarStateChange();
              // Remove closing class and set visibility after fast transition
            setTimeout(() => {
                if (!this.isMenuOpen) {
                    sideMenu.style.visibility = 'hidden';
                    sideMenu.classList.remove('closing');
                }
            }, 100); // Match the faster closing transition duration
        } else {
            this.isMenuOpen = true; // Reset state on failure
        }
    }restoreMenuState() {
        // Always ensure body can scroll initially
        document.body.style.overflow = '';
        
        // Only handle saved state for mobile devices
        if (!this.isDesktop) {
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
    }    ensureMenuClosed() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');

        if (sideMenu && menuOverlay) {
            sideMenu.classList.add('closing');
            sideMenu.classList.remove('open', 'with-animation');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
            this.adjustMainContentMargin();
              // Add a small delay to ensure the fast transition completes before setting visibility
            setTimeout(() => {
                // If menu is still closed (not reopened during timeout)
                if (!this.isMenuOpen) {
                    sideMenu.style.visibility = 'hidden';
                    sideMenu.classList.remove('closing');
                }
            }, 100); // Match the faster closing transition duration
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
        const wasDesktop = this.isDesktop;
        this.isDesktop = window.innerWidth >= 1024;
        
        // If switching between desktop and mobile
        if (wasDesktop !== this.isDesktop) {
            const sideMenu = document.getElementById('sideMenu');
            const menuOverlay = document.getElementById('menuOverlay');
            
            if (this.isDesktop) {
                // Switching to desktop - show menu by default
                this.isMenuOpen = true;                if (sideMenu) {
                    sideMenu.style.transition = 'none'; // Disable transition for immediate change
                    sideMenu.classList.remove('closing'); // Remove any closing class
                    sideMenu.classList.add('open');
                    sideMenu.style.visibility = 'visible';
                    sideMenu.style.left = '0';
                    sideMenu.style.opacity = '1';
                    sideMenu.style.transform = 'translateX(0)';
                    
                    // Re-enable transitions after a brief delay
                    setTimeout(() => {
                        sideMenu.style.transition = '';
                    }, 50);
                }
                if (menuOverlay) {
                    menuOverlay.classList.remove('active');
                }
                document.body.style.overflow = '';
            } else {
                // Switching to mobile - respect saved state
                const savedState = localStorage.getItem('menuState');
                this.isMenuOpen = savedState === 'open';
                  if (sideMenu) {
                    if (this.isMenuOpen) {
                        sideMenu.classList.remove('closing');
                        sideMenu.classList.add('open');
                        sideMenu.style.visibility = 'visible';
                        document.body.style.overflow = 'hidden';
                    } else {
                        sideMenu.classList.add('closing');
                        sideMenu.classList.remove('open');
                        sideMenu.style.visibility = 'hidden';                        document.body.style.overflow = '';
                        // Remove closing class after transition
                        setTimeout(() => {
                            sideMenu.classList.remove('closing');
                        }, 100);
                    }
                }
                if (menuOverlay) {
                    if (this.isMenuOpen) {
                        menuOverlay.classList.add('active');
                    } else {
                        menuOverlay.classList.remove('active');
                    }
                }
            }
        }
        
        // Always adjust main content margin based on current state
        this.adjustMainContentMargin();
        this.saveMenuState();
        this.notifyNavbarStateChange();
    }adjustMainContentMargin() {
        const mainContent = document.querySelector('.main-content') || 
                          document.querySelector('main') || 
                          document.querySelector('.content') ||
                          document.querySelector('.container');
        
        if (mainContent) {
            if (this.isDesktop && this.isMenuOpen) {
                mainContent.style.marginLeft = '300px';
                document.body.classList.remove('menu-closed');
                document.body.classList.add('menu-open');
            } else {
                mainContent.style.marginLeft = '0';
                document.body.classList.remove('menu-open');
                document.body.classList.add('menu-closed');
            }
            mainContent.style.transition = 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    }logout() {
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
