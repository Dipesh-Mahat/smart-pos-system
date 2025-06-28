const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shop ID is required']
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allows multiple null values
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  type: {
    type: String,
    enum: ['regular', 'wholesale', 'vip', 'corporate'],
    default: 'regular'
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: [0, 'Loyalty points cannot be negative']
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: [0, 'Total orders cannot be negative']
  },
  lastOrderDate: {
    type: Date
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  paymentTerms: {
    type: String,
    enum: ['cash', 'net15', 'net30', 'net60', 'cod'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  dateOfBirth: Date,
  anniversaryDate: Date,
  preferences: {
    communicationMethod: {
      type: String,
      enum: ['email', 'sms', 'phone', 'none'],
      default: 'email'
    },
    marketingConsent: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for average order value
CustomerSchema.virtual('averageOrderValue').get(function() {
  if (this.totalOrders === 0) return 0;
  return (this.totalSpent / this.totalOrders).toFixed(2);
});

// Virtual for days since last order
CustomerSchema.virtual('daysSinceLastOrder').get(function() {
  if (!this.lastOrderDate) return null;
  const today = new Date();
  const diffTime = Math.abs(today - this.lastOrderDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Index for efficient queries
CustomerSchema.index({ shopId: 1, name: 'text', email: 1, phone: 1 });
CustomerSchema.index({ shopId: 1, type: 1 });
CustomerSchema.index({ shopId: 1, status: 1 });

const Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;
