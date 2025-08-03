/**
 * Security Logger
 * Simple client-side security logging utility
 */
class SecurityLogger {
    constructor() {
        this.enabled = true;
        this.maxLogs = 100; // Maximum number of logs to keep
        this.storageKey = 'neopos_security_logs';
        this.logs = this.loadLogs();
    }

    /**
     * Log a security event
     * @param {string} event - Event type
     * @param {Object} data - Additional data about the event
     */
    log(event, data = {}) {
        if (!this.enabled) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Add to memory logs
        this.logs.unshift(logEntry);
        
        // Trim logs if too many
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
        
        // Save to storage
        this.saveLogs();
        
        // Output to console in development (browser environment check)
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            console.info(`[SECURITY] ${event}`, data);
        }
    }
    
    /**
     * Load logs from storage
     * @returns {Array} Logs
     */
    loadLogs() {
        try {
            const storedLogs = localStorage.getItem(this.storageKey);
            return storedLogs ? JSON.parse(storedLogs) : [];
        } catch (error) {
            console.error('Error loading security logs:', error);
            return [];
        }
    }
    
    /**
     * Save logs to storage
     */
    saveLogs() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
        } catch (error) {
            console.error('Error saving security logs:', error);
        }
    }
    
    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
        localStorage.removeItem(this.storageKey);
    }
    
    /**
     * Get all logs
     * @returns {Array} Logs
     */
    getLogs() {
        return [...this.logs];
    }
    
    /**
     * Enable or disable logging
     * @param {boolean} enabled - Whether logging is enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Export singleton instance
window.securityLogger = window.securityLogger || new SecurityLogger();
