/**
 * Seed script for Smart POS System
 * This script populates the database with sample data for development
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');
const Expense = require('./models/Expense');
const InventoryLog = require('./models/InventoryLog');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

// Clear existing data
const clearDB = async () => {
  console.log('Clearing existing data...');
  await User.deleteMany({});
  await Product.deleteMany({});
  await Transaction.deleteMany({});
  await Expense.deleteMany({});
  await InventoryLog.deleteMany({});
  console.log('Database cleared');
};

// Seed Users
const seedUsers = async () => {
  console.log('Seeding users...');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);
  
  const shopOwner = new User({
    username: 'testshopowner',
    firstName: 'Test',
    lastName: 'ShopOwner',
    email: 'shop@example.com',
    password: hashedPassword,
    role: 'shopowner',
    shopName: 'Test Shop',
    contactNumber: '9876543210',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country'
    },
    isVerified: true
  });
  
  const admin = new User({
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
    isVerified: true
  });
  
  await shopOwner.save();
  await admin.save();
  
  console.log('Users seeded');
  return { shopOwner, admin };
};

// Main seed function
const seedDB = async () => {
  try {
    await connectDB();
    await clearDB();
    const { shopOwner } = await seedUsers();
    
    console.log('Database seeded successfully!');
    console.log('Test Shop Owner Credentials:');
    console.log('Email: shop@example.com');
    console.log('Password: Password123!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed script
seedDB();
