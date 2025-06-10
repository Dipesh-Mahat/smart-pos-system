// Supplier Settings Page JavaScript

class SupplierSettings {
    constructor() {
        this.currentTab = 'general';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.hideLoadingOverlay();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.closest('.tab-button').dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Form submissions
        document.querySelectorAll('.settings-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings(form);
            });
        });

        // Toggle switches
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handleToggleChange(e.target);
            });
        });

        // Integration actions
        document.querySelectorAll('.integration-card button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleIntegrationAction(e.target);
            });
        });

        // Security actions
        document.querySelectorAll('.session-item button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.endSession(e.target.closest('.session-item'));
            });
        });

        // Support actions
        document.querySelectorAll('.support-card button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleSupportAction(e.target);
            });
        });

        // Privacy data actions
        document.querySelectorAll('.data-actions button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleDataAction(e.target);
            });
        });
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        this.currentTab = tabId;

        // Load tab-specific data if needed
        this.loadTabData(tabId);
    }

    loadTabData(tabId) {
        switch (tabId) {
            case 'security':
                this.loadSecurityData();
                break;
            case 'integrations':
                this.loadIntegrationsData();
                break;
            case 'notifications':
                this.loadNotificationSettings();
                break;
        }
    }

    loadSettings() {
        // Simulate loading settings from API
        const settings = {
            language: 'en',
            timezone: 'UTC',
            currency: 'USD',
            dateFormat: 'MM/DD/YYYY',
            autoSave: true,
            darkMode: false,
            notifications: {
                newOrders: { email: true, push: true },
                orderUpdates: { email: true, push: false },
                lowStock: { email: true, push: true },
                weeklyReports: { email: true, push: false }
            }
        };

        this.applySettings(settings);
    }

    applySettings(settings) {
        // Apply general settings
        if (settings.language) {
            document.getElementById('language').value = settings.language;
        }
        if (settings.timezone) {
            document.getElementById('timezone').value = settings.timezone;
        }
        if (settings.currency) {
            document.getElementById('currency').value = settings.currency;
        }
        if (settings.dateFormat) {
            document.getElementById('dateFormat').value = settings.dateFormat;
        }

        // Apply toggle settings
        const autoSaveToggle = document.querySelector('#general .toggle-switch:nth-of-type(1) input');
        if (autoSaveToggle) autoSaveToggle.checked = settings.autoSave;

        const darkModeToggle = document.querySelector('#general .toggle-switch:nth-of-type(2) input');
        if (darkModeToggle) darkModeToggle.checked = settings.darkMode;
    }

    saveSettings(form) {
        const formData = new FormData(form);
        const settings = {};

        // Collect form data
        for (let [key, value] of formData.entries()) {
            settings[key] = value;
        }

        // Collect toggle states
        form.querySelectorAll('.toggle-switch input').forEach(toggle => {
            const settingName = this.getToggleSettingName(toggle);
            if (settingName) {
                settings[settingName] = toggle.checked;
            }
        });

        this.showSaveIndicator();
        
        // Simulate API call
        setTimeout(() => {
            this.showSuccessMessage('Settings saved successfully!');
        }, 1000);

        console.log('Saving settings:', settings);
    }

    getToggleSettingName(toggle) {
        const settingItem = toggle.closest('.setting-item');
        if (!settingItem) return null;
        
        const settingTitle = settingItem.querySelector('h4, h5');
        if (!settingTitle) return null;
        
        // Convert title to setting name (simplified)
        return settingTitle.textContent.toLowerCase().replace(/\s+/g, '_');
    }

    handleToggleChange(toggle) {
        const settingName = this.getToggleSettingName(toggle);
        
        if (settingName === 'dark_mode') {
            this.toggleDarkMode(toggle.checked);
        }
        
        // Auto-save if enabled
        const autoSaveEnabled = document.querySelector('#general .toggle-switch:nth-of-type(1) input')?.checked;
        if (autoSaveEnabled) {
            this.autoSave();
        }
    }

    toggleDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    autoSave() {
        this.showSaveIndicator();
        setTimeout(() => {
            this.hideSaveIndicator();
        }, 1000);
    }

    loadSecurityData() {
        // Load active sessions
        const sessions = [
            {
                device: 'Chrome on Windows',
                location: 'New York, NY',
                time: 'Current session',
                current: true
            },
            {
                device: 'Safari on iPhone',
                location: 'New York, NY',
                time: '2 hours ago',
                current: false
            }
        ];

        // Update session list if needed
        console.log('Loading security data:', sessions);
    }

    endSession(sessionElement) {
        if (confirm('Are you sure you want to end this session?')) {
            sessionElement.style.opacity = '0.5';
            setTimeout(() => {
                sessionElement.remove();
                this.showSuccessMessage('Session ended successfully');
            }, 300);
        }
    }

    loadIntegrationsData() {
        // Load integration statuses
        const integrations = [
            { name: 'Stripe', connected: true },
            { name: 'PayPal', connected: false },
            { name: 'Shipping Partners', connected: true, count: 2 },
            { name: 'Analytics Tools', connected: false }
        ];

        console.log('Loading integrations:', integrations);
    }

    handleIntegrationAction(button) {
        const card = button.closest('.integration-card');
        const integrationName = card.querySelector('h4').textContent;
        const action = button.textContent.toLowerCase().trim();

        switch (action) {
            case 'connect':
                this.connectIntegration(integrationName, card);
                break;
            case 'disconnect':
                this.disconnectIntegration(integrationName, card);
                break;
            case 'configure':
            case 'manage':
                this.configureIntegration(integrationName);
                break;
        }
    }

    connectIntegration(name, card) {
        this.showModal(`Connect ${name}`, `Connecting to ${name}...`);
        
        setTimeout(() => {
            const status = card.querySelector('.integration-status');
            status.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
            status.classList.add('connected');
            
            const actions = card.querySelector('.integration-actions');
            actions.innerHTML = `
                <button class="btn btn-outline-secondary">Configure</button>
                <button class="btn btn-outline-danger">Disconnect</button>
            `;
            
            this.hideModal();
            this.showSuccessMessage(`${name} connected successfully!`);
        }, 2000);
    }

    disconnectIntegration(name, card) {
        if (confirm(`Are you sure you want to disconnect ${name}?`)) {
            const status = card.querySelector('.integration-status');
            status.innerHTML = '<i class="fas fa-times-circle"></i> Not Connected';
            status.classList.remove('connected');
            
            const actions = card.querySelector('.integration-actions');
            actions.innerHTML = '<button class="btn btn-primary">Connect</button>';
            
            this.showSuccessMessage(`${name} disconnected successfully`);
        }
    }

    configureIntegration(name) {
        this.showModal(`Configure ${name}`, `Opening ${name} configuration...`);
        setTimeout(() => {
            this.hideModal();
        }, 1500);
    }

    loadNotificationSettings() {
        // Load current notification preferences
        console.log('Loading notification settings');
    }

    handleSupportAction(button) {
        const action = button.textContent.toLowerCase().trim();
        
        switch (action) {
            case 'visit help center':
                window.open('https://help.smartpos.com', '_blank');
                break;
            case 'start chat':
                this.startLiveChat();
                break;
            case 'send email':
                this.openEmailSupport();
                break;
            case 'call now':
                this.showPhoneNumber();
                break;
        }
    }

    startLiveChat() {
        this.showSuccessMessage('Live chat will be available soon!');
    }

    openEmailSupport() {
        window.location.href = 'mailto:support@smartpos.com?subject=Supplier Support Request';
    }

    showPhoneNumber() {
        this.showModal('Phone Support', 'Call us at: <strong>+1 (555) 123-4567</strong><br>Available 24/7');
    }

    handleDataAction(button) {
        const action = button.textContent.toLowerCase().trim();
        
        if (action.includes('download')) {
            this.downloadUserData();
        } else if (action.includes('delete')) {
            this.initiateAccountDeletion();
        }
    }

    downloadUserData() {
        this.showSuccessMessage('Data export initiated. You will receive an email when ready.');
    }

    initiateAccountDeletion() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            this.showModal('Account Deletion', 'Please contact support to proceed with account deletion for security reasons.');
        }
    }

    showSaveIndicator() {
        // Show a saving indicator
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        document.body.appendChild(indicator);
    }

    hideSaveIndicator() {
        const indicator = document.querySelector('.save-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `<i class="fas fa-check"></i> ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.hideModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    hideModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.style.display = 'none', 300);
            }, 500);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.supplierSettings = new SupplierSettings();
});
