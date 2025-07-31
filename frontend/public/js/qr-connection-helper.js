/**
 * QR Code Connection Helper for Smart POS Mobile Scanner
 * 
 * This helper manages the QR code generation and connection between mobile and desktop devices.
 * It handles:
 * 1. QR code generation for different connection modes (online, local, hotspot)
 * 2. Connection tracking and status updates
 * 3. Reconnection and fallback options
 */

class QRConnectionHelper {
    constructor(apiBase = '/api') {
        this.apiBase = apiBase;
        this.connectionMode = 'auto'; // 'online', 'local', 'hotspot', or 'auto'
        this.activeSessionId = null;
        this.connectionData = null;
        this.statusUpdateInterval = null;
        this.connectionTimeout = null;
        this.eventHandlers = {};
        
        // Init
        console.log('QR Connection Helper initialized');
        
        // Check if we have an existing connection
        this.restoreConnectionIfAvailable();
    }
    
    /**
     * Attempt to restore a previous connection if available
     */
    async restoreConnectionIfAvailable() {
        const sessionId = localStorage.getItem('qrSessionId');
        const isActive = localStorage.getItem('qrConnectionActive') === 'true';
        
        if (sessionId && isActive) {
            console.log('Attempting to restore previous connection:', sessionId);
            this.activeSessionId = sessionId;
            
            try {
                // Check if the session is still valid
                const response = await fetch(`${this.apiBase}/mobile-scanner/check-session/${sessionId}`, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.valid && data.connected) {
                        console.log('Successfully restored previous connection');
                        this.connectionData = data;
                        this.triggerEvent('connectionRestored', data);
                        this.startConnectionMonitoring();
                        return true;
                    }
                }
            } catch (error) {
                console.error('Failed to restore previous connection:', error);
            }
            
            // Clear invalid session data
            localStorage.removeItem('qrConnectionActive');
            localStorage.removeItem('qrSessionId');
        }
        
        return false;
    }
    
    /**
     * Generate QR code for scanner connection
     * @param {string} type - Scan type: 'product', 'bill', 'inventory' 
     * @param {string} mode - Connection mode: 'auto', 'online', 'local', 'hotspot'
     * @returns {Promise<Object>} QR code data with URLs
     */
    async generateQRCode(type = 'product', mode = 'auto') {
        try {
            this.connectionMode = mode;
            
            const response = await fetch(`${this.apiBase}/mobile-scanner/generate-qr?type=${type}&mode=${mode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to generate QR code: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.activeSessionId = data.sessionId;
                this.connectionData = data.data;
                
                // Start monitoring connection status
                this.startConnectionMonitoring();
                
                // Trigger event
                this.triggerEvent('qrGenerated', this.connectionData);
                
                return this.connectionData;
            } else {
                throw new Error(data.message || 'Failed to generate QR code');
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            
            // Try to generate a fallback QR code
            return this.generateFallbackQR(type);
        }
    }
    
    /**
     * Generate a fallback QR code when the server request fails
     * @param {string} type - Scan type
     * @returns {Object} Fallback QR code data
     */
    async generateFallbackQR(type) {
        try {
            // Try to use local QRCode.js library if available
            if (typeof QRCode === 'undefined') {
                return {
                    error: true,
                    message: 'QR code generation failed and fallback is not available',
                    fallback: true
                };
            }
            
            // Create a canvas element for QR code
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            
            // Generate a simple local connection URL
            const localUrl = `http://localhost:3000/mobile-scanner.html?type=${type}&mode=local&fallback=true`;
            
            // Create a new QRCode instance
            const qr = new QRCode(canvas, {
                text: localUrl,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
            
            // Convert canvas to data URL
            const qrDataUrl = canvas.toDataURL('image/png');
            
            return {
                primaryMode: 'local',
                qrCodes: {
                    local: qrDataUrl
                },
                scannerUrls: {
                    local: localUrl
                },
                fallback: true,
                type: type
            };
        } catch (error) {
            console.error('Fallback QR generation failed:', error);
            return {
                error: true,
                message: 'QR code generation failed completely',
                fallback: true
            };
        }
    }
    
    /**
     * Start monitoring the connection status
     */
    startConnectionMonitoring() {
        // Clear any existing intervals
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
        }
        
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }
        
        // Set connection timeout (24 hours)
        this.connectionTimeout = setTimeout(() => {
            this.triggerEvent('connectionTimeout', {
                sessionId: this.activeSessionId
            });
        }, 24 * 60 * 60 * 1000);
        
        // Check connection status every 5 seconds
        this.statusUpdateInterval = setInterval(async () => {
            if (!this.activeSessionId) return;
            
            try {
                const response = await fetch(`${this.apiBase}/mobile-scanner/check-session/${this.activeSessionId}`, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.valid && data.connected) {
                        // Connected!
                        this.triggerEvent('deviceConnected', data);
                        
                        // Keep monitoring to maintain the connection
                        // This ensures we can detect if the connection drops
                        localStorage.setItem('qrConnectionActive', 'true');
                        localStorage.setItem('qrSessionId', this.activeSessionId);
                    }
                }
            } catch (error) {
                console.log('Connection status check error:', error);
            }
        }, 5000);
    }
    
    /**
     * Stop monitoring the connection status
     * Note: We now only stop monitoring when explicitly called,
     * which helps maintain long-term connections
     */
    stopConnectionMonitoring() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
        
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        
        // Clear stored connection data
        localStorage.removeItem('qrConnectionActive');
        localStorage.removeItem('qrSessionId');
    }
    
    /**
     * Register an event handler
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler function
     */
    on(eventName, handler) {
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(handler);
    }
    
    /**
     * Trigger an event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     */
    triggerEvent(eventName, data) {
        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName].forEach(handler => handler(data));
        }
    }
    
    /**
     * Check if the current environment supports QR code generation
     * @returns {boolean} True if QR code generation is supported
     */
    isQRGenerationSupported() {
        return true; // We always support QR generation with our implementation
    }
    
    /**
     * Get info about available connection modes
     * @returns {Promise<Object>} Connection modes info
     */
    async getConnectionModesInfo() {
        try {
            const response = await fetch(`${this.apiBase}/mobile-scanner/connection-modes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
            
            return {
                online: true,
                local: false,
                hotspot: false
            };
        } catch (error) {
            console.error('Error getting connection modes:', error);
            return {
                online: true,
                local: false,
                hotspot: false,
                error: true
            };
        }
    }
}

// Create a global instance - use try/catch to handle errors
try {
    window.qrConnectionHelper = new QRConnectionHelper();
} catch (error) {
    console.error('Error initializing QR connection helper:', error);
    // Create a basic fallback implementation
    window.qrConnectionHelper = {
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
        generateQRCode: async function(type = 'product', mode = 'auto') {
            // Return a basic QR implementation
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#000000';
            ctx.font = '16px Arial';
            ctx.fillText('QR Fallback', 80, 128);
            
            const dataUrl = canvas.toDataURL('image/png');
            
            return {
                primaryMode: mode,
                qrCodes: { 
                    [mode]: dataUrl
                },
                fallback: true,
                type: type
            };
        },
        startConnectionMonitoring: function() {},
        stopConnectionMonitoring: function() {}
    };
}
