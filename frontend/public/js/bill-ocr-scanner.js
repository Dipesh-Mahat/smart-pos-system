/**
 * Smart POS Bill OCR Processor
 * 
 * This module provides specialized OCR for the standardized Smart POS bill format.
 * It integrates with Tesseract.js for text recognition and adds:
 * - Image preprocessing for optimal OCR accuracy
 * - Structured parsing of the standardized bill format
 * - Validation and error detection
 * - Format-specific optimizations
 */

class SmartPOSBillScanner {
    constructor(options = {}) {
        this.options = {
            language: 'eng',
            tesseractConfig: {
                workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v4/dist/worker.min.js',
                langPath: 'https://tessdata.projectnaptha.com/4.0.0',
                corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v4/tesseract-core.wasm.js',
                logger: message => {
                    if (this.options.debugMode && message.status === 'recognizing text') {
                        const progress = message.progress * 100;
                        if (this.progressCallback && progress % 20 < 1) { // Report on ~20% increments
                            this.progressCallback(Math.floor(progress));
                        }
                    }
                }
            },
            errorCorrection: true,
            enhanceImage: true,
            detectTableStructure: true,
            confidenceThreshold: 60, // Minimum confidence level (0-100)
            debugMode: false,
            ...options
        };
        
        this.worker = null;
        this.progressCallback = null;
        this.initialized = false;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    /**
     * Initialize the OCR engine
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            if (!window.Tesseract) {
                console.error('Tesseract.js not loaded. Please include the library first.');
                return false;
            }
            
            // Create and initialize worker
            this.worker = await window.Tesseract.createWorker(this.options.tesseractConfig);
            await this.worker.loadLanguage(this.options.language);
            await this.worker.initialize(this.options.language);
            await this.worker.setParameters({
                tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-.|:,/\\%$+ ',
                preserve_interword_spaces: '1',
                tessedit_ocr_engine_mode: this.options.errorCorrection ? 2 : 0 // Use Tesseract with LSTM
            });
            
            console.log('OCR engine initialized successfully');
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize OCR engine:', error);
            return false;
        }
    }
    
    /**
     * Set a callback function to track OCR progress
     * @param {Function} callback - Progress callback function (0-100)
     */
    onProgress(callback) {
        this.progressCallback = callback;
    }
    
    /**
     * Enhance image for better OCR results
     * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap} image - The image to enhance
     * @returns {HTMLCanvasElement} - Enhanced image canvas
     */
    enhanceImageForOCR(image) {
        if (!this.options.enhanceImage) {
            return image;
        }
        
        const width = image.width || image.naturalWidth;
        const height = image.height || image.naturalHeight;
        
        // Resize canvas to match image
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Draw image to canvas
        this.ctx.drawImage(image, 0, 0, width, height);
        
        // Get image data for processing
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Apply OCR-specific optimizations
        for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale first
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            // Increase contrast dramatically
            const newValue = avg < 120 ? 0 : 255;
            
            // Apply threshold - convert to black and white
            data[i] = data[i + 1] = data[i + 2] = newValue;
        }
        
        // Put processed image back on canvas
        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas;
    }
    
    /**
     * Scan bill image and extract structured data
     * @param {HTMLImageElement|HTMLCanvasElement|Blob|File|string} image - Image to scan
     * @returns {Promise<Object>} Structured bill data
     */
    async scanBill(image) {
        if (!this.initialized) {
            const success = await this.initialize();
            if (!success) throw new Error('OCR engine initialization failed');
        }
        
        try {
            // Pre-process the image for optimal OCR
            const processedImage = this.enhanceImageForOCR(image);
            
            // Perform OCR recognition
            const result = await this.worker.recognize(processedImage);
            
            // Check for sufficient confidence
            if (result.data.confidence < this.options.confidenceThreshold) {
                console.warn(`Low OCR confidence: ${result.data.confidence}%`);
            }
            
            // Parse the recognized text according to Smart POS bill format
            const billData = this.parseBillFormat(result.data.text);
            
            // Add raw data and confidence for debugging
            billData._raw = {
                text: result.data.text,
                confidence: result.data.confidence
            };
            
            return billData;
        } catch (error) {
            console.error('OCR processing error:', error);
            throw error;
        }
    }
    
    /**
     * Parse standardized Smart POS bill format
     * @param {string} text - Recognized text
     * @returns {Object} Structured bill data
     */
    parseBillFormat(text) {
        // Prepare result object
        const billData = {
            billNo: null,
            date: null,
            supplier: null,
            contact: null,
            email: null,
            address: null,
            items: [],
            summary: {
                totalItems: 0,
                totalQuantity: 0,
                totalCost: 0,
                totalSelling: 0,
                profitMargin: 0
            },
            paymentTerms: null,
            deliveryDate: null,
            gstRegistration: null,
            pan: null
        };
        
        // Process the text by lines
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        // Extract header information using regex patterns
        const billNoPattern = /Bill No:?\s*([A-Z0-9\-]+)/i;
        const datePattern = /Date:?\s*(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})/i;
        const supplierPattern = /Supplier:?\s*(.+)/i;
        const contactPattern = /Contact:?\s*(.+)/i;
        const emailPattern = /Email:?\s*(.+)/i;
        const addressPattern = /Address:?\s*(.+)/i;
        
        // Extract summary information
        const totalItemsPattern = /Total Items:?\s*(\d+)/i;
        const totalQuantityPattern = /Total Quantity:?\s*(\d+)/i;
        const totalCostPattern = /Total Cost:?\s*(?:NPR)?\s*([\d,]+\.?\d*)/i;
        const totalSellingPattern = /Total Selling:?\s*(?:NPR)?\s*([\d,]+\.?\d*)/i;
        const profitMarginPattern = /Profit Margin:?\s*(?:NPR)?\s*([\d,]+\.?\d*)(?:\s*\((.+)%\))?/i;
        
        // Extract payment terms and other footer information
        const paymentTermsPattern = /Payment Terms:?\s*(.+)/i;
        const deliveryDatePattern = /Delivery Date:?\s*(.+)/i;
        const gstPattern = /GST Registration:?\s*(.+)/i;
        const panPattern = /PAN:?\s*(.+)/i;
        
        // Process each line
        let inItemsSection = false;
        let headerProcessed = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Skip separator lines
            if (/^={5,}$/.test(line.replace(/\s/g, ''))) continue;
            
            // Check for header section
            if (!headerProcessed) {
                // Try to extract header information
                const billNoMatch = line.match(billNoPattern);
                if (billNoMatch) billData.billNo = billNoMatch[1].trim();
                
                const dateMatch = line.match(datePattern);
                if (dateMatch) billData.date = dateMatch[1].trim();
                
                const supplierMatch = line.match(supplierPattern);
                if (supplierMatch) billData.supplier = supplierMatch[1].trim();
                
                const contactMatch = line.match(contactPattern);
                if (contactMatch) billData.contact = contactMatch[1].trim();
                
                const emailMatch = line.match(emailPattern);
                if (emailMatch) billData.email = emailMatch[1].trim();
                
                const addressMatch = line.match(addressPattern);
                if (addressMatch) billData.address = addressMatch[1].trim();
                
                // If we found at least bill number or supplier, consider header processed
                if (billData.billNo || billData.supplier) {
                    headerProcessed = true;
                }
                
                continue;
            }
            
            // Check if this is the items table header
            if (line.includes('PRODUCT NAME') && line.includes('QTY') && line.includes('BARCODE')) {
                inItemsSection = true;
                continue;
            }
            
            // Check if this line could be an item in the table
            if (inItemsSection) {
                // Smart POS standardized format: SN | PRODUCT NAME | QTY | UNIT | BARCODE | COST | SELL
                const itemPattern = /^(\d{1,2})\s*\|\s*(.{1,40})\s*\|\s*(\d+)\s*\|\s*(\w+)\s*\|\s*(\d{10,13})\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)$/;
                const itemMatch = line.match(itemPattern);
                
                // Also try alternative pattern with spaces instead of | characters
                const alternativePattern = /^(\d{1,2})\s+(.{5,40})\s+(\d+)\s+(\w+)\s+(\d{10,13})\s+(\d+\.\d{1,2})\s+(\d+\.\d{1,2})$/;
                const alternativeMatch = !itemMatch ? line.match(alternativePattern) : null;
                
                // If we found a valid item line
                if (itemMatch || alternativeMatch) {
                    const match = itemMatch || alternativeMatch;
                    
                    // Parse item data
                    const item = {
                        sn: parseInt(match[1]),
                        name: match[2].trim(),
                        quantity: parseInt(match[3]),
                        unit: match[4].trim(),
                        barcode: match[5].trim(),
                        cost: parseFloat(match[6]),
                        sell: parseFloat(match[7])
                    };
                    
                    // Add to items array
                    billData.items.push(item);
                    continue;
                }
                
                // Check if we've exited the items section (entering summary section)
                if (line.includes('SUMMARY') || line.includes('Total Items')) {
                    inItemsSection = false;
                }
            }
            
            // Look for summary information
            const totalItemsMatch = line.match(totalItemsPattern);
            if (totalItemsMatch) {
                billData.summary.totalItems = parseInt(totalItemsMatch[1]);
            }
            
            const totalQuantityMatch = line.match(totalQuantityPattern);
            if (totalQuantityMatch) {
                billData.summary.totalQuantity = parseInt(totalQuantityMatch[1]);
            }
            
            const totalCostMatch = line.match(totalCostPattern);
            if (totalCostMatch) {
                billData.summary.totalCost = parseFloat(totalCostMatch[1].replace(/,/g, ''));
            }
            
            const totalSellingMatch = line.match(totalSellingPattern);
            if (totalSellingMatch) {
                billData.summary.totalSelling = parseFloat(totalSellingMatch[1].replace(/,/g, ''));
            }
            
            const profitMarginMatch = line.match(profitMarginPattern);
            if (profitMarginMatch) {
                billData.summary.profitMargin = parseFloat(profitMarginMatch[1].replace(/,/g, ''));
                if (profitMarginMatch[2]) {
                    billData.summary.profitPercentage = parseFloat(profitMarginMatch[2]);
                }
            }
            
            // Look for footer information
            const paymentTermsMatch = line.match(paymentTermsPattern);
            if (paymentTermsMatch) {
                billData.paymentTerms = paymentTermsMatch[1].trim();
            }
            
            const deliveryDateMatch = line.match(deliveryDatePattern);
            if (deliveryDateMatch) {
                billData.deliveryDate = deliveryDateMatch[1].trim();
            }
            
            const gstMatch = line.match(gstPattern);
            if (gstMatch) {
                billData.gstRegistration = gstMatch[1].trim();
            }
            
            const panMatch = line.match(panPattern);
            if (panMatch) {
                billData.pan = panMatch[1].trim();
            }
        }
        
        // If items were found but summary info wasn't detected, calculate it
        if (billData.items.length > 0) {
            // Calculate summary if not already populated
            if (!billData.summary.totalItems) {
                billData.summary.totalItems = billData.items.length;
            }
            
            if (!billData.summary.totalQuantity) {
                billData.summary.totalQuantity = billData.items.reduce((sum, item) => sum + item.quantity, 0);
            }
            
            if (!billData.summary.totalCost) {
                billData.summary.totalCost = billData.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
            }
            
            if (!billData.summary.totalSelling) {
                billData.summary.totalSelling = billData.items.reduce((sum, item) => sum + (item.sell * item.quantity), 0);
            }
            
            if (!billData.summary.profitMargin) {
                billData.summary.profitMargin = billData.summary.totalSelling - billData.summary.totalCost;
                billData.summary.profitPercentage = (billData.summary.profitMargin / billData.summary.totalCost) * 100;
            }
        }
        
        // Automatically categorize items based on product names
        this.categorizeItems(billData.items);
        
        // Validate result
        this.validateBillData(billData);
        
        return billData;
    }
    
    /**
     * Validate bill data for completeness and consistency
     * @param {Object} billData - The bill data to validate
     */
    validateBillData(billData) {
        // Flag potential errors
        billData.validationErrors = [];
        
        // Check for missing critical information
        if (!billData.billNo) {
            billData.validationErrors.push('Missing bill number');
        }
        
        if (!billData.date) {
            billData.validationErrors.push('Missing bill date');
        }
        
        if (!billData.supplier) {
            billData.validationErrors.push('Missing supplier information');
        }
        
        // Check for items with missing or invalid barcodes
        const itemsWithIssues = billData.items.filter(item => !item.barcode || item.barcode.length < 10);
        if (itemsWithIssues.length > 0) {
            billData.validationErrors.push(`${itemsWithIssues.length} items have missing or invalid barcodes`);
            
            // Flag problematic items
            billData.items.forEach(item => {
                if (!item.barcode || item.barcode.length < 10) {
                    item.hasIssue = true;
                }
            });
        }
        
        // Check for duplicate barcodes
        const barcodes = new Set();
        const duplicateBarcodes = billData.items
            .filter(item => item.barcode)
            .filter(item => {
                if (barcodes.has(item.barcode)) {
                    return true;
                } else {
                    barcodes.add(item.barcode);
                    return false;
                }
            })
            .map(item => item.barcode);
            
        if (duplicateBarcodes.length > 0) {
            billData.validationErrors.push(`Found ${duplicateBarcodes.length} duplicate barcodes`);
        }
        
        // Check for summary discrepancies
        if (billData.items.length > 0) {
            const calculatedTotalItems = billData.items.length;
            const calculatedTotalQuantity = billData.items.reduce((sum, item) => sum + item.quantity, 0);
            const calculatedTotalCost = billData.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
            const calculatedTotalSelling = billData.items.reduce((sum, item) => sum + (item.sell * item.quantity), 0);
            
            // Calculate acceptable margin of error (0.5%)
            const costMarginError = calculatedTotalCost * 0.005;
            const sellingMarginError = calculatedTotalSelling * 0.005;
            
            // Check if reported totals match calculated totals
            if (billData.summary.totalItems && 
                billData.summary.totalItems !== calculatedTotalItems) {
                billData.validationErrors.push(`Item count mismatch: reported ${billData.summary.totalItems}, calculated ${calculatedTotalItems}`);
            }
            
            if (billData.summary.totalQuantity && 
                Math.abs(billData.summary.totalQuantity - calculatedTotalQuantity) > 1) {
                billData.validationErrors.push(`Quantity mismatch: reported ${billData.summary.totalQuantity}, calculated ${calculatedTotalQuantity}`);
            }
            
            if (billData.summary.totalCost && 
                Math.abs(billData.summary.totalCost - calculatedTotalCost) > costMarginError) {
                billData.validationErrors.push(`Cost mismatch: reported ${billData.summary.totalCost}, calculated ${calculatedTotalCost.toFixed(2)}`);
            }
            
            if (billData.summary.totalSelling && 
                Math.abs(billData.summary.totalSelling - calculatedTotalSelling) > sellingMarginError) {
                billData.validationErrors.push(`Selling price mismatch: reported ${billData.summary.totalSelling}, calculated ${calculatedTotalSelling.toFixed(2)}`);
            }
        }
    }
    
    /**
     * Auto-categorize products based on name
     * @param {Array} items - The items to categorize
     */
    categorizeItems(items) {
        // Category mapping based on keywords
        const categoryMap = {
            'Beverages': ['Cola', 'Juice', 'Water', 'Tea', 'Coffee', 'Soft Drink', 'Drink', 'Beer', 'Wine', 'Mineral'],
            'Chocolates': ['Chocolate', 'Candy', 'Sweet', 'Gum', 'KitKat', 'Dairy Milk', 'Snickers'],
            'Snacks': ['Chips', 'Biscuit', 'Wafer', 'Nuts', 'Crackers', 'Potato', 'Lays', 'Cheetos'],
            'Dairy': ['Milk', 'Yogurt', 'Cheese', 'Butter', 'Cream', 'Curd'],
            'Personal Care': ['Soap', 'Shampoo', 'Toothpaste', 'Lotion', 'Cosmetic', 'Cream', 'Razor', 'Pad'],
            'Household': ['Detergent', 'Cleaner', 'Tissue', 'Paper', 'Mop', 'Broom', 'Bucket'],
            'Frozen': ['Ice Cream', 'Frozen', 'Cold', 'Meat', 'Chicken', 'Fish'],
            'Electronics': ['Battery', 'Charger', 'Cable', 'Adapter', 'Memory', 'Card', 'USB', 'Phone']
        };
        
        // Assign categories
        items.forEach(item => {
            // Default category
            item.category = 'Other';
            
            // Check item name against category keywords
            const name = item.name.toLowerCase();
            
            for (const [category, keywords] of Object.entries(categoryMap)) {
                // Check if any keyword is in the product name
                if (keywords.some(keyword => name.includes(keyword.toLowerCase()))) {
                    item.category = category;
                    break;
                }
            }
        });
    }
    
    /**
     * Release resources when done
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.initialized = false;
        }
    }
}

// Make available globally
window.SmartPOSBillScanner = SmartPOSBillScanner;
