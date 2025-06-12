const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InventoryLogSchema = new Schema({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shop ID is required']
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['purchase', 'sale', 'return', 'adjustment', 'loss', 'transfer', 'stocktake']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    validate: {
      validator: function(v) {
        return v !== 0;
      },
      message: 'Quantity cannot be zero'
    }
  },
  previousStock: {
    type: Number,
    required: [true, 'Previous stock is required']
  },
  newStock: {
    type: Number,
    required: [true, 'New stock is required']
  },
  reference: {
    type: String,
    trim: true
  },
  referenceId: {
    type: Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Transaction', 'PurchaseOrder', 'StockAdjustment']
  },
  notes: {
    type: String,
    trim: true
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
InventoryLogSchema.index({ shopId: 1, createdAt: -1 });
InventoryLogSchema.index({ productId: 1 });
InventoryLogSchema.index({ type: 1 });

const InventoryLog = mongoose.model('InventoryLog', InventoryLogSchema);
module.exports = InventoryLog;
