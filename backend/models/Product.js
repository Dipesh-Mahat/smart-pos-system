const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  barcode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows null/undefined values (for products without barcodes)
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isDemo: {
    type: Boolean,
    default: false,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  minStockLevel: {
    type: Number,
    default: 5,
    min: [0, 'Minimum stock level cannot be negative']
  },
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'kg', 'liter', 'box', 'pack', 'other']
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shop ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supplierInfo: {
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    supplierName: String,
    supplierCode: String
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative'],
    max: [100, 'Tax cannot exceed 100%']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit margin calculation
ProductSchema.virtual('profitMargin').get(function() {
  if (!this.costPrice || this.costPrice === 0) return null;
  return ((this.price - this.costPrice) / this.price * 100).toFixed(2);
});

// Virtual to determine if stock is low
ProductSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStockLevel;
});

// Index for efficient queries
ProductSchema.index({ name: 'text', description: 'text', category: 'text', barcode: 1 });
ProductSchema.index({ shopId: 1 });

const Product = mongoose.model('Product', ProductSchema);
module.exports = Product;
