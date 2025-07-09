/**
 * Development Login Bypass
 * 
 * WARNING: This should NEVER be used in production.
 * This file is strictly for development/testing purposes.
 */

const express = require('express');
const User = require('../models/User');
const router = express.Router();

/**
 * POST /api/dev/bypass-auth/create-test-user
 * Creates a test user with predefined credentials for testing purposes
 */
router.post('/create-test-user', async (req, res) => {
  try {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is disabled in production'
      });
    }
    
    const testUserData = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'shopowner',
      shopName: 'Test Shop'
    };
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: testUserData.email });
    
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'Test user already exists',
        userId: existingUser._id
      });
    }
    
    // Create the test user
    const newUser = await User.create(testUserData);
    
    res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      userId: newUser._id,
      credentials: {
        email: testUserData.email,
        password: 'password123' // Only showing this for testing
      }
    });
  } catch (error) {
    console.error('Dev bypass error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test user',
      error: error.message
    });
  }
});

/**
 * GET /api/dev/bypass-auth/users
 * Lists all users in the database (for testing only)
 */
router.get('/users', async (req, res) => {
  try {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is disabled in production'
      });
    }
    
    const users = await User.find({}, 'email username role shopName');
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Dev bypass error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

module.exports = router;
