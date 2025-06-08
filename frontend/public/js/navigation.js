// Navigation links
const navigationLinks = [
    { name: 'Dashboard', url: 'index.html', icon: '📊' },
    { name: 'Store Management', url: 'store-management.html', icon: '🏪' },
    { name: 'Inventory', url: 'inventory.html', icon: '📦' },
    { name: 'Transactions', url: 'transactions.html', icon: '🔄' },
    { name: 'Analytics & Report', url: 'analytics.html', icon: '📈' },
    { name: 'Suppliers', url: 'suppliers.html', icon: '🤝' },
    { name: 'Settings', url: 'settings.html', icon: '⚙️' },
    { name: 'Add Expense', url: 'add-expense.html', icon: '💸' }
];

// Initialize sidebar
function initializeSidebar() {
    const menuIcon = document.querySelector('.menu-icon');
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="sidebar-title">NeoPOS Menu</div>
            <div class="close-sidebar">×</div>
        </div>
        <div class="sidebar-content">
            ${navigationLinks.map(link => `
                <a href="${link.url}" class="sidebar-item">
                    <span class="sidebar-icon">${link.icon}</span>
                    ${link.name}
                </a>
            `).join('')}
        </div>
    `;

    document.body.appendChild(sidebar);

    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Event listeners
    menuIcon.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    const closeSidebar = () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    sidebar.querySelector('.close-sidebar').addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
}

// Initialize notifications panel
function initializeNotifications() {
    const notificationIcon = document.querySelector('.notification-icon');
    const notificationPanel = document.createElement('div');
    notificationPanel.className = 'notification-panel';
    notificationPanel.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">Notifications</div>
            <div class="close-notifications">×</div>
        </div>
        <div class="notification-content">
            <div class="notification-item unread">
                <div class="notification-icon">🔔</div>
                <div class="notification-text">
                    <div class="notification-message">Low stock alert: Rice (5 kg remaining)</div>
                    <div class="notification-time">2 minutes ago</div>
                </div>
            </div>
            <div class="notification-item">
                <div class="notification-icon">💰</div>
                <div class="notification-text">
                    <div class="notification-message">High value transaction completed: RS 15,000</div>
                    <div class="notification-time">1 hour ago</div>
                </div>
            </div>
            <div class="notification-item">
                <div class="notification-icon">📦</div>
                <div class="notification-text">
                    <div class="notification-message">New inventory items added successfully</div>
                    <div class="notification-time">3 hours ago</div>
                </div>
            </div>
        </div>
        <div class="notification-footer">
            <a href="notifications.html">View All Notifications</a>
        </div>
    `;

    document.body.appendChild(notificationPanel);

    // Add overlay for notifications
    const notificationOverlay = document.createElement('div');
    notificationOverlay.className = 'notification-overlay';
    document.body.appendChild(notificationOverlay);

    notificationIcon.addEventListener('click', () => {
        notificationPanel.classList.add('active');
        notificationOverlay.classList.add('active');
    });

    const closeNotifications = () => {
        notificationPanel.classList.remove('active');
        notificationOverlay.classList.remove('active');
    };

    notificationPanel.querySelector('.close-notifications').addEventListener('click', closeNotifications);
    notificationOverlay.addEventListener('click', closeNotifications);
}

// Add back button functionality
function addBackButton() {
    const header = document.querySelector('.header');
    if (header && !document.querySelector('.back-button')) {
        const backButton = document.createElement('div');
        backButton.className = 'back-button';
        backButton.innerHTML = '← Back';
        backButton.addEventListener('click', () => window.history.back());
        header.insertBefore(backButton, header.firstChild);
    }
}

// Update profile icon
function updateProfileIcon() {
    const profileIcon = document.querySelector('.profile-icon');    if (profileIcon) {
        profileIcon.innerHTML = '<img src="images/avatars/user-avatar.png" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">';
    }
}

// Initialize all navigation features
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    initializeNotifications();
    updateProfileIcon();
    
    // Add back button for specific pages
    const pagesWithBackButton = [
        'add-expense.html',
        'add-item.html',
        'supplier-details.html',
        'receipt-detail.html'
    ];
    
    if (pagesWithBackButton.some(page => window.location.href.includes(page))) {
        addBackButton();
    }
}); 