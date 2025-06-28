const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null // null for top-level categories
  },
  imageUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shop ID is required']
  },
  metadata: {
    taxRate: {
      type: Number,
      default: 0,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    },
    commissionRate: {
      type: Number,
      default: 0,
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100%']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full category path
CategorySchema.virtual('fullPath').get(function() {
  // This would need to be populated to work properly
  if (this.parentCategory && this.parentCategory.name) {
    return `${this.parentCategory.name} > ${this.name}`;
  }
  return this.name;
});

// Virtual for subcategory count
CategorySchema.virtual('subcategoryCount', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
  count: true
});

// Virtual for product count
CategorySchema.virtual('productCount', {
  ref: 'Product',
  localField: 'name',
  foreignField: 'category',
  count: true
});

// Index for efficient queries
CategorySchema.index({ shopId: 1, name: 1 });
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ isActive: 1, sortOrder: 1 });

const Category = mongoose.model('Category', CategorySchema);
module.exports = Category;
