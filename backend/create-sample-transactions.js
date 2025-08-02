const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const User = require('./models/User');
const Product = require('./models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-pos-system';

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Helper function to generate receipt number
const generateReceiptNumber = async (shopId) => {
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    
    // Find the last transaction for this shop with today's date prefix
    const lastTransaction = await Transaction.findOne({
        shopId,
        receiptNumber: { $regex: `^${datePrefix}` }
    }).sort({ receiptNumber: -1 });
    
    let sequenceNumber = 1;
    
    if (lastTransaction) {
        // Extract the sequence number from the last receipt and increment
        const lastSequence = parseInt(lastTransaction.receiptNumber.substring(datePrefix.length));
        sequenceNumber = lastSequence + 1;
    }
    
    // Format: YYYYMMDD0001
    return `${datePrefix}${sequenceNumber.toString().padStart(4, '0')}`;
};

async function createSampleTransactions() {
    try {
        console.log('Creating sample transactions...');

        // Find shop owner by email (ram@kirana.com) or any shopowner
        let shopOwner = await User.findOne({ email: 'ram@kirana.com', role: 'shopowner' });
        
        if (!shopOwner) {
            shopOwner = await User.findOne({ username: 'ram_kirana', role: 'shopowner' });
        }
        
        if (!shopOwner) {
            // Fallback: try to find any shopowner
            shopOwner = await User.findOne({ role: 'shopowner' });
        }
        
        if (!shopOwner) {
            console.log('Shop owner not found. Please ensure you have a shopowner user in the database.');
            console.log('Looking for user with email: ram@kirana.com or any user with role: shopowner');
            return;
        }

        console.log('Found shop owner:', {
            username: shopOwner.username,
            name: shopOwner.firstName + ' ' + shopOwner.lastName,
            email: shopOwner.email,
            shopName: shopOwner.shopName
        });

        // Get some products for the transactions
        const products = await Product.find({ shopId: shopOwner._id }).limit(10);
        if (products.length === 0) {
            console.log('No products found. Please create some products first.');
            return;
        }

        console.log(`Found ${products.length} products for transactions`);

        // Delete existing transactions for this shop
        await Transaction.deleteMany({ shopId: shopOwner._id });
        console.log('Cleared existing transactions');

        // Sample transaction data - simple transactions with just products and prices
        const sampleTransactions = [
            {
                items: [
                    {
                        productId: products[0]._id,
                        name: products[0].name,
                        price: products[0].price,
                        quantity: 2,
                        subtotal: products[0].price * 2
                    },
                    {
                        productId: products[1]._id,
                        name: products[1].name,
                        price: products[1].price,
                        quantity: 1,
                        subtotal: products[1].price * 1
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[2]._id,
                        name: products[2].name,
                        price: products[2].price,
                        quantity: 3,
                        subtotal: products[2].price * 3
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[0]._id,
                        name: products[0].name,
                        price: products[0].price,
                        quantity: 1,
                        subtotal: products[0].price * 1
                    },
                    {
                        productId: products[3] ? products[3]._id : products[1]._id,
                        name: products[3] ? products[3].name : products[1].name,
                        price: products[3] ? products[3].price : products[1].price,
                        quantity: 2,
                        subtotal: products[3] ? products[3].price * 2 : products[1].price * 2
                    },
                    {
                        productId: products[4] ? products[4]._id : products[2]._id,
                        name: products[4] ? products[4].name : products[2].name,
                        price: products[4] ? products[4].price : products[2].price,
                        quantity: 1,
                        subtotal: products[4] ? products[4].price * 1 : products[2].price * 1
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[1]._id,
                        name: products[1].name,
                        price: products[1].price,
                        quantity: 4,
                        subtotal: products[1].price * 4
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[2]._id,
                        name: products[2].name,
                        price: products[2].price,
                        quantity: 2,
                        subtotal: products[2].price * 2
                    },
                    {
                        productId: products[5] ? products[5]._id : products[0]._id,
                        name: products[5] ? products[5].name : products[0].name,
                        price: products[5] ? products[5].price : products[0].price,
                        quantity: 1,
                        subtotal: products[5] ? products[5].price * 1 : products[0].price * 1
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[3] ? products[3]._id : products[1]._id,
                        name: products[3] ? products[3].name : products[1].name,
                        price: products[3] ? products[3].price : products[1].price,
                        quantity: 3,
                        subtotal: products[3] ? products[3].price * 3 : products[1].price * 3
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[0]._id,
                        name: products[0].name,
                        price: products[0].price,
                        quantity: 1,
                        subtotal: products[0].price * 1
                    },
                    {
                        productId: products[2]._id,
                        name: products[2].name,
                        price: products[2].price,
                        quantity: 2,
                        subtotal: products[2].price * 2
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[1]._id,
                        name: products[1].name,
                        price: products[1].price,
                        quantity: 2,
                        subtotal: products[1].price * 2
                    },
                    {
                        productId: products[4] ? products[4]._id : products[2]._id,
                        name: products[4] ? products[4].name : products[2].name,
                        price: products[4] ? products[4].price : products[2].price,
                        quantity: 1,
                        subtotal: products[4] ? products[4].price * 1 : products[2].price * 1
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[0]._id,
                        name: products[0].name,
                        price: products[0].price,
                        quantity: 5,
                        subtotal: products[0].price * 5
                    }
                ],
                status: 'completed'
            },
            {
                items: [
                    {
                        productId: products[1]._id,
                        name: products[1].name,
                        price: products[1].price,
                        quantity: 1,
                        subtotal: products[1].price * 1
                    },
                    {
                        productId: products[2]._id,
                        name: products[2].name,
                        price: products[2].price,
                        quantity: 1,
                        subtotal: products[2].price * 1
                    },
                    {
                        productId: products[3] ? products[3]._id : products[0]._id,
                        name: products[3] ? products[3].name : products[0].name,
                        price: products[3] ? products[3].price : products[0].price,
                        quantity: 1,
                        subtotal: products[3] ? products[3].price * 1 : products[0].price * 1
                    }
                ],
                status: 'completed'
            }
        ];

        let transactionCount = 0;

        for (const sampleData of sampleTransactions) {
            // Calculate totals
            const subtotal = sampleData.items.reduce((sum, item) => sum + item.subtotal, 0);
            const total = subtotal; // No tax or additional fees for now
            
            // Generate receipt number
            const receiptNumber = await generateReceiptNumber(shopOwner._id);
            
            // Create different dates (spread over last few days)
            const daysAgo = Math.floor(Math.random() * 7); // 0-6 days ago
            const createdDate = new Date();
            createdDate.setDate(createdDate.getDate() - daysAgo);
            createdDate.setHours(
                8 + Math.floor(Math.random() * 12), // 8 AM to 8 PM
                Math.floor(Math.random() * 60), // Random minutes
                Math.floor(Math.random() * 60)  // Random seconds
            );

            const transactionData = {
                receiptNumber,
                shopId: shopOwner._id,
                cashierId: shopOwner._id,
                cashierName: shopOwner.firstName + ' ' + shopOwner.lastName || 'Shop Staff',
                items: sampleData.items,
                subtotal: subtotal,
                total: total,
                amountPaid: total, // Customer paid exact amount
                change: 0, // No change needed
                payments: [{
                    method: 'cash',
                    amount: total,
                    reference: '',
                    details: {}
                }],
                status: sampleData.status,
                createdAt: createdDate,
                updatedAt: createdDate
            };

            // Create the transaction
            const transaction = new Transaction(transactionData);
            await transaction.save();
            
            console.log(`Created transaction ${receiptNumber} - NPR ${total} (${sampleData.items.length} items)`);
            transactionCount++;
        }

        console.log(`Successfully created ${transactionCount} sample transactions!`);
        
    } catch (error) {
        console.error('Error creating sample transactions:', error);
    }
}

async function main() {
    await connectDB();
    await createSampleTransactions();
    await mongoose.connection.close();
    console.log('Database connection closed.');
}

if (require.main === module) {
    main();
}

module.exports = { createSampleTransactions };
