/**
 * Custom Modal Utility
 * Smart POS System - Nepal
 * 
 * Provides beautiful custom modal dialogs to replace default browser alerts and confirms
 */

class CustomModal {
    constructor() {
        this.activeModal = null;
        this.setupGlobalStyles();
    }

    setupGlobalStyles() {
        // Add any additional dynamic styles if needed
    }

    // Custom Confirm Dialog
    confirm(options) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm Action',
                message = 'Are you sure you want to proceed?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'warning' // warning, danger, info
            } = options;

            const modal = this.createModal({
                title,
                message,
                type,
                actions: [
                    {
                        text: cancelText,
                        class: 'secondary',
                        action: () => {
                            this.closeModal();
                            resolve(false);
                        }
                    },
                    {
                        text: confirmText,
                        class: type === 'danger' ? 'danger' : 'primary',
                        action: () => {
                            this.closeModal();
                            resolve(true);
                        }
                    }
                ]
            });

            this.showModal(modal);
        });
    }

    // Custom Alert Dialog
    alert(options) {
        return new Promise((resolve) => {
            const {
                title = 'Information',
                message = '',
                buttonText = 'OK',
                type = 'info' // info, success, warning, error
            } = options;

            const modal = this.createModal({
                title,
                message,
                type,
                actions: [
                    {
                        text: buttonText,
                        class: 'primary',
                        action: () => {
                            this.closeModal();
                            resolve();
                        }
                    }
                ]
            });

            this.showModal(modal);
        });
    }

    createModal({ title, message, type, actions }) {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const iconMap = {
            warning: 'fas fa-exclamation-triangle',
            danger: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle'
        };

        overlay.innerHTML = `
            <div class="custom-modal">
                <div class="custom-modal-header">
                    <div class="custom-modal-icon ${type}">
                        <i class="${iconMap[type] || iconMap.info}"></i>
                    </div>
                    <h3 class="custom-modal-title">${title}</h3>
                    <p class="custom-modal-message">${message}</p>
                </div>
                <div class="custom-modal-body">
                    <div class="custom-modal-actions">
                        ${actions.map(action => 
                            `<button class="custom-modal-btn ${action.class}" data-action="${actions.indexOf(action)}">
                                ${action.text}
                            </button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        actions.forEach((action, index) => {
            const button = overlay.querySelector(`[data-action="${index}"]`);
            button.addEventListener('click', action.action);
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                const cancelAction = actions.find(a => a.class === 'secondary');
                if (cancelAction) {
                    cancelAction.action();
                }
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                const cancelAction = actions.find(a => a.class === 'secondary');
                if (cancelAction) {
                    cancelAction.action();
                }
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        return overlay;
    }

    showModal(modal) {
        this.activeModal = modal;
        document.body.appendChild(modal);
        
        // Trigger animation (quicker)
        setTimeout(() => {
            modal.classList.add('show');
        }, 5);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        if (this.activeModal) {
            this.activeModal.classList.remove('show');
            
            setTimeout(() => {
                if (this.activeModal && this.activeModal.parentNode) {
                    this.activeModal.parentNode.removeChild(this.activeModal);
                }
                this.activeModal = null;
                
                // Restore body scroll
                document.body.style.overflow = '';
            }, 150); // Faster close animation
        }
    }
}

// Create global instance
window.customModal = new CustomModal();

// Convenient global functions
window.customConfirm = (options) => window.customModal.confirm(options);
window.customAlert = (options) => window.customModal.alert(options);

// Override default confirm and alert for gradual migration
window.originalConfirm = window.confirm;
window.originalAlert = window.alert;

// Enhanced confirm with automatic detection
window.smartConfirm = (message, options = {}) => {
    if (typeof message === 'string') {
        return window.customModal.confirm({
            message,
            ...options
        });
    }
    return window.customModal.confirm(message);
};

// Enhanced alert with automatic detection
window.smartAlert = (message, options = {}) => {
    if (typeof message === 'string') {
        return window.customModal.alert({
            message,
            ...options
        });
    }
    return window.customModal.alert(message);
};
