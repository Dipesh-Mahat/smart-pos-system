const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SupplierInventorySchema = new Schema({
  supplierId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Supplier ID is required']
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    default: 0
  },
  minStock: {
    type: Number,
    required: [true, 'Minimum stock is required'],
    default: 0
  },
  maxStock: {
    type: Number,
    default: 0
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required']
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: 'in-stock'
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Automatically update status based on current and min stock
SupplierInventorySchema.pre('save', function(next) {
  if (this.currentStock === 0) {
    this.status = 'out-of-stock';
  } else if (this.currentStock <= this.minStock) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  
  this.lastUpdated = Date.now();
  next();
});

// Index for better query performance
SupplierInventorySchema.index({ supplierId: 1, productId: 1 }, { unique: true });
SupplierInventorySchema.index({ sku: 1, supplierId: 1 }, { unique: true });
SupplierInventorySchema.index({ status: 1 });

const SupplierInventory = mongoose.model('SupplierInventory', SupplierInventorySchema);

module.exports = SupplierInventory;
