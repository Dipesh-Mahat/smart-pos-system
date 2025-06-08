document.addEventListener('DOMContentLoaded', function() {
    // Get menu elements
    const menuIcon = document.querySelector('.menu-icon, #menuIcon');
    const sideMenu = document.querySelector('.side-menu, #sideMenu');
    const closeMenu = document.querySelector('.close-menu, #closeMenu');
    const menuOverlay = document.querySelector('.menu-overlay, #menuOverlay');

    // Get notification elements
    const notificationIcon = document.querySelector('.notification-icon, #notificationIcon');
    const notificationPanel = document.querySelector('.notification-panel, #notificationPanel');
    const closeNotifications = document.querySelector('.close-notifications, #closeNotifications');
    const notificationOverlay = document.querySelector('.notification-overlay, #notificationOverlay');

    // Toggle menu function
    function toggleMenu() {
        if (sideMenu && menuOverlay) {
            sideMenu.style.left = '0';
            menuOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
            sideMenu.classList.add('open');
        }
    }

    // Close menu function
    function closeMenuFunc() {
        if (sideMenu && menuOverlay) {
            sideMenu.style.left = '-280px';
            menuOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
            sideMenu.classList.remove('open');
        }
    }

    // Toggle notifications function
    function toggleNotifications() {
        if (notificationPanel && notificationOverlay) {
            notificationPanel.style.right = '0';
            notificationOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    // Close notifications function
    function closeNotificationsFunc() {
        if (notificationPanel && notificationOverlay) {
            notificationPanel.style.right = '-300px';
            notificationOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Event listeners for menu
    if (menuIcon) {
        menuIcon.addEventListener('click', toggleMenu);
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', closeMenuFunc);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenuFunc);
    }

    // Event listeners for notifications
    if (notificationIcon) {
        notificationIcon.addEventListener('click', toggleNotifications);
    }

    if (closeNotifications) {
        closeNotifications.addEventListener('click', closeNotificationsFunc);
    }

    if (notificationOverlay) {
        notificationOverlay.addEventListener('click', closeNotificationsFunc);
    }

    // Prevent closing when clicking inside menu or notification panel
    if (sideMenu) {
        sideMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    if (notificationPanel) {
        notificationPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Handle viewport changes
    function checkViewport() {
        if (window.innerWidth >= 1024) {
            if (sideMenu) {
                sideMenu.style.left = '0';
            }
            if (menuOverlay) {
                menuOverlay.style.display = 'none';
            }
        } else {
            if (sideMenu && !sideMenu.classList.contains('open')) {
                sideMenu.style.left = '-280px';
            }
        }
    }

    // Run on page load and resize
    window.addEventListener('load', checkViewport);
    window.addEventListener('resize', checkViewport);
}); 