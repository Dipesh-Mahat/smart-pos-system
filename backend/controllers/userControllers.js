const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user profile (Protected route)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const users = await User.find().select('-password'); // Exclude passwords
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get all approved suppliers (for shopowners)
const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await User.find({ role: 'supplier', status: 'approved' }).select('-password');
    res.status(200).json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be different from current password' 
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(req.user.id, { 
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error' 
    });
  }
};

module.exports = { getProfile, getAllUsers, getAllSuppliers, changePassword };
