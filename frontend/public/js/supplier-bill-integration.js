/**
 * Smart POS Bill Generator Integration
 * 
 * This module integrates the bill generator with supplier-shop owner orders.
 * It provides functionality to:
 * 1. Generate a bill from an existing order
 * 2. Create a bill when an order is placed or delivered
 * 3. Convert bill data to match the order structure for saving
 */

class SupplierBillIntegration {
    constructor() {
        // Initialize bill generator
        this.billGenerator = null;
        if (window.SmartPOSBillGenerator) {
            this.billGenerator = new SmartPOSBillGenerator({
                companyName: "Smart POS System",
                currency: "NPR",
                enablePDF: true
                // Removed enableQRCode as per requirements
            });
        } else {
            console.error("SmartPOSBillGenerator not found. Make sure to include bill-generator.js before this script.");
        }
    }

    /**
     * Generate a bill from an existing order
     * @param {Object} order - Order data from API
     * @param {HTMLElement} container - DOM element to show the bill preview
     * @returns {Object} Bill data
     */
    generateBillFromOrder(order, container) {
        if (!this.billGenerator) {
            throw new Error("Bill generator not initialized");
        }

        // Convert order to bill format
        const billData = this.convertOrderToBillFormat(order);
        
        // Generate bill
        const bill = this.billGenerator.createBill(billData);
        
        // Show preview if container is provided
        if (container) {
            this.billGenerator.showPreview(container);
        }
        
        return bill;
    }
    
    /**
     * Convert order structure to bill format
     * @param {Object} order - Order data from API
     * @returns {Object} Formatted bill data
     */
    convertOrderToBillFormat(order) {
        // Extract supplier and shop owner details
        const supplier = order.supplierDetails || {};
        const customer = order.shopDetails || {};
        
        // Format items
        const items = order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            barcode: item.sku || '',
            cost: item.unitPrice, // Supplier's selling price becomes shop's cost
            sell: item.unitPrice * 1.2 // Default 20% markup for shop owner's selling price (can be adjusted)
        }));
        
        // Calculate discount percentage
        const discountPercentage = order.subtotal > 0 ? (order.discount / order.subtotal) * 100 : 0;
        
        // Create bill data
        const billData = {
            billNo: order.orderNumber,
            date: order.orderDate,
            deliveryDate: order.expectedDeliveryDate,
            
            supplier: {
                name: supplier.name || supplier.businessName || 'Supplier',
                contact: supplier.phone || supplier.contact || '',
                email: supplier.email || '',
                address: supplier.address ? 
                    (typeof supplier.address === 'object' ? 
                        `${supplier.address.street}, ${supplier.address.city}` : 
                        supplier.address) : ''
            },
            
            customer: {
                name: customer.name || customer.businessName || 'Customer',
                contact: customer.phone || customer.contact || '',
                email: customer.email || '',
                address: customer.address ? 
                    (typeof customer.address === 'object' ? 
                        `${customer.address.street}, ${customer.address.city}` : 
                        customer.address) : ''
            },
            
            items: items,
            
            discount: discountPercentage,
            discountType: 'percentage'
            
            // Removed paymentInfo, gstInfo, and notes as per requirements
        };
        
        return billData;
    }
    
    /**
     * Register event handlers for order actions
     */
    registerEventHandlers() {
        // Handle order placed event
        document.addEventListener('order-placed', event => {
            const { order, containerSelector } = event.detail;
            const container = document.querySelector(containerSelector);
            if (container) {
                this.generateBillFromOrder(order, container);
            }
        });
        
        // Handle order delivered event
        document.addEventListener('order-delivered', event => {
            const { order, containerSelector } = event.detail;
            const container = document.querySelector(containerSelector);
            if (container) {
                this.generateBillFromOrder(order, container);
            }
        });
    }
    
    /**
     * Generate bill when order button is clicked
     * @param {string} orderId - Order ID to generate bill for
     * @param {string} containerSelector - CSS selector for bill container
     */
    setupGenerateBillButton(orderId, containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        
        // Create button
        const generateBillBtn = document.createElement('button');
        generateBillBtn.className = 'btn btn-primary generate-bill-btn';
        generateBillBtn.innerHTML = '<i class="fas fa-file-invoice"></i> Generate Bill';
        generateBillBtn.onclick = async () => {
            try {
                // Show loading state
                generateBillBtn.disabled = true;
                generateBillBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
                
                // Fetch order details
                const response = await fetch(`/api/orders/${orderId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch order details');
                }
                
                const order = await response.json();
                
                // Generate bill
                this.generateBillFromOrder(order, container);
            } catch (error) {
                console.error('Error generating bill:', error);
                alert('Failed to generate bill: ' + error.message);
            } finally {
                // Reset button state
                generateBillBtn.disabled = false;
                generateBillBtn.innerHTML = '<i class="fas fa-file-invoice"></i> Generate Bill';
            }
        };
        
        // Add button to container
        container.appendChild(generateBillBtn);
    }
}

// Export for use in other modules
window.SupplierBillIntegration = SupplierBillIntegration;

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create instance
    const billIntegration = new SupplierBillIntegration();
    
    // Register event handlers
    billIntegration.registerEventHandlers();
    
    // Make available globally
    window.billIntegration = billIntegration;
});
