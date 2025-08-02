/**
 * Smart POS Bill Generator
 * 
 * This module creates professional bills in the standardized Smart POS format
 * for transactions between suppliers and shop owners. It supports:
 * - Digital bill generation with standardized layout
 * - Print-ready formatting with receipt info
 * - Save to PDF functionality
 * - Email sharing options
 * - Bill preview interface
 */

class SmartPOSBillGenerator {
    constructor(options = {}) {
        this.options = {
            currency: 'NPR',
            dateFormat: 'YYYY-MM-DD',
            showDigitalWatermark: true,
            enablePrinting: true,
            enablePDF: true,
            enableEmail: true,
            // No enableQRCode as per requirements
            companyLogo: null, // URL to logo image
            companyName: 'Smart POS System',
            printOptions: {
                paperSize: 'a4',
                orientation: 'portrait',
                margins: {
                    top: '1cm',
                    bottom: '1cm',
                    left: '1cm',
                    right: '1cm'
                }
            },
            ...options
        };
        
        // Initialize variables
        this.billData = null;
        this.billElement = null;
    }
    
    /**
     * Format currency value
     * @param {number} amount - Amount to format
     * @param {boolean} includeSymbol - Whether to include currency symbol
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount, includeSymbol = true) {
        const formatted = new Intl.NumberFormat('ne-NP', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
        
        return includeSymbol ? `${this.options.currency} ${formatted}` : formatted;
    }
    
    /**
     * Generate QR code for payment information
     * @param {string} data - Data to encode in QR code
     * @returns {string} QR code HTML
     */
    generateQRCode(data) {
        if (typeof qrcode !== 'undefined') {
            // Create QR Code using qrcode-generator library if available
            try {
                const typeNumber = 0; // Auto-detect size
                const errorCorrectionLevel = 'L'; // Low error correction
                const qr = qrcode(typeNumber, errorCorrectionLevel);
                qr.addData(data);
                qr.make();
                return qr.createImgTag(4); // Pixel size = 4
            } catch (e) {
                console.error("Error generating QR code:", e);
                return this.generateQRCodeFallback();
            }
        } else {
            return this.generateQRCodeFallback();
        }
    }
    
    /**
     * Generate fallback QR code when library is not available
     * @returns {string} QR code placeholder HTML
     */
    generateQRCodeFallback() {
        return `
            <div class="qr-code-placeholder" style="width:120px;height:120px;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;margin:10px auto;background:#f9f9f9">
                <div style="text-align:center">
                    <div style="font-size:32px">QR</div>
                    <div style="font-size:12px">Scan to Pay</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Format date in standard format
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return date; // Return as is if invalid
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Generate bill number
     * @param {string} prefix - Bill number prefix
     * @returns {string} Generated bill number
     */
    generateBillNumber(prefix = 'SP') {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(100000 + Math.random() * 900000);
        
        return `${prefix}-${year}${month}-${random}`;
    }
    
    /**
     * Create a bill from transaction data
     * @param {Object} data - Transaction data
     * @returns {Object} Processed bill data
     */
    createBill(data) {
        // Create a fresh bill object
        this.billData = {
            billNo: data.billNo || this.generateBillNumber(),
            date: data.date ? this.formatDate(data.date) : this.formatDate(new Date()),
            supplier: data.supplier || data.from || {},
            customer: data.customer || data.to || {},
            items: Array.isArray(data.items) ? data.items : [],
            summary: {
                totalItems: data.items ? data.items.length : 0,
                totalQuantity: 0,
                totalCost: 0,
                totalSelling: 0,
                profitMargin: 0,
                profitPercentage: 0,
                subTotal: 0,
                discount: data.discount || 0,
                discountType: data.discountType || 'percentage', // 'percentage' or 'fixed'
                grandTotal: 0
            },
            deliveryDate: data.deliveryDate ? this.formatDate(data.deliveryDate) : '',
            // Removed paymentInfo, gstInfo and notes as per requirements
        };
        
        // Calculate totals
        let totalQuantity = 0;
        let totalCost = 0;
        let totalSelling = 0;
        
        this.billData.items.forEach(item => {
            const quantity = parseFloat(item.quantity) || 1;
            const cost = parseFloat(item.cost) || 0;
            const sell = parseFloat(item.sell) || 0;
            
            totalQuantity += quantity;
            totalCost += cost * quantity;
            totalSelling += sell * quantity;
            
            // Ensure each item has all required properties
            item.quantity = quantity;
            item.cost = cost;
            item.sell = sell;
            item.unit = item.unit || 'pcs';
        });
        
        // Update summary
        this.billData.summary.totalQuantity = totalQuantity;
        this.billData.summary.totalCost = totalCost;
        this.billData.summary.totalSelling = totalSelling;
        this.billData.summary.profitMargin = totalSelling - totalCost;
        this.billData.summary.profitPercentage = totalCost > 0 ? 
            (this.billData.summary.profitMargin / totalCost) * 100 : 0;
        
        // Calculate subtotal (using total selling price)
        this.billData.summary.subTotal = totalSelling;
        
        // Calculate discount
        let discountAmount = 0;
        if (this.billData.summary.discountType === 'percentage') {
            discountAmount = (this.billData.summary.discount / 100) * this.billData.summary.subTotal;
        } else {
            discountAmount = this.billData.summary.discount;
        }
        
        // Calculate after discount (which becomes the grand total)
        const afterDiscount = this.billData.summary.subTotal - discountAmount;
        
        // Calculate grand total (no tax)
        this.billData.summary.grandTotal = afterDiscount;
        
        return this.billData;
    }
    
    /**
     * Generate HTML representation of the bill
     * @param {boolean} forPrinting - Whether to optimize for printing
     * @returns {HTMLElement} Bill element
     */
    generateBillHTML(forPrinting = false) {
        if (!this.billData) {
            throw new Error('No bill data available. Call createBill() first.');
        }
        
        // Create bill container
        const bill = document.createElement('div');
        bill.className = forPrinting ? 'smart-pos-bill print-mode' : 'smart-pos-bill';
        
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .smart-pos-bill {
                font-family: 'Arial', sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                background-color: white;
            }
            
            .smart-pos-bill.print-mode {
                box-shadow: none;
                padding: 0;
                width: 100%;
                max-width: none;
            }
            
            .bill-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
            }
            
            .bill-logo {
                max-height: 80px;
                margin-bottom: 10px;
            }
            
            .bill-title {
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .bill-separator {
                border: none;
                height: 2px;
                background: repeating-linear-gradient(90deg, #000, #000 10px, transparent 10px, transparent 20px);
                margin: 15px 0;
            }
            
            .bill-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            
            .bill-info-block {
                flex: 1;
            }
            
            .bill-info-block h3 {
                margin: 0 0 5px;
                font-size: 14px;
                color: #555;
            }
            
            .bill-info-block p {
                margin: 0 0 3px;
                font-size: 14px;
            }
            
            .bill-items {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .bill-items th {
                background-color: #f5f5f5;
                border-bottom: 1px solid #ddd;
                padding: 10px;
                text-align: left;
            }
            
            .bill-items td {
                padding: 8px 10px;
                border-bottom: 1px solid #eee;
                font-size: 14px;
            }
            
            .bill-items .numeric {
                text-align: right;
            }
            
            .bill-summary {
                margin-left: auto;
                width: 300px;
                margin-bottom: 20px;
            }
            
            .bill-summary-row {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                font-size: 14px;
            }
            
            .bill-summary-row.total {
                font-weight: bold;
                border-top: 1px solid #ddd;
                padding-top: 10px;
                font-size: 16px;
            }
            
            .bill-footer {
                margin-top: 30px;
                font-size: 14px;
            }
            
            .bill-notes {
                padding: 10px;
                background-color: #f9f9f9;
                font-size: 14px;
                font-style: italic;
                margin-bottom: 20px;
            }
            
            .bill-signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 50px;
            }
            
            .signature-block {
                width: 200px;
                text-align: center;
            }
            
            .signature-line {
                border-top: 1px solid #000;
                margin-bottom: 5px;
                width: 100%;
                display: block;
            }
            
            .digital-watermark {
                text-align: center;
                color: #999;
                font-size: 12px;
                margin-top: 20px;
            }
            
            @media print {
                .smart-pos-bill {
                    box-shadow: none;
                    padding: 0;
                }
                
                .no-print {
                    display: none;
                }
                
                .page-break {
                    page-break-after: always;
                }
            }
        `;
        
        bill.appendChild(style);
        
        // Create header
        const header = document.createElement('div');
        header.className = 'bill-header';
        
        if (this.options.companyLogo) {
            const logo = document.createElement('img');
            logo.src = this.options.companyLogo;
            logo.alt = 'Company Logo';
            logo.className = 'bill-logo';
            header.appendChild(logo);
        }
        
        const title = document.createElement('h1');
        title.className = 'bill-title';
        title.textContent = 'SMART POS SUPPLIER BILL';
        header.appendChild(title);
        
        bill.appendChild(header);
        
        // Add separator
        const separator1 = document.createElement('div');
        separator1.className = 'bill-separator';
        bill.appendChild(separator1);
        
        // Bill info section
        const infoSection = document.createElement('div');
        infoSection.className = 'bill-info';
        
        // Bill details
        const billDetails = document.createElement('div');
        billDetails.className = 'bill-info-block';
        
        const billNoTitle = document.createElement('h3');
        billNoTitle.textContent = 'Bill Information';
        billDetails.appendChild(billNoTitle);
        
        const billNo = document.createElement('p');
        billNo.innerHTML = `<strong>Bill No:</strong> ${this.billData.billNo}`;
        billDetails.appendChild(billNo);
        
        const billDate = document.createElement('p');
        billDate.innerHTML = `<strong>Date:</strong> ${this.billData.date}`;
        billDetails.appendChild(billDate);
        
        if (this.billData.deliveryDate) {
            const deliveryDate = document.createElement('p');
            deliveryDate.innerHTML = `<strong>Delivery Date:</strong> ${this.billData.deliveryDate}`;
            billDetails.appendChild(deliveryDate);
        }
        
        infoSection.appendChild(billDetails);
        
        // Supplier info
        const supplierInfo = document.createElement('div');
        supplierInfo.className = 'bill-info-block';
        
        const supplierTitle = document.createElement('h3');
        supplierTitle.textContent = 'Supplier';
        supplierInfo.appendChild(supplierTitle);
        
        const supplier = this.billData.supplier || {};
        
        if (supplier.name) {
            const supplierName = document.createElement('p');
            supplierName.innerHTML = `<strong>${supplier.name}</strong>`;
            supplierInfo.appendChild(supplierName);
        }
        
        if (supplier.contact) {
            const supplierContact = document.createElement('p');
            supplierContact.innerHTML = `<strong>Contact:</strong> ${supplier.contact}`;
            supplierInfo.appendChild(supplierContact);
        }
        
        if (supplier.email) {
            const supplierEmail = document.createElement('p');
            supplierEmail.innerHTML = `<strong>Email:</strong> ${supplier.email}`;
            supplierInfo.appendChild(supplierEmail);
        }
        
        if (supplier.address) {
            const supplierAddress = document.createElement('p');
            supplierAddress.innerHTML = `<strong>Address:</strong> ${supplier.address}`;
            supplierInfo.appendChild(supplierAddress);
        }
        
        infoSection.appendChild(supplierInfo);
        
        // Customer info
        const customerInfo = document.createElement('div');
        customerInfo.className = 'bill-info-block';
        
        const customerTitle = document.createElement('h3');
        customerTitle.textContent = 'Customer';
        customerInfo.appendChild(customerTitle);
        
        const customer = this.billData.customer || {};
        
        if (customer.name) {
            const customerName = document.createElement('p');
            customerName.innerHTML = `<strong>${customer.name}</strong>`;
            customerInfo.appendChild(customerName);
        }
        
        if (customer.contact) {
            const customerContact = document.createElement('p');
            customerContact.innerHTML = `<strong>Contact:</strong> ${customer.contact}`;
            customerInfo.appendChild(customerContact);
        }
        
        if (customer.email) {
            const customerEmail = document.createElement('p');
            customerEmail.innerHTML = `<strong>Email:</strong> ${customer.email}`;
            customerInfo.appendChild(customerEmail);
        }
        
        if (customer.address) {
            const customerAddress = document.createElement('p');
            customerAddress.innerHTML = `<strong>Address:</strong> ${customer.address}`;
            customerInfo.appendChild(customerAddress);
        }
        
        infoSection.appendChild(customerInfo);
        
        bill.appendChild(infoSection);
        
        // Add separator
        const separator2 = document.createElement('div');
        separator2.className = 'bill-separator';
        bill.appendChild(separator2);
        
        // Items table
        const itemsTable = document.createElement('table');
        itemsTable.className = 'bill-items';
        
        // Table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['SN', 'PRODUCT NAME', 'QTY', 'UNIT', 'BARCODE', 'COST', 'SELL'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            if (['QTY', 'COST', 'SELL'].includes(headerText)) {
                th.className = 'numeric';
            }
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        itemsTable.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        
        this.billData.items.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // Serial number
            const snCell = document.createElement('td');
            snCell.textContent = String(index + 1).padStart(2, '0');
            row.appendChild(snCell);
            
            // Product name
            const nameCell = document.createElement('td');
            nameCell.textContent = item.name;
            row.appendChild(nameCell);
            
            // Quantity
            const qtyCell = document.createElement('td');
            qtyCell.textContent = item.quantity;
            qtyCell.className = 'numeric';
            row.appendChild(qtyCell);
            
            // Unit
            const unitCell = document.createElement('td');
            unitCell.textContent = item.unit || 'pcs';
            row.appendChild(unitCell);
            
            // Barcode
            const barcodeCell = document.createElement('td');
            barcodeCell.textContent = item.barcode || '';
            row.appendChild(barcodeCell);
            
            // Cost
            const costCell = document.createElement('td');
            costCell.textContent = this.formatCurrency(item.cost, false);
            costCell.className = 'numeric';
            row.appendChild(costCell);
            
            // Sell
            const sellCell = document.createElement('td');
            sellCell.textContent = this.formatCurrency(item.sell, false);
            sellCell.className = 'numeric';
            row.appendChild(sellCell);
            
            tbody.appendChild(row);
        });
        
        itemsTable.appendChild(tbody);
        bill.appendChild(itemsTable);
        
        // Add separator
        const separator3 = document.createElement('div');
        separator3.className = 'bill-separator';
        bill.appendChild(separator3);
        
        // Bill summary
        const summary = document.createElement('div');
        summary.className = 'bill-summary';
        
        const summaryTitle = document.createElement('h3');
        summaryTitle.textContent = 'SUMMARY';
        summary.appendChild(summaryTitle);
        
        // Total items
        const totalItemsRow = document.createElement('div');
        totalItemsRow.className = 'bill-summary-row';
        totalItemsRow.innerHTML = `
            <span>Total Items:</span>
            <span>${this.billData.summary.totalItems}</span>
        `;
        summary.appendChild(totalItemsRow);
        
        // Total quantity
        const totalQtyRow = document.createElement('div');
        totalQtyRow.className = 'bill-summary-row';
        totalQtyRow.innerHTML = `
            <span>Total Quantity:</span>
            <span>${this.billData.summary.totalQuantity} ${this.billData.items[0]?.unit || 'pcs'}</span>
        `;
        summary.appendChild(totalQtyRow);
        
        // Total cost
        const totalCostRow = document.createElement('div');
        totalCostRow.className = 'bill-summary-row';
        totalCostRow.innerHTML = `
            <span>Total Cost:</span>
            <span>${this.formatCurrency(this.billData.summary.totalCost)}</span>
        `;
        summary.appendChild(totalCostRow);
        
        // Total selling
        const totalSellingRow = document.createElement('div');
        totalSellingRow.className = 'bill-summary-row';
        totalSellingRow.innerHTML = `
            <span>Total Selling:</span>
            <span>${this.formatCurrency(this.billData.summary.totalSelling)}</span>
        `;
        summary.appendChild(totalSellingRow);
        
        // Profit margin
        const profitRow = document.createElement('div');
        profitRow.className = 'bill-summary-row';
        profitRow.innerHTML = `
            <span>Profit Margin:</span>
            <span>${this.formatCurrency(this.billData.summary.profitMargin)} (${this.billData.summary.profitPercentage.toFixed(1)}%)</span>
        `;
        summary.appendChild(profitRow);
        
        // Subtotal
        const subtotalRow = document.createElement('div');
        subtotalRow.className = 'bill-summary-row';
        subtotalRow.innerHTML = `
            <span>Subtotal:</span>
            <span>${this.formatCurrency(this.billData.summary.subTotal)}</span>
        `;
        summary.appendChild(subtotalRow);
        
        // Discount (if applicable)
        if (this.billData.summary.discount > 0) {
            const discountLabel = this.billData.summary.discountType === 'percentage' ? 
                `Discount (${this.billData.summary.discount}%):` : 'Discount:';
            
            const discountAmount = this.billData.summary.discountType === 'percentage' ?
                (this.billData.summary.discount / 100) * this.billData.summary.subTotal :
                this.billData.summary.discount;
                
            const discountRow = document.createElement('div');
            discountRow.className = 'bill-summary-row';
            discountRow.innerHTML = `
                <span>${discountLabel}</span>
                <span>- ${this.formatCurrency(discountAmount)}</span>
            `;
            summary.appendChild(discountRow);
        }
        
        // Grand Total
        const grandTotalRow = document.createElement('div');
        grandTotalRow.className = 'bill-summary-row total';
        grandTotalRow.innerHTML = `
            <span>Grand Total:</span>
            <span>${this.formatCurrency(this.billData.summary.grandTotal)}</span>
        `;
        summary.appendChild(grandTotalRow);

        bill.appendChild(summary);
        
        // Add separator
        const separator4 = document.createElement('div');
        separator4.className = 'bill-separator';
        bill.appendChild(separator4);
        
        // Additional information
        const additionalInfo = document.createElement('div');
        additionalInfo.className = 'bill-footer';
        
        // No payment terms, payment method, GST, PAN, or QR code as per requirements
        
        bill.appendChild(additionalInfo);
        
        // No notes section as per requirements
        
        // Signature section
        const signatures = document.createElement('div');
        signatures.className = 'bill-signatures';
        
        // Supplier signature
        const supplierSignature = document.createElement('div');
        supplierSignature.className = 'signature-block';
        supplierSignature.innerHTML = `
            <span class="signature-line"></span>
            <span>Supplier Signature</span>
        `;
        signatures.appendChild(supplierSignature);
        
        // Received by signature
        const receivedSignature = document.createElement('div');
        receivedSignature.className = 'signature-block';
        receivedSignature.innerHTML = `
            <span class="signature-line"></span>
            <span>Received By</span>
        `;
        signatures.appendChild(receivedSignature);
        
        // Date signature
        const dateSignature = document.createElement('div');
        dateSignature.className = 'signature-block';
        dateSignature.innerHTML = `
            <span class="signature-line"></span>
            <span>Date</span>
        `;
        signatures.appendChild(dateSignature);
        
        bill.appendChild(signatures);
        
        // Digital watermark
        if (this.options.showDigitalWatermark && !forPrinting) {
            const watermark = document.createElement('div');
            watermark.className = 'digital-watermark no-print';
            watermark.innerHTML = `
                Generated by Smart POS System | ${new Date().toLocaleString()} | Document is electronically verified
            `;
            bill.appendChild(watermark);
        }
        
        this.billElement = bill;
        return bill;
    }
    
    /**
     * Show bill preview in modal dialog
     * @param {HTMLElement} container - Container element for preview
     * @returns {Object} Modal control methods
     */
    showPreview(container) {
        if (!container) {
            throw new Error('Container element is required for preview');
        }
        
        if (!this.billElement) {
            this.generateBillHTML();
        }
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'bill-preview-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            padding: 20px;
        `;
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'bill-preview-content';
        modalContent.style.cssText = `
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'bill-preview-header';
        modalHeader.style.cssText = `
            padding: 15px;
            background-color: #f5f5f5;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = 'Bill Preview';
        modalTitle.style.margin = '0';
        modalHeader.appendChild(modalTitle);
        
        // Actions toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'bill-preview-toolbar';
        toolbar.style.cssText = `
            display: flex;
            gap: 10px;
        `;
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕ Close';
        closeButton.className = 'bill-preview-close';
        closeButton.style.cssText = `
            padding: 8px 15px;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        closeButton.onclick = () => {
            modal.remove();
        };
        toolbar.appendChild(closeButton);
        
        // Print button
        if (this.options.enablePrinting) {
            const printButton = document.createElement('button');
            printButton.textContent = '🖨️ Print';
            printButton.className = 'bill-preview-print';
            printButton.style.cssText = `
                padding: 8px 15px;
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            `;
            printButton.onclick = () => {
                this.printBill();
            };
            toolbar.appendChild(printButton);
        }
        
        // PDF button
        if (this.options.enablePDF) {
            const pdfButton = document.createElement('button');
            pdfButton.textContent = '📄 Save PDF';
            pdfButton.className = 'bill-preview-pdf';
            pdfButton.style.cssText = `
                padding: 8px 15px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            `;
            pdfButton.onclick = () => {
                this.savePDF();
            };
            toolbar.appendChild(pdfButton);
        }
        
        // Email button
        if (this.options.enableEmail) {
            const emailButton = document.createElement('button');
            emailButton.textContent = '✉️ Email';
            emailButton.className = 'bill-preview-email';
            emailButton.style.cssText = `
                padding: 8px 15px;
                background-color: #FF9800;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            `;
            emailButton.onclick = () => {
                this.emailBill();
            };
            toolbar.appendChild(emailButton);
        }
        
        modalHeader.appendChild(toolbar);
        modalContent.appendChild(modalHeader);
        
        // Create scroll container
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'bill-preview-scroll';
        scrollContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        `;
        
        // Clone the bill element to add to the preview
        const billClone = this.billElement.cloneNode(true);
        scrollContainer.appendChild(billClone);
        
        modalContent.appendChild(scrollContainer);
        modal.appendChild(modalContent);
        container.appendChild(modal);
        
        // Return control methods
        return {
            close: () => modal.remove(),
            print: () => this.printBill(),
            savePDF: () => this.savePDF(),
            emailBill: () => this.emailBill()
        };
    }
    
    /**
     * Print the bill
     */
    printBill() {
        // Generate print-optimized version
        const printBill = this.generateBillHTML(true);
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Add content to print window
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Bill - ${this.billData.billNo}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
                ${printBill.outerHTML}
                <script>
                    // Auto-print when loaded
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            setTimeout(() => window.close(), 500);
                        }, 300);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
    
    /**
     * Save bill as PDF
     */
    savePDF() {
        if (typeof html2pdf !== 'undefined') {
            const element = this.generateBillHTML(true);
            const opt = {
                margin:       [10, 10, 10, 10],
                filename:     `SmartPOS-Bill-${this.billData.billNo}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            html2pdf().set(opt).from(element).save();
        } else {
            alert('PDF generation library not loaded. Please include html2pdf.js library.');
        }
    }
    
    /**
     * Email the bill
     */
    emailBill() {
        // Get customer email if available
        const email = this.billData.customer && this.billData.customer.email 
            ? this.billData.customer.email 
            : '';
            
        const subject = `Bill ${this.billData.billNo} from ${this.options.companyName}`;
        const body = `Dear customer,\n\nPlease find attached your bill ${this.billData.billNo} dated ${this.billData.date}.\n\nThank you for your business.\n\n${this.options.companyName}`;
        
        // Open email client
        window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
}

// Make available globally
window.SmartPOSBillGenerator = SmartPOSBillGenerator;
