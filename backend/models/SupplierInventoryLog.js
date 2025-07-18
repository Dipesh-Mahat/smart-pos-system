const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SupplierInventoryLogSchema = new Schema({
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
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['received', 'sold', 'damaged', 'transfer', 'correction', 'initial']
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
    enum: ['Order', 'StockAdjustment', null]
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
SupplierInventoryLogSchema.index({ supplierId: 1, productId: 1 });
SupplierInventoryLogSchema.index({ supplierId: 1, createdAt: -1 });
SupplierInventoryLogSchema.index({ type: 1 });

const SupplierInventoryLog = mongoose.model('SupplierInventoryLog', SupplierInventoryLogSchema);

module.exports = SupplierInventoryLog;
