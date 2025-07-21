const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Referral Commission Settings
  referralCommission: {
    percentage: {
      type: Number,
      default: 3, // Default 3% commission
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    },
    minimumSubscriptionAmount: {
      type: Number,
      default: 100 // Minimum subscription amount to qualify for commission
    },
    maximumCommissionPerReferral: {
      type: Number,
      default: 1000 // Maximum commission amount per referral
    }
  },
  // Subscription Plans
  subscriptionPlans: {
    '3months': {
      amount: {
        type: Number,
        default: 559
      },
      features: {
        maxProducts: {
          type: Number,
          default: 50
        },
        maxImages: {
          type: Number,
          default: 200
        },
        prioritySupport: {
          type: Boolean,
          default: false
        },
        featuredListing: {
          type: Boolean,
          default: false
        }
      }
    },
    '6months': {
      amount: {
        type: Number,
        default: 779
      },
      features: {
        maxProducts: {
          type: Number,
          default: 100
        },
        maxImages: {
          type: Number,
          default: 500
        },
        prioritySupport: {
          type: Boolean,
          default: true
        },
        featuredListing: {
          type: Boolean,
          default: false
        }
      }
    },
    '1year': {
      amount: {
        type: Number,
        default: 899
      },
      features: {
        maxProducts: {
          type: Number,
          default: 200
        },
        maxImages: {
          type: Number,
          default: 1000
        },
        prioritySupport: {
          type: Boolean,
          default: true
        },
        featuredListing: {
          type: Boolean,
          default: true
        }
      }
    }
  },
  // File Upload Settings
  fileUpload: {
    maxFileSize: {
      type: Number,
      default: 200 * 1024 * 1024 // 200MB in bytes
    },
    allowedFormats: {
      type: [String],
      default: ['jpeg', 'jpg', 'png', 'gif', 'webp']
    },
    maxFilesPerRequest: {
      type: Number,
      default: 10
    }
  },
  // Withdrawal Settings
  withdrawal: {
    minimumAmount: {
      type: Number,
      default: 100
    },
    maximumAmount: {
      type: Number,
      default: 50000
    },
    processingFee: {
      type: Number,
      default: 0
    },
    processingTime: {
      type: Number,
      default: 3 // Days
    }
  },
  // KYC Settings
  kyc: {
    isRequired: {
      type: Boolean,
      default: true
    },
    autoApproval: {
      type: Boolean,
      default: false
    },
    requiredDocuments: {
      type: [String],
      default: ['pan', 'aadhar']
    }
  },
  // System Settings
  system: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'System is under maintenance. Please try again later.'
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 2 // Hours
    }
  },
  // Updated by admin
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

// Update timestamp on save
systemSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema); 