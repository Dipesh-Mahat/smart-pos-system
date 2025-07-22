const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  admin: { type: String, required: true },
  recipients: [{ type: String, required: true }], // user emails or ids
  message: { type: String, required: true },
  method: { type: String, enum: ['email', 'push', 'sms', 'other'], default: 'other' },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  error: { type: String },
  time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
