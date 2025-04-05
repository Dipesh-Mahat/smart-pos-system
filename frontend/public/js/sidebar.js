document.addEventListener('DOMContentLoaded', function() {
    // Get menu elements
    const menuIcon = document.querySelector('.menu-icon');
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationOverlay = document.getElementById('notificationOverlay');
    const closeNotifications = document.querySelector('.close-notifications');

    // Menu toggle functionality
    function toggleMenu() {
        sideMenu.classList.toggle('open');
        menuOverlay.classList.toggle('active');
        document.body.style.overflow = sideMenu.classList.contains('open') ? 'hidden' : '';
    }

    // Close menu function
    function closeMenu() {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Menu icon click event
    menuIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });

    // Close menu when clicking overlay
    menuOverlay.addEventListener('click', closeMenu);

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!sideMenu.contains(e.target) && !menuIcon.contains(e.target)) {
            closeMenu();
        }
    });

    // Prevent menu from closing when clicking inside
    sideMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Handle menu item clicks
    document.querySelectorAll('.menu-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            const link = this.querySelector('a');
            if (link) {
                closeMenu();
            }
        });
    });

    // Handle menu item link clicks
    document.querySelectorAll('.menu-item a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    // Notification panel functionality
    function toggleNotifications() {
        notificationPanel.classList.toggle('active');
        notificationOverlay.classList.toggle('active');
        document.body.style.overflow = notificationPanel.classList.contains('active') ? 'hidden' : '';
    }

    // Notification icon click event
    notificationIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleNotifications();
    });

    // Close notifications when clicking overlay
    notificationOverlay.addEventListener('click', function() {
        notificationPanel.classList.remove('active');
        notificationOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close notifications button
    closeNotifications.addEventListener('click', function() {
        notificationPanel.classList.remove('active');
        notificationOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close notifications when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationPanel.contains(e.target) && !notificationIcon.contains(e.target)) {
            notificationPanel.classList.remove('active');
            notificationOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Prevent notifications from closing when clicking inside
    notificationPanel.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});