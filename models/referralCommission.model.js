const mongoose = require('mongoose');

const referralCommissionSchema = new mongoose.Schema({
  // Referrer (the vendor who referred)
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Referred vendor (the one who was referred)
  referredVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Referral code used
  referralCode: {
    type: String,
    required: true
  },
  // Commission details
  commission: {
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  // Subscription details that triggered commission
  subscription: {
    plan: {
      type: String,
      enum: ['3months', '6months', '1year'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true
    }
  },
  // Commission status
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // Payment details
  payment: {
    paidAt: Date,
    transactionId: String,
    adminNotes: String
  },
  // Admin management
  admin: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    notes: String
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

// Indexes for efficient queries
referralCommissionSchema.index({ referrer: 1, status: 1 });
referralCommissionSchema.index({ referredVendor: 1 });
referralCommissionSchema.index({ status: 1 });
referralCommissionSchema.index({ createdAt: -1 });

// Update timestamp on save
referralCommissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ReferralCommission', referralCommissionSchema); 