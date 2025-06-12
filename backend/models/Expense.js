const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shop ID is required']
  },
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    enum: ['rent', 'utilities', 'salary', 'inventory', 'equipment', 'marketing', 'maintenance', 'taxes', 'insurance', 'other']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    default: Date.now,
    required: [true, 'Date is required']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bankTransfer', 'mobilePayment', 'check', 'other'],
    default: 'cash'
  },
  reference: {
    type: String,
    trim: true
  },
  recurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    nextDate: Date,
    endDate: Date
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
ExpenseSchema.index({ shopId: 1, date: -1 });
ExpenseSchema.index({ category: 1 });

const Expense = mongoose.model('Expense', ExpenseSchema);
module.exports = Expense;
