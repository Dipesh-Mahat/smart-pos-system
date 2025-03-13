const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path based on your file structure

// Function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role }, // Payload
    process.env.JWT_SECRET, // Secret key
    { expiresIn: '1h' } // Expiration time
  );
};

// Login function
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords here (use bcrypt to hash and compare)

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token, // Send token in response
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { login };
