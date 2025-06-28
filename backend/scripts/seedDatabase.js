#!/usr/bin/env node

/**
 * Manual Database Seeding Script
 * Run this script to manually seed the database
 * Usage: node scripts/seedDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const seedDatabase = require('../utils/seedDatabase');

async function runSeeding() {
  try {
    console.log('🚀 Manual database seeding started...');
    
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not defined!');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Run seeding
    await seedDatabase();
    
    console.log('🎉 Manual seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during manual seeding:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding process
runSeeding();
