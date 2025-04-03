document.addEventListener('DOMContentLoaded', function() {
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationPanel = document.getElementById('notificationPanel');
    const notificationOverlay = document.getElementById('notificationOverlay');
    const closeNotifications = document.querySelector('.close-notifications');

    // Function to close notifications
    function closeNotificationPanel() {
        notificationPanel.classList.remove('active');
        notificationOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Open notifications
    notificationIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationPanel.classList.add('active');
        notificationOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close notifications when clicking the close button
    closeNotifications.addEventListener('click', function(e) {
        e.stopPropagation();
        closeNotificationPanel();
    });

    // Close notifications when clicking overlay
    notificationOverlay.addEventListener('click', closeNotificationPanel);

    // Close notifications when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationPanel.contains(e.target) && !notificationIcon.contains(e.target)) {
            closeNotificationPanel();
        }
    });

    // Prevent notifications from closing when clicking inside
    notificationPanel.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}); 