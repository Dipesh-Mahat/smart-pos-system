# Smart POS Bill Format Specification

## Overview
The Smart POS system uses a standardized bill format for OCR scanning. This format ensures accurate extraction of product information from supplier bills and invoices.

## Bill Format Layout

### Header Section
```
SMART POS SUPPLIER BILL
========================================
Bill No: SP-2024-001234
Date: 2024-07-05
Supplier: ABC Wholesale Suppliers Ltd.
Contact: +977-9841234567
Email: sales@abcwholesale.com.np
========================================
```

### Items Section Format
Each item should be formatted as follows:
```
SN | PRODUCT NAME                    | QTY | UNIT | BARCODE       | COST  | SELL
01 | Coca Cola 500ml                 | 24  | pcs  | 9843201234567 | 15.50 | 25.00
02 | Dairy Milk Chocolate 65g        | 30  | pcs  | 9843201234568 | 22.00 | 33.00
03 | Potato Chips Original 50g       | 18  | pcs  | 9843201234571 | 14.75 | 21.90
```

### Footer Section
```
========================================
SUMMARY:
Total Items: 3
Total Quantity: 72 pcs
Total Cost: NPR 1,584.50
Total Selling: NPR 2,388.00
Profit Margin: NPR 803.50 (50.7%)
========================================
Received By: ________________
Date: ________________
Signature: ________________
```

## Field Specifications

### Product Fields
- **SN**: Serial number (01-99)
- **PRODUCT NAME**: Product name (max 30 characters)
- **QTY**: Quantity (numeric)
- **UNIT**: Unit of measurement (pcs, kg, ltr, etc.)
- **BARCODE**: Product barcode (10-13 digits)
- **COST**: Cost price per unit (NPR format: XX.XX)
- **SELL**: Selling price per unit (NPR format: XX.XX)

### Data Types
- Numbers: Use standard decimal format (15.50)
- Currency: NPR prefix for totals, no prefix for unit prices
- Barcodes: Numeric only, 10-13 digits
- Text: Plain text, no special characters in product names

## OCR Recognition Patterns

### Regex Patterns Used
```javascript
// Header pattern
const billNoPattern = /Bill No:\s*([A-Z0-9-]+)/i;
const datePattern = /Date:\s*(\d{4}-\d{2}-\d{2})/;
const supplierPattern = /Supplier:\s*(.+)/;

// Item line pattern
const itemPattern = /^(\d{1,2})\s*\|\s*(.{1,30})\s*\|\s*(\d+)\s*\|\s*(\w+)\s*\|\s*(\d{10,13})\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)$/;

// Total pattern
const totalPattern = /Total Cost:\s*NPR\s*([\d,]+\.?\d*)/;
```

### Formatting Guidelines
1. Use consistent spacing and alignment
2. Separate sections with equal signs (=)
3. Use pipe (|) characters to separate item columns
4. Keep product names under 30 characters
5. Use consistent decimal places (2 digits after decimal)

## Smart POS Categories
The system will auto-categorize products based on name keywords:

### Category Mapping
- **Beverages**: Cola, Juice, Water, Tea, Coffee, Soft Drink
- **Chocolates**: Chocolate, Candy, Sweet, Gum
- **Snacks**: Chips, Biscuit, Wafer, Nuts, Crackers
- **Dairy**: Milk, Yogurt, Cheese, Butter, Cream
- **Personal Care**: Soap, Shampoo, Toothpaste, Lotion
- **Household**: Detergent, Cleaner, Tissue, Paper
- **Frozen**: Ice Cream, Frozen, Cold
- **Electronics**: Battery, Charger, Cable, Adapter

## Sample Complete Bill

```
SMART POS SUPPLIER BILL
========================================
Bill No: SP-2024-001234
Date: 2024-07-05
Supplier: Kathmandu Wholesale Distributors
Contact: +977-9841234567
Email: orders@kwdistributors.com.np
Address: Teku, Kathmandu
========================================

SN | PRODUCT NAME                    | QTY | UNIT | BARCODE       | COST  | SELL
01 | Coca Cola 500ml                 | 24  | pcs  | 9843201234567 | 15.50 | 25.00
02 | Dairy Milk Chocolate 65g        | 30  | pcs  | 9843201234568 | 22.00 | 33.00
03 | KitKat Chocolate 4 Finger       | 25  | pcs  | 9843201234569 | 18.75 | 25.00
04 | Snickers Chocolate Bar          | 20  | pcs  | 9843201234570 | 26.50 | 38.00
05 | Potato Chips Original 50g       | 18  | pcs  | 9843201234571 | 14.75 | 21.90
06 | Mineral Water 1L                | 12  | pcs  | 9843201234572 | 8.50  | 13.80

========================================
SUMMARY:
Total Items: 6
Total Quantity: 129 pcs
Total Cost: NPR 2,447.50
Total Selling: NPR 3,731.40
Profit Margin: NPR 1,283.90 (52.4%)
========================================

Payment Terms: Net 30 Days
Delivery Date: 2024-07-06
GST Registration: 123456789
PAN: 987654321

Received By: ________________
Date: ________________
Signature: ________________
```

## Implementation Notes

### OCR Accuracy Tips
1. Use high contrast black text on white background
2. Ensure minimum 12pt font size
3. Avoid cursive or decorative fonts
4. Use monospace fonts for numeric data
5. Leave adequate white space between sections

### Error Handling
- Products with missing barcodes will be flagged for manual entry
- Invalid price formats will be highlighted
- Duplicate barcodes will trigger warnings
- Missing required fields will prevent bill processing

### Integration with Smart POS
- Scanned items automatically update inventory
- Cost prices update existing product records
- New products are added to the database
- Supplier information is linked to products
- Purchase history is recorded for analytics

This standardized format ensures reliable OCR processing and seamless integration with the Smart POS inventory management system.
