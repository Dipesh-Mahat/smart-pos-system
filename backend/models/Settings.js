const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingsSchema = new Schema({
  shopId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shop ID is required'],
    unique: true
  },
  business: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    phone: String,
    email: String,
    website: String,
    taxId: String,
    registrationNumber: String
  },
  currency: {
    code: {
      type: String,
      default: 'NPR',
      enum: ['NPR', 'USD', 'EUR', 'INR', 'GBP']
    },
    symbol: {
      type: String,
      default: 'Rs.'
    },
    position: {
      type: String,
      enum: ['before', 'after'],
      default: 'before'
    },
    decimalPlaces: {
      type: Number,
      default: 2,
      min: 0,
      max: 4
    }
  },
  tax: {
    defaultRate: {
      type: Number,
      default: 13, // VAT in Nepal
      min: 0,
      max: 100
    },
    taxInclusive: {
      type: Boolean,
      default: false
    },
    taxLabel: {
      type: String,
      default: 'VAT'
    }
  },
  receipt: {
    showLogo: {
      type: Boolean,
      default: true
    },
    showAddress: {
      type: Boolean,
      default: true
    },
    showTaxId: {
      type: Boolean,
      default: true
    },
    footerMessage: {
      type: String,
      default: 'Thank you for your business!'
    },
    headerMessage: String,
    paperSize: {
      type: String,
      enum: ['80mm', '58mm', 'A4'],
      default: '80mm'
    }
  },
  inventory: {
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0
    },
    autoDeductStock: {
      type: Boolean,
      default: true
    },
    allowNegativeStock: {
      type: Boolean,
      default: false
    },
    trackExpiry: {
      type: Boolean,
      default: false
    }
  },
  pos: {
    quickSaleMode: {
      type: Boolean,
      default: false
    },
    barcodeScanning: {
      type: Boolean,
      default: true
    },
    customerRequired: {
      type: Boolean,
      default: false
    },
    discountLimit: {
      type: Number,
      default: 100, // percentage
      min: 0,
      max: 100
    },
    roundingMethod: {
      type: String,
      enum: ['none', 'nearest', 'up', 'down'],
      default: 'nearest'
    }
  },
  notifications: {
    lowStock: {
      type: Boolean,
      default: true
    },
    newOrders: {
      type: Boolean,
      default: true
    },
    dailyReport: {
      type: Boolean,
      default: false
    },
    email: String, // notification email
    sms: String    // notification phone
  },
  backup: {
    autoBackup: {
      type: Boolean,
      default: false
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    lastBackup: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
// shopId index is automatically created by unique: true

const Settings = mongoose.model('Settings', SettingsSchema);
module.exports = Settings;
