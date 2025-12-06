const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  // Basic employee information
  employeeId: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Employee role and hierarchy
  role: {
    type: String,
    enum: ['super_employee', 'employee'],
    required: true
  },
  superEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null // null for super employees, ObjectId for regular employees
  },
  
  // Commission percentage for regular employees (set by super employee)
  employeeCommissionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // District assignment
  assignedDistricts: [{
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin who assigned the district
    }
  }],
  
  // Commission settings for super employees
  commissionSettings: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    },
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin who set the commission
    },
    setAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Wallet for super employees
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    transactions: [{
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      description: {
        type: String,
        required: true
      },
      reference: {
        type: String, // Reference to seller subscription or other transaction
        default: null
      },
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Employee statistics
  statistics: {
    totalSellersAssigned: {
      type: Number,
      default: 0
    },
    totalCommissionEarned: {
      type: Number,
      default: 0
    },
    totalCommissionPaid: {
      type: Number,
      default: 0
    },
    lastCommissionDate: {
      type: Date,
      default: null
    }
  },
  
  // Status and permissions
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile information
  profileImage: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Security and login tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Admin who created this employee
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Last admin who updated this employee
  }
}, {
  timestamps: true
});

// Indexes for better performance
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ phone: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ superEmployee: 1 });
employeeSchema.index({ 'assignedDistricts.district': 1, 'assignedDistricts.state': 1 });
employeeSchema.index({ isActive: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to generate employee ID and hash password
employeeSchema.pre('save', async function(next) {
  // Generate employee ID for new employees
  if (this.isNew) {
    const prefix = this.role === 'super_employee' ? 'SE' : 'EMP';
    const count = await this.constructor.countDocuments({ role: this.role });
    this.employeeId = `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Hash password if it's modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  next();
});

// Method to compare password
employeeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
employeeSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
employeeSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  return this.updateOne(updates);
};

// Method to check if employee can manage a district
employeeSchema.methods.canManageDistrict = function(district, state) {
  if (!this.isActive) return false;
  
  return this.assignedDistricts.some(assignment => 
    assignment.district.toLowerCase() === district.toLowerCase() &&
    assignment.state.toLowerCase() === state.toLowerCase()
  );
};

// Method to get assigned districts as array of strings
employeeSchema.methods.getAssignedDistricts = function() {
  return this.assignedDistricts.map(assignment => 
    `${assignment.district}, ${assignment.state}`
  );
};

// Method to add commission to wallet
employeeSchema.methods.addCommission = function(amount, description, reference = null) {
  if (this.role !== 'super_employee') {
    throw new Error('Only super employees can receive commissions');
  }
  
  this.wallet.balance += amount;
  this.wallet.transactions.push({
    type: 'credit',
    amount,
    description,
    reference,
    date: new Date()
  });
  
  this.statistics.totalCommissionEarned += amount;
  this.statistics.lastCommissionDate = new Date();
  
  return this.save();
};

// Method to deduct from wallet
employeeSchema.methods.deductFromWallet = function(amount, description) {
  if (this.wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  
  this.wallet.balance -= amount;
  this.wallet.transactions.push({
    type: 'debit',
    amount,
    description,
    date: new Date()
  });
  
  this.statistics.totalCommissionPaid += amount;
  
  return this.save();
};

// Static method to get employees by district
employeeSchema.statics.getEmployeesByDistrict = function(district, state) {
  return this.find({
    isActive: true,
    'assignedDistricts.district': new RegExp(district, 'i'),
    'assignedDistricts.state': new RegExp(state, 'i')
  });
};

// Static method to get super employees with available districts
employeeSchema.statics.getSuperEmployeesWithDistricts = function() {
  return this.find({
    role: 'super_employee',
    isActive: true
  }).select('employeeId name email assignedDistricts commissionSettings statistics');
};

module.exports = mongoose.model('Employee', employeeSchema);
