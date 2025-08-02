const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  barcode: String,
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be positive']
  },
  unit: String,
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  }
});

const PaymentSchema = new Schema({
  method: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'mobileBanking', 'creditAccount', 'check', 'other']
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payment amount cannot be negative']
  },
  reference: String,
  details: {
    cardType: String,
    cardLastFour: String,
    mobileProvider: String,
    accountName: String,
    checkNumber: String,
    otherDetails: String
  }
});

const TransactionSchema = new Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shop ID is required']
  },  items: [TransactionItemSchema],
  // Customer field - now properly linked to Customer model
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: false // Optional since some transactions may not have customers
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  },
  payments: [PaymentSchema],
  amountPaid: {
    type: Number,
    required: true,
    min: [0, 'Amount paid cannot be negative']
  },
  change: {
    type: Number,
    default: 0,
    min: [0, 'Change cannot be negative']
  },
  status: {
    type: String,
    enum: ['completed', 'refunded', 'partially_refunded', 'voided'],
    default: 'completed'
  },
  notes: String,
  cashierId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cashierName: String,
  refunds: [{
    amount: Number,
    reason: String,
    date: {
      type: Date,
      default: Date.now
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  loyaltyPointsEarned: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points earned cannot be negative']
  },
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points redeemed cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Methods to handle transaction calculations
TransactionSchema.methods.calculateTotals = function() {
  // Calculate subtotal from all items
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Calculate total with discount
  this.total = this.subtotal - this.discount;
  
  // Calculate change
  this.amountPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  this.change = Math.max(0, this.amountPaid - this.total);
  
  return this;
};

// Index for efficient queries
TransactionSchema.index({ shopId: 1, createdAt: -1 });
// receiptNumber index is automatically created by unique: true
TransactionSchema.index({ shopId: 1, customerId: 1 }); // Re-enabled customer index
TransactionSchema.index({ cashierId: 1 });

const Transaction = mongoose.model('Transaction', TransactionSchema);
module.exports = Transaction;
