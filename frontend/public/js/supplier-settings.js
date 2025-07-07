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
        // Show loading state
        this.showLoadingOverlay();
        
        // Get settings from API
        fetch('/api/supplier/settings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load settings');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                this.applySettings(data.data.settings);
            } else {
                throw new Error(data.message || 'Failed to load settings');
            }
        })
        .catch(error => {
            console.error('Error loading settings:', error);
            this.showErrorMessage('Failed to load settings. Please try refreshing the page.');
        })
        .finally(() => {
            this.hideLoadingOverlay();
        });
    }
    
    getToken() {
        // Get JWT token from localStorage or other storage
        return localStorage.getItem('token') || '';
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
        
        // Determine which endpoint to use based on form or tab
        const section = form.closest('.tab-pane').id;
        let endpoint = '/api/supplier/settings';
        let payload = {};
        
        switch (section) {
            case 'general':
                endpoint += '/preferences';
                payload = {
                    language: settings.language || 'en',
                    timezone: settings.timezone || 'UTC',
                    currency: settings.currency || 'USD',
                    dateFormat: settings.dateFormat || 'MM/DD/YYYY',
                    autoSave: settings.auto_save === true,
                    darkMode: settings.dark_mode === true
                };
                break;
                
            case 'notifications':
                endpoint += '/notifications';
                payload = {
                    notifications: {
                        newOrders: {
                            email: Boolean(settings.new_orders_email),
                            push: Boolean(settings.new_orders_push)
                        },
                        orderUpdates: {
                            email: Boolean(settings.order_updates_email),
                            push: Boolean(settings.order_updates_push)
                        },
                        lowStock: {
                            email: Boolean(settings.low_stock_alerts_email),
                            push: Boolean(settings.low_stock_alerts_push)
                        },
                        weeklyReports: {
                            email: Boolean(settings.weekly_reports_email)
                        }
                    }
                };
                break;
                
            case 'security':
                endpoint += '/security';
                payload = {
                    twoFactorEnabled: Boolean(settings.two_factor_authentication),
                    loginNotifications: Boolean(settings.login_notifications)
                };
                break;
                
            case 'privacy':
                endpoint += '/privacy';
                payload = {
                    profileVisibility: settings.profile_visibility || 'public',
                    contactVisibility: Boolean(settings.contact_information)
                };
                break;
                
            default:
                this.hideLoadingOverlay();
                return;
        }
        
        // Make API call to save settings
        fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save settings');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                this.showSuccessMessage(data.message || 'Settings saved successfully!');
            } else {
                throw new Error(data.message || 'Failed to save settings');
            }
        })
        .catch(error => {
            console.error('Error saving settings:', error);
            this.showErrorMessage('Failed to save settings. Please try again.');
        })
        .finally(() => {
            this.hideSaveIndicator();
        });
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
        // Get active sessions from API
        fetch('/api/supplier/settings/sessions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load sessions');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                this.renderSessions(data.data.sessions);
            } else {
                throw new Error(data.message || 'Failed to load sessions');
            }
        })
        .catch(error => {
            console.error('Error loading sessions:', error);
            this.showErrorMessage('Failed to load security data. Please try refreshing.');
        });
    }
    
    renderSessions(sessions) {
        const sessionList = document.querySelector('.session-list');
        if (!sessionList) return;
        
        // Clear current list
        sessionList.innerHTML = '';
        
        if (!sessions || sessions.length === 0) {
            sessionList.innerHTML = '<p>No active sessions found.</p>';
            return;
        }
        
        // Add current session first
        const currentSession = {
            id: 'current', // This is placeholder, actual ID should come from the backend
            deviceName: 'Current Device',
            browser: 'Current Browser',
            location: 'Current Location',
            current: true
        };
        
        // Add all sessions to the list
        [currentSession, ...sessions].forEach(session => {
            if (session.id === 'current') {
                sessionList.appendChild(this.createSessionElement(session));
            }
        });
        
        // Add other sessions
        sessions.forEach(session => {
            if (!session.current) {
                sessionList.appendChild(this.createSessionElement(session));
            }
        });
    }
    
    createSessionElement(session) {
        const element = document.createElement('div');
        element.className = 'session-item';
        element.dataset.id = session.id;
        
        const isCurrent = session.current;
        
        element.innerHTML = `
            <div class="session-info">
                <div class="session-device">
                    <i class="fas fa-${isCurrent ? 'desktop' : 'mobile-alt'}"></i>
                    <span>${session.browser || 'Unknown Browser'}</span>
                </div>
                <div class="session-details">
                    <span class="session-location">${session.location || 'Unknown Location'}</span>
                    <span class="session-time">${isCurrent ? 'Current session' : this.formatTime(session.lastActive)}</span>
                </div>
            </div>
            ${isCurrent ? 
                `<span class="session-status current">Current</span>` : 
                `<button class="btn btn-outline-danger btn-sm">
                    <i class="fas fa-sign-out-alt"></i>
                    End Session
                </button>`
            }
        `;
        
        if (!isCurrent) {
            const endButton = element.querySelector('button');
            endButton.addEventListener('click', () => this.endSession(element));
        }
        
        return element;
    }
    
    formatTime(timestamp) {
        if (!timestamp) return 'Unknown time';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // Difference in seconds
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
        
        return `on ${date.toLocaleDateString()}`;
    }

    endSession(sessionElement) {
        const sessionId = sessionElement.dataset.id;
        
        if (confirm('Are you sure you want to end this session?')) {
            sessionElement.style.opacity = '0.5';
            
            fetch(`/api/supplier/settings/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to end session');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    sessionElement.remove();
                    this.showSuccessMessage(data.message || 'Session ended successfully');
                } else {
                    throw new Error(data.message || 'Failed to end session');
                }
            })
            .catch(error => {
                console.error('Error ending session:', error);
                sessionElement.style.opacity = '1';
                this.showErrorMessage('Failed to end session. Please try again.');
            });
        }
    }

    loadIntegrationsData() {
        // Get integrations from settings API
        fetch('/api/supplier/settings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load integrations');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.data.settings && data.data.settings.integrations) {
                this.renderIntegrations(data.data.settings.integrations);
            } else {
                throw new Error(data.message || 'Failed to load integrations');
            }
        })
        .catch(error => {
            console.error('Error loading integrations:', error);
            this.showErrorMessage('Failed to load integrations. Please try refreshing.');
        });
    }
    
    renderIntegrations(integrations) {
        // For now, just log the integrations - you'd update the UI here
        console.log('Rendering integrations:', integrations);
        
        // Default integrations if none found
        if (!integrations || integrations.length === 0) {
            integrations = [
                { name: 'Stripe', type: 'payment', isActive: false },
                { name: 'PayPal', type: 'payment', isActive: false },
                { name: 'Shipping Partners', type: 'shipping', isActive: false },
                { name: 'Analytics Tools', type: 'analytics', isActive: false }
            ];
        }
        
        // Update the integration cards based on the data
        const integrationGrid = document.querySelector('.integration-grid');
        if (integrationGrid) {
            // Find and update each integration card
            integrationGrid.querySelectorAll('.integration-card').forEach(card => {
                const name = card.querySelector('h4').textContent;
                const integration = integrations.find(i => i.name === name || i.name.includes(name));
                
                if (integration) {
                    const statusElement = card.querySelector('.integration-status');
                    const isConnected = integration.isActive;
                    
                    if (isConnected) {
                        statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
                        statusElement.classList.add('connected');
                        
                        // Update buttons
                        card.querySelector('.integration-actions').innerHTML = `
                            <button class="btn btn-outline-secondary">Configure</button>
                            <button class="btn btn-outline-danger">Disconnect</button>
                        `;
                    } else {
                        statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Not Connected';
                        statusElement.classList.remove('connected');
                        
                        // Update buttons
                        card.querySelector('.integration-actions').innerHTML = `
                            <button class="btn btn-primary">Connect</button>
                        `;
                    }
                    
                    // Add event listeners to the new buttons
                    card.querySelectorAll('button').forEach(button => {
                        button.addEventListener('click', () => this.handleIntegrationAction(button));
                    });
                }
            });
        }
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
        
        // Create a new integration object
        const newIntegration = {
            name: name,
            type: this.getIntegrationType(name),
            isActive: true,
            connectedAt: new Date().toISOString(),
            apiKey: 'auto-generated-key-' + Math.random().toString(36).substring(2, 15),
            scopes: ['read', 'write']
        };
        
        // Get current integrations and add or update this one
        fetch('/api/supplier/settings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            }
        })
        .then(response => response.json())
        .then(data => {
            let integrations = [];
            
            if (data.success && data.data.settings && data.data.settings.integrations) {
                integrations = data.data.settings.integrations;
            }
            
            // Check if integration already exists
            const existingIndex = integrations.findIndex(i => i.name === name);
            if (existingIndex >= 0) {
                integrations[existingIndex] = newIntegration;
            } else {
                integrations.push(newIntegration);
            }
            
            // Update integrations
            return fetch('/api/supplier/settings/integrations', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ integrations })
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const status = card.querySelector('.integration-status');
                status.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
                status.classList.add('connected');
                
                const actions = card.querySelector('.integration-actions');
                actions.innerHTML = `
                    <button class="btn btn-outline-secondary">Configure</button>
                    <button class="btn btn-outline-danger">Disconnect</button>
                `;
                
                // Add event listeners to the new buttons
                actions.querySelectorAll('button').forEach(button => {
                    button.addEventListener('click', () => this.handleIntegrationAction(button));
                });
                
                this.hideModal();
                this.showSuccessMessage(`${name} connected successfully!`);
            } else {
                throw new Error(data.message || 'Failed to connect integration');
            }
        })
        .catch(error => {
            console.error('Error connecting integration:', error);
            this.hideModal();
            this.showErrorMessage('Failed to connect integration. Please try again.');
        });
    }

    getIntegrationType(name) {
        if (name.toLowerCase().includes('stripe') || name.toLowerCase().includes('paypal')) {
            return 'payment';
        } else if (name.toLowerCase().includes('shipping')) {
            return 'shipping';
        } else if (name.toLowerCase().includes('analytics')) {
            return 'analytics';
        }
        return 'other';
    }

    disconnectIntegration(name, card) {
        if (confirm(`Are you sure you want to disconnect ${name}?`)) {
            // Get current integrations and update the one matching name
            fetch('/api/supplier/settings', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                }
            })
            .then(response => response.json())
            .then(data => {
                let integrations = [];
                
                if (data.success && data.data.settings && data.data.settings.integrations) {
                    integrations = data.data.settings.integrations.filter(i => i.name !== name);
                }
                
                // Update integrations
                return fetch('/api/supplier/settings/integrations', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify({ integrations })
                });
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const status = card.querySelector('.integration-status');
                    status.innerHTML = '<i class="fas fa-times-circle"></i> Not Connected';
                    status.classList.remove('connected');
                    
                    const actions = card.querySelector('.integration-actions');
                    actions.innerHTML = '<button class="btn btn-primary">Connect</button>';
                    
                    // Add event listener to the new button
                    actions.querySelector('button').addEventListener('click', () => this.handleIntegrationAction(actions.querySelector('button')));
                    
                    this.showSuccessMessage(`${name} disconnected successfully`);
                } else {
                    throw new Error(data.message || 'Failed to disconnect integration');
                }
            })
            .catch(error => {
                console.error('Error disconnecting integration:', error);
                this.showErrorMessage('Failed to disconnect integration. Please try again.');
            });
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
        // Request data export from API
        fetch('/api/supplier/settings/data-export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to initiate data export');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                this.showSuccessMessage(data.message || 'Data export initiated. You will receive an email when ready.');
            } else {
                throw new Error(data.message || 'Failed to initiate data export');
            }
        })
        .catch(error => {
            console.error('Error initiating data export:', error);
            this.showErrorMessage('Failed to initiate data export. Please try again later.');
        });
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

    showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
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
    
    showLoadingOverlay() {
        let overlay = document.getElementById('loadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.supplierSettings = new SupplierSettings();
});
