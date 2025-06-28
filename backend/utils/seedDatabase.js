const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Expense = require('../models/Expense');
const Settings = require('../models/Settings');

// Check if database is already seeded
async function isDatabaseSeeded() {
  try {
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    return userCount > 0 && productCount > 0;
  } catch (error) {
    console.error('Error checking if database is seeded:', error);
    return false;
  }
}

// Seed Users
async function seedUsers() {
  try {
    console.log('Seeding users...');
    
    const users = [
      {
        username: 'admin',
        email: 'admin@smartpos.com',
        password: 'Admin123!',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator'
      },
      {
        username: 'shopowner1',
        email: 'ram.sharma@example.com',
        password: 'Shop123!',
        role: 'shopowner',
        firstName: 'Ram Bahadur',
        lastName: 'Sharma',
        shopName: 'Sharma General Store',
        contactNumber: '+977-9841234567',
        address: {
          street: 'Thamel Chowk',
          city: 'Kathmandu',
          state: 'Bagmati',
          postalCode: '44600',
          country: 'Nepal'
        }
      },
      {
        username: 'shopowner2',
        email: 'sita.gurung@example.com',
        password: 'Shop123!',
        role: 'shopowner',
        firstName: 'Sita',
        lastName: 'Gurung',
        shopName: 'Gurung Mart & Grocery',
        contactNumber: '+977-9851234567',
        address: {
          street: 'Lakeside Road',
          city: 'Pokhara',
          state: 'Gandaki',
          postalCode: '33700',
          country: 'Nepal'
        }
      },
      {
        username: 'supplier1',
        email: 'krishna.supplier@example.com',
        password: 'Supplier123!',
        role: 'supplier',
        firstName: 'Krishna Prasad',
        lastName: 'Adhikari',
        shopName: 'Adhikari Wholesale Suppliers',
        contactNumber: '+977-9861234567',
        address: {
          street: 'Bhaisepati Industrial Area',
          city: 'Lalitpur',
          state: 'Bagmati',
          postalCode: '44700',
          country: 'Nepal'
        }
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const existingUser = await User.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });
      
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`Created user: ${user.username} (${user.role})`);
      } else {
        createdUsers.push(existingUser);
        console.log(`User already exists: ${existingUser.username}`);
      }
    }

    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

// Seed Categories
async function seedCategories(users) {
  try {
    console.log('Seeding categories...');
    
    const shopOwners = users.filter(user => user.role === 'shopowner');
    const categories = [];

    for (const shopOwner of shopOwners) {
      const shopCategories = [
        {
          name: 'Groceries',
          description: 'Essential food items and daily necessities',
          shopId: shopOwner._id,
          isActive: true,
          sortOrder: 1,
          metadata: {
            taxRate: 13, // VAT in Nepal
            commissionRate: 5
          }
        },
        {
          name: 'Beverages',
          description: 'Drinks, tea, coffee, and refreshments',
          shopId: shopOwner._id,
          isActive: true,
          sortOrder: 2,
          metadata: {
            taxRate: 13,
            commissionRate: 8
          }
        },
        {
          name: 'Snacks & Confectionery',
          description: 'Biscuits, chips, chocolates, and snack items',
          shopId: shopOwner._id,
          isActive: true,
          sortOrder: 3,
          metadata: {
            taxRate: 13,
            commissionRate: 6
          }
        },
        {
          name: 'Personal Care',
          description: 'Soaps, shampoos, toothpaste, and hygiene products',
          shopId: shopOwner._id,
          isActive: true,
          sortOrder: 4,
          metadata: {
            taxRate: 13,
            commissionRate: 7
          }
        },
        {
          name: 'Household Items',
          description: 'Cleaning supplies, detergents, and home essentials',
          shopId: shopOwner._id,
          isActive: true,
          sortOrder: 5,
          metadata: {
            taxRate: 13,
            commissionRate: 6
          }
        },
        {
          name: 'Dairy Products',
          description: 'Milk, yogurt, cheese, and dairy items',
          shopId: shopOwner._id,
          isActive: true,
          sortOrder: 6,
          metadata: {
            taxRate: 13,
            commissionRate: 4
          }
        }
      ];

      for (const categoryData of shopCategories) {
        const existingCategory = await Category.findOne({ 
          name: categoryData.name, 
          shopId: categoryData.shopId 
        });
        
        if (!existingCategory) {
          const category = new Category(categoryData);
          await category.save();
          categories.push(category);
          console.log(`Created category: ${category.name} for ${shopOwner.shopName}`);
        } else {
          categories.push(existingCategory);
        }
      }
    }

    return categories;
  } catch (error) {
    console.error('Error seeding categories:', error);
    throw error;
  }
}

// Seed Products
async function seedProducts(users, categories) {
  try {
    console.log('Seeding products...');
    
    const shopOwners = users.filter(user => user.role === 'shopowner');
    const suppliers = users.filter(user => user.role === 'supplier');
    const products = [];

    for (const shopOwner of shopOwners) {
      const shopCategories = categories.filter(cat => cat.shopId.toString() === shopOwner._id.toString());
      
      const productData = [
        {
          name: 'Basmati Rice (5kg)',
          description: 'Premium quality Basmati rice from India',
          sku: 'RICE-BASMATI-5KG',
          category: shopCategories.find(cat => cat.name === 'Groceries')?._id,
          price: 850,
          costPrice: 700,
          stock: 50,
          minStockLevel: 10,
          maxStockLevel: 200,
          shopId: shopOwner._id,
          supplierId: suppliers[0]?._id,
          isActive: true,
          tags: ['rice', 'basmati', 'grain', 'staple'],
          specifications: {
            brand: 'Himalayan Gold',
            weight: '5kg',
            origin: 'India',
            type: 'Long Grain'
          }
        },
        {
          name: 'Nepali Tea (250g)',
          description: 'Fresh Nepali black tea leaves',
          sku: 'TEA-NEPALI-250G',
          category: shopCategories.find(cat => cat.name === 'Beverages')?._id,
          price: 180,
          costPrice: 120,
          stock: 75,
          minStockLevel: 15,
          maxStockLevel: 150,
          shopId: shopOwner._id,
          supplierId: suppliers[0]?._id,
          isActive: true,
          tags: ['tea', 'nepali', 'black tea', 'organic'],
          specifications: {
            brand: 'Ilam Tea',
            weight: '250g',
            origin: 'Nepal',
            type: 'Black Tea'
          }
        },
        {
          name: 'Wai Wai Noodles',
          description: 'Popular instant noodles - chicken flavor',
          sku: 'NOODLES-WAIWAI-CHICKEN',
          category: shopCategories.find(cat => cat.name === 'Snacks & Confectionery')?._id,
          price: 30,
          costPrice: 22,
          stock: 200,
          minStockLevel: 50,
          maxStockLevel: 500,
          shopId: shopOwner._id,
          supplierId: suppliers[0]?._id,
          isActive: true,
          tags: ['noodles', 'instant', 'waiwai', 'chicken'],
          specifications: {
            brand: 'Wai Wai',
            flavor: 'Chicken',
            weight: '75g',
            type: 'Instant Noodles'
          }
        },
        {
          name: 'Lux Soap (100g)',
          description: 'Premium beauty soap with rose fragrance',
          sku: 'SOAP-LUX-ROSE-100G',
          category: shopCategories.find(cat => cat.name === 'Personal Care')?._id,
          price: 45,
          costPrice: 35,
          stock: 80,
          minStockLevel: 20,
          maxStockLevel: 200,
          shopId: shopOwner._id,
          supplierId: suppliers[0]?._id,
          isActive: true,
          tags: ['soap', 'lux', 'beauty', 'rose'],
          specifications: {
            brand: 'Lux',
            fragrance: 'Rose',
            weight: '100g',
            type: 'Beauty Soap'
          }
        },
        {
          name: 'Teer Detergent (1kg)',
          description: 'Powerful washing powder for clean clothes',
          sku: 'DETERGENT-TEER-1KG',
          category: shopCategories.find(cat => cat.name === 'Household Items')?._id,
          price: 280,
          costPrice: 220,
          stock: 60,
          minStockLevel: 15,
          maxStockLevel: 120,
          shopId: shopOwner._id,
          supplierId: suppliers[0]?._id,
          isActive: true,
          tags: ['detergent', 'teer', 'washing powder', 'cleaning'],
          specifications: {
            brand: 'Teer',
            weight: '1kg',
            type: 'Washing Powder',
            usage: 'Laundry'
          }
        },
        {
          name: 'DDC Milk (1 Liter)',
          description: 'Fresh pasteurized milk from DDC',
          sku: 'MILK-DDC-1L',
          category: shopCategories.find(cat => cat.name === 'Dairy Products')?._id,
          price: 85,
          costPrice: 70,
          stock: 40,
          minStockLevel: 10,
          maxStockLevel: 80,
          shopId: shopOwner._id,
          supplierId: suppliers[0]?._id,
          isActive: true,
          tags: ['milk', 'ddc', 'dairy', 'fresh'],
          specifications: {
            brand: 'DDC',
            volume: '1 Liter',
            type: 'Pasteurized Milk',
            fatContent: '3.5%'
          }
        },
        {
          name: 'Masala Dal (1kg)',
          description: 'Mixed lentils with traditional Nepali spices',
          sku: 'DAL-MASALA-1KG',
          category: shopCategories.find(cat => cat.name === 'Groceries')?._id,
          price: 160,
          costPrice: 130,
          stock: 90,
          minStockLevel: 20,
          maxStockLevel: 180,
          shopId: shopOwner._id,
          supplierId: suppliers[0]?._id,
          isActive: true,
          tags: ['dal', 'lentils', 'masala', 'protein'],
          specifications: {
            brand: 'Local',
            weight: '1kg',
            type: 'Mixed Lentils',
            origin: 'Nepal'
          }
        },
        {
          name: 'Khukri Rum (375ml)',
          description: 'Premium Nepali rum - aged blend',
          sku: 'RUM-KHUKRI-375ML',
          category: shopCategories.find(cat => cat.name === 'Beverages')?._id,
          price: 980,
          costPrice: 800,
          stock: 25,
          minStockLevel: 5,
          maxStockLevel: 50,
          shopId: shopOwner._id,
          supplierId: suppliers[0]?._id,
          isActive: true,
          tags: ['rum', 'khukri', 'alcohol', 'nepali'],
          specifications: {
            brand: 'Khukri',
            volume: '375ml',
            alcoholContent: '42.8%',
            type: 'Aged Rum'
          }
        }
      ];

      for (const product of productData) {
        if (product.category) { // Only create if category exists
          const existingProduct = await Product.findOne({ 
            sku: product.sku, 
            shopId: product.shopId 
          });
          
          if (!existingProduct) {
            const newProduct = new Product(product);
            await newProduct.save();
            products.push(newProduct);
            console.log(`Created product: ${newProduct.name} for ${shopOwner.shopName}`);
          } else {
            products.push(existingProduct);
          }
        }
      }
    }

    return products;
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
}

// Seed Customers
async function seedCustomers(users) {
  try {
    console.log('Seeding customers...');
    
    const shopOwners = users.filter(user => user.role === 'shopowner');
    const customers = [];

    for (const shopOwner of shopOwners) {
      const customerData = [
        {
          shopId: shopOwner._id,
          name: 'Maya Tamang',
          email: 'maya.tamang@example.com',
          phone: '+977-9841111111',
          address: {
            street: 'Boudha Stupa Area',
            city: 'Kathmandu',
            state: 'Bagmati',
            postalCode: '44600',
            country: 'Nepal'
          },
          type: 'regular',
          loyaltyPoints: 150,
          totalSpent: 12500,
          totalOrders: 8
        },
        {
          shopId: shopOwner._id,
          name: 'Suresh Rai',
          email: 'suresh.rai@example.com',
          phone: '+977-9842222222',
          address: {
            street: 'Patan Durbar Square',
            city: 'Lalitpur',
            state: 'Bagmati',
            postalCode: '44700',
            country: 'Nepal'
          },
          type: 'vip',
          loyaltyPoints: 500,
          totalSpent: 45000,
          totalOrders: 15
        },
        {
          shopId: shopOwner._id,
          name: 'Binita Shrestha',
          email: 'binita.shrestha@example.com',
          phone: '+977-9843333333',
          address: {
            street: 'Newroad Commercial Area',
            city: 'Kathmandu',
            state: 'Bagmati',
            postalCode: '44600',
            country: 'Nepal'
          },
          type: 'regular',
          loyaltyPoints: 80,
          totalSpent: 8500,
          totalOrders: 5
        },
        {
          shopId: shopOwner._id,
          name: 'Dipak Thapa',
          email: 'dipak.thapa@example.com',
          phone: '+977-9844444444',
          address: {
            street: 'Durbarmarg Shopping District',
            city: 'Kathmandu',
            state: 'Bagmati',
            postalCode: '44600',
            country: 'Nepal'
          },
          type: 'premium',
          loyaltyPoints: 750,
          totalSpent: 65000,
          totalOrders: 22
        }
      ];

      for (const customer of customerData) {
        const existingCustomer = await Customer.findOne({ 
          email: customer.email, 
          shopId: customer.shopId 
        });
        
        if (!existingCustomer) {
          const newCustomer = new Customer(customer);
          await newCustomer.save();
          customers.push(newCustomer);
          console.log(`Created customer: ${newCustomer.name} for ${shopOwner.shopName}`);
        } else {
          customers.push(existingCustomer);
        }
      }
    }

    return customers;
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

// Seed Settings
async function seedSettings(users) {
  try {
    console.log('Seeding settings...');
    
    const shopOwners = users.filter(user => user.role === 'shopowner');

    for (const shopOwner of shopOwners) {
      const existingSettings = await Settings.findOne({ shopId: shopOwner._id });
      
      if (!existingSettings) {
        const settings = new Settings({
          shopId: shopOwner._id,
          business: {
            name: shopOwner.shopName,
            address: shopOwner.address,
            phone: shopOwner.contactNumber,
            email: shopOwner.email
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
            displayOnReceipts: true
          },
          inventory: {
            trackStock: true,
            allowNegativeStock: false,
            lowStockThreshold: 10,
            autoReorder: false
          },
          pos: {
            requireCustomerForSale: false,
            allowDiscounts: true,
            maxDiscount: 50,
            printReceiptAutomatically: true,
            showProductImages: true
          }
        });

        await settings.save();
        console.log(`Created settings for ${shopOwner.shopName}`);
      }
    }
  } catch (error) {
    console.error('Error seeding settings:', error);
    throw error;
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding process...');
    
    // Check if database is already seeded
    if (await isDatabaseSeeded()) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }

    // Seed data in order (maintaining relationships)
    const users = await seedUsers();
    const categories = await seedCategories(users);
    const products = await seedProducts(users, categories);
    const customers = await seedCustomers(users);
    await seedSettings(users);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`Created ${users.length} users, ${categories.length} categories, ${products.length} products, ${customers.length} customers`);
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

module.exports = seedDatabase;
