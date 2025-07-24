# Smart POS Bill Generator Usage Guide

This document provides instructions for integrating and using the Smart POS Bill Generator in your project.

## Overview

The Smart POS Bill Generator is a flexible tool designed for generating standardized bills for supplier-shop owner transactions. It supports:

- Digital bill generation with standardized layout
- Print-ready formatting with receipt info
- Save to PDF functionality (requires html2pdf.js)
- Email sharing options
- Bill preview interface
- Tax and discount calculations
- Integration with supplier order system

## Integration

### 1. Include Required Libraries

Add the following libraries to your HTML:

```html
<!-- Required for PDF generation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<!-- Required for QR code generation -->
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>

<!-- Smart POS Bill Generator -->
<script src="path/to/bill-generator.js"></script>
```

### 2. Initialize the Bill Generator

```javascript
// Create bill generator instance with options
const billGenerator = new SmartPOSBillGenerator({
    companyName: "Your Store Name",
    currency: "NPR",
    enablePDF: true,
    enableQRCode: true,
    // Optional logo URL
    companyLogo: "/path/to/logo.png"
});
```

### 3. Prepare Bill Data

```javascript
// Prepare bill data structure
const billData = {
    // Bill identification
    billNo: "INV-2025-12345", // Optional, will be auto-generated if not provided
    date: new Date(), // Today's date is used if not provided
    
    // Supplier information
    supplier: {
        name: "Supplier Company Name",
        contact: "98XXXXXXXX",
        email: "supplier@example.com",
        address: "Supplier Address"
    },
    
    // Customer information
    customer: {
        name: "Customer Business Name",
        contact: "98XXXXXXXX",
        email: "customer@example.com",
        address: "Customer Address"
    },
    
    // Items in the bill
    items: [
        {
            name: "Product Name",
            quantity: 10,
            unit: "pcs", // pieces, boxes, kg, etc.
            barcode: "12345678", // Optional
            cost: 100.00, // Cost price
            sell: 120.00 // Selling price
        }
        // Add more items as needed
    ],
    
    // Discount and tax information
    discount: 5,
    discountType: 'percentage', // 'percentage' or 'fixed'
    tax: 13,
    taxType: 'percentage', // 'percentage' or 'fixed'
    
    // No payment information as per requirements
    
    // No GST/PAN information or notes as per requirements
};
```

### 4. Generate and Display the Bill

```javascript
// Create bill from data
billGenerator.createBill(billData);

// Show bill preview in a container
const containerElement = document.getElementById('billContainer');
billGenerator.showPreview(containerElement);
```

## Available Options

When initializing the `SmartPOSBillGenerator`, you can customize the following options:

```javascript
const options = {
    // Currency symbol
    currency: 'NPR',
    
    // Date format
    dateFormat: 'YYYY-MM-DD',
    
    // Show digital watermark
    showDigitalWatermark: true,
    
    // Enable/disable features
    enablePrinting: true,
    enablePDF: true,
    enableEmail: true,
    
    // Company information
    companyLogo: 'path/to/logo.png', // URL to logo image
    companyName: 'Smart POS System',
    
    // Print settings
    printOptions: {
        paperSize: 'a4',
        orientation: 'portrait',
        margins: {
            top: '1cm',
            bottom: '1cm',
            left: '1cm',
            right: '1cm'
        }
    }
};
```

## API Reference

### Methods

#### `createBill(data)`
Creates a bill from the provided data structure.

#### `generateBillHTML(forPrinting = false)`
Generates an HTML representation of the bill.

#### `showPreview(container)`
Shows the bill in a modal preview with action buttons.

#### `printBill()`
Opens a print dialog to print the bill.

#### `savePDF()`
Saves the bill as a PDF file.

#### `emailBill()`
Opens the user's email client with the bill information.

## Styling

The bill generator includes its own styling, but you can customize the appearance by adding your own CSS classes or by modifying the generated HTML after creation.

## Example Implementation

See the complete examples in:
- Basic usage: `frontend/public/pages/bill-generator-test.html`
- Supplier integration: `frontend/public/pages/supplier-bill-demo.html`

## Integration with Supplier Order System

The Smart POS Bill Generator includes a dedicated integration module for connecting with the supplier order system.

### Including the Integration Module

```html
<script src="../js/bill-generator.js"></script>
<script src="../js/supplier-bill-integration.js"></script>
```

### Using the Integration Module

```javascript
// Initialize the integration module
const billIntegration = new SupplierBillIntegration();

// Generate bill from order
billIntegration.generateBillFromOrder(orderData, containerElement);

// Add generate bill button to order UI
billIntegration.setupGenerateBillButton('ORDER_ID', '#container-selector');
```

### Converting Order Data to Bill Format

The integration module automatically converts order data from the backend API format to the bill format:

```javascript
// Order data from API
const orderData = {
    orderNumber: 'ORD-2025-001',
    orderDate: '2025-07-22',
    items: [...],
    subtotal: 10000,
    tax: 1300,
    // ...other order properties
};

// Automatically converted to bill format
const billData = billIntegration.convertOrderToBillFormat(orderData);
```

### Event-Driven Bill Generation

The integration module supports event-driven bill generation:

```javascript
// Trigger bill generation when an order is placed
document.dispatchEvent(new CustomEvent('order-placed', {
    detail: {
        order: orderData,
        containerSelector: '#bill-container'
    }
}));

// Trigger bill generation when an order is delivered
document.dispatchEvent(new CustomEvent('order-delivered', {
    detail: {
        order: orderData,
        containerSelector: '#bill-container'
    }
}));
```

## Troubleshooting

1. **PDF Export Not Working**
   - Make sure you've included the html2pdf.js library
   - Check the console for any JavaScript errors

<!-- Removed QR Code troubleshooting as per requirements -->
   
3. **Print Layout Issues**
   - Adjust the printOptions margins in the constructor options
   - Use the forPrinting parameter when generating HTML

## Support

For any issues or questions, please refer to the project documentation or contact the development team.
