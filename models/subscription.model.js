const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['3months', '6months', '1year'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled', 'failed'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Razorpay integration
  razorpay: {
    subscriptionId: String,
    paymentId: String,
    orderId: String,
    signature: String
  },
  // Features included in this subscription
  features: {
    maxProducts: {
      type: Number,
      default: 100
    },
    maxImages: {
      type: Number,
      default: 50
    },
    featuredListing: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: true
    }
  },
  // Auto-renewal settings
  autoRenew: {
    type: Boolean,
    default: false
  },
  nextRenewalDate: Date,
  // Cancellation
  cancelledAt: Date,
  cancellationReason: String,
  // Refund information
  refund: {
    amount: Number,
    reason: String,
    processedAt: Date,
    razorpayRefundId: String
  },
  // Admin notes
  adminNotes: String,
  // Payment history
  paymentHistory: [{
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending']
    },
    razorpayPaymentId: String,
    description: String
  }]
}, {
  timestamps: true
});

// Index for vendor-based queries
subscriptionSchema.index({ vendor: 1 });

// Index for status-based queries
subscriptionSchema.index({ status: 1 });

// Index for date-based queries
subscriptionSchema.index({ startDate: 1, endDate: 1 });

// Index for Razorpay integration
subscriptionSchema.index({ 'razorpay.subscriptionId': 1 });
subscriptionSchema.index({ 'razorpay.paymentId': 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate >= now;
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.isActive) return 0;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

// Static method to get plan details
subscriptionSchema.statics.getPlanDetails = function() {
  return {
    '3months': {
      duration: 90,
      amount: 559,
      features: {
        maxProducts: 50,
        maxImages: 25,
        featuredListing: false,
        prioritySupport: false,
        analytics: true
      }
    },
    '6months': {
      duration: 180,
      amount: 779,
      features: {
        maxProducts: 75,
        maxImages: 35,
        featuredListing: true,
        prioritySupport: false,
        analytics: true
      }
    },
    '1year': {
      duration: 365,
      amount: 899,
      features: {
        maxProducts: 100,
        maxImages: 50,
        featuredListing: true,
        prioritySupport: true,
        analytics: true
      }
    }
  };
};

module.exports = mongoose.model('Subscription', subscriptionSchema); 