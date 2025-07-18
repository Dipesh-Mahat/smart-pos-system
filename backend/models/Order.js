const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  }
});

const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shop ID is required']
  },
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Supplier ID is required']
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cost cannot be negative']
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
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bankTransfer', 'creditAccount', 'cod'],
    default: 'creditAccount'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'failed', 'refunded'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  reviewComment: String,
  notes: String,
  trackingNumber: String,
  cancelReason: String,
  returnReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for order age in days
OrderSchema.virtual('orderAge').get(function() {
  const today = new Date();
  const diffTime = Math.abs(today - this.orderDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Methods to handle order calculations
OrderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
  return this;
};

// Index for efficient queries
OrderSchema.index({ shopId: 1, orderDate: -1 });
OrderSchema.index({ supplierId: 1, orderDate: -1 });
// orderNumber index is automatically created by unique: true
OrderSchema.index({ status: 1 });

const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;
