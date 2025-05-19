// Sidebar navigation functionality
function initializeSidebar() {
    const menuIcon = document.getElementById('menuIcon');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    // Toggle menu
    menuIcon.addEventListener('click', function() {
        sideMenu.classList.toggle('open');
        menuOverlay.classList.toggle('active');
    });
    
    // Close menu when clicking overlay
    menuOverlay.addEventListener('click', function() {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
    });

    // Menu item click events
    document.querySelectorAll('.menu-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const menuText = this.querySelector('.menu-text').textContent;
            const href = getMenuItemHref(menuText);
            if (href) {
                window.location.href = href;
            }
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
        });
    });
}

// Map menu items to their corresponding pages
function getMenuItemHref(menuText) {
    const menuMap = {
        'Dashboard': 'index.html',
        'Sales Management': 'sales.html',
        'Inventory': 'inventory.html',
        'Transactions': 'transactions.html',
        'Analytics & Report': 'report.html',
        'Suppliers': 'suppliers.html',
        'Settings': 'settings.html',
        'Add Expense': 'add-expense.html'
    };
    return menuMap[menuText];
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSidebar); 