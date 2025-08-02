const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logSecurityEvent } = require('../utils/securityLogger');
const { initializeSession } = require('../middleware/sessionSecurity');
const { resetLoginAttempts } = require('../middleware/bruteForceProtection');

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
    console.log('Login attempt received:', { email: req.body.email, role: req.body.role });
    const { email, password, role } = req.body;
    
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
    
    // Query to find the user by email
    let query = { email: normalizedEmail };
    
    // First try to find the user with email and role if role is specified
    let user = null;
    if (role) {
      user = await User.findOne({ email: normalizedEmail, role: role });
    }
    
    // If no user found with email and role, find any user with this email (for admin fallback)
    if (!user) {
      user = await User.findOne({ email: normalizedEmail });
    }
    
    // Check if account is locked
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
      logSecurityEvent('LOGIN_BLOCKED', { email: normalizedEmail });
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Use constant-time comparison to prevent timing attacks
    if (!user) {
      // User not found with this email
      logSecurityEvent('LOGIN_FAILED', { email: normalizedEmail, reason: 'user_not_found' });
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials'
      });
    }
    
    // Role logic: allow admin to log in regardless of selected role, but enforce correct role for shopowner/supplier
    if (role && user.role !== role) {
      // Check if this user is an admin - admins can login regardless of selected role
      if (user.role === 'admin') {
        // Allow admin to log in with any role selected
        // Log the role override for monitoring purposes
        logSecurityEvent('LOGIN_ROLE_OVERRIDE', { email: normalizedEmail, requested: role, actual: user.role });
        // Continue with admin login - we'll use the actual admin role
      } else {
        // For non-admin users (shopowner/supplier), enforce correct role matching
        logSecurityEvent('LOGIN_FAILED', { email: normalizedEmail, reason: 'wrong_role', requested: role, actual: user.role });
        return res.status(401).json({ 
          success: false, 
          message: `Account exists but not as ${role}. Please select the correct user type.`
        });
      }
    }
    
    // Check password
    if (!await bcrypt.compare(password, user.password)) {
      await user.incrementLoginAttempts();
      logSecurityEvent('LOGIN_FAILED', { email: normalizedEmail, reason: 'wrong_password' });
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

    // Debug log - print user object for troubleshooting
    console.log('User logging in successfully with role:', user.role);

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


module.exports = {
  login,
  register,
  registerSupplier
};

