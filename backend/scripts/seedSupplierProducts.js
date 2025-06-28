const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-pos')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedSupplierProducts() {
  try {
    // Find some suppliers
    const suppliers = await User.find({ role: 'supplier', status: 'approved' }).limit(3);
    
    if (suppliers.length === 0) {
      console.log('No approved suppliers found. Creating sample suppliers...');
      
      // Create sample suppliers
      const sampleSuppliers = [
        {
          username: 'kathmandu_kirana',
          email: 'info@kathmandukirana.com.np',
          password: 'password123',
          firstName: 'Kathmandu',
          lastName: 'Kirana',
          shopName: 'Kathmandu Kirana Suppliers',
          role: 'supplier',
          status: 'approved',
          contactNumber: '+977 1-5551234',
          address: {
            city: 'Kathmandu',
            state: 'Bagmati',
            country: 'Nepal'
          }
        },
        {
          username: 'patan_beverages',
          email: 'contact@patanbeverages.com.np',
          password: 'password123',
          firstName: 'Patan',
          lastName: 'Beverages',
          shopName: 'Patan Beverages Ltd',
          role: 'supplier',
          status: 'approved',
          contactNumber: '+977 1-5522334',
          address: {
            city: 'Patan',
            state: 'Bagmati',
            country: 'Nepal'
          }
        },
        {
          username: 'bhatbhateni_dist',
          email: 'sales@bbmart.com.np',
          password: 'password123',
          firstName: 'Bhat-Bhateni',
          lastName: 'Distributors',
          shopName: 'Bhat-Bhateni Mart Distributors',
          role: 'supplier',
          status: 'approved',
          contactNumber: '+977 1-4431234',
          address: {
            city: 'Kathmandu',
            state: 'Bagmati',
            country: 'Nepal'
          }
        }
      ];
      
      for (const supplierData of sampleSuppliers) {
        const supplier = new User(supplierData);
        await supplier.save();
        suppliers.push(supplier);
      }
      console.log('Created sample suppliers');
    }

    // Create sample products for each supplier
    const sampleProducts = [
      // Kathmandu Kirana Products
      {
        name: 'Basmati Rice Premium',
        description: 'High quality basmati rice imported from India',
        category: 'Grains & Rice',
        price: 180,
        costPrice: 150,
        stock: 500,
        minStockLevel: 50,
        unit: 'kg',
        barcode: 'KK001',
        isActive: true
      },
      {
        name: 'Dal (Lentils) Mixed',
        description: 'Mixed lentils for daily cooking',
        category: 'Pulses',
        price: 120,
        costPrice: 100,
        stock: 300,
        minStockLevel: 30,
        unit: 'kg',
        barcode: 'KK002',
        isActive: true
      },
      {
        name: 'Mustard Oil Pure',
        description: 'Pure mustard oil for cooking',
        category: 'Cooking Oil',
        price: 220,
        costPrice: 180,
        stock: 200,
        minStockLevel: 20,
        unit: 'liter',
        barcode: 'KK003',
        isActive: true
      },
      {
        name: 'Tea Leaves Premium',
        description: 'Premium Nepali tea leaves',
        category: 'Beverages',
        price: 350,
        costPrice: 280,
        stock: 150,
        minStockLevel: 15,
        unit: 'kg',
        barcode: 'KK004',
        isActive: true
      },
      
      // Patan Beverages Products
      {
        name: 'Coca Cola 1L',
        description: 'Coca Cola soft drink 1 liter bottle',
        category: 'Soft Drinks',
        price: 80,
        costPrice: 65,
        stock: 1000,
        minStockLevel: 100,
        unit: 'piece',
        barcode: 'PB001',
        isActive: true
      },
      {
        name: 'Sprite 1L',
        description: 'Sprite lemon soft drink 1 liter bottle',
        category: 'Soft Drinks',
        price: 80,
        costPrice: 65,
        stock: 800,
        minStockLevel: 100,
        unit: 'piece',
        barcode: 'PB002',
        isActive: true
      },
      {
        name: 'Mineral Water 1L',
        description: 'Pure mineral water 1 liter bottle',
        category: 'Water',
        price: 25,
        costPrice: 18,
        stock: 2000,
        minStockLevel: 200,
        unit: 'piece',
        barcode: 'PB003',
        isActive: true
      },
      {
        name: 'Energy Drink Red Bull',
        description: 'Red Bull energy drink 250ml can',
        category: 'Energy Drinks',
        price: 150,
        costPrice: 120,
        stock: 500,
        minStockLevel: 50,
        unit: 'piece',
        barcode: 'PB004',
        isActive: true
      },
      
      // Bhat-Bhateni Products
      {
        name: 'Instant Noodles Wai Wai',
        description: 'Popular instant noodles pack',
        category: 'Instant Food',
        price: 25,
        costPrice: 18,
        stock: 1500,
        minStockLevel: 150,
        unit: 'piece',
        barcode: 'BB001',
        isActive: true
      },
      {
        name: 'Biscuits Parle-G',
        description: 'Glucose biscuits family pack',
        category: 'Snacks',
        price: 45,
        costPrice: 35,
        stock: 800,
        minStockLevel: 80,
        unit: 'pack',
        barcode: 'BB002',
        isActive: true
      },
      {
        name: 'Soap Dettol',
        description: 'Antibacterial soap bar',
        category: 'Personal Care',
        price: 55,
        costPrice: 40,
        stock: 600,
        minStockLevel: 60,
        unit: 'piece',
        barcode: 'BB003',
        isActive: true
      },
      {
        name: 'Detergent Powder Surf',
        description: 'Washing powder for clothes',
        category: 'Household',
        price: 120,
        costPrice: 95,
        stock: 400,
        minStockLevel: 40,
        unit: 'kg',
        barcode: 'BB004',
        isActive: true
      }
    ];

    // Assign products to suppliers
    const productsPerSupplier = 4;
    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i];
      const supplierProducts = sampleProducts.slice(i * productsPerSupplier, (i + 1) * productsPerSupplier);
      
      for (const productData of supplierProducts) {
        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          barcode: productData.barcode,
          shopId: supplier._id 
        });
        
        if (!existingProduct) {
          const product = new Product({
            ...productData,
            shopId: supplier._id,
            supplierInfo: {
              supplierId: supplier._id,
              supplierName: supplier.shopName || `${supplier.firstName} ${supplier.lastName}`,
              supplierCode: productData.barcode
            }
          });
          
          await product.save();
          console.log(`Created product: ${product.name} for supplier: ${supplier.shopName}`);
        } else {
          console.log(`Product ${productData.name} already exists for supplier ${supplier.shopName}`);
        }
      }
    }

    console.log('Supplier products seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding supplier products:', error);
    process.exit(1);
  }
}

seedSupplierProducts();
