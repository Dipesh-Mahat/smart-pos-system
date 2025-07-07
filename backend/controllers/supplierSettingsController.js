const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get supplier settings (general preferences, notification settings, etc)
 */
exports.getSettings = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    // Find user and select only the relevant fields for settings
    const supplier = await User.findById(supplierId).select('preferences securitySettings notificationPreferences integrations privacySettings businessSettings -_id');
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        settings: {
          preferences: supplier.preferences || {},
          security: supplier.securitySettings || {},
          notifications: supplier.notificationPreferences || {},
          integrations: supplier.integrations || [],
          privacy: supplier.privacySettings || {},
          business: supplier.businessSettings || {}
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching supplier settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve settings',
      error: error.message
    });
  }
};

/**
 * Update supplier general preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { language, timezone, currency, dateFormat, autoSave, darkMode } = req.body;
    
    // Update supplier preferences
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      {
        preferences: {
          language,
          timezone,
          currency,
          dateFormat,
          autoSave,
          darkMode
        }
      },
      { new: true, runValidators: true }
    ).select('preferences -_id');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: updatedSupplier.preferences }
    });
    
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};

/**
 * Update notification settings
 */
exports.updateNotificationSettings = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { notifications } = req.body;
    
    // Update notification preferences
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      { notificationPreferences: notifications },
      { new: true, runValidators: true }
    ).select('notificationPreferences -_id');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: { notifications: updatedSupplier.notificationPreferences }
    });
    
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
};

/**
 * Update security settings
 */
exports.updateSecuritySettings = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { twoFactorEnabled, loginNotifications } = req.body;
    
    // Update security settings
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      {
        securitySettings: {
          twoFactorEnabled,
          loginNotifications
        }
      },
      { new: true, runValidators: true }
    ).select('securitySettings -_id');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: { security: updatedSupplier.securitySettings }
    });
    
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings',
      error: error.message
    });
  }
};

/**
 * Get active sessions
 */
exports.getActiveSessions = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    // Find supplier and get sessions
    const supplier = await User.findById(supplierId).select('activeSessions -_id');
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { sessions: supplier.activeSessions || [] }
    });
    
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active sessions',
      error: error.message
    });
  }
};

/**
 * Terminate a specific session
 */
exports.terminateSession = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { sessionId } = req.params;
    
    // Find supplier and remove the session
    const supplier = await User.findById(supplierId);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Filter out the session with the matching ID
    const activeSessions = (supplier.activeSessions || []).filter(
      session => session.id !== sessionId
    );
    
    // Update supplier with new sessions list
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      { activeSessions },
      { new: true }
    ).select('activeSessions -_id');
    
    res.status(200).json({
      success: true,
      message: 'Session terminated successfully',
      data: { sessions: updatedSupplier.activeSessions }
    });
    
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate session',
      error: error.message
    });
  }
};

/**
 * Terminate all sessions except current one
 */
exports.terminateAllSessions = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { currentSessionId } = req.body;
    
    // Find supplier
    const supplier = await User.findById(supplierId);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // Keep only the current session
    const activeSessions = (supplier.activeSessions || []).filter(
      session => session.id === currentSessionId
    );
    
    // Update supplier with new sessions list
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      { activeSessions },
      { new: true }
    ).select('activeSessions -_id');
    
    res.status(200).json({
      success: true,
      message: 'All other sessions terminated successfully',
      data: { sessions: updatedSupplier.activeSessions }
    });
    
  } catch (error) {
    console.error('Error terminating all sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to terminate sessions',
      error: error.message
    });
  }
};

/**
 * Manage integrations
 */
exports.updateIntegrations = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { integrations } = req.body;
    
    // Update integrations
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      { integrations },
      { new: true, runValidators: true }
    ).select('integrations -_id');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Integrations updated successfully',
      data: { integrations: updatedSupplier.integrations }
    });
    
  } catch (error) {
    console.error('Error updating integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update integrations',
      error: error.message
    });
  }
};

/**
 * Update privacy settings
 */
exports.updatePrivacySettings = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { profileVisibility, contactVisibility } = req.body;
    
    // Update privacy settings
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      {
        privacySettings: {
          profileVisibility,
          contactVisibility
        }
      },
      { new: true, runValidators: true }
    ).select('privacySettings -_id');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: { privacy: updatedSupplier.privacySettings }
    });
    
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings',
      error: error.message
    });
  }
};

/**
 * Request account data export
 */
exports.requestDataExport = async (req, res) => {
  try {
    const supplierId = req.user._id;
    
    // Find supplier
    const supplier = await User.findById(supplierId);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    
    // In a real implementation, this would initiate a background job to export data
    // and send an email with a download link
    
    res.status(200).json({
      success: true,
      message: 'Data export requested successfully. You will receive an email with download instructions.'
    });
    
  } catch (error) {
    console.error('Error requesting data export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request data export',
      error: error.message
    });
  }
};
