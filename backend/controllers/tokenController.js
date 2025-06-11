const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenBlacklist = require('../utils/tokenBlacklist');
const { logSecurityEvent } = require('../utils/securityLogger');

const refreshToken = async (req, res) => {
  try {
    // Check for token in cookies first, then in request body
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token not found' 
      });
    }    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }    // Generate new access token and refresh token
    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();
    
    // Parse token to get expiry
    const tokenData = jwt.decode(newAccessToken);
    const expiresAt = tokenData.exp * 1000; // Convert to milliseconds
    
    // Set HTTP-only cookie with the new refresh token
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(expiresAt).toISOString()
    });  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Provide specific error messages based on error type
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please login again.',
        errorType: 'token_expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Please login again.',
        errorType: 'token_invalid'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      errorType: 'token_error'
    });
  }
};

/**
 * Logs out a user by blacklisting their tokens
 */
const logout = async (req, res) => {
  try {
    // Get access token from authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    // Get refresh token from cookies or body
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken;

    // Blacklist the access token if present
    if (token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.jti && decoded.exp) {
          tokenBlacklist.addToBlacklist(decoded.jti, decoded.exp, 'logout');
          logSecurityEvent('TOKEN_BLACKLISTED', { 
            userId: decoded.id, 
            jti: decoded.jti,
            reason: 'logout'
          });
        }
      } catch (error) {
        console.error('Error decoding access token:', error);
      }
    }

    // Blacklist the refresh token if present
    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken);
        if (decoded && decoded.jti && decoded.exp) {
          tokenBlacklist.addToBlacklist(decoded.jti, decoded.exp, 'logout');
          logSecurityEvent('REFRESH_TOKEN_BLACKLISTED', { 
            userId: decoded.id, 
            jti: decoded.jti,
            reason: 'logout'
          });
        }
      } catch (error) {
        console.error('Error decoding refresh token:', error);
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout'
    });
  }
};

module.exports = { refreshToken, logout };
