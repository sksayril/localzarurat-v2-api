const mongoose = require('mongoose');

const employeeCommissionSchema = new mongoose.Schema({
  // Commission details
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  
  // Commission calculation
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
    subscriptionAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Commission status and payment
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  
  payment: {
    paidAt: {
      type: Date,
      default: null
    },
    transactionId: {
      type: String,
      default: null
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'bank_transfer', 'upi'],
      default: 'wallet'
    }
  },
  
  // Admin approval details
  admin: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: null
    }
  },
  
  // District information
  district: {
    name: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    }
  },
  
  // Commission period
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
employeeCommissionSchema.index({ employee: 1 });
employeeCommissionSchema.index({ seller: 1 });
employeeCommissionSchema.index({ subscription: 1 });
employeeCommissionSchema.index({ status: 1 });
employeeCommissionSchema.index({ 'district.name': 1, 'district.state': 1 });
employeeCommissionSchema.index({ createdAt: -1 });

// Virtual for commission details
employeeCommissionSchema.virtual('commissionDetails').get(function() {
  return {
    percentage: this.commission.percentage,
    amount: this.commission.amount,
    subscriptionAmount: this.commission.subscriptionAmount,
    calculatedAt: this.createdAt
  };
});

// Method to approve commission
employeeCommissionSchema.methods.approve = function(adminId, notes = null) {
  if (this.status !== 'pending') {
    throw new Error('Commission is not in pending status');
  }
  
  this.status = 'paid';
  this.payment.paidAt = new Date();
  this.payment.transactionId = `TXN_${Date.now()}_${this._id}`;
  this.admin.approvedBy = adminId;
  this.admin.approvedAt = new Date();
  this.admin.notes = notes;
  
  return this.save();
};

// Method to cancel commission
employeeCommissionSchema.methods.cancel = function(adminId, notes = null) {
  if (this.status !== 'pending') {
    throw new Error('Commission is not in pending status');
  }
  
  this.status = 'cancelled';
  this.admin.approvedBy = adminId;
  this.admin.approvedAt = new Date();
  this.admin.notes = notes;
  
  return this.save();
};

// Static method to calculate commission for a subscription
employeeCommissionSchema.statics.calculateCommission = async function(
  employeeId, 
  sellerId, 
  subscriptionId, 
  subscriptionAmount, 
  commissionPercentage
) {
  const commissionAmount = (subscriptionAmount * commissionPercentage) / 100;
  
  const commission = new this({
    employee: employeeId,
    seller: sellerId,
    subscription: subscriptionId,
    commission: {
      percentage: commissionPercentage,
      amount: commissionAmount,
      subscriptionAmount: subscriptionAmount
    },
    district: {
      name: 'Default', // This should be populated from seller's district
      state: 'Default'
    },
    period: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  });
  
  return await commission.save();
};

// Static method to get commissions by employee
employeeCommissionSchema.statics.getCommissionsByEmployee = function(employeeId, status = null) {
  const query = { employee: employeeId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('seller', 'name email vendorDetails.shopName')
    .populate('subscription', 'plan amount status')
    .populate('admin.approvedBy', 'name')
    .sort({ createdAt: -1 });
};

// Static method to get commission statistics
employeeCommissionSchema.statics.getCommissionStatistics = function(employeeId = null) {
  const matchStage = employeeId ? { employee: new mongoose.Types.ObjectId(employeeId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$commission.amount' },
        averageAmount: { $avg: '$commission.amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('EmployeeCommission', employeeCommissionSchema);
