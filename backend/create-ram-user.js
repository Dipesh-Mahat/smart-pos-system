const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-pos-system';

async function createRamUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        // Delete existing user if any
        await User.deleteOne({ email: 'ram@kirana.com' });

        // Create the exact user from your database
        const userData = {
            username: "ram_kirana",
            email: "ram@kirana.com",
            password: "$2b$10$UxgCi3f1.f78H.z54y444uBs3KyqGFj05MrCiCe6pFF2pBSxJRfWy", // This is the hashed password
            role: "shopowner",
            firstName: "Ram Bahadur",
            lastName: "Shrestha",
            shopName: "Ram Kirana Pasal",
            profilePicture: "/images/avatars/user-avatar.png",
            contactDetails: {},
            businessDetails: {},
            billingAddress: {},
            businessSettings: {},
            notificationPreferences: {},
            failedLoginAttempts: 0,
            preferences: {},
            securitySettings: {},
            privacySettings: {},
            status: "active",
            productCategories: [],
            createdAt: new Date('2024-01-05T00:00:00.000Z'),
            lastPasswordChange: new Date('2025-08-02T05:33:13.016Z'),
            integrations: [],
            activeSessions: [],
            updatedAt: new Date('2025-08-02T05:33:13.482Z')
        };

        const user = new User(userData);
        await user.save();

        console.log('✅ Ram Bahadur Shrestha user created successfully!');
        console.log('User details:', {
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            shopName: user.shopName
        });

        await mongoose.disconnect();
        console.log('Database connection closed.');
        
    } catch (error) {
        console.error('Error creating user:', error);
        await mongoose.disconnect();
    }
}

createRamUser();
