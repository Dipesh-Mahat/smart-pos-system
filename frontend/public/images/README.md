# Smart POS System - Image Assets

This directory contains all image assets for the Smart POS System, organized into logical folders for better maintainability.

## Folder Structure

### 📁 **avatars/**
User profile and testimonial avatar images
- `user-avatar.png` - Default user profile picture
- `testimonial-avatar-1.png` - Customer testimonial avatar (Robert Johnson)
- `testimonial-avatar-2.png` - Customer testimonial avatar (Michael Chang)  
- `testimonial-avatar-3.png` - Customer testimonial avatar (Thomas Parker)

### 📁 **icons/**
UI icons and functional graphics
- `barcode-icon.png` - Inventory/barcode scanning icon
- `counter-icon.png` - Transaction counter icon
- `currency-icon.png` - Finance/currency icon
- `document-icon.png` - Reports/documentation icon
- `export-data.png` - Data export functionality icon

### 📁 **logos/**
Brand logos and main branding assets
- `smart-pos-logo.png` - Main Smart POS system logo

### 📁 **screenshots/**
Application screenshots and preview images
- `dashboard-preview.png` - Dashboard preview image
- `pos-dashboard-devices.png` - Multi-device dashboard showcase
- `pos-store-usage.png` - Store environment usage showcase

## Image Naming Convention

- Use kebab-case (lowercase with hyphens)
- Be descriptive about the image purpose
- Include the image type when relevant (icon, avatar, logo, etc.)
- Avoid spaces, special characters, and generic names

## Usage Guidelines

When referencing images in HTML/CSS/JS files:
- Use relative paths from the images directory
- Include appropriate alt text for accessibility
- Organize by folder: `images/[folder]/[filename].png`

Examples:
```html
<img src="images/logos/smart-pos-logo.png" alt="Smart POS Logo">
<img src="images/icons/barcode-icon.png" alt="Inventory">
<img src="images/avatars/user-avatar.png" alt="User Profile">
```

## Last Updated
June 8, 2025 - Initial organization and cleanup
