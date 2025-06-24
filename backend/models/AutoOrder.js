const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AutoOrderSchema = new Schema({
  shopId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  nextOrderDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('AutoOrder', AutoOrderSchema);
