const Settings = require('../models/Settings');

// Get shop settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ shopId: req.user._id });
    
    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        shopId: req.user._id,
        business: {
          name: req.user.shopName || 'My Shop',
          address: req.user.address || {},
          phone: req.user.contactNumber || '',
          email: req.user.email || ''
        },
        currency: {
          code: 'NPR',
          symbol: 'Rs.',
          position: 'before',
          decimalPlaces: 2
        },
        tax: {
          defaultRate: 13,
          inclusive: false,
          registrationNumber: ''
        },
        receipt: {
          showLogo: true,
          showAddress: true,
          showPhone: true,
          showEmail: true,
          footerText: 'Thank you for your business!'
        },
        inventory: {
          trackStock: true,
          lowStockAlert: true,
          lowStockThreshold: 10,
          autoReorder: false
        },
        pos: {
          allowDiscount: true,
          maxDiscountPercent: 50,
          requireCustomer: false,
          defaultPaymentMethod: 'cash'
        },
        notifications: {
          lowStock: true,
          newOrders: true,
          dailySales: true,
          emailNotifications: true,
          pushNotifications: false
        }
      };
      
      settings = new Settings(defaultSettings);
      await settings.save();
    }
    
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve settings' });
  }
};

// Update shop settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { shopId: req.user._id },
      req.body,
      { 
        new: true, 
        runValidators: true,
        upsert: true // Create if doesn't exist
      }
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'Settings updated successfully', 
      settings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};

// Update specific setting section
exports.updateSettingSection = async (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;
    
    // Valid sections
    const validSections = [
      'business', 'currency', 'tax', 'receipt', 
      'inventory', 'pos', 'notifications'
    ];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid settings section' 
      });
    }
    
    const updateQuery = {};
    updateQuery[section] = updateData;
    
    const settings = await Settings.findOneAndUpdate(
      { shopId: req.user._id },
      { $set: updateQuery },
      { 
        new: true, 
        runValidators: true,
        upsert: true
      }
    );
    
    res.status(200).json({ 
      success: true, 
      message: `${section} settings updated successfully`, 
      settings 
    });
  } catch (error) {
    console.error('Error updating setting section:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update setting section' });
  }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
  try {
    const { section } = req.body;
    
    let defaultSettings = {};
    
    if (section) {
      // Reset specific section
      switch (section) {
        case 'currency':
          defaultSettings.currency = {
            code: 'NPR',
            symbol: 'Rs.',
            position: 'before',
            decimalPlaces: 2
          };
          break;
        case 'tax':
          defaultSettings.tax = {
            defaultRate: 13,
            inclusive: false,
            registrationNumber: ''
          };
          break;
        case 'receipt':
          defaultSettings.receipt = {
            showLogo: true,
            showAddress: true,
            showPhone: true,
            showEmail: true,
            footerText: 'Thank you for your business!'
          };
          break;
        case 'inventory':
          defaultSettings.inventory = {
            trackStock: true,
            lowStockAlert: true,
            lowStockThreshold: 10,
            autoReorder: false
          };
          break;
        case 'pos':
          defaultSettings.pos = {
            allowDiscount: true,
            maxDiscountPercent: 50,
            requireCustomer: false,
            defaultPaymentMethod: 'cash'
          };
          break;
        case 'notifications':
          defaultSettings.notifications = {
            lowStock: true,
            newOrders: true,
            dailySales: true,
            emailNotifications: true,
            pushNotifications: false
          };
          break;
        default:
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid section for reset' 
          });
      }
    } else {
      // Reset all settings
      defaultSettings = {
        currency: {
          code: 'NPR',
          symbol: 'Rs.',
          position: 'before',
          decimalPlaces: 2
        },
        tax: {
          defaultRate: 13,
          inclusive: false,
          registrationNumber: ''
        },
        receipt: {
          showLogo: true,
          showAddress: true,
          showPhone: true,
          showEmail: true,
          footerText: 'Thank you for your business!'
        },
        inventory: {
          trackStock: true,
          lowStockAlert: true,
          lowStockThreshold: 10,
          autoReorder: false
        },
        pos: {
          allowDiscount: true,
          maxDiscountPercent: 50,
          requireCustomer: false,
          defaultPaymentMethod: 'cash'
        },
        notifications: {
          lowStock: true,
          newOrders: true,
          dailySales: true,
          emailNotifications: true,
          pushNotifications: false
        }
      };
    }
    
    const settings = await Settings.findOneAndUpdate(
      { shopId: req.user._id },
      { $set: defaultSettings },
      { 
        new: true, 
        runValidators: true,
        upsert: true
      }
    );
    
    res.status(200).json({ 
      success: true, 
      message: section ? `${section} settings reset to default` : 'All settings reset to default', 
      settings 
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ success: false, error: 'Failed to reset settings' });
  }
};

// Get business profile (public info)
exports.getBusinessProfile = async (req, res) => {
  try {
    const settings = await Settings.findOne({ shopId: req.user._id })
      .select('business currency tax');
    
    if (!settings) {
      return res.status(404).json({ 
        success: false, 
        error: 'Business profile not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      profile: {
        business: settings.business,
        currency: settings.currency,
        tax: settings.tax
      }
    });
  } catch (error) {
    console.error('Error getting business profile:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve business profile' });
  }
};
