/**
 * Mobile Scanner Connection Manager - Enhanced Version
 * 
 * This module manages connections between mobile scanners and the POS terminal.
 * It handles:
 * 1. Room creation and management with security tokens
 * 2. Mobile device connection and authentication
 * 3. Barcode data transmission
 * 4. Connection monitoring and auto-recovery
 * 5. Device management with activity tracking
 */

class EnhancedScannerConnection {
    constructor() {
        this.activeConnections = new Map(); // roomCode -> connection info
        this.connectionTimeouts = new Map(); // roomCode -> timeout
        this.reconnectAttempts = new Map(); // deviceId -> attempt count
        this.messageHandlers = new Map(); // event type -> handler function
        this.heartbeatIntervals = new Map(); // roomCode -> interval
        
        // Start periodic cleanup
        this.cleanupInterval = setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
        
        console.log('Enhanced Mobile Scanner Connection Manager initialized');
    }

    /**
     * Generate a secure room code
     * @returns {string} - Room code
     */
    generateRoomCode() {
        // In production, use a more secure method with proper entropy
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    /**
     * Generate a security token for a room
     * @param {string} roomCode - Room code
     * @returns {string} - Security token
     */
    generateSecurityToken(roomCode) {
        // In production, use a proper HMAC or JWT
        const timestamp = Date.now();
        return btoa(`${roomCode}-${timestamp}-${Math.random().toString(36).substring(2, 15)}`);
    }

    /**
     * Create a new room for connection
     * @param {string} roomCode - Room code (optional, generated if not provided)
     * @returns {Object} - Room details including security token
     */
    createRoom(roomCode) {
        // Generate room code if not provided
        if (!roomCode) {
            roomCode = this.generateRoomCode();
        }
        
        // If room already exists, regenerate token but keep connections
        if (this.activeConnections.has(roomCode)) {
            const room = this.activeConnections.get(roomCode);
            
            // Only update if room is marked inactive
            if (!room.isActive) {
                room.isActive = true;
                room.securityToken = this.generateSecurityToken(roomCode);
                room.lastActivity = Date.now();
                
                console.log(`Room ${roomCode} reactivated with new token`);
                this.dispatchEvent('room_reactivated', { 
                    roomCode, 
                    deviceCount: room.devices.length 
                });
                
                return {
                    roomCode,
                    securityToken: room.securityToken,
                    url: this.getMobileScannerUrl(roomCode, room.securityToken)
                };
            }
            
            return {
                roomCode,
                securityToken: room.securityToken,
                url: this.getMobileScannerUrl(roomCode, room.securityToken)
            };
        }
        
        // Create new room
        const securityToken = this.generateSecurityToken(roomCode);
        
        this.activeConnections.set(roomCode, {
            createdAt: Date.now(),
            lastActivity: Date.now(),
            securityToken: securityToken,
            devices: [],
            isActive: true,
            connectionStats: {
                totalConnections: 0,
                totalBarcodeScans: 0,
                lastScanTime: null
            }
        });
        
        // Set up heartbeat for this room
        this.setupHeartbeat(roomCode);
        
        // Set room expiration
        this.setRoomExpiration(roomCode);
        
        console.log(`Room ${roomCode} created with token`);
        this.dispatchEvent('room_created', { 
            roomCode, 
            securityToken 
        });
        
        return {
            roomCode,
            securityToken,
            url: this.getMobileScannerUrl(roomCode, securityToken)
        };
    }

    /**
     * Set up heartbeat interval for a room
     * @param {string} roomCode - Room code
     */
    setupHeartbeat(roomCode) {
        // Clear any existing heartbeat
        if (this.heartbeatIntervals.has(roomCode)) {
            clearInterval(this.heartbeatIntervals.get(roomCode));
        }
        
        // Create new heartbeat interval
        const interval = setInterval(() => {
            if (this.activeConnections.has(roomCode)) {
                const room = this.activeConnections.get(roomCode);
                
                // Send heartbeat to all connected devices
                if (room.devices.length > 0) {
                    this.dispatchEvent('heartbeat', { 
                        roomCode, 
                        timestamp: Date.now() 
                    });
                    
                    // Check if any devices haven't responded to heartbeats
                    this.checkDeviceResponsiveness(roomCode);
                }
            } else {
                // Room no longer exists, clear the interval
                clearInterval(interval);
                this.heartbeatIntervals.delete(roomCode);
            }
        }, 30 * 1000); // 30 second heartbeat
        
        this.heartbeatIntervals.set(roomCode, interval);
    }

    /**
     * Check if devices in a room are responsive
     * @param {string} roomCode - Room code
     */
    checkDeviceResponsiveness(roomCode) {
        if (!this.activeConnections.has(roomCode)) return;
        
        const room = this.activeConnections.get(roomCode);
        const now = Date.now();
        const unresponsiveThreshold = 2 * 60 * 1000; // 2 minutes
        
        // Find unresponsive devices
        const unresponsiveDevices = room.devices.filter(device => 
            now - device.lastActivity > unresponsiveThreshold
        );
        
        // Handle unresponsive devices
        unresponsiveDevices.forEach(device => {
            console.log(`Device ${device.id} in room ${roomCode} is unresponsive`);
            
            // Attempt to reconnect if not exceeded max attempts
            const attempts = this.reconnectAttempts.get(device.id) || 0;
            if (attempts < 3) {
                this.reconnectAttempts.set(device.id, attempts + 1);
                this.dispatchEvent('device_reconnect_attempt', {
                    roomCode,
                    deviceId: device.id,
                    attempt: attempts + 1
                });
            } else {
                // Remove device after max reconnect attempts
                this.disconnectDevice(roomCode, device.id, 'unresponsive');
            }
        });
    }

    /**
     * Set room expiration timeout
     * @param {string} roomCode - Room code
     */
    setRoomExpiration(roomCode) {
        // Clear any existing timeout
        if (this.connectionTimeouts.has(roomCode)) {
            clearTimeout(this.connectionTimeouts.get(roomCode));
        }
        
        // Set new timeout - rooms expire after 30 minutes of inactivity
        const timeout = setTimeout(() => {
            if (this.activeConnections.has(roomCode)) {
                const room = this.activeConnections.get(roomCode);
                const now = Date.now();
                const inactiveTime = now - room.lastActivity;
                
                // If inactive for more than 30 minutes and no devices connected
                if (inactiveTime > 30 * 60 * 1000 && room.devices.length === 0) {
                    this.deactivateRoom(roomCode);
                } else {
                    // Reset timeout if still active
                    this.setRoomExpiration(roomCode);
                }
            }
        }, 30 * 60 * 1000); // 30 minutes
        
        this.connectionTimeouts.set(roomCode, timeout);
    }

    /**
     * Deactivate a room but keep it in memory for potential reuse
     * @param {string} roomCode - Room code
     */
    deactivateRoom(roomCode) {
        if (!this.activeConnections.has(roomCode)) return;
        
        const room = this.activeConnections.get(roomCode);
        room.isActive = false;
        
        console.log(`Room ${roomCode} deactivated due to inactivity`);
        this.dispatchEvent('room_deactivated', { roomCode });
        
        // Disconnect any remaining devices
        room.devices.forEach(device => {
            this.disconnectDevice(roomCode, device.id, 'room_deactivated');
        });
        
        // Clear heartbeat
        if (this.heartbeatIntervals.has(roomCode)) {
            clearInterval(this.heartbeatIntervals.get(roomCode));
            this.heartbeatIntervals.delete(roomCode);
        }
    }

    /**
     * Get mobile scanner URL
     * @param {string} roomCode - Room code
     * @param {string} token - Security token
     * @returns {string} - URL for mobile scanner
     */
    getMobileScannerUrl(roomCode, token) {
        // In production, use the actual domain
        return `${window.location.origin}/mobile-scanner.html?room=${roomCode}&token=${token}`;
    }

    /**
     * Handle a device connection request
     * @param {string} roomCode - Room code
     * @param {string} token - Security token
     * @param {Object} deviceInfo - Information about the connecting device
     * @returns {Object} - Connection result
     */
    connectDevice(roomCode, token, deviceInfo) {
        // Validate room and token
        if (!this.activeConnections.has(roomCode)) {
            console.log(`Connection attempt to non-existent room: ${roomCode}`);
            return { 
                success: false, 
                error: 'room_not_found',
                message: 'The room does not exist or has expired' 
            };
        }
        
        const room = this.activeConnections.get(roomCode);
        
        // Validate room is active
        if (!room.isActive) {
            console.log(`Connection attempt to inactive room: ${roomCode}`);
            return { 
                success: false, 
                error: 'room_inactive',
                message: 'The room is no longer active' 
            };
        }
        
        // Validate token
        if (room.securityToken !== token) {
            console.log(`Invalid token for room ${roomCode}`);
            return { 
                success: false, 
                error: 'invalid_token',
                message: 'The security token is invalid' 
            };
        }
        
        // Generate device ID if not provided
        const deviceId = deviceInfo.id || this.generateDeviceId();
        
        // Check if device already connected
        const existingDeviceIndex = room.devices.findIndex(d => d.id === deviceId);
        
        if (existingDeviceIndex >= 0) {
            // Update existing device info
            room.devices[existingDeviceIndex] = {
                ...room.devices[existingDeviceIndex],
                ...deviceInfo,
                lastActivity: Date.now()
            };
            
            console.log(`Device ${deviceId} reconnected to room ${roomCode}`);
            this.dispatchEvent('device_reconnected', { 
                roomCode, 
                deviceId 
            });
        } else {
            // Add new device
            room.devices.push({
                id: deviceId,
                ...deviceInfo,
                connectedAt: Date.now(),
                lastActivity: Date.now(),
                scans: []
            });
            
            room.connectionStats.totalConnections++;
            
            console.log(`Device ${deviceId} connected to room ${roomCode}`);
            this.dispatchEvent('device_connected', { 
                roomCode, 
                deviceId,
                deviceInfo 
            });
        }
        
        // Update room activity
        room.lastActivity = Date.now();
        
        // Reset room expiration
        this.setRoomExpiration(roomCode);
        
        return {
            success: true,
            deviceId,
            roomInfo: {
                roomCode,
                createdAt: room.createdAt,
                deviceCount: room.devices.length
            }
        };
    }

    /**
     * Generate a unique device ID
     * @returns {string} - Device ID
     */
    generateDeviceId() {
        return `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Disconnect a device from a room
     * @param {string} roomCode - Room code
     * @param {string} deviceId - Device ID
     * @param {string} reason - Reason for disconnection
     */
    disconnectDevice(roomCode, deviceId, reason) {
        if (!this.activeConnections.has(roomCode)) return;
        
        const room = this.activeConnections.get(roomCode);
        
        // Find and remove device
        const deviceIndex = room.devices.findIndex(d => d.id === deviceId);
        if (deviceIndex >= 0) {
            const device = room.devices[deviceIndex];
            room.devices.splice(deviceIndex, 1);
            
            console.log(`Device ${deviceId} disconnected from room ${roomCode}. Reason: ${reason}`);
            this.dispatchEvent('device_disconnected', { 
                roomCode, 
                deviceId,
                reason,
                duration: Date.now() - device.connectedAt,
                scanCount: device.scans.length
            });
        }
        
        // Clean up reconnect attempts
        this.reconnectAttempts.delete(deviceId);
        
        // Update room activity
        room.lastActivity = Date.now();
    }

    /**
     * Process a barcode scan from a mobile device
     * @param {string} roomCode - Room code
     * @param {string} deviceId - Device ID
     * @param {Object} scanData - Scan data
     * @returns {Object} - Processing result
     */
    processScan(roomCode, deviceId, scanData) {
        if (!this.activeConnections.has(roomCode)) {
            return { 
                success: false, 
                error: 'room_not_found' 
            };
        }
        
        const room = this.activeConnections.get(roomCode);
        
        // Find the device
        const device = room.devices.find(d => d.id === deviceId);
        if (!device) {
            return { 
                success: false, 
                error: 'device_not_found' 
            };
        }
        
        // Update device activity
        device.lastActivity = Date.now();
        
        // Add scan to device history
        const scan = {
            barcode: scanData.barcode,
            timestamp: Date.now(),
            meta: scanData.meta || {}
        };
        
        device.scans.push(scan);
        
        // Update room stats
        room.connectionStats.totalBarcodeScans++;
        room.connectionStats.lastScanTime = Date.now();
        room.lastActivity = Date.now();
        
        console.log(`Barcode scan from device ${deviceId} in room ${roomCode}: ${scanData.barcode}`);
        this.dispatchEvent('barcode_scanned', { 
            roomCode, 
            deviceId,
            scan
        });
        
        return {
            success: true,
            scanId: `scan-${Date.now()}`,
            scansProcessed: device.scans.length
        };
    }

    /**
     * Update device heartbeat
     * @param {string} roomCode - Room code
     * @param {string} deviceId - Device ID
     */
    updateDeviceHeartbeat(roomCode, deviceId) {
        if (!this.activeConnections.has(roomCode)) return;
        
        const room = this.activeConnections.get(roomCode);
        
        // Find the device
        const device = room.devices.find(d => d.id === deviceId);
        if (device) {
            device.lastActivity = Date.now();
            // Reset reconnect attempts since device is responsive
            this.reconnectAttempts.delete(deviceId);
        }
    }

    /**
     * Clean up inactive connections
     */
    cleanupInactiveConnections() {
        const now = Date.now();
        const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours
        
        this.activeConnections.forEach((room, roomCode) => {
            // Check if room has been inactive for 24 hours
            if (now - room.lastActivity > inactiveThreshold) {
                console.log(`Cleaning up inactive room ${roomCode}`);
                
                // Clean up room resources
                if (this.heartbeatIntervals.has(roomCode)) {
                    clearInterval(this.heartbeatIntervals.get(roomCode));
                    this.heartbeatIntervals.delete(roomCode);
                }
                
                if (this.connectionTimeouts.has(roomCode)) {
                    clearTimeout(this.connectionTimeouts.get(roomCode));
                    this.connectionTimeouts.delete(roomCode);
                }
                
                // Remove room
                this.activeConnections.delete(roomCode);
            }
        });
    }

    /**
     * Register an event handler
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler
     */
    on(eventType, handler) {
        if (!this.messageHandlers.has(eventType)) {
            this.messageHandlers.set(eventType, []);
        }
        
        this.messageHandlers.get(eventType).push(handler);
    }

    /**
     * Dispatch an event to registered handlers
     * @param {string} eventType - Event type
     * @param {Object} eventData - Event data
     */
    dispatchEvent(eventType, eventData) {
        if (!this.messageHandlers.has(eventType)) return;
        
        this.messageHandlers.get(eventType).forEach(handler => {
            try {
                handler(eventData);
            } catch (error) {
                console.error(`Error in ${eventType} handler:`, error);
            }
        });
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.enhancedScannerConnection = new EnhancedScannerConnection();
}
