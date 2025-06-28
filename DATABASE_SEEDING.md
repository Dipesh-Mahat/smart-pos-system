# Database Seeding Guide

This guide explains how to seed your Smart POS System database with initial data.

## Methods

### 1. Automatic Seeding on Render (Recommended for Production)

The application automatically seeds the database when deployed on Render if the environment variable is set.

**Setup on Render:**
1. Go to your Render dashboard
2. Select your backend service
3. Go to Environment Variables
4. Add: `SEED_DATABASE` = `true`
5. Redeploy your service

The database will be automatically seeded when the app starts, but only if it's empty.

### 2. Manual Seeding (Local Development)

For local development, you can manually run the seeding script.

```bash
# Navigate to backend directory
cd backend

# Install dependencies if not already installed
npm install

# Run the seeding script
npm run seed
```

### 3. One-time Manual Seeding on Production

If you need to manually seed on production (not recommended), you can:

1. Set environment variables locally with your production MongoDB URI
2. Run: `npm run seed`

## Environment Variables Required

```env
MONGODB_URI=your_mongodb_atlas_connection_string
SEED_DATABASE=true  # Only for automatic seeding
```

## What Gets Seeded

The seeding process creates:

1. **Users:**
   - 1 Admin user
   - 2 Shop owners with different shops
   - 1 Supplier

2. **Categories:**
   - Electronics
   - Clothing  
   - Home & Garden
   (Created for each shop)

3. **Products:**
   - Sample products in each category
   - Proper inventory levels
   - Supplier relationships

4. **Customers:**
   - Regular and VIP customers
   - Purchase history and loyalty points

5. **Settings:**
   - Default shop settings
   - Currency and tax configuration
   - POS system preferences

## Default Login Credentials

After seeding, you can login with:

**Admin:**
- Username: `admin`
- Email: `admin@smartpos.com`
- Password: `Admin123!`

**Shop Owner 1:**
- Username: `shopowner1`
- Email: `shop1@example.com`
- Password: `Shop123!`
- Shop: John's Electronics Store

**Shop Owner 2:**
- Username: `shopowner2`
- Email: `shop2@example.com`  
- Password: `Shop123!`
- Shop: Jane's Fashion Boutique

**Supplier:**
- Username: `supplier1`
- Email: `supplier1@example.com`
- Password: `Supplier123!`
- Company: Electronics Wholesale Co.

## Important Notes

- Seeding only runs if the database is empty (no existing users/products)
- All passwords are hashed with bcrypt
- Sample data includes proper relationships between entities
- Seeding is idempotent - safe to run multiple times
- In production, seeding happens automatically only once

## Troubleshooting

If seeding fails:
1. Check MongoDB connection
2. Verify environment variables
3. Check server logs for specific errors
4. Ensure database permissions allow writes

For manual seeding issues:
```bash
# Check if script can connect to database
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"

# Run seeding with verbose output
DEBUG=* npm run seed
```
