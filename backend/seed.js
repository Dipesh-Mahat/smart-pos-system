/**
 * Enhanced Seed script for Smart POS System - Production Ready Demo Data
 * This script populates the database with realistic data for presentation
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
const AutoOrder = require('./models/AutoOrder');
const SupplierInventory = require('./models/SupplierInventory');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://smartpos-admin:QsIKePK7zpwmpmv8@smart-pos-cluster.lpptxzc.mongodb.net/smart-pos-system');
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
  await AutoOrder.deleteMany({});
  await SupplierInventory.deleteMany({});
  console.log('Database cleared');
};

// Seed Users - Production Ready Demo Data
const seedUsers = async () => {
  console.log('Seeding users...');
  
  const salt = await bcrypt.genSalt(10);
  
  // Admin User - Production Ready
  const admin = new User({
    username: 'admin',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@smartpos.com',
    password: await bcrypt.hash('admin123', salt),
    role: 'admin',
    profilePicture: '/images/avatars/admin-avatar.png',
    contactDetails: {
      title: 'System Administrator',
      primaryPhone: '+977-9800000000',
      secondaryEmail: 'support@smartpos.com'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  });

  // ==== 5 SHOP OWNERS FOR DEMO ====
  
  // Shop Owner 1 - Small Nepali Mart
  const shopOwner1 = new User({
    username: 'ram_kirana',
    firstName: 'Ram',
    lastName: 'Shrestha',
    email: 'ram@kirana.com',
    password: await bcrypt.hash('ram123', salt),
    role: 'shopowner',
    shopName: 'Ram Kirana Pasal',
    profilePicture: '/images/avatars/shopowner1.jpg',
    contactDetails: {
      title: 'Pasal Malik',
      primaryPhone: '+977-9841234567'
    },
    billingAddress: {
      street: 'Naya Sadak',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-05'),
    lastLogin: new Date()
  });
  
  // Shop Owner 2 - Grocery Store
  const shopOwner2 = new User({
    username: 'priya_grocery',
    firstName: 'Priya',
    lastName: 'Maharjan',
    email: 'priya@freshmart.com',
    password: await bcrypt.hash('priya123', salt),
    role: 'shopowner',
    shopName: 'Fresh Mart Grocery Store',
    profilePicture: '/images/avatars/shopowner2.jpg',
    contactDetails: {
      title: 'Store Manager',
      primaryPhone: '+977-9841987654',
      secondaryPhone: '+977-9851987654'
    },
    billingAddress: {
      street: 'Durbar Marg, Shopping Center',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
    },
    businessSettings: {
      currency: 'NPR',
      paymentTerms: 'cod',
      businessHours: [
        { day: 'monday', open: true, openTime: '07:00', closeTime: '21:00' },
        { day: 'tuesday', open: true, openTime: '07:00', closeTime: '21:00' },
        { day: 'wednesday', open: true, openTime: '07:00', closeTime: '21:00' },
        { day: 'thursday', open: true, openTime: '07:00', closeTime: '21:00' },
        { day: 'friday', open: true, openTime: '07:00', closeTime: '21:00' },
        { day: 'saturday', open: true, openTime: '07:00', closeTime: '22:00' },
        { day: 'sunday', open: true, openTime: '08:00', closeTime: '20:00' }
      ]
    },
    status: 'active',
    isVerified: true,
    businessLicense: 'BL-2024-002',
    panNumber: 'PAN987654321',
    createdAt: new Date('2024-01-10'),
    lastLogin: new Date()
  });

  // Shop Owner 3 - Fashion Store
  const shopOwner3 = new User({
    username: 'amit_fashion',
    firstName: 'Amit',
    lastName: 'Thapa',
    email: 'amit@fashionhub.com',
    password: await bcrypt.hash('amit123', salt),
    role: 'shopowner',
    shopName: 'Fashion Hub & Accessories',
    profilePicture: '/images/avatars/shopowner3.jpg',
    contactDetails: {
      title: 'Fashion Store Owner',
      primaryPhone: '+977-9841555666',
      secondaryPhone: '+977-9851555666'
    },
    billingAddress: {
      street: 'Thamel, Fashion District',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
    },
    businessSettings: {
      currency: 'NPR',
      paymentTerms: 'cod'
    },
    status: 'active',
    isVerified: true,
    businessLicense: 'BL-2024-003',
    panNumber: 'PAN456789123',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date()
  });

  // Shop Owner 4 - Hardware Store
  const shopOwner4 = new User({
    username: 'kumar_hardware',
    firstName: 'Kumar',
    lastName: 'Gurung',
    email: 'kumar@hardwarestore.com',
    password: await bcrypt.hash('kumar123', salt),
    role: 'shopowner',
    shopName: 'Gurung Hardware & Tools',
    profilePicture: '/images/avatars/shopowner4.jpg',
    contactDetails: {
      title: 'Hardware Store Owner',
      primaryPhone: '+977-9841777888',
      secondaryPhone: '+977-9851777888'
    },
    billingAddress: {
      street: 'Balaju Industrial Area',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
    },
    businessSettings: {
      currency: 'NPR',
      paymentTerms: 'net15'
    },
    status: 'active',
    isVerified: true,
    businessLicense: 'BL-2024-004',
    panNumber: 'PAN789123456',
    createdAt: new Date('2024-01-20'),
    lastLogin: new Date()
  });

  // Shop Owner 5 - Pharmacy
  const shopOwner5 = new User({
    username: 'sita_pharmacy',
    firstName: 'Sita',
    lastName: 'Poudel',
    email: 'sita@medicarepharmacy.com',
    password: await bcrypt.hash('sita123', salt),
    role: 'shopowner',
    shopName: 'Medicare Pharmacy & Health Care',
    profilePicture: '/images/avatars/shopowner5.jpg',
    contactDetails: {
      title: 'Licensed Pharmacist',
      primaryPhone: '+977-9841999000',
      secondaryPhone: '+977-9851999000'
    },
    billingAddress: {
      street: 'Maharajgunj Medical Area',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
    },
    businessSettings: {
      currency: 'NPR',
      paymentTerms: 'cod'
    },
    status: 'active',
    isVerified: true,
    businessLicense: 'BL-2024-005',
    panNumber: 'PAN321654987',
    createdAt: new Date('2024-01-25'),
    lastLogin: new Date()
  });

  // ==== 3 SUPPLIERS FOR DEMO ====
  
  // Supplier 1 - Electronics Distributor
  const supplier1 = new User({
    username: 'krishna_wholesale',
    firstName: 'Krishna',
    lastName: 'Adhikari',
    email: 'krishna@electronicsupply.com',
    password: await bcrypt.hash('krishna123', salt),
    role: 'supplier',
    companyName: 'Adhikari Electronics Distribution Pvt. Ltd.',
    profilePicture: '/images/avatars/supplier1.jpg',
    contactDetails: {
      title: 'Chief Executive Officer',
      primaryPhone: '+977-9841111222',
      secondaryPhone: '+977-9851111222',
      secondaryEmail: 'sales@electronicsupply.com'
    },
    businessDetails: {
      businessType: 'distributor',
      businessRegistration: 'CR-2023-ELEC-001',
      taxId: 'TAX-ELEC-123456',
      description: 'Leading distributor of smartphones, laptops, accessories and electronic gadgets across Nepal',
      website: 'www.electronicsupply.com',
      establishedYear: 2015
    },
    billingAddress: {
      street: 'New Baneshwor, Electronic Market',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
    },
    businessSettings: {
      paymentTerms: 'net30',
      currency: 'NPR',
      shippingMethod: 'express',
      freeShippingThreshold: 50000,
      leadTime: 2,
      maxOrderQuantity: 5000
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  });

  // Supplier 2 - FMCG Distributor
  const supplier2 = new User({
    username: 'shiva_fmcg',
    firstName: 'Shiva',
    lastName: 'Karki',
    email: 'shiva@fmcgsupply.com',
    password: await bcrypt.hash('shiva123', salt),
    role: 'supplier',
    companyName: 'Karki FMCG Distribution Network',
    profilePicture: '/images/avatars/supplier2.jpg',
    contactDetails: {
      title: 'Managing Director',
      primaryPhone: '+977-9841333444',
      secondaryPhone: '+977-9851333444',
      secondaryEmail: 'orders@fmcgsupply.com'
    },
    businessDetails: {
      businessType: 'wholesaler',
      businessRegistration: 'CR-2020-FMCG-002',
      taxId: 'TAX-FMCG-789012',
      description: 'Wholesale distributor of packaged foods, beverages, personal care and household products',
      website: 'www.fmcgsupply.com',
      establishedYear: 2018
    },
    billingAddress: {
      street: 'Kalimati Commercial Area',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
    },
    businessSettings: {
      paymentTerms: 'net15',
      currency: 'NPR',
      shippingMethod: 'standard',
      freeShippingThreshold: 25000,
      leadTime: 3,
      maxOrderQuantity: 10000
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-02'),
    lastLogin: new Date()
  });

  // Supplier 3 - Pharmaceutical Distributor
  const supplier3 = new User({
    username: 'ram_pharma',
    firstName: 'Ram',
    lastName: 'Bahadur',
    email: 'ram@pharmasupply.com',
    password: await bcrypt.hash('ram123', salt),
    role: 'supplier',
    companyName: 'Bahadur Pharmaceutical Supply Chain',
    profilePicture: '/images/avatars/supplier3.jpg',
    contactDetails: {
      title: 'Licensed Pharmaceutical Distributor',
      primaryPhone: '+977-9841555777',
      secondaryPhone: '+977-9851555777',
      secondaryEmail: 'medical@pharmasupply.com'
    },
    businessDetails: {
      businessType: 'distributor',
      businessRegistration: 'CR-2019-PHARMA-003',
      taxId: 'TAX-PHARMA-345678',
      description: 'Authorized distributor of medicines, medical devices and healthcare products',
      website: 'www.pharmasupply.com',
      establishedYear: 2016
    },
    billingAddress: {
      street: 'Teku Pharmaceutical Hub',
      city: 'Kathmandu',
      state: 'Bagmati',
      postalCode: '44600',
      country: 'Nepal'
    },
    businessSettings: {
      paymentTerms: 'net30',
      currency: 'NPR',
      shippingMethod: 'express',
      freeShippingThreshold: 75000,
      leadTime: 1,
      maxOrderQuantity: 2000
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-03'),
    lastLogin: new Date()
  });

  const users = [admin, shopOwner1, shopOwner2, shopOwner3, shopOwner4, shopOwner5, supplier1, supplier2, supplier3];
  const savedUsers = await User.insertMany(users);
  
  console.log('✅ DEMO USERS CREATED:');
  console.log('=== ADMIN ===');
  console.log('Username: admin | Password: admin123');
  console.log('=== SHOP OWNERS ===');
  console.log('1. Username: rajesh_electronics | Password: rajesh123 | Shop: Shrestha Electronics & Mobile Center');
  console.log('2. Username: priya_grocery | Password: priya123 | Shop: Fresh Mart Grocery Store');
  console.log('3. Username: amit_fashion | Password: amit123 | Shop: Fashion Hub & Accessories');
  console.log('4. Username: kumar_hardware | Password: kumar123 | Shop: Gurung Hardware & Tools');
  console.log('5. Username: sita_pharmacy | Password: sita123 | Shop: Medicare Pharmacy & Health Care');
  console.log('=== SUPPLIERS ===');
  console.log('1. Username: krishna_wholesale | Password: krishna123 | Company: Adhikari Electronics Distribution');
  console.log('2. Username: shiva_fmcg | Password: shiva123 | Company: Karki FMCG Distribution Network');
  console.log('3. Username: ram_pharma | Password: ram123 | Company: Bahadur Pharmaceutical Supply Chain');
  
  return savedUsers;
}

// Seed Products - Comprehensive Product Catalog
const seedProducts = async (shopOwner, supplier1) => {
  console.log('Seeding products...');
  
  const products = [
    // Grocery Items
    {
      name: 'Basmati Rice Premium (5kg)',
      barcode: 'RICE001',
      description: 'Premium quality aged Basmati rice imported from India',
      category: 'Groceries',
      price: 950,
      costPrice: 780,
      stock: 45,
      minStockLevel: 10,
      unit: 'pack',
      imageUrl: '/images/products/basmati-rice.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'India Gate',
      expiryDate: new Date('2025-12-31'),
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Nepali Local Rice (10kg)',
      barcode: 'RICE002',
      description: 'Fresh local rice from Chitwan valley',
      category: 'Groceries',
      price: 650,
      costPrice: 520,
      stock: 60,
      minStockLevel: 15,
      unit: 'pack',
      imageUrl: '/images/products/local-rice.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'Nepal Agro',
      createdAt: new Date('2024-01-06')
    },
    
    // Beverages
    {
      name: 'Coca Cola (330ml)',
      barcode: 'COKE330',
      description: 'Refreshing Coca Cola soft drink',
      category: 'Beverages',
      price: 45,
      costPrice: 32,
      stock: 200,
      minStockLevel: 50,
      unit: 'piece',
      imageUrl: '/images/products/coca-cola.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'Coca Cola',
      expiryDate: new Date('2024-12-31'),
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Nepali Tea Premium (500g)',
      barcode: 'TEA001',
      description: 'Premium quality orthodox black tea from Ilam',
      category: 'Beverages',
      price: 380,
      costPrice: 280,
      stock: 85,
      minStockLevel: 20,
      unit: 'pack',
      imageUrl: '/images/products/nepali-tea.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'Himalayan Tea',
      createdAt: new Date('2024-01-06')
    },
    
    // Snacks
    {
      name: 'Wai Wai Noodles Chicken',
      barcode: 'WAIWAI001',
      description: 'Popular instant noodles with chicken flavor',
      category: 'Snacks',
      price: 32,
      costPrice: 24,
      stock: 300,
      minStockLevel: 100,
      unit: 'pack',
      imageUrl: '/images/products/waiwai.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'Wai Wai',
      expiryDate: new Date('2024-08-31'),
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Rara Noodles Vegetarian',
      barcode: 'RARA001',
      description: 'Healthy vegetarian instant noodles',
      category: 'Snacks',
      price: 28,
      costPrice: 21,
      stock: 250,
      minStockLevel: 80,
      unit: 'pack',
      imageUrl: '/images/products/rara.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'Rara',
      expiryDate: new Date('2024-09-30'),
      createdAt: new Date('2024-01-06')
    },
    
    // Personal Care
    {
      name: 'Lux Beauty Soap (100g)',
      barcode: 'LUX100',
      description: 'Premium beauty soap with rose fragrance',
      category: 'Personal Care',
      price: 48,
      costPrice: 36,
      stock: 120,
      minStockLevel: 30,
      unit: 'piece',
      imageUrl: '/images/products/lux-soap.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'Lux',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Colgate Toothpaste (175g)',
      barcode: 'COLGATE175',
      description: 'Advanced whitening toothpaste for healthy teeth',
      category: 'Personal Care',
      price: 185,
      costPrice: 140,
      stock: 90,
      minStockLevel: 25,
      unit: 'pack',
      imageUrl: '/images/products/colgate.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'Colgate',
      expiryDate: new Date('2026-01-31'),
      createdAt: new Date('2024-01-06')
    },
    
    // Dairy Products
    {
      name: 'DDC Fresh Milk (1L)',
      barcode: 'DDC1L',
      description: 'Fresh pasteurized milk from DDC dairy',
      category: 'Dairy',
      price: 92,
      costPrice: 75,
      stock: 35,
      minStockLevel: 10,
      unit: 'liter',
      imageUrl: '/images/products/ddc-milk.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'DDC',
      expiryDate: new Date('2024-02-15'),
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Local Paneer (250g)',
      barcode: 'PANEER250',
      description: 'Fresh homemade paneer from local dairy',
      category: 'Dairy',
      price: 180,
      costPrice: 140,
      stock: 25,
      minStockLevel: 8,
      unit: 'pack',
      imageUrl: '/images/products/paneer.jpg',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier1._id,
        supplierName: supplier1.firstName + ' ' + supplier1.lastName,
        supplierCode: 'SUP001'
      },
      tax: 13,
      brand: 'Local Dairy',
      expiryDate: new Date('2024-02-10'),
      createdAt: new Date('2024-01-06')
    }
  ];
  
  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} products`);
  return createdProducts;
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
      subtotal: 36500.00,
      tax: 4745.00,
      total: 41245.00,
      status: 'pending',
      orderDate: new Date('2024-01-15'),
      notes: 'Urgent order for new store opening',
      expectedDeliveryDate: new Date('2024-01-20')
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
      subtotal: 15000.00,
      tax: 1950.00,
      total: 16950.00,
      status: 'confirmed',
      orderDate: new Date('2024-01-10'),
      expectedDeliveryDate: new Date('2024-01-18'),
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
      subtotal: 11000.00,
      tax: 1430.00,
      total: 12430.00,
      status: 'shipped',
      orderDate: new Date('2024-01-05'),
      expectedDeliveryDate: new Date('2024-01-12'),
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
      requireCustomer: false
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

// Seed Transactions - Sales Data
const seedTransactions = async (shopOwner, customers, products) => {
  console.log('Seeding transactions...');
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 30);
  
  const transactions = [
    // TODAY'S TRANSACTIONS
    {
      receiptNumber: `RCP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-001`,
      shopId: shopOwner._id,
      customerId: customers[0]._id,
      items: [
        {
          productId: products[0]._id,
          name: products[0].name,
          price: products[0].price,
          quantity: 3,
          subtotal: products[0].price * 3,
          tax: (products[0].price * 3) * 0.13
        },
        {
          productId: products[2]._id,
          name: products[2].name,
          price: products[2].price,
          quantity: 2,
          subtotal: products[2].price * 2,
          tax: (products[2].price * 2) * 0.13
        }
      ],
      subtotal: (products[0].price * 3) + (products[2].price * 2),
      tax: ((products[0].price * 3) + (products[2].price * 2)) * 0.13,
      discount: 100,
      total: ((products[0].price * 3) + (products[2].price * 2)) * 1.13 - 100,
      amountPaid: ((products[0].price * 3) + (products[2].price * 2)) * 1.13 - 100,
      change: 0,
      paymentMethod: 'cash',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30, 0)
    },
    {
      receiptNumber: `RCP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-002`,
      shopId: shopOwner._id,
      customerId: customers[1]._id,
      items: [
        {
          productId: products[1]._id,
          name: products[1].name,
          price: products[1].price,
          quantity: 5,
          subtotal: products[1].price * 5,
          tax: (products[1].price * 5) * 0.13
        }
      ],
      subtotal: products[1].price * 5,
      tax: (products[1].price * 5) * 0.13,
      discount: 0,
      total: (products[1].price * 5) * 1.13,
      amountPaid: (products[1].price * 5) * 1.13,
      change: 0,
      paymentMethod: 'card',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 15, 0)
    },
    {
      receiptNumber: `RCP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-003`,
      shopId: shopOwner._id,
      customerId: customers[2]._id,
      items: [
        {
          productId: products[3]._id,
          name: products[3].name,
          price: products[3].price,
          quantity: 1,
          subtotal: products[3].price,
          tax: products[3].price * 0.13
        },
        {
          productId: products[4]._id,
          name: products[4].name,
          price: products[4].price,
          quantity: 2,
          subtotal: products[4].price * 2,
          tax: (products[4].price * 2) * 0.13
        }
      ],
      subtotal: products[3].price + (products[4].price * 2),
      tax: (products[3].price + (products[4].price * 2)) * 0.13,
      discount: 50,
      total: (products[3].price + (products[4].price * 2)) * 1.13 - 50,
      amountPaid: (products[3].price + (products[4].price * 2)) * 1.13 - 50,
      change: 0,
      paymentMethod: 'cash',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 45, 0)
    },
    {
      receiptNumber: `RCP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-004`,
      shopId: shopOwner._id,
      customerId: customers[0]._id,
      items: [
        {
          productId: products[5]._id,
          name: products[5].name,
          price: products[5].price,
          quantity: 4,
          subtotal: products[5].price * 4,
          tax: (products[5].price * 4) * 0.13
        }
      ],
      subtotal: products[5].price * 4,
      tax: (products[5].price * 4) * 0.13,
      discount: 0,
      total: (products[5].price * 4) * 1.13,
      amountPaid: (products[5].price * 4) * 1.13,
      change: 0,
      paymentMethod: 'digital',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 20, 0)
    },
    // YESTERDAY'S TRANSACTIONS
    {
      receiptNumber: `RCP-${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}-001`,
      shopId: shopOwner._id,
      customerId: customers[1]._id,
      items: [
        {
          productId: products[6]._id,
          name: products[6].name,
          price: products[6].price,
          quantity: 2,
          subtotal: products[6].price * 2,
          tax: (products[6].price * 2) * 0.13
        }
      ],
      subtotal: products[6].price * 2,
      tax: (products[6].price * 2) * 0.13,
      discount: 0,
      total: (products[6].price * 2) * 1.13,
      amountPaid: (products[6].price * 2) * 1.13,
      change: 0,
      paymentMethod: 'cash',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 30, 0)
    },
    {
      receiptNumber: `RCP-${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}-002`,
      shopId: shopOwner._id,
      customerId: customers[2]._id,
      items: [
        {
          productId: products[7]._id,
          name: products[7].name,
          price: products[7].price,
          quantity: 1,
          subtotal: products[7].price,
          tax: products[7].price * 0.13
        }
      ],
      subtotal: products[7].price,
      tax: products[7].price * 0.13,
      discount: 25,
      total: (products[7].price * 1.13) - 25,
      amountPaid: (products[7].price * 1.13) - 25,
      change: 0,
      paymentMethod: 'card',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 45, 0)
    },
    // WEEK'S TRANSACTIONS
    {
      receiptNumber: `RCP-${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}${String(weekAgo.getDate()).padStart(2, '0')}-001`,
      shopId: shopOwner._id,
      customerId: customers[0]._id,
      items: [
        {
          productId: products[8]._id,
          name: products[8].name,
          price: products[8].price,
          quantity: 3,
          subtotal: products[8].price * 3,
          tax: (products[8].price * 3) * 0.13
        }
      ],
      subtotal: products[8].price * 3,
      tax: (products[8].price * 3) * 0.13,
      discount: 0,
      total: (products[8].price * 3) * 1.13,
      amountPaid: (products[8].price * 3) * 1.13,
      change: 0,
      paymentMethod: 'cash',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate(), 12, 30, 0)
    },
    // OLDER TRANSACTIONS FOR HISTORICAL DATA
    {
      receiptNumber: 'RCP-2024-001',
      shopId: shopOwner._id,
      customerId: customers[0]._id,
      items: [
        {
          productId: products[0]._id,
          name: products[0].name,
          price: products[0].price,
          quantity: 2,
          subtotal: products[0].price * 2,
          tax: (products[0].price * 2) * 0.13
        }
      ],
      subtotal: products[0].price * 2,
      tax: (products[0].price * 2) * 0.13,
      discount: 50,
      total: ((products[0].price * 2) * 1.13) - 50,
      amountPaid: ((products[0].price * 2) * 1.13) - 50,
      change: 0,
      paymentMethod: 'cash',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(monthAgo.getFullYear(), monthAgo.getMonth(), monthAgo.getDate(), 10, 30, 0)
    }
  ];
  
  const createdTransactions = await Transaction.insertMany(transactions);
  console.log(`Created ${createdTransactions.length} transactions`);
  return createdTransactions;
};

// Seed Expenses - Business Expenses
const seedExpenses = async (shopOwner) => {
  console.log('Seeding expenses...');
  
  const expenses = [
    {
      shopId: shopOwner._id,
      title: 'Monthly Rent',
      description: 'Shop rent for January 2024',
      amount: 25000,
      category: 'rent',
      date: new Date('2024-01-01'),
      addedBy: shopOwner._id,
      recurring: true,
      recurringDetails: {
        frequency: 'monthly'
      }
    },
    {
      shopId: shopOwner._id,
      description: 'Monthly electricity charges',
      amount: 3500,
      category: 'utilities',
      date: new Date('2024-01-05'),
      addedBy: shopOwner._id,
      recurring: true,
      recurringDetails: {
        frequency: 'monthly'
      }
    },
    {
      shopId: shopOwner._id,
      description: 'Monthly internet and phone charges',
      amount: 1800,
      category: 'utilities',
      date: new Date('2024-01-03'),
      addedBy: shopOwner._id,
      recurring: true,
      recurringDetails: {
        frequency: 'monthly'
      }
    },
    {
      shopId: shopOwner._id,
      description: 'Stock replenishment from supplier',
      amount: 45000,
      category: 'inventory',
      date: new Date('2024-01-08'),
      addedBy: shopOwner._id,
      recurring: false
    },
    {
      shopId: shopOwner._id,
      description: 'Monthly salary for shop assistant',
      amount: 18000,
      category: 'salary',
      date: new Date('2024-01-10'),
      addedBy: shopOwner._id,
      recurring: true,
      recurringDetails: {
        frequency: 'monthly'
      }
    }
  ];
  
  const createdExpenses = await Expense.insertMany(expenses);
  console.log(`Created ${createdExpenses.length} expenses`);
  return createdExpenses;
};

// Seed Inventory Logs - Stock Movement
const seedInventoryLogs = async (shopOwner, products) => {
  console.log('Seeding inventory logs...');
  
  const inventoryLogs = [
    {
      productId: products[0]._id,
      shopId: shopOwner._id,
      type: 'purchase',
      quantity: 50,
      previousStock: 0,
      newStock: 50,
      notes: 'Opening inventory for new product',
      performedBy: shopOwner._id
    },
    {
      productId: products[0]._id,
      shopId: shopOwner._id,
      type: 'sale',
      quantity: -2,
      previousStock: 50,
      newStock: 48,
      notes: 'Sold to customer Maya Tamang',
      performedBy: shopOwner._id
    },
    {
      productId: products[1]._id,
      shopId: shopOwner._id,
      type: 'purchase',
      quantity: 60,
      previousStock: 0,
      newStock: 60,
      notes: 'Opening inventory',
      performedBy: shopOwner._id
    },
    {
      productId: products[2]._id,
      shopId: shopOwner._id,
      type: 'purchase',
      quantity: 300,
      previousStock: 0,
      newStock: 300,
      notes: 'Bulk purchase for snacks category',
      performedBy: shopOwner._id
    },
    {
      productId: products[2]._id,
      shopId: shopOwner._id,
      type: 'sale',
      quantity: -5,
      previousStock: 300,
      newStock: 295,
      notes: 'Sold to customer Maya Tamang',
      performedBy: shopOwner._id
    },
    {
      productId: products[8]._id,
      shopId: shopOwner._id,
      type: 'purchase',
      quantity: 40,
      previousStock: 0,
      newStock: 40,
      notes: 'Fresh dairy products delivery',
      performedBy: shopOwner._id
    },
    {
      productId: products[8]._id,
      shopId: shopOwner._id,
      type: 'sale',
      quantity: -2,
      previousStock: 40,
      newStock: 38,
      notes: 'Sold to customer Binita Shrestha',
      performedBy: shopOwner._id
    },
    {
      productId: products[8]._id,
      shopId: shopOwner._id,
      type: 'loss',
      quantity: -3,
      previousStock: 38,
      newStock: 35,
      notes: 'Removed expired milk products',
      performedBy: shopOwner._id
    }
  ];
  
  const createdInventoryLogs = await InventoryLog.insertMany(inventoryLogs);
  console.log(`Created ${createdInventoryLogs.length} inventory logs`);
  return createdInventoryLogs;
};

// Main seed function
const seedDB = async () => {
  try {
    await connectDB();
    await clearDB();
    
    // Seed in order (users first, then dependent data)
    const { admin, shopOwner, supplier1, supplier2 } = await seedUsers();
    const categories = await seedCategories(shopOwner);
    const customers = await seedCustomers(shopOwner);
    const products = await seedProducts(shopOwner, supplier1);
    const transactions = await seedTransactions(shopOwner, customers, products);
    const expenses = await seedExpenses(shopOwner);
    const inventoryLogs = await seedInventoryLogs(shopOwner, products);
    const orders = await seedOrders(shopOwner, supplier1, products);
    const settings = await seedSettings(shopOwner);
    
    console.log('\n🎉 Database seeded successfully with production-ready data!');
    console.log('='.repeat(60));
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('👑 ADMIN ACCESS:');
    console.log('Email: admin@smartpos.com');
    console.log('Password: admin123');
    console.log('');
    console.log('🏪 SHOP OWNER ACCESS:');
    console.log('Email: rajesh.shrestha@smartpos.com');
    console.log('Password: shop123');
    console.log('');
    console.log('📦 SUPPLIER ACCESS (Approved):');
    console.log('Email: krishna@wholesale.com.np');
    console.log('Password: supplier123');
    console.log('');
    console.log('📦 SUPPLIER PENDING APPROVAL:');
    console.log('Email: sita@freshproduce.com.np');
    console.log('Password: supplier123');
    console.log('='.repeat(60));
    console.log('📊 DATA CREATED:');
    console.log(`- 4 Users (1 admin, 1 shopowner, 2 suppliers)`);
    console.log(`- ${categories.length} Product Categories`);
    console.log(`- ${customers.length} Customers with purchase history`);
    console.log(`- ${products.length} Products with realistic pricing`);
    console.log(`- ${transactions.length} Sales Transactions`);
    console.log(`- ${expenses.length} Business Expenses`);
    console.log(`- ${inventoryLogs.length} Inventory Movement Logs`);
    console.log(`- ${orders.length} Supplier Orders`);
    console.log(`- 1 Complete Settings Configuration`);
    console.log('='.repeat(60));
    console.log('🌐 ACCESS POINTS:');
    console.log('Admin Dashboard: http://localhost:8080/pages/admin-dashboard.html');
    console.log('POS System: http://localhost:8080');
    console.log('Supplier Portal: http://localhost:8080/supplier-landing.html');
    console.log('='.repeat(60));
    console.log('✅ Your Smart POS System is now ready for production use!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed script
seedDB();
