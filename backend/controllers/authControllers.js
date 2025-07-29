const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logSecurityEvent } = require('../utils/securityLogger');
const { initializeSession } = require('../middleware/sessionSecurity');
const { resetLoginAttempts } = require('../middleware/bruteForceProtection');
const axios = require('axios');

// Basic input validation
const validateLoginInput = (email, password) => {
  const errors = {};
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Email is invalid';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) { // Changed from 8 to 6 to match frontend
    errors.password = 'Password must be at least 6 characters';
  }
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

// Login function with improved security
const login = async (req, res) => {
  try {
    console.log('Login attempt received:', { email: req.body.email });
    const { email, password } = req.body;
    
    // Validate input
    const { errors, isValid } = validateLoginInput(email, password);
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fix the validation errors',
        errors: errors
      });
    }

    // Check if user exists - use normalized email for lookup
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    // Check if account is locked
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      logSecurityEvent('LOGIN_BLOCKED', { email: normalizedEmail });
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Use constant-time comparison to prevent timing attacks
    // Don't reveal whether the email exists or password is wrong
    if (!user || !await bcrypt.compare(password, user.password)) {
      if (user) {
        await user.incrementLoginAttempts();
        logSecurityEvent('LOGIN_FAILED', { email: normalizedEmail });
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Generate tokens
    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Set HTTP-only cookie with the token for added security
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Initialize secure session
    initializeSession(req, user);

    // Reset brute force protection attempts on successful login
    await resetLoginAttempts(req, res, () => {});

    logSecurityEvent('LOGIN_SUCCESS', { userId: user._id });

    // Return minimal user info to reduce exposure
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken, // Still include token for clients that need it
      refreshToken, // Return the refresh token for clients without cookie support
      user: {
        id: user._id,
        email: user.email, // Include email for frontend display
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username, // Include username for frontend display
        shopName: user.shopName
      }
    });
  } catch (error) {
    logSecurityEvent('LOGIN_ERROR', { error: error.message });
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

// Register function with improved security
const register = async (req, res) => {
  try {
    console.log('Registration request received:', JSON.stringify(req.body));
    console.log('Request headers:', JSON.stringify(req.headers));
    const { email, password, confirmPassword, shopName } = req.body;

    // Basic validation with consistent error structure
    const errors = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (!confirmPassword) errors.confirmPassword = 'Confirm password is required';
    if (!shopName) errors.shopName = 'Shop name is required';
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Please fix the validation errors',
        errors: errors
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    // Email format validation (trim spaces before validation)
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Password strength validation - match frontend requirement of 6 characters
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists - use normalized email
    const normalizedEmail = trimmedEmail.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Generate a username from email if not provided
    const username = normalizedEmail.split('@')[0];
    
    // Create new user with normalized data and generate missing required fields
    const userData = { 
      email: normalizedEmail, 
      password, // Pass password directly, pre-save hook will hash it
      role: 'shopowner',
      shopName: shopName.trim(),
      username: username, // Generate username from email
      firstName: shopName.trim().split(' ')[0] || 'Shop', // Use first part of shop name as firstName
      lastName: shopName.trim().split(' ').slice(1).join(' ') || 'Owner' // Use rest of shop name as lastName or default
    };
    
    console.log('Creating user with data:', JSON.stringify(userData));
    
    try {
      // Use User.create() which is more atomic and handles validation/saving in one step
      const newUser = await User.create(userData);
      console.log('User registered successfully:', newUser.email);

      // Seed demo products for new shopowner
      if (newUser.role === 'shopowner') {
        try {
          const Product = require('../models/Product');
          const demoProducts = require('../utils/demoProducts');
          // Attach shopId to each demo product
          const demoProductsToInsert = demoProducts.map(p => ({ ...p, shopId: newUser._id }));
          await Product.insertMany(demoProductsToInsert);
          console.log('Demo products seeded for shop:', newUser._id);
        } catch (seedErr) {
          console.error('Error seeding demo products:', seedErr);
        }
      }

      // Return user ID for debugging purposes
      return res.status(201).json({ 
        success: true,
        message: 'User registered successfully',
        userId: newUser._id
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      
      // Handle Mongoose validation errors
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: saveError.errors
        });
      }
      
      // Handle duplicate key errors from MongoDB
      if (saveError.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists' 
        });
      }
      
      // Re-throw for the outer catch block
      throw saveError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    // Log full error details for debugging
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Handle duplicate key errors from MongoDB
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }
    
    // Return more detailed error message for debugging
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error: ' + error.message,
      errorType: error.name || 'Unknown Error'
    });
  }
};

// Supplier registration function
const registerSupplier = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      registrationNumber,
      panNumber,
      businessAddress,
      contactPerson,
      position,
      email,
      phone,
      productCategories,
      yearsInBusiness,
      deliveryAreas,
      businessDescription,
      website,
      references
    } = req.body;

    // Required field validation
    const requiredFields = [
      'businessName', 'businessType', 'businessAddress', 'contactPerson', 
      'position', 'email', 'phone', 'deliveryAreas', 'yearsInBusiness'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Email format validation
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if user already exists
    const normalizedEmail = trimmedEmail.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Validate product categories
    if (!productCategories || productCategories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product category must be selected'
      });
    }

    // Create supplier application
    const supplierData = {
      firstName: contactPerson.split(' ')[0] || contactPerson,
      lastName: contactPerson.split(' ').slice(1).join(' ') || '',
      email: normalizedEmail,
      role: 'supplier',
      status: 'pending',
      businessName: businessName.trim(),
      businessType,
      registrationNumber: registrationNumber?.trim(),
      panNumber: panNumber?.trim(),
      businessAddress: businessAddress.trim(),
      contactPerson: contactPerson.trim(),
      position: position.trim(),
      phone: phone.trim(),
      productCategories: Array.isArray(productCategories) ? productCategories : [productCategories],
      yearsInBusiness,
      deliveryAreas: deliveryAreas.trim(),
      businessDescription: businessDescription?.trim(),
      website: website?.trim(),
      references: references?.trim()
    };

    const newSupplier = new User(supplierData);
    await newSupplier.save();

    res.status(201).json({
      success: true,
      message: 'Supplier application submitted successfully. We will review your application and contact you within 2-3 business days.',
      supplier: {
        id: newSupplier._id,
        businessName: newSupplier.businessName,
        email: newSupplier.email,
        status: newSupplier.status
      }
    });

  } catch (error) {
    console.error('Supplier registration error:', error);
    // Handle duplicate key errors from MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal Server Error: ' + error.message,
      errorType: error.name || 'Unknown Error'
    });
  }
};

/**
 * Verify Google OAuth token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const googleAuth = async (req, res) => {
  try {
    const { token, googleData, authMode } = req.body;
    
    if (!token || !googleData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google token and user data are required' 
      });
    }
    
    // Verify the Google token with Google's API
    let googleUser;
    try {
      // Option 1: Use the provided googleData directly (if you trust the client)
      googleUser = googleData;
      
      // Option 2: Verify the token with Google's API (more secure)
      // const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
      // googleUser = response.data;
      
    } catch (error) {
      console.error('Google token verification error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid Google token' 
      });
    }      // Check if the email from Google is verified
    // Note: Google OAuth userinfo endpoint returns email_verified as a boolean or string
    if (googleUser.email_verified === false || googleUser.email_verified === 'false') {
      return res.status(400).json({ 
        success: false, 
        message: 'Google email is not verified. Please verify your email before continuing.' 
      });
    }
    
    // If email_verified field is missing, we'll trust Google's OAuth flow which typically only returns verified emails
    if (!googleUser.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email information is missing from your Google account.' 
      });
    }
      // Find existing user or create a new one
    const existingUser = await User.findOne({ 
      $or: [
        { googleId: googleUser.sub },
        { email: googleUser.email }
      ]
    });
      // Handle edge cases for existing users trying to use Google OAuth
    if (existingUser && !existingUser.googleId) {
      if (authMode === 'login') {
        // User exists via standard login but is trying to use OAuth to login
        return res.status(400).json({
          success: false,
          message: 'This email is already registered. Please use your password to log in or reset your password.'
        });
      } else if (authMode === 'register') {
        // User is trying to register with Google using an existing email
        // Let's link the Google account to the existing user account
        existingUser.googleId = googleUser.sub;
        existingUser.googleProfile = {
          name: googleUser.name,
          picture: googleUser.picture,
          locale: googleUser.locale,
          updated_at: new Date()
        };
        
        await existingUser.save();
        
        logSecurityEvent('GOOGLE_ACCOUNT_LINKED', { 
          userId: existingUser._id, 
          email: existingUser.email 
        });
        
        // Return success with notification that accounts were linked
        const payload = {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role
        };
        
        // Generate tokens
        const accessToken = jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        const refreshToken = jwt.sign(
          payload,
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );
        
        return res.status(200).json({
          success: true,
          message: 'Google account linked to your existing account successfully!',
          user: {
            id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role
          },
          accessToken,
          refreshToken
        });
      }
    }
    
    let user;
    
    if (existingUser) {
      // If trying to register with an existing account
      if (authMode === 'register' && !existingUser.googleId) {
        return res.status(400).json({ 
          success: false, 
          message: 'An account with this email already exists. Please log in instead.' 
        });
      }
      
      // Update existing user with latest Google profile data
      if (!existingUser.googleId) {
        // If user exists with the email but no googleId, link the accounts
        existingUser.googleId = googleUser.sub;
      }
      
      existingUser.googleProfile = {
        name: googleUser.name,
        picture: googleUser.picture,
        locale: googleUser.locale,
        updated_at: new Date()
      };
      
      user = await existingUser.save();
      logSecurityEvent('GOOGLE_LOGIN_SUCCESS', { userId: user._id, email: user.email });
    } else {
      // If trying to login with a non-existing account
      if (authMode === 'login') {
        return res.status(404).json({ 
          success: false, 
          message: 'No account found with this Google email. Please register first.' 
        });
      }
      
      // Create new user from Google data
      // Generate a unique username based on the Google name or email
      let username = googleUser.email.split('@')[0];
      
      // Check if the username already exists and make it unique if needed
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        // Append a random string to make username unique
        username = `${username}_${Math.random().toString(36).substring(2, 8)}`;
      }
      
      // Create the new user
      user = await User.create({
        email: googleUser.email,
        username,
        firstName: googleUser.given_name || googleUser.name.split(' ')[0],
        lastName: googleUser.family_name || googleUser.name.split(' ').slice(1).join(' '),
        googleId: googleUser.sub,
        googleProfile: {
          name: googleUser.name,
          picture: googleUser.picture,
          locale: googleUser.locale,
          updated_at: new Date()
        },
        role: 'shopowner' // Default role for new users
      });
      
      logSecurityEvent('GOOGLE_REGISTER_SUCCESS', { userId: user._id, email: user.email });
    }
    
    // Generate JWT token
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    // Generate access token
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        picture: user.googleProfile?.picture
      }
    });
    
  } catch (error) {
    console.error('Google authentication error:', error);
    logSecurityEvent('GOOGLE_AUTH_ERROR', { error: error.message });
    res.status(500).json({ 
      success: false, 
      message: 'Google authentication failed' 
    });
  }
};

module.exports = {
  login,
  register,
  googleAuth,
  registerSupplier
};

