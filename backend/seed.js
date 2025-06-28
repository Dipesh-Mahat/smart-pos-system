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
const Customer = require('./models/Customer');
const Category = require('./models/Category');
const Order = require('./models/Order');
const Settings = require('./models/Settings');
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
  await Customer.deleteMany({});
  await Category.deleteMany({});
  await Order.deleteMany({});
  await Settings.deleteMany({});
  console.log('Database cleared');
};

// Seed Users
const seedUsers = async () => {
  console.log('Seeding users...');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);
  
  const shopOwner = new User({
    username: 'testshopowner',
    firstName: 'Ram Bahadur',
    lastName: 'Sharma',
    email: 'ram.sharma@example.com',
    password: hashedPassword,
    role: 'shopowner',
    shopName: 'Sharma General Store & Mart',
    contactNumber: '9876543210',
    address: {
      street: 'Thamel Chowk',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
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

  // Add a supplier user
  const supplier = new User({
    username: 'supplier1',
    firstName: 'Krishna Prasad',
    lastName: 'Adhikari',
    email: 'krishna.adhikari@nepal.com',
    password: hashedPassword,
    role: 'supplier',
    contactNumber: '9800000001',
    address: {
      street: 'Bhaisepati Industrial Area',
      city: 'Lalitpur',
      state: 'Bagmati',
      postalCode: '44700',
      country: 'Nepal'
    },
    status: 'approved'
  });

  await shopOwner.save();
  await admin.save();
  await supplier.save();

  console.log('Users seeded');
  return { shopOwner, admin, supplier };
};

// Seed Products for the supplier
const seedProducts = async (supplier) => {
  console.log('Seeding products...');
  const products = [
    {
      name: 'Basmati Rice (5kg)',
      barcode: 'RICE-BASMATI-5KG',
      description: 'Premium quality Basmati rice from India',
      category: 'Groceries',
      price: 850,
      costPrice: 700,
      stock: 50,
      minStockLevel: 10,
      unit: 'bag',
      imageUrl: '',
      shopId: supplier._id, // For demo, use supplier as shopId
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13
    },
    {
      name: 'Nepali Tea (250g)',
      barcode: 'TEA-NEPALI-250G',
      description: 'Fresh Nepali black tea leaves from Ilam',
      category: 'Beverages',
      price: 180,
      costPrice: 120,
      stock: 75,
      minStockLevel: 15,
      unit: 'packet',
      imageUrl: '',
      shopId: supplier._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13
    },
    {
      name: 'Wai Wai Noodles',
      barcode: 'NOODLES-WAIWAI',
      description: 'Popular instant noodles - chicken flavor',
      category: 'Snacks & Confectionery',
      price: 30,
      costPrice: 22,
      stock: 200,
      minStockLevel: 50,
      unit: 'pack',
      imageUrl: '',
      shopId: supplier._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13
    },
    {
      name: 'Lux Soap (100g)',
      barcode: 'SOAP-LUX-100G',
      description: 'Premium beauty soap with rose fragrance',
      category: 'Personal Care',
      price: 45,
      costPrice: 35,
      stock: 80,
      minStockLevel: 20,
      unit: 'piece',
      imageUrl: '',
      shopId: supplier._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13
    },
    {
      name: 'DDC Milk (1 Liter)',
      barcode: 'MILK-DDC-1L',
      description: 'Fresh pasteurized milk from DDC',
      category: 'Dairy Products',
      price: 85,
      costPrice: 70,
      stock: 40,
      minStockLevel: 10,
      unit: 'liter',
      imageUrl: '',
      shopId: supplier._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13
    }
  ];
  await Product.insertMany(products);
  console.log('Products seeded');
};

// Seed Categories
const seedCategories = async (shopOwner) => {
  console.log('Seeding categories...');
  
  const categories = [
    {
      name: 'Groceries',
      description: 'Essential food items and daily necessities',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 1
    },
    {
      name: 'Beverages',
      description: 'Drinks, tea, coffee, and refreshments',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 2
    },
    {
      name: 'Snacks & Confectionery',
      description: 'Biscuits, chips, chocolates, and snack items',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 3
    },
    {
      name: 'Personal Care',
      description: 'Soaps, shampoos, toothpaste, and hygiene products',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 4
    },
    {
      name: 'Household Items',
      description: 'Cleaning supplies, detergents, and home essentials',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 5
    },
    {
      name: 'Dairy Products',
      description: 'Milk, yogurt, cheese, and dairy items',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 6
    }
  ];
  
  const createdCategories = await Category.insertMany(categories);
  console.log(`Created ${createdCategories.length} categories`);
  return createdCategories;
};

// Seed Customers
const seedCustomers = async (shopOwner) => {
  console.log('Seeding customers...');
  
  const customers = [
    {
      shopId: shopOwner._id,
      name: 'Maya Tamang',
      email: 'maya.tamang@email.com',
      phone: '+977-9841234567',
      address: {
        street: 'Boudha Stupa Area',
        city: 'Kathmandu',
        state: 'Bagmati',
        postalCode: '44600',
        country: 'Nepal'
      },
      type: 'regular',
      status: 'active',
      loyaltyPoints: 150,
      totalSpent: 2500.75,
      totalOrders: 8,
      lastOrderDate: new Date('2024-01-15')
    },
    {
      shopId: shopOwner._id,
      name: 'Suresh Rai',
      email: 'suresh.rai@email.com',
      phone: '+977-9851234567',
      address: {
        street: 'Patan Durbar Square',
        city: 'Lalitpur',
        state: 'Bagmati',
        postalCode: '44700',
        country: 'Nepal'
      },
      type: 'wholesale',
      status: 'active',
      loyaltyPoints: 300,
      totalSpent: 5600.25,
      totalOrders: 15,
      lastOrderDate: new Date('2024-01-12')
    },
    {
      shopId: shopOwner._id,
      name: 'Binita Shrestha',
      email: 'binita.shrestha@email.com',
      phone: '+977-9861234567',
      address: {
        street: 'Newroad Commercial Area',
        city: 'Kathmandu',
        state: 'Bagmati',
        postalCode: '44600',
        country: 'Nepal'
      },
      type: 'vip',
      status: 'active',
      loyaltyPoints: 500,
      totalSpent: 8750.50,
      totalOrders: 25,
      lastOrderDate: new Date('2024-01-10')
    },
    {
      shopId: shopOwner._id,
      name: 'Dipak Thapa',
      email: 'dipak.thapa@email.com',
      phone: '+977-9871234567',
      address: {
        street: 'Durbarmarg Shopping District',
        city: 'Kathmandu',
        state: 'Bagmati',
        postalCode: '44600',
        country: 'Nepal'
      },
      type: 'regular',
      status: 'inactive',
      loyaltyPoints: 75,
      totalSpent: 980.25,
      totalOrders: 4,
      lastOrderDate: new Date('2023-12-20')
    },
    {
      shopId: shopOwner._id,
      name: 'Anita Gurung',
      email: 'anita.gurung@email.com',
      phone: '+977-9881234567',
      address: {
        street: 'Lakeside Road',
        city: 'Pokhara',
        state: 'Gandaki',
        postalCode: '33700',
        country: 'Nepal'
      },
      type: 'corporate',
      status: 'active',
      loyaltyPoints: 1000,
      totalSpent: 15420.80,
      totalOrders: 42,
      lastOrderDate: new Date('2024-01-14')
    }
  ];
  
  const createdCustomers = await Customer.insertMany(customers);
  console.log(`Created ${createdCustomers.length} customers`);
  return createdCustomers;
};

// Seed Orders
const seedOrders = async (shopOwner, supplier, products) => {
  console.log('Seeding orders...');
  
  const orders = [
    {
      orderNumber: 'ORD-001-2024',
      shopId: shopOwner._id,
      supplierId: supplier._id,
      items: [
        {
          productId: products[0]._id,
          name: products[0].name,
          sku: products[0].barcode,
          quantity: 50,
          unitPrice: 250.00,
          totalPrice: 12500.00
        },
        {
          productId: products[1]._id,
          name: products[1].name,
          sku: products[1].barcode,
          quantity: 30,
          unitPrice: 800.00,
          totalPrice: 24000.00
        }
      ],
      totalAmount: 36500.00,
      status: 'pending',
      orderDate: new Date('2024-01-15'),
      notes: 'Urgent order for new store opening',
      requestedDeliveryDate: new Date('2024-01-20')
    },
    {
      orderNumber: 'ORD-002-2024',
      shopId: shopOwner._id,
      supplierId: supplier._id,
      items: [
        {
          productId: products[2]._id,
          name: products[2].name,
          sku: products[2].barcode,
          quantity: 100,
          unitPrice: 150.00,
          totalPrice: 15000.00
        }
      ],
      totalAmount: 15000.00,
      status: 'confirmed',
      orderDate: new Date('2024-01-10'),
      estimatedDeliveryDate: new Date('2024-01-18'),
      notes: 'Regular monthly order'
    },
    {
      orderNumber: 'ORD-003-2024',
      shopId: shopOwner._id,
      supplierId: supplier._id,
      items: [
        {
          productId: products[3]._id,
          name: products[3].name,
          sku: products[3].barcode,
          quantity: 20,
          unitPrice: 300.00,
          totalPrice: 6000.00
        },
        {
          productId: products[4]._id,
          name: products[4].name,
          sku: products[4].barcode,
          quantity: 25,
          unitPrice: 200.00,
          totalPrice: 5000.00
        }
      ],
      totalAmount: 11000.00,
      status: 'shipped',
      orderDate: new Date('2024-01-05'),
      estimatedDeliveryDate: new Date('2024-01-12'),
      notes: 'Special promotional items'
    }
  ];
  
  const createdOrders = await Order.insertMany(orders);
  console.log(`Created ${createdOrders.length} orders`);
  return createdOrders;
};

// Seed Settings
const seedSettings = async (shopOwner) => {
  console.log('Seeding settings...');
  
  const settings = new Settings({
    shopId: shopOwner._id,
    business: {
      name: shopOwner.shopName,
      logo: '',
      address: {
        street: '123 Business Street',
        city: 'Kathmandu',
        state: 'Bagmati',
        postalCode: '44600',
        country: 'Nepal'
      },
      phone: '+977-1-4567890',
      email: shopOwner.email,
      website: 'https://testshop.com',
      taxId: 'TAX123456789',
      registrationNumber: 'REG987654321'
    },
    currency: {
      code: 'NPR',
      symbol: 'Rs.',
      position: 'before',
      decimalPlaces: 2
    },
    tax: {
      defaultRate: 13,
      inclusive: false,
      registrationNumber: 'VAT123456789'
    },
    receipt: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      footerText: 'Thank you for shopping with us!'
    },
    inventory: {
      trackStock: true,
      lowStockAlert: true,
      lowStockThreshold: 10,
      autoReorder: false
    },
    pos: {
      allowDiscount: true,
      maxDiscountPercent: 15,
      requireCustomer: false,
      defaultPaymentMethod: 'cash'
    },
    notifications: {
      lowStock: true,
      newOrders: true,
      dailySales: true,
      emailNotifications: true,
      pushNotifications: false
    }
  });
  
  await settings.save();
  console.log('Created settings');
  return settings;
};

// Main seed function
const seedDB = async () => {
  try {
    await connectDB();
    await clearDB();
    
    // Seed in order (users first, then dependent data)
    const { shopOwner, supplier } = await seedUsers();
    const categories = await seedCategories(shopOwner);
    const customers = await seedCustomers(shopOwner);
    const products = await seedProducts(supplier);
    const orders = await seedOrders(shopOwner, supplier, products);
    const settings = await seedSettings(shopOwner);
    
    console.log('Database seeded successfully!');
    console.log('=================================');
    console.log('Test Shop Owner Credentials:');
    console.log('Email: ram.sharma@example.com');
    console.log('Password: Password123!');
    console.log('=================================');
    console.log('Test Supplier Credentials:');
    console.log('Email: krishna.adhikari@nepal.com');
    console.log('Password: Password123!');
    console.log('=================================');
    console.log(`Created:`);
    console.log(`- 2 Users (1 shopowner, 1 supplier)`);
    console.log(`- ${categories.length} Categories`);
    console.log(`- ${customers.length} Customers`);
    console.log(`- ${products.length} Products`);
    console.log(`- ${orders.length} Orders`);
    console.log(`- 1 Settings configuration`);
    console.log('=================================');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed script
seedDB();
