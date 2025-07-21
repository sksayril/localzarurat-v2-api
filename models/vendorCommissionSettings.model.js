const mongoose = require('mongoose');

const vendorCommissionSettingsSchema = new mongoose.Schema({
  // Vendor for whom commission is set
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Commission percentage (default 10%)
  commissionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10
  },
  // Whether this vendor has custom commission or uses default
  isCustomCommission: {
    type: Boolean,
    default: false
  },
  // Admin who set this commission
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Admin notes
  notes: {
    type: String,
    trim: true
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes (vendor field already has unique index from schema definition)
vendorCommissionSettingsSchema.index({ isActive: 1 });
vendorCommissionSettingsSchema.index({ createdAt: -1 });

// Update timestamp on save
vendorCommissionSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get commission percentage for a vendor
vendorCommissionSettingsSchema.statics.getCommissionPercentage = async function(vendorId) {
  const settings = await this.findOne({ vendor: vendorId, isActive: true });
  return settings ? settings.commissionPercentage : 10; // Default 10%
};

// Static method to set commission for a vendor
vendorCommissionSettingsSchema.statics.setCommission = async function(vendorId, percentage, adminId, notes = '') {
  const existingSettings = await this.findOne({ vendor: vendorId });
  
  if (existingSettings) {
    existingSettings.commissionPercentage = percentage;
    existingSettings.isCustomCommission = percentage !== 10;
    existingSettings.setBy = adminId;
    existingSettings.notes = notes;
    existingSettings.isActive = true;
    return await existingSettings.save();
  } else {
    const newSettings = new this({
      vendor: vendorId,
      commissionPercentage: percentage,
      isCustomCommission: percentage !== 10,
      setBy: adminId,
      notes: notes
    });
    return await newSettings.save();
  }
};

module.exports = mongoose.model('VendorCommissionSettings', vendorCommissionSettingsSchema); 