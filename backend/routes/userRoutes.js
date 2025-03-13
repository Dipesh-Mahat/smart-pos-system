// routes/userRoutes.js

const express = require('express');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/authenticate');
const router = express.Router();

// Register a new user (shopowner, storevendor, admin)
router.post('/register', async (req, res) => {
  const { username, email, password, firstName, lastName, role, shopName } = req.body;

  // Input validation (simplified)
  if (!username || !email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role,
      shopName: role === 'shopowner' ? shopName : undefined, // Only for shopowners
    });

    await newUser.save();

    // Generate JWT token
    const token = newUser.generateAuthToken();

    res.status(201).json({
      message: `${role} created successfully!`,
      token,  // Send JWT token in the response
    });
  } catch (err) {
    res.status(400).json({ error: 'Error creating user', message: err.message });
  }
});

// Login a user (generates JWT token)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = user.generateAuthToken();
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin-only route
router.get('/admin-dashboard', authenticate, authorize(['admin']), (req, res) => {
  res.send('Welcome to the Admin Dashboard');
});

// Shopowner-only route
router.get('/shopowner-dashboard', authenticate, authorize(['shopowner']), (req, res) => {
  res.send('Welcome to the Shopowner Dashboard');
});

// Storevendor-only route
router.get('/storevendor-dashboard', authenticate, authorize(['storevendor']), (req, res) => {
  res.send('Welcome to the Storevendor Dashboard');
});

module.exports = router;
