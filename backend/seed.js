/**
 * Enhanced Seed script for Smart POS System - Nepali Small Mart Focus
 * Realistic data for small Nepali grocery shops/kirana pasals
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
const SupplierInventoryLog = require('./models/SupplierInventoryLog');
const NotificationLog = require('./models/NotificationLog');
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

// Seed Users - Realistic Nepali Names and Small Mart Focus
const seedUsers = async () => {
  console.log('Seeding users...');
  
  const salt = await bcrypt.genSalt(10);
  
  // Admin User
  const admin = new User({
    username: 'admin',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@smartpos.com',
    password: await bcrypt.hash('admin123', salt),
    role: 'admin',
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  });

  // ==== 5 NEPALI SHOP OWNERS - SMALL MARTS ====
  
  // Shop Owner 1 - Kirana Pasal
  const shopOwner1 = new User({
    username: 'ram_kirana',
    firstName: 'Ram Bahadur',
    lastName: 'Shrestha',
    email: 'ram@kirana.com',
    password: await bcrypt.hash('ram123', salt),
    role: 'shopowner',
    shopName: 'Ram Kirana Pasal',
    contactDetails: {
      primaryPhone: '+977-9841234567'
    },
    billingAddress: {
      street: 'Naya Sadak',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-05'),
    lastLogin: new Date()
  });
  
  // Shop Owner 2 - General Store
  const shopOwner2 = new User({
    username: 'sita_general',
    firstName: 'Sita',
    lastName: 'Tamang',
    email: 'sita@generalstore.com',
    password: await bcrypt.hash('sita123', salt),
    role: 'shopowner',
    shopName: 'Sita General Store',
    contactDetails: {
      primaryPhone: '+977-9841987654'
    },
    billingAddress: {
      street: 'Baneshwor',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-10'),
    lastLogin: new Date()
  });

  // Shop Owner 3 - Grocery
  const shopOwner3 = new User({
    username: 'hari_grocery',
    firstName: 'Hari Prasad',
    lastName: 'Thapa',
    email: 'hari@grocery.com',
    password: await bcrypt.hash('hari123', salt),
    role: 'shopowner',
    shopName: 'Hari Grocery Corner',
    contactDetails: {
      primaryPhone: '+977-9841555666'
    },
    billingAddress: {
      street: 'Bhaktapur',
      city: 'Bhaktapur',
      state: 'Bagmati',
      country: 'Nepal'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date()
  });

  // Shop Owner 4 - Mini Mart
  const shopOwner4 = new User({
    username: 'krishna_mart',
    firstName: 'Krishna',
    lastName: 'Gurung',
    email: 'krishna@minimart.com',
    password: await bcrypt.hash('krishna123', salt),
    role: 'shopowner',
    shopName: 'Krishna Mini Mart',
    contactDetails: {
      primaryPhone: '+977-9841777888'
    },
    billingAddress: {
      street: 'Pokhara',
      city: 'Pokhara',
      state: 'Gandaki',
      country: 'Nepal'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-20'),
    lastLogin: new Date()
  });

  // Shop Owner 5 - Departmental Store
  const shopOwner5 = new User({
    username: 'laxmi_departmental',
    firstName: 'Laxmi',
    lastName: 'Poudel',
    email: 'laxmi@departmental.com',
    password: await bcrypt.hash('laxmi123', salt),
    role: 'shopowner',
    shopName: 'Laxmi Departmental Store',
    contactDetails: {
      primaryPhone: '+977-9841999000'
    },
    billingAddress: {
      street: 'Chitwan',
      city: 'Bharatpur',
      state: 'Bagmati',
      country: 'Nepal'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-25'),
    lastLogin: new Date()
  });

  // ==== 3 SUPPLIERS FOR SMALL MARTS ====
  
  // Supplier 1 - Wholesale Supplier
  const supplier1 = new User({
    username: 'sharma_grains',
    firstName: 'Shyam',
    lastName: 'Sharma',
    email: 'sharma@grainssupplier.com',
    password: await bcrypt.hash('sharma123', salt),
    role: 'supplier',
    companyName: 'Sharma Grains Supplier',
    businessName: 'Sharma Grains Supplier',
    businessType: 'wholesale',
    businessAddress: 'Kalimati Grain Market, Kathmandu, Nepal',
    contactPerson: 'Shyam Sharma',
    position: 'Owner',
    phone: '+977-9801000001',
    contactDetails: {
      primaryPhone: '+977-9801000001',
      secondaryEmail: 'info@grainssupplier.com'
    },
    businessDetails: {
      businessType: 'wholesaler',
      description: 'Supplier of rice, lentils, and grains to local marts',
      establishedYear: 2012
    },
    billingAddress: {
      street: 'Kalimati',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  });

  // Supplier 2 - FMCG Distributor
  const supplier2 = new User({
    username: 'nepal_grocery',
    firstName: 'Manoj',
    lastName: 'Nepal',
    email: 'manoj@nepalgrocery.com',
    password: await bcrypt.hash('manoj123', salt),
    role: 'supplier',
    companyName: 'Nepal Grocery Traders',
    businessName: 'Nepal Grocery Traders',
    businessType: 'wholesale',
    businessAddress: 'Balkhu, Kathmandu, Nepal',
    contactPerson: 'Manoj Nepal',
    position: 'Manager',
    phone: '+977-9801000002',
    contactDetails: {
      primaryPhone: '+977-9801000002',
      secondaryEmail: 'contact@nepalgrocery.com'
    },
    businessDetails: {
      businessType: 'wholesaler',
      description: 'Bulk grocery and daily essentials supplier',
      establishedYear: 2015
    },
    billingAddress: {
      street: 'Balkhu',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal'
    },
    status: 'active',
    isVerified: true,
    createdAt: new Date('2024-01-02'),
    lastLogin: new Date()
  });

  // Supplier 3 - Local Supplier
  const supplier3 = new User({
    username: 'bhatta_rice',
    firstName: 'Suresh',
    lastName: 'Bhatta',
    email: 'suresh@bhattarice.com',
    password: await bcrypt.hash('suresh123', salt),
    role: 'supplier',
    companyName: 'Bhatta Rice & Pulses',
    businessName: 'Bhatta Rice & Pulses',
    businessType: 'retailer',
    businessAddress: 'Teku Road, Kathmandu, Nepal',
    contactPerson: 'Suresh Bhatta',
    position: 'Owner',
    phone: '+977-9801000003',
    contactDetails: {
      primaryPhone: '+977-9801000003',
      secondaryEmail: 'info@bhattarice.com'
    },
    businessDetails: {
      businessType: 'retailer',
      description: 'Supplier of rice, pulses, and grains to local stores',
      establishedYear: 2017
    },
    billingAddress: {
      street: 'Teku',
      city: 'Kathmandu',
      state: 'Bagmati',
      country: 'Nepal'
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
  console.log('=== SHOP OWNERS (Small Nepali Marts) ===');
  console.log('1. Username: ram_kirana | Password: ram123 | Shop: Ram Kirana Pasal');
  console.log('2. Username: sita_general | Password: sita123 | Shop: Sita General Store');
  console.log('3. Username: hari_grocery | Password: hari123 | Shop: Hari Grocery Corner');
  console.log('4. Username: krishna_mart | Password: krishna123 | Shop: Krishna Mini Mart');
  console.log('5. Username: laxmi_departmental | Password: laxmi123 | Shop: Laxmi Departmental Store');
  console.log('=== SUPPLIERS ===');
  console.log('1. Username: sharma_grains | Password: sharma123 | Company: Sharma Grains Supplier');
  console.log('2. Username: nepal_grocery | Password: manoj123 | Company: Nepal Grocery Traders');
  console.log('3. Username: bhatta_rice | Password: suresh123 | Company: Bhatta Rice & Pulses');
  
  return savedUsers;
};

// Seed Products - Daily Use Nepali Items
const seedProducts = async (shopOwner, supplier) => {
  console.log('Seeding products with daily use Nepali items...');
  
  const products = [
    // Rice and Grains
    {
      name: 'Chamal (Rice) - 5kg',
      barcode: 'RICE005',
      description: 'Daily use white rice 5kg pack',
      category: 'Grains',
      price: 650,
      costPrice: 520,
      stock: 45,
      minStockLevel: 10,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Local',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Daal Masoor (Red Lentils) - 1kg',
      barcode: 'DAAL001',
      description: 'Red lentils 1kg pack',
      category: 'Grains',
      price: 180,
      costPrice: 150,
      stock: 60,
      minStockLevel: 15,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Local',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Chiura (Beaten Rice) - 500g',
      barcode: 'CHIURA500',
      description: 'Traditional beaten rice 500g',
      category: 'Grains',
      price: 85,
      costPrice: 65,
      stock: 40,
      minStockLevel: 10,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Local',
      createdAt: new Date('2024-01-06')
    },
    
    // Spices and Oil
    {
      name: 'Nun (Salt) - 1kg',
      barcode: 'SALT1KG',
      description: 'Table salt 1kg pack',
      category: 'Spices',
      price: 35,
      costPrice: 25,
      stock: 80,
      minStockLevel: 20,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Trishul',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Khana Pakune Tel (Cooking Oil) - 1L',
      barcode: 'OIL1L',
      description: 'Refined cooking oil 1 liter',
      category: 'Oil',
      price: 250,
      costPrice: 220,
      stock: 35,
      minStockLevel: 8,
      unit: 'liter',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Dhara',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Haldi (Turmeric Powder) - 100g',
      barcode: 'HALDI100',
      description: 'Pure turmeric powder 100g',
      category: 'Spices',
      price: 45,
      costPrice: 35,
      stock: 50,
      minStockLevel: 12,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Local',
      createdAt: new Date('2024-01-06')
    },
    
    // Noodles and Snacks
    {
      name: 'Wai Wai Noodles',
      barcode: 'WAIWAI001',
      description: 'Popular instant noodles',
      category: 'Snacks',
      price: 32,
      costPrice: 24,
      stock: 200,
      minStockLevel: 50,
      unit: 'piece',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Wai Wai',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Rara Noodles',
      barcode: 'RARA001',
      description: 'Instant noodles rara brand',
      category: 'Snacks',
      price: 28,
      costPrice: 21,
      stock: 180,
      minStockLevel: 40,
      unit: 'piece',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Rara',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Kurkure',
      barcode: 'KURKURE001',
      description: 'Crunchy corn snacks',
      category: 'Snacks',
      price: 20,
      costPrice: 15,
      stock: 100,
      minStockLevel: 25,
      unit: 'piece',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Kurkure',
      createdAt: new Date('2024-01-06')
    },
    
    // Personal Care
    {
      name: 'Sabun (Soap) - Lux',
      barcode: 'LUXSOAP',
      description: 'Beauty soap bar',
      category: 'Personal Care',
      price: 48,
      costPrice: 36,
      stock: 80,
      minStockLevel: 20,
      unit: 'piece',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Lux',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Daant Saaf Paste (Toothpaste)',
      barcode: 'COLGATE001',
      description: 'Toothpaste for dental care',
      category: 'Personal Care',
      price: 185,
      costPrice: 140,
      stock: 60,
      minStockLevel: 15,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Colgate',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Daant Brush (Toothbrush)',
      barcode: 'BRUSH001',
      description: 'Soft bristle toothbrush',
      category: 'Personal Care',
      price: 35,
      costPrice: 25,
      stock: 45,
      minStockLevel: 10,
      unit: 'piece',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Oral-B',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Shampoo Sachet',
      barcode: 'SHAMPOO001',
      description: 'Hair shampoo small pack',
      category: 'Personal Care',
      price: 15,
      costPrice: 10,
      stock: 150,
      minStockLevel: 30,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Head & Shoulders',
      createdAt: new Date('2024-01-06')
    },
    
    // Beverages
    {
      name: 'Chiya Patti (Tea Leaves) - 250g',
      barcode: 'TEA250',
      description: 'Black tea leaves 250g pack',
      category: 'Beverages',
      price: 180,
      costPrice: 150,
      stock: 40,
      minStockLevel: 10,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Gorkha Tea',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Chini (Sugar) - 1kg',
      barcode: 'SUGAR1KG',
      description: 'White sugar 1kg pack',
      category: 'Sweeteners',
      price: 120,
      costPrice: 100,
      stock: 70,
      minStockLevel: 15,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Local',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Biscuit - Marie',
      barcode: 'MARIE001',
      description: 'Plain marie biscuits',
      category: 'Snacks',
      price: 45,
      costPrice: 35,
      stock: 90,
      minStockLevel: 20,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Parle-G',
      createdAt: new Date('2024-01-06')
    },
    
    // Stationery
    {
      name: 'Pencil',
      barcode: 'PENCIL001',
      description: 'Writing pencil HB',
      category: 'Stationery',
      price: 8,
      costPrice: 5,
      stock: 200,
      minStockLevel: 50,
      unit: 'piece',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Apsara',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Copy Kitab (Notebook)',
      barcode: 'COPY001',
      description: 'Exercise notebook 40 pages',
      category: 'Stationery',
      price: 25,
      costPrice: 18,
      stock: 120,
      minStockLevel: 30,
      unit: 'piece',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Local',
      createdAt: new Date('2024-01-06')
    },
    {
      name: 'Pen - Ball Point',
      barcode: 'PEN001',
      description: 'Blue ball point pen',
      category: 'Stationery',
      price: 12,
      costPrice: 8,
      stock: 150,
      minStockLevel: 40,
      unit: 'piece',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Reynolds',
      createdAt: new Date('2024-01-06')
    },
    
    // Household Items
    {
      name: 'Detergent Powder - 500g',
      barcode: 'DETERGENT500',
      description: 'Washing powder 500g',
      category: 'Household',
      price: 95,
      costPrice: 75,
      stock: 50,
      minStockLevel: 12,
      unit: 'pack',
      shopId: shopOwner._id,
      isActive: true,
      supplierInfo: {
        supplierId: supplier._id,
        supplierName: supplier.firstName + ' ' + supplier.lastName
      },
      brand: 'Surf Excel',
      createdAt: new Date('2024-01-06')
    }
  ];
  
  const createdProducts = await Product.insertMany(products);
  console.log(`Created ${createdProducts.length} daily use products`);
  return createdProducts;
};

// Seed Categories for Nepali Mart
const seedCategories = async (shopOwner) => {
  console.log('Seeding categories...');
  
  const categories = [
    {
      name: 'Grains',
      description: 'Rice, lentils, beaten rice and other grains',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 1
    },
    {
      name: 'Spices',
      description: 'Salt, turmeric, and cooking spices',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 2
    },
    {
      name: 'Oil',
      description: 'Cooking oil and ghee',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 3
    },
    {
      name: 'Snacks',
      description: 'Noodles, biscuits, and snack items',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 4
    },
    {
      name: 'Personal Care',
      description: 'Soap, toothpaste, shampoo, and hygiene products',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 5
    },
    {
      name: 'Beverages',
      description: 'Tea, coffee, and drink items',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 6
    },
    {
      name: 'Sweeteners',
      description: 'Sugar and sweetening items',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 7
    },
    {
      name: 'Stationery',
      description: 'Pen, pencil, notebook, and school items',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 8
    },
    {
      name: 'Household',
      description: 'Cleaning and household items',
      shopId: shopOwner._id,
      isActive: true,
      sortOrder: 9
    }
  ];
  
  const createdCategories = await Category.insertMany(categories);
  console.log(`Created ${createdCategories.length} categories`);
  return createdCategories;
};

// Seed Customers with Nepali Names
const seedCustomers = async (shopOwner) => {
  console.log('Seeding customers...');
  
  const customers = [
    {
      shopId: shopOwner._id,
      name: 'Maya Devi Sharma',
      phone: '+977-9841234567',
      address: {
        street: 'Boudha',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      type: 'regular',
      status: 'active',
      loyaltyPoints: 120,
      totalSpent: 1850.50,
      totalOrders: 15,
      lastOrderDate: new Date('2024-01-15')
    },
    {
      shopId: shopOwner._id,
      name: 'Bhim Bahadur Rai',
      phone: '+977-9851234567',
      address: {
        street: 'Lalitpur',
        city: 'Lalitpur',
        state: 'Bagmati',
        country: 'Nepal'
      },
      type: 'regular',
      status: 'active',
      loyaltyPoints: 200,
      totalSpent: 2650.75,
      totalOrders: 22,
      lastOrderDate: new Date('2024-01-12')
    },
    {
      shopId: shopOwner._id,
      name: 'Kamala Thapa',
      phone: '+977-9861234567',
      address: {
        street: 'Baneshwor',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      type: 'regular',
      status: 'active',
      loyaltyPoints: 90,
      totalSpent: 1420.25,
      totalOrders: 12,
      lastOrderDate: new Date('2024-01-10')
    },
    {
      shopId: shopOwner._id,
      name: 'Dil Bahadur Gurung',
      phone: '+977-9871234567',
      address: {
        street: 'Thamel',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      type: 'regular',
      status: 'active',
      loyaltyPoints: 45,
      totalSpent: 890.00,
      totalOrders: 8,
      lastOrderDate: new Date('2024-01-08')
    },
    {
      shopId: shopOwner._id,
      name: 'Sunita Magar',
      phone: '+977-9881234567',
      address: {
        street: 'Kirtipur',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      type: 'regular',
      status: 'active',
      loyaltyPoints: 150,
      totalSpent: 2180.80,
      totalOrders: 18,
      lastOrderDate: new Date('2024-01-14')
    }
  ];
  
  const createdCustomers = await Customer.insertMany(customers);
  console.log(`Created ${createdCustomers.length} customers`);
  return createdCustomers;
};

// Seed Transactions - Simple Payment Method
const seedTransactions = async (shopOwner, customers, products) => {
  console.log('Seeding transactions...');
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  const transactions = [
    // TODAY'S TRANSACTIONS
    {
      receiptNumber: `RCP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-001`,
      shopId: shopOwner._id,
      customerId: customers[0]._id,
      items: [
        {
          productId: products[0]._id, // Rice
          name: products[0].name,
          price: products[0].price,
          quantity: 1,
          subtotal: products[0].price
        },
        {
          productId: products[6]._id, // Wai Wai
          name: products[6].name,
          price: products[6].price,
          quantity: 3,
          subtotal: products[6].price * 3
        }
      ],
      subtotal: products[0].price + (products[6].price * 3),
      discount: 50,
      total: (products[0].price + (products[6].price * 3)) - 50,
      amountPaid: (products[0].price + (products[6].price * 3)) - 50,
      change: 0,
      paymentMethod: 'paid', // Simple payment tracking
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
          productId: products[1]._id, // Daal
          name: products[1].name,
          price: products[1].price,
          quantity: 2,
          subtotal: products[1].price * 2
        },
        {
          productId: products[9]._id, // Soap
          name: products[9].name,
          price: products[9].price,
          quantity: 1,
          subtotal: products[9].price
        }
      ],
      subtotal: (products[1].price * 2) + products[9].price,
      discount: 0,
      total: (products[1].price * 2) + products[9].price,
      amountPaid: (products[1].price * 2) + products[9].price,
      change: 0,
      paymentMethod: 'paid',
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
          productId: products[16]._id, // Pencil
          name: products[16].name,
          price: products[16].price,
          quantity: 5,
          subtotal: products[16].price * 5
        },
        {
          productId: products[17]._id, // Notebook
          name: products[17].name,
          price: products[17].price,
          quantity: 2,
          subtotal: products[17].price * 2
        }
      ],
      subtotal: (products[16].price * 5) + (products[17].price * 2),
      discount: 10,
      total: ((products[16].price * 5) + (products[17].price * 2)) - 10,
      amountPaid: ((products[16].price * 5) + (products[17].price * 2)) - 10,
      change: 0,
      paymentMethod: 'paid',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 45, 0)
    },
    
    // YESTERDAY'S TRANSACTIONS
    {
      receiptNumber: `RCP-${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}-001`,
      shopId: shopOwner._id,
      customerId: customers[3]._id,
      items: [
        {
          productId: products[13]._id, // Tea
          name: products[13].name,
          price: products[13].price,
          quantity: 1,
          subtotal: products[13].price
        },
        {
          productId: products[14]._id, // Sugar
          name: products[14].name,
          price: products[14].price,
          quantity: 1,
          subtotal: products[14].price
        }
      ],
      subtotal: products[13].price + products[14].price,
      discount: 0,
      total: products[13].price + products[14].price,
      amountPaid: products[13].price + products[14].price,
      change: 0,
      paymentMethod: 'paid',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 30, 0)
    },
    {
      receiptNumber: `RCP-${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}-002`,
      shopId: shopOwner._id,
      customerId: customers[4]._id,
      items: [
        {
          productId: products[10]._id, // Toothpaste
          name: products[10].name,
          price: products[10].price,
          quantity: 1,
          subtotal: products[10].price
        },
        {
          productId: products[11]._id, // Toothbrush
          name: products[11].name,
          price: products[11].price,
          quantity: 1,
          subtotal: products[11].price
        }
      ],
      subtotal: products[10].price + products[11].price,
      discount: 20,
      total: (products[10].price + products[11].price) - 20,
      amountPaid: (products[10].price + products[11].price) - 20,
      change: 0,
      paymentMethod: 'paid',
      status: 'completed',
      cashierId: shopOwner._id,
      cashierName: shopOwner.firstName + ' ' + shopOwner.lastName,
      createdAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 45, 0)
    }
  ];
  
  const createdTransactions = await Transaction.insertMany(transactions);
  console.log(`Created ${createdTransactions.length} transactions`);
  return createdTransactions;
};

// Seed Auto Orders for Low Stock
const seedAutoOrders = async (shopOwner, supplier, products) => {
  console.log('Seeding auto orders...');
  
  const autoOrders = [
    {
      shopId: shopOwner._id,
      supplierId: supplier._id,
      productId: products[0]._id, // Rice
      productName: products[0].name,
      quantity: 20,
      frequency: 'weekly',
      nextOrderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      isActive: true,
      minStockLevel: products[0].minStockLevel,
      reorderQuantity: 20,
      autoOrderEnabled: true,
      priority: 'high'
    },
    {
      shopId: shopOwner._id,
      supplierId: supplier._id,
      productId: products[6]._id, // Wai Wai
      productName: products[6].name,
      quantity: 100,
      frequency: 'weekly',
      nextOrderDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      isActive: true,
      minStockLevel: products[6].minStockLevel,
      reorderQuantity: 100,
      autoOrderEnabled: true,
      priority: 'medium'
    },
    {
      shopId: shopOwner._id,
      supplierId: supplier._id,
      productId: products[9]._id, // Soap
      productName: products[9].name,
      quantity: 50,
      frequency: 'monthly',
      nextOrderDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
      isActive: true,
      minStockLevel: products[9].minStockLevel,
      reorderQuantity: 50,
      autoOrderEnabled: true,
      priority: 'medium'
    }
  ];
  
  const createdAutoOrders = await AutoOrder.insertMany(autoOrders);
  console.log(`Created ${createdAutoOrders.length} auto orders`);
  return createdAutoOrders;
};

// Seed notification logs for system alerts and messages
const seedNotificationLogs = async (shopOwner, supplier) => {
  console.log('Seeding notification logs...');
  
  const NotificationLog = mongoose.model('NotificationLog');
  
  const notifications = [
    {
      admin: 'System',
      recipients: [shopOwner.email],
      message: 'Low stock alert: Rice (Chamal) stock is below minimum threshold',
      method: 'push',
      status: 'sent',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      admin: 'System',
      recipients: [shopOwner.email],
      message: 'New order received from Bhim Bahadur Rai',
      method: 'push',
      status: 'sent',
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
      admin: 'System',
      recipients: [shopOwner.email, supplier.email],
      message: 'Auto order generated for Wai Wai Noodles',
      method: 'email',
      status: 'sent',
      time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    {
      admin: 'System',
      recipients: [shopOwner.email],
      message: 'Daily sales summary for yesterday: Total sales NPR 2,850.00',
      method: 'email',
      status: 'sent',
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // Yesterday
    },
    {
      admin: 'System',
      recipients: [shopOwner.email],
      message: 'Security alert: New login detected from unknown device',
      method: 'sms',
      status: 'sent',
      time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    },
    {
      admin: 'System',
      recipients: [supplier.email],
      message: 'New order received from Ram Kirana Pasal',
      method: 'push',
      status: 'sent',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  ];
  
  const createdNotifications = await NotificationLog.insertMany(notifications);
  console.log(`Created ${createdNotifications.length} notification logs`);
  return createdNotifications;
};

// Seed inventory logs to track stock changes
const seedInventoryLogs = async (shopOwner, products, transactions) => {
  console.log('Seeding inventory logs...');
  
  const InventoryLog = mongoose.model('InventoryLog');
  
  const inventoryLogs = [
    // Purchase logs
    {
      shopId: shopOwner._id,
      productId: products[0]._id, // Rice
      type: 'purchase',
      quantity: 20,
      previousStock: 25,
      newStock: 45,
      reference: 'Initial purchase',
      notes: 'Regular stock replenishment',
      cost: products[0].costPrice * 20,
      performedBy: shopOwner._id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    },
    {
      shopId: shopOwner._id,
      productId: products[6]._id, // Wai Wai Noodles
      type: 'purchase',
      quantity: 100,
      previousStock: 100,
      newStock: 200,
      reference: 'Bulk purchase',
      notes: 'Festival season preparation',
      cost: products[6].costPrice * 100,
      performedBy: shopOwner._id,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
    },
    
    // Sale logs based on transactions
    {
      shopId: shopOwner._id,
      productId: products[0]._id, // Rice
      type: 'sale',
      quantity: -1,
      previousStock: 45,
      newStock: 44,
      reference: transactions[0].receiptNumber,
      referenceId: transactions[0]._id,
      referenceModel: 'Transaction',
      notes: 'Sale to Maya Devi Sharma',
      cost: products[0].costPrice * 1,
      performedBy: shopOwner._id,
      createdAt: new Date(transactions[0].createdAt)
    },
    {
      shopId: shopOwner._id,
      productId: products[6]._id, // Wai Wai
      type: 'sale',
      quantity: -3,
      previousStock: 200,
      newStock: 197,
      reference: transactions[0].receiptNumber,
      referenceId: transactions[0]._id,
      referenceModel: 'Transaction',
      notes: 'Sale to Maya Devi Sharma',
      cost: products[6].costPrice * 3,
      performedBy: shopOwner._id,
      createdAt: new Date(transactions[0].createdAt)
    },
    {
      shopId: shopOwner._id,
      productId: products[1]._id, // Daal
      type: 'sale',
      quantity: -2,
      previousStock: 60,
      newStock: 58,
      reference: transactions[1].receiptNumber,
      referenceId: transactions[1]._id,
      referenceModel: 'Transaction',
      notes: 'Sale to Bhim Bahadur Rai',
      cost: products[1].costPrice * 2,
      performedBy: shopOwner._id,
      createdAt: new Date(transactions[1].createdAt)
    },
    
    // Adjustment logs
    {
      shopId: shopOwner._id,
      productId: products[9]._id, // Soap
      type: 'adjustment',
      quantity: -2,
      previousStock: 82,
      newStock: 80,
      reference: 'Stocktake adjustment',
      notes: 'Found damaged items',
      performedBy: shopOwner._id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    {
      shopId: shopOwner._id,
      productId: products[13]._id, // Tea
      type: 'adjustment',
      quantity: 2,
      previousStock: 38,
      newStock: 40,
      reference: 'Stocktake adjustment',
      notes: 'Found extra stock in back store',
      performedBy: shopOwner._id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    
    // Loss record
    {
      shopId: shopOwner._id,
      productId: products[14]._id, // Sugar
      type: 'loss',
      quantity: -3,
      previousStock: 73,
      newStock: 70,
      reference: 'Damage report',
      notes: 'Water damage due to roof leak',
      performedBy: shopOwner._id,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
    }
  ];
  
  const createdInventoryLogs = await InventoryLog.insertMany(inventoryLogs);
  console.log(`Created ${createdInventoryLogs.length} inventory logs`);
  return createdInventoryLogs;
};

// Seed orders to suppliers
const seedOrders = async (shopOwner, supplier, products) => {
  console.log('Seeding supplier orders...');
  
  const Order = mongoose.model('Order');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const orders = [
    {
      orderNumber: `ORD-${lastWeek.getFullYear()}${String(lastWeek.getMonth() + 1).padStart(2, '0')}${String(lastWeek.getDate()).padStart(2, '0')}-001`,
      shopId: shopOwner._id,
      supplierId: supplier._id,
      items: [
        {
          productId: products[0]._id, // Rice
          name: products[0].name,
          sku: 'RICE005',
          quantity: 20,
          unitPrice: products[0].costPrice,
          totalPrice: products[0].costPrice * 20,
          discount: 0
        },
        {
          productId: products[1]._id, // Daal
          name: products[1].name,
          sku: 'DAAL001',
          quantity: 15,
          unitPrice: products[1].costPrice,
          totalPrice: products[1].costPrice * 15,
          discount: 0
        }
      ],
      subtotal: products[0].costPrice * 20 + products[1].costPrice * 15,
      shippingCost: 200,
      discount: 500,
      total: (products[0].costPrice * 20 + products[1].costPrice * 15) + 200 - 500,
      status: 'delivered',
      orderDate: lastWeek,
      expectedDeliveryDate: twoDaysAgo,
      actualDeliveryDate: twoDaysAgo,
      shippingAddress: {
        street: 'Naya Sadak',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      paymentMethod: 'bankTransfer',
      paymentStatus: 'paid',
      notes: 'Regular weekly order'
    },
    {
      orderNumber: `ORD-${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}-001`,
      shopId: shopOwner._id,
      supplierId: supplier._id,
      items: [
        {
          productId: products[6]._id, // Wai Wai
          name: products[6].name,
          sku: 'WAIWAI001',
          quantity: 100,
          unitPrice: products[6].costPrice,
          totalPrice: products[6].costPrice * 100,
          discount: 100
        },
        {
          productId: products[7]._id, // Rara Noodles
          name: products[7].name,
          sku: 'RARA001',
          quantity: 80,
          unitPrice: products[7].costPrice,
          totalPrice: products[7].costPrice * 80,
          discount: 80
        }
      ],
      subtotal: products[6].costPrice * 100 + products[7].costPrice * 80,
      shippingCost: 150,
      discount: 180,
      total: (products[6].costPrice * 100 + products[7].costPrice * 80) + 150 - 180,
      status: 'confirmed',
      orderDate: yesterday,
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      shippingAddress: {
        street: 'Naya Sadak',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      paymentMethod: 'creditAccount',
      paymentStatus: 'pending',
      notes: 'Urgent order for festival season'
    },
    {
      orderNumber: `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
      shopId: shopOwner._id,
      supplierId: supplier._id,
      items: [
        {
          productId: products[9]._id, // Soap
          name: products[9].name,
          sku: 'LUXSOAP',
          quantity: 50,
          unitPrice: products[9].costPrice,
          totalPrice: products[9].costPrice * 50,
          discount: 0
        },
        {
          productId: products[10]._id, // Toothpaste
          name: products[10].name,
          sku: 'COLGATE001',
          quantity: 30,
          unitPrice: products[10].costPrice,
          totalPrice: products[10].costPrice * 30,
          discount: 0
        },
        {
          productId: products[11]._id, // Toothbrush
          name: products[11].name,
          sku: 'BRUSH001',
          quantity: 30,
          unitPrice: products[11].costPrice,
          totalPrice: products[11].costPrice * 30,
          discount: 0
        }
      ],
      subtotal: products[9].costPrice * 50 + products[10].costPrice * 30 + products[11].costPrice * 30,
      shippingCost: 200,
      discount: 0,
      total: (products[9].costPrice * 50 + products[10].costPrice * 30 + products[11].costPrice * 30) + 200,
      status: 'pending',
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      shippingAddress: {
        street: 'Naya Sadak',
        city: 'Kathmandu',
        state: 'Bagmati',
        country: 'Nepal'
      },
      paymentMethod: 'creditAccount',
      paymentStatus: 'pending',
      notes: 'Monthly hygiene products order'
    }
  ];
  
  const createdOrders = await Order.insertMany(orders);
  console.log(`Created ${createdOrders.length} supplier orders`);
  return createdOrders;
};

// Seed supplier inventories
const seedSupplierInventories = async (supplier, products) => {
  console.log('Seeding supplier inventories...');
  
  const SupplierInventory = mongoose.model('SupplierInventory');
  
  const supplierInventories = [
    {
      supplierId: supplier._id,
      productId: products[0]._id, // Rice
      sku: 'SUP-RICE005',
      currentStock: 350,
      minStock: 100,
      maxStock: 500,
      costPrice: products[0].costPrice * 0.9, // 10% lower than shop's cost price
      sellingPrice: products[0].costPrice,
      location: 'Warehouse A1',
      status: 'in-stock',
      batchNumber: 'BATCH-R22',
      notes: 'Popular rice brand'
    },
    {
      supplierId: supplier._id,
      productId: products[1]._id, // Daal
      sku: 'SUP-DAAL001',
      currentStock: 250,
      minStock: 50,
      maxStock: 400,
      costPrice: products[1].costPrice * 0.85,
      sellingPrice: products[1].costPrice,
      location: 'Warehouse A2',
      status: 'in-stock',
      batchNumber: 'BATCH-D18',
      notes: 'Red lentils imported from India'
    },
    {
      supplierId: supplier._id,
      productId: products[6]._id, // Wai Wai Noodles
      sku: 'SUP-WAIWAI001',
      currentStock: 800,
      minStock: 200,
      maxStock: 1500,
      costPrice: products[6].costPrice * 0.75,
      sellingPrice: products[6].costPrice,
      location: 'Warehouse B3',
      status: 'in-stock',
      batchNumber: 'BATCH-W45',
      notes: 'High demand product'
    },
    {
      supplierId: supplier._id,
      productId: products[7]._id, // Rara Noodles
      sku: 'SUP-RARA001',
      currentStock: 600,
      minStock: 150,
      maxStock: 1200,
      costPrice: products[7].costPrice * 0.8,
      sellingPrice: products[7].costPrice,
      location: 'Warehouse B3',
      status: 'in-stock',
      batchNumber: 'BATCH-R38',
      notes: 'Secondary noodle brand'
    },
    {
      supplierId: supplier._id,
      productId: products[9]._id, // Soap
      sku: 'SUP-LUXSOAP',
      currentStock: 400,
      minStock: 100,
      maxStock: 600,
      costPrice: products[9].costPrice * 0.8,
      sellingPrice: products[9].costPrice,
      location: 'Warehouse C1',
      status: 'in-stock',
      batchNumber: 'BATCH-S56',
      notes: 'Beauty soap, high margin'
    },
    {
      supplierId: supplier._id,
      productId: products[10]._id, // Toothpaste
      sku: 'SUP-COLGATE001',
      currentStock: 180,
      minStock: 40,
      maxStock: 300,
      costPrice: products[10].costPrice * 0.85,
      sellingPrice: products[10].costPrice,
      location: 'Warehouse C1',
      status: 'in-stock',
      batchNumber: 'BATCH-TP29',
      notes: 'Premium toothpaste'
    },
    {
      supplierId: supplier._id,
      productId: products[11]._id, // Toothbrush
      sku: 'SUP-BRUSH001',
      currentStock: 250,
      minStock: 50,
      maxStock: 350,
      costPrice: products[11].costPrice * 0.7,
      sellingPrice: products[11].costPrice,
      location: 'Warehouse C1',
      status: 'in-stock',
      batchNumber: 'BATCH-TB14',
      notes: 'Soft bristle brush'
    },
    {
      supplierId: supplier._id,
      productId: products[13]._id, // Tea
      sku: 'SUP-TEA250',
      currentStock: 120,
      minStock: 30,
      maxStock: 200,
      costPrice: products[13].costPrice * 0.8,
      sellingPrice: products[13].costPrice,
      location: 'Warehouse A3',
      status: 'in-stock',
      batchNumber: 'BATCH-T11',
      notes: 'Nepal grown black tea'
    },
    {
      supplierId: supplier._id,
      productId: products[14]._id, // Sugar
      sku: 'SUP-SUGAR1KG',
      currentStock: 380,
      minStock: 100,
      maxStock: 500,
      costPrice: products[14].costPrice * 0.9,
      sellingPrice: products[14].costPrice,
      location: 'Warehouse A2',
      status: 'in-stock',
      batchNumber: 'BATCH-SG21',
      notes: 'Regular white sugar'
    },
    {
      supplierId: supplier._id,
      productId: products[19]._id, // Detergent
      sku: 'SUP-DETERGENT500',
      currentStock: 40,
      minStock: 50,
      maxStock: 200,
      costPrice: products[19].costPrice * 0.85,
      sellingPrice: products[19].costPrice,
      location: 'Warehouse C2',
      status: 'low-stock',
      batchNumber: 'BATCH-D09',
      notes: 'Running low, need to restock'
    }
  ];
  
  const createdSupplierInventories = await SupplierInventory.insertMany(supplierInventories);
  console.log(`Created ${createdSupplierInventories.length} supplier inventory items`);
  return createdSupplierInventories;
};

// Seed supplier inventory logs
const seedSupplierInventoryLogs = async (supplier, products, orders) => {
  console.log('Seeding supplier inventory logs...');
  
  const SupplierInventoryLog = mongoose.model('SupplierInventoryLog');
  
  const supplierInventoryLogs = [
    // Initial stock entries
    {
      supplierId: supplier._id,
      productId: products[0]._id, // Rice
      type: 'initial',
      quantity: 400,
      previousStock: 0,
      newStock: 400,
      reference: 'Initial inventory',
      notes: 'Opening stock recording',
      location: 'Warehouse A1',
      performedBy: supplier._id,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    },
    {
      supplierId: supplier._id,
      productId: products[1]._id, // Daal
      type: 'initial',
      quantity: 300,
      previousStock: 0,
      newStock: 300,
      reference: 'Initial inventory',
      notes: 'Opening stock recording',
      location: 'Warehouse A2',
      performedBy: supplier._id,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    },
    
    // Sales to shop owners
    {
      supplierId: supplier._id,
      productId: products[0]._id, // Rice
      type: 'sold',
      quantity: -20,
      previousStock: 400,
      newStock: 380,
      reference: orders[0].orderNumber,
      referenceId: orders[0]._id,
      referenceModel: 'Order',
      notes: 'Sale to Ram Kirana Pasal',
      location: 'Warehouse A1',
      performedBy: supplier._id,
      createdAt: new Date(orders[0].orderDate)
    },
    {
      supplierId: supplier._id,
      productId: products[1]._id, // Daal
      type: 'sold',
      quantity: -15,
      previousStock: 300,
      newStock: 285,
      reference: orders[0].orderNumber,
      referenceId: orders[0]._id,
      referenceModel: 'Order',
      notes: 'Sale to Ram Kirana Pasal',
      location: 'Warehouse A2',
      performedBy: supplier._id,
      createdAt: new Date(orders[0].orderDate)
    },
    
    // Received new stock
    {
      supplierId: supplier._id,
      productId: products[6]._id, // Wai Wai
      type: 'received',
      quantity: 500,
      previousStock: 350,
      newStock: 850,
      reference: 'Manufacturer delivery',
      notes: 'Bulk purchase from manufacturer',
      location: 'Warehouse B3',
      performedBy: supplier._id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
    },
    {
      supplierId: supplier._id,
      productId: products[7]._id, // Rara Noodles
      type: 'received',
      quantity: 400,
      previousStock: 250,
      newStock: 650,
      reference: 'Manufacturer delivery',
      notes: 'Bulk purchase from manufacturer',
      location: 'Warehouse B3',
      performedBy: supplier._id,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
    },
    
    // Damaged stock
    {
      supplierId: supplier._id,
      productId: products[19]._id, // Detergent
      type: 'damaged',
      quantity: -10,
      previousStock: 90,
      newStock: 80,
      reference: 'Damage report',
      notes: 'Damaged during transport',
      location: 'Warehouse C2',
      performedBy: supplier._id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    },
    
    // More sales
    {
      supplierId: supplier._id,
      productId: products[6]._id, // Wai Wai
      type: 'sold',
      quantity: -50,
      previousStock: 850,
      newStock: 800,
      reference: 'Spot sale',
      notes: 'Direct sale to Krishna Mini Mart',
      location: 'Warehouse B3',
      performedBy: supplier._id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    
    // Stock correction
    {
      supplierId: supplier._id,
      productId: products[9]._id, // Soap
      type: 'correction',
      quantity: -20,
      previousStock: 420,
      newStock: 400,
      reference: 'Stocktake adjustment',
      notes: 'Correcting inventory after physical count',
      location: 'Warehouse C1',
      performedBy: supplier._id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    },
    {
      supplierId: supplier._id,
      productId: products[19]._id, // Detergent
      type: 'correction',
      quantity: -30,
      previousStock: 80,
      newStock: 50,
      reference: 'Stocktake adjustment',
      notes: 'Inventory correction after expiry check',
      location: 'Warehouse C2',
      performedBy: supplier._id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }
  ];
  
  const createdSupplierInventoryLogs = await SupplierInventoryLog.insertMany(supplierInventoryLogs);
  console.log(`Created ${createdSupplierInventoryLogs.length} supplier inventory logs`);
  return createdSupplierInventoryLogs;
};

// Main seed function
const seedDB = async () => {
  try {
    await connectDB();
    await clearDB();
    
    console.log('🇳🇵 Creating demo data for Nepali small marts...\n');
    
    const savedUsers = await seedUsers();
    const shopOwner = savedUsers.find(u => u.role === 'shopowner');
    const supplier = savedUsers.find(u => u.role === 'supplier');
    
    const categories = await seedCategories(shopOwner);
    const customers = await seedCustomers(shopOwner);
    const products = await seedProducts(shopOwner, supplier);
    const transactions = await seedTransactions(shopOwner, customers, products);
    const autoOrders = await seedAutoOrders(shopOwner, supplier, products);
    
    // Seed the previously missing tables
    const notifications = await seedNotificationLogs(shopOwner, supplier);
    const inventoryLogs = await seedInventoryLogs(shopOwner, products, transactions);
    const orders = await seedOrders(shopOwner, supplier, products);
    const supplierInventories = await seedSupplierInventories(supplier, products);
    const supplierInventoryLogs = await seedSupplierInventoryLogs(supplier, products, orders);
    
    console.log('\n🎉 Database seeded successfully with Nepali mart data!');
    console.log('='.repeat(60));
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('👑 ADMIN ACCESS:');
    console.log('Username: admin | Password: admin123');
    console.log('');
    console.log('🏪 SHOP OWNER ACCESS (Nepali Small Marts):');
    console.log('1. Username: ram_kirana | Password: ram123 | Shop: Ram Kirana Pasal');
    console.log('2. Username: sita_general | Password: sita123 | Shop: Sita General Store');
    console.log('3. Username: hari_grocery | Password: hari123 | Shop: Hari Grocery Corner');
    console.log('4. Username: krishna_mart | Password: krishna123 | Shop: Krishna Mini Mart');
    console.log('5. Username: laxmi_departmental | Password: laxmi123 | Shop: Laxmi Departmental Store');
    console.log('');
    console.log('📦 SUPPLIER ACCESS:');
    console.log('1. Username: ramesh_wholesale | Password: ramesh123 | Company: Adhikari Wholesale Suppliers');
    console.log('2. Username: gopal_distributor | Password: gopal123 | Company: Karki Distribution Network');
    console.log('3. Username: bhim_local | Password: bhim123 | Company: Bahadur Local Suppliers');
    console.log('='.repeat(60));
    console.log('📊 DATA CREATED:');
    console.log(`- ${savedUsers.length} Users (1 admin, 5 shopowners, 3 suppliers)`);
    console.log(`- ${categories.length} Product Categories`);
    console.log(`- ${customers.length} Customers with Nepali names`);
    console.log(`- ${products.length} Daily use products (Rice, Daal, Noodles, Soap, etc.)`);
    console.log(`- ${transactions.length} Sales Transactions`);
    console.log(`- ${autoOrders.length} Auto Orders for low stock`);
    console.log(`- ${notifications.length} Notification logs`);
    console.log(`- ${inventoryLogs.length} Inventory logs`);
    console.log(`- ${orders.length} Orders to suppliers`);
    console.log(`- ${supplierInventories.length} Supplier inventory items`);
    console.log(`- ${supplierInventoryLogs.length} Supplier inventory logs`);
    console.log('='.repeat(60));
    console.log('✅ Your Smart POS System is ready for Nepali small marts!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed script
seedDB();
