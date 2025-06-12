/**
 * Seed script for Smart POS System
 * This script populates the database with sample data for development
 */

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Transaction = require('./models/Transaction');
const Expense = require('./models/Expense');
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
  await Customer.deleteMany({});
  await Transaction.deleteMany({});
  await Expense.deleteMany({});
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

// Seed Products
const seedProducts = async (shopOwner) => {
  console.log('Seeding products...');
  
  const products = [
    {
      name: 'Laptop',
      price: 1200,
      stock: 10,
      minStockLevel: 3,
      category: 'Electronics',
      description: 'High-performance laptop with SSD',
      barcode: '123456789012',
      shopId: shopOwner._id
    },
    {
      name: 'Smartphone',
      price: 800,
      stock: 15,
      minStockLevel: 5,
      category: 'Electronics',
      description: 'Latest smartphone model',
      barcode: '123456789013',
      shopId: shopOwner._id
    },
    {
      name: 'Coffee Mug',
      price: 12,
      stock: 50,
      minStockLevel: 10,
      category: 'Kitchenware',
      description: 'Ceramic coffee mug',
      barcode: '123456789014',
      shopId: shopOwner._id
    },
    {
      name: 'Desk Chair',
      price: 150,
      stock: 8,
      minStockLevel: 2,
      category: 'Furniture',
      description: 'Ergonomic office chair',
      barcode: '123456789015',
      shopId: shopOwner._id
    },
    {
      name: 'Headphones',
      price: 80,
      stock: 20,
      minStockLevel: 5,
      category: 'Electronics',
      description: 'Noise-cancelling headphones',
      barcode: '123456789016',
      shopId: shopOwner._id
    }
  ];
  
  await Product.insertMany(products);
  console.log('Products seeded');
  
  return await Product.find({ shopId: shopOwner._id });
};

// Seed Customers
const seedCustomers = async (shopOwner) => {
  console.log('Seeding customers...');
  
  const customers = [
    {
      name: 'John Doe',
      phone: '9876543210',
      email: 'john@example.com',
      type: 'regular',
      loyaltyPoints: 120,
      shopId: shopOwner._id
    },
    {
      name: 'Jane Smith',
      phone: '8765432109',
      email: 'jane@example.com',
      type: 'wholesale',
      loyaltyPoints: 350,
      shopId: shopOwner._id
    },
    {
      name: 'Bob Johnson',
      phone: '7654321098',
      email: 'bob@example.com',
      type: 'vip',
      loyaltyPoints: 500,
      shopId: shopOwner._id
    }
  ];
  
  await Customer.insertMany(customers);
  console.log('Customers seeded');
  
  return await Customer.find({ shopId: shopOwner._id });
};

// Seed Transactions
const seedTransactions = async (shopOwner, products, customers) => {
  console.log('Seeding transactions...');
  
  // Helper to get random items for a transaction
  const getRandomItems = (products, count) => {
    const items = [];
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    selected.forEach(product => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        subtotal: product.price * quantity
      });
    });
    
    return items;
  };
  
  // Create transactions with dates from the past week
  const transactions = [];
  const paymentMethods = ['cash', 'card', 'mobileBanking'];
  
  // Create 10 transactions over the past week
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const items = getRandomItems(products, Math.floor(Math.random() * 3) + 1);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = Math.round(subtotal * 0.1 * 100) / 100;
    const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const total = subtotal + tax - discount;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const amountPaid = Math.ceil(total / 5) * 5; // Round up to nearest $5
    
    transactions.push({
      receiptNumber: `INV-${Date.now()}-${i}`,
      shopId: shopOwner._id,
      items: items,
      customerId: customer._id,
      subtotal: subtotal,
      tax: tax,
      discount: discount,
      total: total,
      payments: [{
        method: paymentMethod,
        amount: amountPaid,
        reference: `REF-${Date.now()}-${i}`
      }],
      amountPaid: amountPaid,
      change: amountPaid - total,
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: `${shopOwner.firstName} ${shopOwner.lastName}`,
      createdAt: date
    });
  }
  
  await Transaction.insertMany(transactions);
  console.log('Transactions seeded');
};

// Seed Expenses
const seedExpenses = async (shopOwner) => {
  console.log('Seeding expenses...');
  
  const categories = ['rent', 'utilities', 'salary', 'inventory', 'marketing', 'other'];
  const expenses = [];
  
  // Create 10 expenses over the past month
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 1000) + 50;
    
    expenses.push({
      shopId: shopOwner._id,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Expense`,
      amount: amount,
      date: date,
      category: category,
      description: `Payment for ${category}`,
      recurring: Math.random() > 0.7,
      addedBy: shopOwner._id
    });
  }
  
  await Expense.insertMany(expenses);
  console.log('Expenses seeded');
};

// Main seed function
const seedDB = async () => {
  try {
    await connectDB();
    await clearDB();
    
    const { shopOwner } = await seedUsers();
    const products = await seedProducts(shopOwner);
    const customers = await seedCustomers(shopOwner);
    
    await seedTransactions(shopOwner, products, customers);
    await seedExpenses(shopOwner);
    
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
