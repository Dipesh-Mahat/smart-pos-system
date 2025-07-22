/**
 * Smart POS Unified Scanner Connection Manager
 * Handles unified mobile scanner connections for both navbar and POS page
 */

class ScannerUnified {
    constructor() {
        this.isConnected = false;
        this.roomCode = null;
        this.connectionToken = null;
        this.deviceId = null;
        this.connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected'
        this.listeners = new Map(); // event listeners
        this.connectionTimeout = null;
        this.heartbeatInterval = null;
        
        this.init();
    }

    init() {
        // Check for existing connection
        this.restoreConnection();
        
        // Listen for mobile scanner connections
        this.setupConnectionListeners();
        
        // Add global connection indicator
        this.addConnectionIndicator();
    }

    /**
     * Restore previous connection if available
     */
    restoreConnection() {
        const savedConnection = localStorage.getItem('smartpos_scanner_connection');
        if (savedConnection) {
            try {
                const connection = JSON.parse(savedConnection);
                const now = Date.now();
                
                // Check if connection is still valid (within 1 hour)
                if (connection.timestamp && (now - connection.timestamp) < 3600000) {
                    this.roomCode = connection.roomCode;
                    this.connectionToken = connection.token;
                    this.deviceId = connection.deviceId;
                    
                    // Try to reconnect
                    this.attemptReconnection();
                }
            } catch (error) {
                console.log('Failed to restore scanner connection:', error);
                localStorage.removeItem('smartpos_scanner_connection');
            }
        }
    }

    /**
     * Save connection for restoration
     */
    saveConnection() {
        if (this.roomCode && this.connectionToken) {
            const connection = {
                roomCode: this.roomCode,
                token: this.connectionToken,
                deviceId: this.deviceId,
                timestamp: Date.now()
            };
            localStorage.setItem('smartpos_scanner_connection', JSON.stringify(connection));
        }
    }

    /**
     * Create a new scanner connection
     */
    async createConnection(scanType = 'auto') {
        // Generate new connection details
        this.roomCode = 'SC' + Math.floor(100000 + Math.random() * 900000);
        this.connectionToken = this.generateSecureToken();
        
        // Update status
        this.setConnectionStatus('connecting');
        
        // Create room in connection manager if available
        if (typeof mobileScannerConnection !== 'undefined') {
            const roomDetails = mobileScannerConnection.createRoom(this.roomCode);
            if (roomDetails) {
                this.connectionToken = roomDetails.securityToken;
            }
        }
        
        // Generate mobile scanner URL
        const baseUrl = window.location.origin;
        const mobileUrl = `${baseUrl}/mobile-scanner.html?room=${encodeURIComponent(this.roomCode)}&mode=${scanType}&token=${encodeURIComponent(this.connectionToken)}`;
        
        // Show connection dialog
        this.showConnectionDialog(mobileUrl, scanType);
        
        // Start connection timeout
        this.startConnectionTimeout();
        
        return {
            roomCode: this.roomCode,
            mobileUrl: mobileUrl,
            token: this.connectionToken
        };
    }

    /**
     * Show connection dialog for mobile scanner
     */
    showConnectionDialog(mobileUrl, scanType) {
        // Remove existing dialog
        const existingDialog = document.getElementById('unifiedScannerDialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Create dialog
        const overlay = document.createElement('div');
        overlay.id = 'unifiedScannerDialog';
        overlay.className = 'unified-scanner-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'unified-scanner-dialog';

        // Show connected device info if connected
        let connectedDeviceHtml = '';
        if (this.isConnected && this.deviceId) {
            connectedDeviceHtml = `
                <div class="connected-device-info" style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
                    <span style="color:#28a745;font-weight:600;"><i class="fas fa-link"></i> Connected: <span id="connectedDeviceName">${this.deviceId}</span></span>
                    <button class="btn secondary" id="disconnectMobileBtn" style="margin-left:16px;"><i class="fas fa-unlink"></i> Disconnect</button>
                </div>
            `;
        }

        // Only show 'Open in New Tab' button if on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);
        dialog.innerHTML = `
            <div class="scanner-dialog-header">
                <h3><i class="fas fa-mobile-alt"></i> Connect Mobile Scanner</h3>
                <button class="close-scanner-dialog" id="closeScannerDialog">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="scanner-dialog-content">
                ${connectedDeviceHtml}
                <div class="connection-info">
                    <div class="room-code-display">
                        <span class="room-label">Room Code:</span>
                        <span class="room-code">${this.roomCode}</span>
                    </div>
                    <div class="scan-mode-info">
                        <i class="fas fa-${scanType === 'barcode' ? 'barcode' : scanType === 'bill' ? 'receipt' : 'qrcode'}"></i>
                        <span>${scanType === 'barcode' ? 'Product Scanner' : scanType === 'bill' ? 'Bill Scanner' : 'Smart Scanner'}</span>
                    </div>
                </div>
                <div style="margin:12px 0 20px 0;color:#555;font-size:15px;">Scan the QR code below with your mobile device to connect and start scanning. Once connected, your mobile camera will open automatically.</div>
                <div class="connection-methods">
                    <div class="connection-method">
                        <h4><i class="fas fa-qrcode"></i> Scan QR Code</h4>
                        <div id="qrCodeContainer" class="qr-code-container">
                            <div class="qr-placeholder">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Generating QR Code...</p>
                            </div>
                        </div>
                    </div>
                    <div class="connection-method">
                        <h4><i class="fas fa-link"></i> Open on Mobile</h4>
                        <div class="mobile-url-input">
                            <input type="text" readonly value="${mobileUrl}" id="mobileUrlInput">
                            <button id="copyUrlBtn" title="Copy URL">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="connection-status-display" id="connectionStatusDisplay">
                    <div class="status-indicator">
                        <div class="status-dot ${this.isConnected ? 'connected' : 'connecting'}"></div>
                        <span>${this.isConnected ? 'Mobile device connected!' : 'Waiting for mobile device...'}</span>
                    </div>
                </div>
                <div class="scanner-dialog-actions">
                    ${isMobile ? `<button class="btn secondary" id="openInNewTabBtn"><i class="fas fa-external-link-alt"></i> Open in New Tab</button>` : ''}
                    <button class="btn primary" id="testConnectionBtn">
                        <i class="fas fa-wifi"></i> Test Connection
                    </button>
                </div>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Add styles if not present
        this.addDialogStyles();

        // Show with animation
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);

        // Setup event handlers
        this.setupDialogEvents(overlay, mobileUrl);

        // Generate QR code
        this.generateQRCode(mobileUrl);

        // Disconnect button event
        if (this.isConnected) {
            const disconnectBtn = overlay.querySelector('#disconnectMobileBtn');
            if (disconnectBtn) {
                disconnectBtn.addEventListener('click', () => {
                    this.disconnect();
                    this.closeConnectionDialog(overlay);
                });
            }
        }
    }

    /**
     * Setup dialog event handlers
     */
    setupDialogEvents(overlay, mobileUrl) {
        // Close button
        const closeBtn = overlay.querySelector('#closeScannerDialog');
        closeBtn?.addEventListener('click', () => {
            this.closeConnectionDialog(overlay);
        });
        
        // Copy URL button
        const copyBtn = overlay.querySelector('#copyUrlBtn');
        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(mobileUrl);
        });
        
        // Open in new tab (only if button exists, i.e., on mobile)
        const newTabBtn = overlay.querySelector('#openInNewTabBtn');
        if (newTabBtn) {
            newTabBtn.addEventListener('click', () => {
                window.open(mobileUrl, '_blank');
            });
        }
        
        // Test connection
        const testBtn = overlay.querySelector('#testConnectionBtn');
        testBtn?.addEventListener('click', () => {
            this.testConnection();
        });
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeConnectionDialog(overlay);
            }
        });
        
        // ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeConnectionDialog(overlay);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    /**
     * Generate QR code for connection URL
     */
    generateQRCode(url) {
        const container = document.getElementById('qrCodeContainer');
        if (!container) return;
        
        // Check if QRCode library is available
        if (typeof QRCode !== 'undefined') {
            container.innerHTML = '';
            QRCode.toCanvas(container, url, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#2c3e50',
                    light: '#ffffff'
                }
            }, (error) => {
                if (error) {
                    container.innerHTML = '<p>QR Code generation failed</p>';
                }
            });
        } else {
            // Load QRCode library dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
            script.onload = () => {
                this.generateQRCode(url);
            };
            script.onerror = () => {
                container.innerHTML = '<p>QR Code generation failed</p>';
            };
            document.head.appendChild(script);
        }
    }

    /**
     * Copy URL to clipboard
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const input = document.getElementById('mobileUrlInput');
                input.select();
                document.execCommand('copy');
            }
            
            this.showNotification('URL copied to clipboard!', 'success');
        } catch (error) {
            this.showNotification('Failed to copy URL', 'error');
        }
    }

    /**
     * Test connection
     */
    testConnection() {
        this.showNotification('Testing connection...', 'info');
        
        // Simulate connection test
        setTimeout(() => {
            if (this.isConnected) {
                this.showNotification('Connection is active!', 'success');
            } else {
                this.showNotification('No active connection. Please connect a mobile device.', 'warning');
            }
        }, 1000);
    }

    /**
     * Close connection dialog
     */
    closeConnectionDialog(overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
        
        // Clear connection timeout if still connecting
        if (this.connectionStatus === 'connecting') {
            this.setConnectionStatus('disconnected');
        }
    }

    /**
     * Setup connection listeners
     */
    setupConnectionListeners() {
        if (typeof mobileScannerConnection !== 'undefined') {
            // Listen for device connections
            mobileScannerConnection.on('device_connected', (data) => {
                if (data.roomCode === this.roomCode) {
                    this.handleDeviceConnected(data);
                }
            });
            
            // Listen for scan events
            mobileScannerConnection.on('scan_received', (data) => {
                if (data.roomCode === this.roomCode) {
                    this.handleScanReceived(data);
                }
            });
            
            // Listen for disconnections
            mobileScannerConnection.on('device_disconnected', (data) => {
                if (data.roomCode === this.roomCode) {
                    this.handleDeviceDisconnected(data);
                }
            });
        }
    }

    /**
     * Handle device connection
     */
    handleDeviceConnected(data) {
        this.deviceId = data.deviceId;
        this.setConnectionStatus('connected');
        this.saveConnection();

        // Update connection dialog and auto-close after short delay
        const statusDisplay = document.getElementById('connectionStatusDisplay');
        if (statusDisplay) {
            statusDisplay.innerHTML = `
                <div class="status-indicator connected">
                    <div class="status-dot connected"></div>
                    <span>Mobile device connected!</span>
                </div>
            `;
        }

        this.showNotification('Mobile scanner connected!', 'success');
        this.emit('connected', data);

        // Start heartbeat
        this.startHeartbeat();

        // Auto-close dialog after 1s
        setTimeout(() => {
            const overlay = document.getElementById('unifiedScannerDialog');
            if (overlay) this.closeConnectionDialog(overlay);
        }, 1000);
    }

    /**
     * Handle scan received
     */
    handleScanReceived(data) {
        this.emit('scan', data);
    }

    /**
     * Handle device disconnection
     */
    handleDeviceDisconnected(data) {
        this.setConnectionStatus('disconnected');
        this.deviceId = null;
        
        this.showNotification('Mobile scanner disconnected', 'warning');
        this.emit('disconnected', data);
        
        // Stop heartbeat
        this.stopHeartbeat();
    }

    /**
     * Set connection status
     */
    setConnectionStatus(status) {
        this.connectionStatus = status;
        this.isConnected = status === 'connected';
        
        // Update global indicator
        this.updateConnectionIndicator();
        
        this.emit('statusChange', { status, isConnected: this.isConnected });
    }

    /**
     * Add global connection indicator
     */
    addConnectionIndicator() {
        // Add indicator to navbar if it doesn't exist
        const navbar = document.querySelector('.smart-pos-navbar .navbar-right');
        if (navbar && !document.getElementById('scannerConnectionIndicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'scannerConnectionIndicator';
            indicator.className = 'scanner-connection-indicator';
            indicator.innerHTML = `
                <div class="connection-dot disconnected"></div>
                <span class="connection-text">Scanner</span>
            `;
            indicator.title = 'Mobile Scanner Connection Status';
            
            // Insert before scan button
            const scanButton = navbar.querySelector('.scan-button');
            if (scanButton) {
                navbar.insertBefore(indicator, scanButton);
            } else {
                navbar.appendChild(indicator);
            }
        }
    }

    /**
     * Update connection indicator
     */
    updateConnectionIndicator() {
        const indicator = document.getElementById('scannerConnectionIndicator');
        if (indicator) {
            const dot = indicator.querySelector('.connection-dot');
            const text = indicator.querySelector('.connection-text');
            
            if (dot && text) {
                dot.className = `connection-dot ${this.connectionStatus}`;
                text.textContent = this.isConnected ? 'Connected' : 'Scanner';
                indicator.title = this.isConnected ? 
                    `Mobile Scanner Connected (Room: ${this.roomCode})` : 
                    'Mobile Scanner Disconnected';
            }
        }
    }

    /**
     * Attempt reconnection
     */
    attemptReconnection() {
        if (!this.roomCode || !this.connectionToken) return;
        
        this.setConnectionStatus('connecting');
        
        // Try to reconnect using existing room code
        if (typeof mobileScannerConnection !== 'undefined') {
            const success = mobileScannerConnection.attemptReconnection(
                this.roomCode, 
                this.connectionToken
            );
            
            if (success) {
                this.setConnectionStatus('connected');
                this.startHeartbeat();
            } else {
                this.setConnectionStatus('disconnected');
                // Clear saved connection
                localStorage.removeItem('smartpos_scanner_connection');
            }
        }
    }

    /**
     * Start connection timeout
     */
    startConnectionTimeout() {
        this.clearConnectionTimeout();
        
        this.connectionTimeout = setTimeout(() => {
            if (this.connectionStatus === 'connecting') {
                this.setConnectionStatus('disconnected');
                this.showNotification('Connection timeout. Please try again.', 'warning');
            }
        }, 60000); // 1 minute timeout
    }

    /**
     * Clear connection timeout
     */
    clearConnectionTimeout() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
    }

    /**
     * Start heartbeat to maintain connection
     */
    startHeartbeat() {
        this.stopHeartbeat();
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && typeof mobileScannerConnection !== 'undefined') {
                const alive = mobileScannerConnection.sendHeartbeat(this.roomCode);
                if (!alive) {
                    this.handleDeviceDisconnected({ roomCode: this.roomCode });
                }
            }
        }, 30000); // 30 seconds
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Generate secure token
     */
    generateSecureToken() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                callback(data);
            });
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.smartPOSNavbar && typeof window.smartPOSNavbar.showNotification === 'function') {
            window.smartPOSNavbar.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Add dialog styles
     */
    addDialogStyles() {
        if (document.getElementById('unifiedScannerDialogStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'unifiedScannerDialogStyles';
        styles.textContent = `
            .unified-scanner-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .unified-scanner-overlay.show {
                opacity: 1;
            }
            
            .unified-scanner-dialog {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .unified-scanner-overlay.show .unified-scanner-dialog {
                transform: scale(1);
            }
            
            .scanner-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid #e9ecef;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 16px 16px 0 0;
            }
            
            .scanner-dialog-header h3 {
                margin: 0;
                font-size: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .close-scanner-dialog {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .close-scanner-dialog:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .scanner-dialog-content {
                padding: 24px;
            }
            
            .connection-info {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .room-code-display {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .room-label {
                font-size: 12px;
                color: #6c757d;
                text-transform: uppercase;
                font-weight: 600;
            }
            
            .room-code {
                font-size: 24px;
                font-weight: 700;
                color: #2c3e50;
                font-family: monospace;
            }
            
            .scan-mode-info {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #495057;
                font-weight: 500;
            }
            
            .connection-methods {
                display: grid;
                gap: 20px;
                margin-bottom: 24px;
            }
            
            .connection-method {
                border: 2px solid #e9ecef;
                border-radius: 12px;
                padding: 20px;
                transition: all 0.3s ease;
            }
            
            .connection-method:hover {
                border-color: #007bff;
                background: #f8f9ff;
            }
            
            .connection-method h4 {
                margin: 0 0 12px 0;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .qr-code-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 200px;
                background: white;
                border-radius: 8px;
            }
            
            .qr-placeholder {
                text-align: center;
                color: #6c757d;
            }
            
            .mobile-url-input {
                display: flex;
                gap: 8px;
            }
            
            .mobile-url-input input {
                flex: 1;
                padding: 12px;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                font-size: 14px;
                font-family: monospace;
            }
            
            .mobile-url-input button {
                padding: 12px 16px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .mobile-url-input button:hover {
                background: #1e7e34;
                transform: translateY(-1px);
            }
            
            .connection-status-display {
                background: #e9ecef;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 24px;
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
                justify-content: center;
            }
            
            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #dc3545;
                animation: pulse 2s infinite;
            }
            
            .status-dot.connecting {
                background: #ffc107;
                animation: pulse 1s infinite;
            }
            
            .status-dot.connected {
                background: #28a745;
                animation: none;
            }
            
            .scanner-dialog-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            
            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn.primary {
                background: #007bff;
                color: white;
            }
            
            .btn.primary:hover {
                background: #0056b3;
                transform: translateY(-1px);
            }
            
            .btn.secondary {
                background: #6c757d;
                color: white;
            }
            
            .btn.secondary:hover {
                background: #545b62;
                transform: translateY(-1px);
            }
            
            .scanner-connection-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                font-size: 12px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .scanner-connection-indicator:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .connection-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #dc3545;
            }
            
            .connection-dot.connecting {
                background: #ffc107;
                animation: pulse 1s infinite;
            }
            
            .connection-dot.connected {
                background: #28a745;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            @media (max-width: 768px) {
                .connection-info {
                    flex-direction: column;
                    gap: 16px;
                    text-align: center;
                }
                
                .scanner-dialog-actions {
                    flex-direction: column;
                }
                
                .connection-text {
                    display: none;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Public API methods
     */
    
    // Connect with specific scan type
    async connectBarcode() {
        return await this.createConnection('barcode');
    }
    
    async connectBill() {
        return await this.createConnection('bill');
    }
    
    async connectAuto() {
        return await this.createConnection('auto');
    }
    
    // Disconnect
    disconnect() {
        if (typeof mobileScannerConnection !== 'undefined' && this.roomCode) {
            mobileScannerConnection.closeRoom(this.roomCode);
        }
        
        this.setConnectionStatus('disconnected');
        this.roomCode = null;
        this.connectionToken = null;
        this.deviceId = null;
        
        localStorage.removeItem('smartpos_scanner_connection');
        this.stopHeartbeat();
        this.clearConnectionTimeout();
        
        this.showNotification('Scanner disconnected', 'info');
    }
    
    // Get connection status
    getStatus() {
        return {
            isConnected: this.isConnected,
            status: this.connectionStatus,
            roomCode: this.roomCode,
            deviceId: this.deviceId
        };
    }
}

// Create global instance
window.unifiedScannerConnection = new ScannerUnified();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScannerUnified;
}
