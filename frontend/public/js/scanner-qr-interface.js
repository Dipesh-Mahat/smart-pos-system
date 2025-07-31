/**
 * QR Code Scanner UI Component
 * 
 * This component renders the QR code scanner UI and manages the connection
 * between mobile devices and the POS terminal.
 */

class ScannerQRInterface {
    constructor(containerId, qrHelper = null) {
        // Try to get the container element
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with ID "${containerId}" not found`);
            this.container = document.createElement('div');
            this.container.id = containerId;
            document.body.appendChild(this.container);
        }
        
        // Use provided qrHelper or global instance or create a fallback
        this.qrHelper = qrHelper || window.qrConnectionHelper;
        this.isShowing = false;
        this.currentMode = 'auto';
        this.currentType = 'product';
        this.eventHandlers = {};
        
        // Check if qrHelper is properly initialized
        if (!this.qrHelper || typeof this.qrHelper.on !== 'function') {
            console.warn('QR Connection Helper not properly initialized. Creating fallback.');
            this.createFallbackHelper();
        }
        
        try {
            // Create UI elements
            this.createUI();
            
            // Set up event listeners
            this.setupEvents();
            
            console.log('Scanner QR Interface initialized');
        } catch (error) {
            console.error('Error initializing Scanner QR Interface:', error);
        }
    }
    
    /**
     * Create a fallback qrHelper if the global one isn't working
     */
    createFallbackHelper() {
        // Create basic implementation with event handling
        this.qrHelper = {
            eventHandlers: {},
            on: function(eventName, handler) {
                if (!this.eventHandlers[eventName]) {
                    this.eventHandlers[eventName] = [];
                }
                this.eventHandlers[eventName].push(handler);
            },
            triggerEvent: function(eventName, data) {
                if (this.eventHandlers[eventName]) {
                    this.eventHandlers[eventName].forEach(handler => handler(data));
                }
            },
            generateQRCode: async function() {
                // Basic implementation
                return { qrCodes: { local: '#' }, primaryMode: 'local' };
            }
        };
    }
    
    /**
     * Create the scanner UI
     */
    createUI() {
        // Create base UI
        this.container.innerHTML = `
            <div class="scanner-modal" id="scannerModal">
                <div class="scanner-modal-content">
                    <div class="scanner-modal-header">
                        <h3><i class="fas fa-qrcode"></i> Scan with Mobile Device</h3>
                        <button class="close-modal" id="closeScannerBtn">&times;</button>
                    </div>
                    <div class="scanner-modal-body">
                        <div class="connection-modes">
                            <button class="mode-btn active" data-mode="auto">Auto</button>
                            <button class="mode-btn" data-mode="online">Online</button>
                            <button class="mode-btn" data-mode="local">Local WiFi</button>
                            <button class="mode-btn" data-mode="hotspot">Hotspot</button>
                        </div>
                        
                        <div class="qr-display" id="qrDisplay">
                            <div class="qr-loader">
                                <div class="spinner"></div>
                                <p>Generating QR Code...</p>
                            </div>
                        </div>
                        
                        <div class="connection-status" id="connectionStatus">
                            <span class="status-dot"></span>
                            <span class="status-text">Ready to connect</span>
                        </div>
                        
                        <div class="scanner-instructions">
                            <p><strong>Instructions:</strong></p>
                            <ol>
                                <li>Scan this QR code with your mobile device</li>
                                <li>Allow camera permissions when prompted</li>
                                <li>Point the mobile camera at products to scan</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Style the elements
        const style = document.createElement('style');
        style.textContent = `
            .scanner-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .scanner-modal.active {
                display: flex;
                opacity: 1;
                align-items: center;
                justify-content: center;
            }
            
            .scanner-modal-content {
                background-color: white;
                width: 90%;
                max-width: 500px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                transform: translateY(30px);
                opacity: 0;
                transition: transform 0.4s ease, opacity 0.4s ease;
            }
            
            .scanner-modal.active .scanner-modal-content {
                transform: translateY(0);
                opacity: 1;
            }
            
            .scanner-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background-color: #4f46e5;
                color: white;
            }
            
            .scanner-modal-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 500;
            }
            
            .scanner-modal-header h3 i {
                margin-right: 8px;
            }
            
            .close-modal {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
            }
            
            .scanner-modal-body {
                padding: 20px;
            }
            
            .connection-modes {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
                gap: 8px;
            }
            
            .mode-btn {
                padding: 8px 12px;
                background-color: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .mode-btn:hover {
                background-color: #e5e7eb;
            }
            
            .mode-btn.active {
                background-color: #4f46e5;
                border-color: #4338ca;
                color: white;
            }
            
            .qr-display {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 280px;
                height: 280px;
                margin: 0 auto 20px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 10px;
                background-color: white;
                position: relative;
            }
            
            .qr-display img {
                max-width: 100%;
                max-height: 100%;
            }
            
            .qr-loader {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(79, 70, 229, 0.2);
                border-radius: 50%;
                border-top-color: #4f46e5;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .connection-status {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
            }
            
            .status-dot {
                display: inline-block;
                width: 12px;
                height: 12px;
                background-color: #9ca3af;
                border-radius: 50%;
                margin-right: 8px;
            }
            
            .status-dot.connecting {
                background-color: #f59e0b;
                animation: pulse 1.5s infinite;
            }
            
            .status-dot.connected {
                background-color: #10b981;
            }
            
            .status-dot.error {
                background-color: #ef4444;
            }
            
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
            
            .scanner-instructions {
                background-color: #f9fafb;
                border-radius: 6px;
                padding: 15px;
                font-size: 14px;
            }
            
            .scanner-instructions p {
                margin-top: 0;
            }
            
            .scanner-instructions ol {
                margin: 0;
                padding-left: 20px;
            }
            
            .scanner-instructions li {
                margin-bottom: 5px;
            }
            
            .scanner-instructions li:last-child {
                margin-bottom: 0;
            }
        `;
        
        document.head.appendChild(style);
        
        // Set up close button
        document.getElementById('closeScannerBtn').addEventListener('click', () => {
            this.hide();
        });
        
        // Set up mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMode = e.target.dataset.mode;
                this.generateQR();
            });
        });
    }
    
    /**
     * Set up event listeners
     */
    setupEvents() {
        try {
            // Listen for QR code generation events
            this.qrHelper.on('qrGenerated', (data) => {
                this.updateQRDisplay(data);
            });
            
            // Listen for connection events
            this.qrHelper.on('deviceConnected', (data) => {
                this.updateConnectionStatus('connected', 'Device connected!');
                // Keep connection open indefinitely
                // Store connection information for easy reconnection
                localStorage.setItem('lastConnectedDevice', JSON.stringify({
                    time: new Date().toISOString(),
                    sessionId: data.sessionId || 'unknown'
                }));
            });
            
            // Listen for connection restoration events
            this.qrHelper.on('connectionRestored', (data) => {
                this.updateConnectionStatus('connected', 'Previous connection restored!');
                // Update the UI to show we're connected
                document.getElementById('scannerConnectedIndicator')?.classList.add('active');
            });
            
            // Listen for timeout events
            this.qrHelper.on('connectionTimeout', () => {
                this.updateConnectionStatus('error', 'Connection timed out. Try again.');
            });
            
            // Check for existing connections on page load
            this.checkForExistingConnections();
        } catch (error) {
            console.error('Error setting up scanner event handlers:', error);
            this.updateConnectionStatus('error', 'Failed to initialize scanner connection');
        }
    }
    
    /**
     * Check for existing scanner connections
     */
    async checkForExistingConnections() {
        if (localStorage.getItem('qrConnectionActive') === 'true' && 
            localStorage.getItem('qrSessionId')) {
            // We have a stored connection, attempt to restore it
            this.updateConnectionStatus('waiting', 'Checking existing connection...');
            
            // The QR helper will try to restore the connection in its constructor
            // We just need to make sure the UI reflects any updates
            document.getElementById('scannerConnectedIndicator')?.classList.add('checking');
        }
    }
    
    /**
     * Show the scanner interface
     * @param {string} type - Scan type: 'product', 'bill', 'inventory'
     */
    show(type = 'product') {
        this.currentType = type;
        this.isShowing = true;
        document.getElementById('scannerModal').classList.add('active');
        
        // Reset status
        this.updateConnectionStatus('waiting', 'Ready to connect');
        
        // Generate QR code
        this.generateQR();
    }
    
    /**
     * Hide the scanner interface
     */
    hide() {
        this.isShowing = false;
        document.getElementById('scannerModal').classList.remove('active');
        
        // Do not stop connection monitoring
        // This allows the connection to persist even when the modal is closed
        // this.qrHelper.stopConnectionMonitoring();
    }
    
    /**
     * Generate QR code
     */
    async generateQR() {
        // Show loading state
        const qrDisplay = document.getElementById('qrDisplay');
        qrDisplay.innerHTML = `
            <div class="qr-loader">
                <div class="spinner"></div>
                <p>Generating QR Code...</p>
            </div>
        `;
        
        // Update connection status
        this.updateConnectionStatus('connecting', 'Generating QR code...');
        
        // Generate QR code
        const data = await this.qrHelper.generateQRCode(this.currentType, this.currentMode);
        
        // Update UI with QR code
        this.updateQRDisplay(data);
    }
    
    /**
     * Update the QR code display
     * @param {Object} data - QR code data
     */
    updateQRDisplay(data) {
        const qrDisplay = document.getElementById('qrDisplay');
        
        if (data.error || data.fallback) {
            // Show error or fallback QR
            this.updateConnectionStatus('error', 'Using fallback connection');
            
            if (data.qrCodes?.local) {
                qrDisplay.innerHTML = `
                    <img src="${data.qrCodes.local}" alt="QR Code for Scanner">
                    <p class="qr-note">Fallback local connection</p>
                `;
            } else {
                qrDisplay.innerHTML = `
                    <div class="qr-error">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 15px;"></i>
                        <p>QR code generation failed</p>
                    </div>
                `;
            }
            return;
        }
        
        // Determine which QR code to show based on the selected mode
        let qrToShow;
        let modeLabel;
        
        if (this.currentMode === 'auto') {
            // Show the primary mode's QR code
            const primaryMode = data.primaryMode || 'online';
            qrToShow = data.qrCodes[primaryMode];
            modeLabel = primaryMode.charAt(0).toUpperCase() + primaryMode.slice(1);
        } else {
            // Show the selected mode's QR code if available
            qrToShow = data.qrCodes[this.currentMode];
            modeLabel = this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1);
            
            // Fall back to another mode if selected mode is not available
            if (!qrToShow) {
                if (data.qrCodes.online) {
                    qrToShow = data.qrCodes.online;
                    modeLabel = 'Online (Fallback)';
                } else if (data.qrCodes.local) {
                    qrToShow = data.qrCodes.local;
                    modeLabel = 'Local (Fallback)';
                } else if (data.qrCodes.hotspot) {
                    qrToShow = data.qrCodes.hotspot;
                    modeLabel = 'Hotspot (Fallback)';
                }
            }
        }
        
        if (qrToShow) {
            qrDisplay.innerHTML = `
                <img src="${qrToShow}" alt="QR Code for Scanner">
                <p style="text-align: center; margin-top: 8px; font-size: 14px; color: #4b5563;">${modeLabel} Connection</p>
            `;
            
            this.updateConnectionStatus('waiting', 'Scan QR code with mobile device');
        } else {
            // No QR code available
            qrDisplay.innerHTML = `
                <div class="qr-error">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ef4444; margin-bottom: 15px;"></i>
                    <p>No QR code available for selected mode</p>
                </div>
            `;
            
            this.updateConnectionStatus('error', 'QR code generation failed');
        }
    }
    
    /**
     * Update the connection status display
     * @param {string} status - Status: 'waiting', 'connecting', 'connected', 'error'
     * @param {string} message - Status message
     */
    updateConnectionStatus(status, message) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        // Reset all classes
        statusDot.classList.remove('connecting', 'connected', 'error');
        
        // Set appropriate class
        if (status === 'connecting') {
            statusDot.classList.add('connecting');
        } else if (status === 'connected') {
            statusDot.classList.add('connected');
        } else if (status === 'error') {
            statusDot.classList.add('error');
        }
        
        // Update message
        statusText.textContent = message;
    }
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if container exists
    if (document.getElementById('scanner-container')) {
        window.scannerQRInterface = new ScannerQRInterface('scanner-container');
    }
});
