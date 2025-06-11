/**
 * Token blacklist for handling revoked tokens
 * This provides a simple in-memory implementation for development
 * For production, use Redis or another persistent store
 */

// Simple in-memory store with expiration
class TokenBlacklist {
  constructor() {
    this.blacklistedTokens = new Map();
    // Clean up expired tokens every hour
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  /**
   * Add a token to the blacklist
   * @param {string} jti - Token's unique identifier
   * @param {number} exp - Token expiration timestamp (in seconds)
   * @param {string} reason - Reason for blacklisting
   * @param {string} userId - Optional user ID associated with the token
   */
  addToBlacklist(jti, exp, reason = 'logout', userId = null) {
    if (!jti) return;
    
    // Convert exp from seconds to milliseconds
    const expiry = exp * 1000;
    
    this.blacklistedTokens.set(jti, {
      expiry,
      reason,
      userId,
      blacklistedAt: Date.now()
    });
  }

  /**
   * Check if a token is blacklisted
   * @param {string} jti - Token's unique identifier
   * @returns {boolean} True if token is blacklisted
   */
  isBlacklisted(jti) {
    return this.blacklistedTokens.has(jti);
  }

  /**
   * Remove expired tokens from the blacklist
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let removed = 0;
    
    for (const [jti, data] of this.blacklistedTokens.entries()) {
      if (data.expiry < now) {
        this.blacklistedTokens.delete(jti);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`Cleaned up ${removed} expired tokens from blacklist`);
    }
  }

  /**
   * Get the current size of the blacklist
   * @returns {number} Number of tokens in the blacklist
   */
  getSize() {
    return this.blacklistedTokens.size;
  }

  /**
   * Blacklist all tokens for a specific user
   * Useful for "logout everywhere" functionality
   * @param {string} userId - User ID
   * @param {string} reason - Reason for blacklisting
   */
  blacklistUserTokens(userId, reason = 'user_blacklisted') {
    // In a real implementation with Redis, you would use a pattern search
    // Here we just iterate through all tokens
    for (const [jti, data] of this.blacklistedTokens.entries()) {
      if (data.userId === userId) {
        this.blacklistedTokens.set(jti, {
          ...data,
          reason
        });
      }
    }
  }
}

// Export a singleton instance
module.exports = new TokenBlacklist();
const tokenBlacklist = new TokenBlacklist();

module.exports = tokenBlacklist;
