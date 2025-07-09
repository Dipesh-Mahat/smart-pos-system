const User = require('../models/User');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

/**
 * Get supplier profile information
 */
exports.getSupplierProfile = async (req, res) => {
  try {
    console.log('Fetching supplier profile for user:', req.user?._id);
    
    // Get user ID from authenticated user
    const supplierId = req.user._id;
    
    if (!supplierId) {
      console.log('No user ID found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Find supplier with all details
    console.log('Looking for supplier with ID:', supplierId);
    const supplier = await User.findById(supplierId).select('-password');
    
    if (!supplier) {
      console.log('Supplier not found with ID:', supplierId);
      return res.status(404).json({
        success: false,
        message: 'Supplier profile not found'
      });
    }
    
    console.log('Supplier found:', supplier.email);
    
    // Get stats for the supplier (optional enhancement)
    // In a real implementation, we would query orders, products, etc.
    const stats = {
      totalSales: 567892, // Placeholder value - would be calculated
      totalOrders: 1234, // Placeholder value - would be calculated
      averageRating: 4.8, // Placeholder value - would be calculated
      completionRate: 98.5 // Placeholder value - would be calculated
    };
    
    res.status(200).json({
      success: true,
      data: {
        profile: supplier,
        stats: stats
      }
    });
    
  } catch (error) {
    console.error('Error fetching supplier profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supplier profile',
      error: error.message
    });
  }
};

/**
 * Update supplier company information
 */
exports.updateCompanyInfo = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const {
      businessName,
      businessType,
      businessRegistration,
      taxId,
      companyDesc,
      website,
      establishedYear
    } = req.body;
    
    // Validate required fields
    if (!businessName) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required'
      });
    }
    
    // Update supplier profile
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      {
        companyName: businessName,
        businessDetails: {
          businessType,
          businessRegistration,
          taxId,
          description: companyDesc,
          website,
          establishedYear: parseInt(establishedYear) || null
        }
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Company information updated successfully',
      data: { profile: updatedSupplier }
    });
    
  } catch (error) {
    console.error('Error updating company info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company information',
      error: error.message
    });
  }
};

/**
 * Update supplier contact details
 */
exports.updateContactDetails = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const {
      primaryContact,
      contactTitle,
      primaryEmail,
      secondaryEmail,
      primaryPhone,
      secondaryPhone,
      businessAddress,
      billingAddress,
      shippingAddress
    } = req.body;
    
    // Validate required fields
    if (!primaryContact || !primaryEmail || !primaryPhone || !businessAddress) {
      return res.status(400).json({
        success: false,
        message: 'Primary contact details and business address are required'
      });
    }
    
    // Update supplier profile
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      {
        firstName: primaryContact.split(' ')[0] || primaryContact,
        lastName: primaryContact.split(' ').slice(1).join(' ') || '',
        email: primaryEmail,
        contactDetails: {
          title: contactTitle,
          secondaryEmail,
          primaryPhone,
          secondaryPhone
        },
        address: parseAddress(businessAddress),
        billingAddress: billingAddress ? parseAddress(billingAddress) : undefined,
        shippingAddress: shippingAddress ? parseAddress(shippingAddress) : undefined
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Contact details updated successfully',
      data: { profile: updatedSupplier }
    });
    
  } catch (error) {
    console.error('Error updating contact details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact details',
      error: error.message
    });
  }
};

/**
 * Update supplier business settings
 */
exports.updateBusinessSettings = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const {
      defaultPaymentTerms,
      currency,
      shippingMethod,
      freeShippingThreshold,
      leadTime,
      maxOrderQuantity,
      businessHours
    } = req.body;
    
    // Update supplier profile
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      {
        businessSettings: {
          paymentTerms: defaultPaymentTerms,
          currency,
          shippingMethod,
          freeShippingThreshold: parseFloat(freeShippingThreshold) || 0,
          leadTime: parseInt(leadTime) || 1,
          maxOrderQuantity: parseInt(maxOrderQuantity) || 1000,
          businessHours: businessHours || []
        }
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Business settings updated successfully',
      data: { profile: updatedSupplier }
    });
    
  } catch (error) {
    console.error('Error updating business settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business settings',
      error: error.message
    });
  }
};

/**
 * Update supplier notification preferences
 */
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { notifications } = req.body;
    
    if (!notifications) {
      return res.status(400).json({
        success: false,
        message: 'Notification preferences are required'
      });
    }
    
    // Update supplier profile
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      {
        notificationPreferences: notifications
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { profile: updatedSupplier }
    });
    
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

/**
 * Update supplier profile picture
 */
exports.updateProfilePicture = async (req, res) => {
  try {
    // Handle file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }
    
    const supplierId = req.user._id;
    const supplier = await User.findById(supplierId);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier profile not found'
      });
    }
    
    // Delete old profile picture if exists
    if (supplier.profilePicture && !supplier.profilePicture.includes('user-avatar.png')) {
      try {
        const oldImagePath = path.join(__dirname, '..', 'public', supplier.profilePicture);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (err) {
        console.error('Error deleting old profile picture:', err);
      }
    }
    
    // Update with new profile picture
    const profilePicturePath = `/uploads/avatars/${req.file.filename}`;
    
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      { profilePicture: profilePicturePath },
      { new: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profile: updatedSupplier,
        profilePicture: profilePicturePath
      }
    });
    
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture',
      error: error.message
    });
  }
};

/**
 * Change supplier account status (deactivate/activate)
 */
exports.updateAccountStatus = async (req, res) => {
  try {
    const supplierId = req.user._id;
    const { action } = req.body;
    
    if (!action || !['activate', 'deactivate'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action (activate/deactivate) is required'
      });
    }
    
    const newStatus = action === 'activate' ? 'approved' : 'inactive';
    
    const updatedSupplier = await User.findByIdAndUpdate(
      supplierId,
      { status: newStatus },
      { new: true }
    ).select('-password');
    
    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Account ${action}d successfully`,
      data: { profile: updatedSupplier }
    });
    
  } catch (error) {
    console.error('Error updating account status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account status',
      error: error.message
    });
  }
};

/**
 * Helper function to parse address string into address object
 */
function parseAddress(addressString) {
  if (!addressString) return {};
  
  const lines = addressString.split('\n');
  return {
    street: lines[0] || '',
    city: lines[1] || '',
    state: lines[2] ? lines[2].split(',')[0].trim() : '',
    postalCode: lines[2] ? lines[2].split(',')[1].trim() : '',
    country: lines[3] || ''
  };
}
