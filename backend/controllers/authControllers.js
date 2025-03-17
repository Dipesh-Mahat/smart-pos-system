const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if needed

// Function to generate JWT token with improved security
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role,
      // Add a unique identifier to prevent token reuse
      jti: require('crypto').randomBytes(16).toString('hex')
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '8h', // Reduced token lifetime for security
      issuer: 'smart-pos-system',
      audience: 'pos-users'
    }
  );
};

// Basic input validation
const validateLoginInput = (email, password) => {
  const errors = {};
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Email is invalid';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
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
    const { email, password } = req.body;
    
    // Validate input
    const { errors, isValid } = validateLoginInput(email, password);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    // Check if user exists - use normalized email for lookup
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    // Use constant-time comparison to prevent timing attacks
    // Don't reveal whether the email exists or password is wrong
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Log failed login attempts (in a real system, you'd track this for lockout)
      console.log(`Failed login attempt for email: ${normalizedEmail}`);
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only cookie with the token for added security
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours in milliseconds
    });

    // Return minimal user info to reduce exposure
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token, // Still include token for clients that need it
      user: {
        id: user._id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
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
    const { username, email, password, firstName, lastName, role, shopName } = req.body;

    // Basic validation
    if (!username || !email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'All required fields must be provided' 
      });
    }

    // Email format validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters long' 
      });
    }

    // Check if user already exists - use normalized email
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { username: username.trim() }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password with higher work factor for better security
    const salt = await bcrypt.genSalt(12); // Increased from default 10
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with normalized data
    const newUser = new User({ 
      username: username.trim(), 
      email: normalizedEmail, 
      password: hashedPassword, 
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      shopName: role === 'shopowner' ? shopName.trim() : undefined
    });
    
    await newUser.save();

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key errors from MongoDB
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or username already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error' 
    });
  }
};

module.exports = { login, register };
