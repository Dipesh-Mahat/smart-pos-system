const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AutoOrderSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  nextOrderDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  notes: String,
  lastOrderDate: { type: Date },
  ordersPlaced: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes for faster queries
AutoOrderSchema.index({ shopId: 1, supplierId: 1 });
AutoOrderSchema.index({ shopId: 1, isActive: 1 });
AutoOrderSchema.index({ nextOrderDate: 1, isActive: 1 });

module.exports = mongoose.model('AutoOrder', AutoOrderSchema);
