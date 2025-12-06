const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'vendor', 'customer', 'super_employee', 'employee'],
    default: 'customer'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
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
  // Security questions for forgot password
  securityQuestions: {
    question1: {
      question: {
        type: String,
        enum: [
          'What was your first pet\'s name?',
          'In which city were you born?',
          'What was your mother\'s maiden name?',
          'What was the name of your first school?',
          'What is your favorite movie?',
          'What was your childhood nickname?',
          'What is the name of the street you grew up on?',
          'What was your favorite food as a child?'
        ]
      },
      answer: {
        type: String,
        trim: true
      }
    },
    question2: {
      question: {
        type: String,
        enum: [
          'What was your first pet\'s name?',
          'In which city were you born?',
          'What was your mother\'s maiden name?',
          'What was the name of your first school?',
          'What is your favorite movie?',
          'What was your childhood nickname?',
          'What is the name of the street you grew up on?',
          'What was your favorite food as a child?'
        ]
      },
      answer: {
        type: String,
        trim: true
      }
    }
  },
  // Employee code for seller registration
  employeeCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: null
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  
  // Vendor specific fields
  vendorDetails: {
    // Shop listing information
    shopName: String,
    shopDescription: String,
    shopMetaTitle: String,
    shopMetaDescription: String,
    shopMetaKeywords: [String],
    shopMetaTags: [String],
    shopImages: [String], // Array of image URLs
    shopAddress: {
      pincode: {
        type: String,
        trim: true
      },
      addressLine1: {
        type: String,
        trim: true
      },
      addressLine2: {
        type: String,
        trim: true,
        default: ''
      },
      location: {
        type: String,
        trim: true
      },
      nearbyLocation: {
        type: String,
        trim: true,
        default: ''
      },
      // Geographic coordinates for location-based services
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180
        }
      }
    },
    isShopListed: {
      type: Boolean,
      default: false
    },
    shopListedAt: Date,
    
    gstNumber: {
      type: String,
      uppercase: true,
      trim: true
    },
    // Detailed address for vendor
    vendorAddress: {
      doorNumber: String,
      street: String,
      location: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    mainCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MainCategory'
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory'
    },
    // KYC Details
    kyc: {
      panNumber: {
        type: String,
        uppercase: true,
        trim: true
      },
      panImage: String, // AWS S3 URL
      aadharNumber: {
        type: String,
        trim: true
      },
      aadharFrontImage: String, // AWS S3 URL
      aadharBackImage: String, // AWS S3 URL
      isVerified: {
        type: Boolean,
        default: false
      },
      verificationDate: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    // Subscription management
    subscription: {
      currentPlan: {
        type: String,
        enum: ['3months', '6months', '1year']
      },
      status: {
        type: String,
        enum: ['inactive', 'pending', 'active', 'expired', 'cancelled'],
        default: 'inactive'
      },
      amount: Number,
      startDate: Date,
      endDate: Date,
      isActive: Boolean,
      razorpaySubscriptionId: String,
      razorpayPaymentId: String,
      features: {
        maxProducts: {
          type: Number,
          default: 0
        },
        maxImages: {
          type: Number,
          default: 0
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
    referralCode: {
      type: String,
      unique: true,
      sparse: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    wallet: {
      balance: {
        type: Number,
        default: 0
      },
      transactions: [{
        type: {
          type: String,
          enum: ['credit', 'debit']
        },
        amount: Number,
        description: String,
        date: {
          type: Date,
          default: Date.now
        }
      }]
    },
    withdrawalRequests: [{
      amount: Number,
      paymentMethod: {
        type: String,
        enum: ['upi', 'bank'],
        required: true
      },
      upiId: {
        type: String,
        trim: true
      },
      bankDetails: {
        accountNumber: {
          type: String,
          trim: true
        },
        ifscCode: {
          type: String,
          trim: true
        },
        accountHolderName: {
          type: String,
          trim: true
        },
        bankName: {
          type: String,
          trim: true
        }
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      requestDate: {
        type: Date,
        default: Date.now
      },
      processedDate: Date,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      adminNotes: {
        type: String,
        trim: true
      },
      transactionId: {
        type: String,
        trim: true
      }
    }],
    // Rating and review statistics
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  // Customer specific fields
  customerDetails: {
    preferences: {
      categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MainCategory'
      }],
      pincode: String
    },
    favorites: [{
      vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Admin specific fields
  adminDetails: {
    permissions: {
      type: [String],
      enum: ['dashboard', 'vendors', 'kyc', 'withdrawals', 'categories', 'subscriptions', 'referrals', 'settings', 'employees', 'districts', 'all'],
      default: ['all']
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isSuperAdmin: {
      type: Boolean,
      default: false
    },
    accessLevel: {
      type: String,
      enum: ['full', 'limited', 'readonly'],
      default: 'full'
    }
  },
  
  // Employee specific fields (for users with employee role)
  employeeDetails: {
    employeeId: {
      type: String,
      trim: true,
      uppercase: true
    },
    superEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    assignedDistricts: [{
      district: String,
      state: String,
      assignedAt: {
        type: Date,
        default: Date.now
      }
    }],
    permissions: {
      type: [String],
      enum: ['view_sellers', 'manage_sellers', 'view_commissions', 'manage_commissions'],
      default: ['view_sellers']
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Index for search optimization
userSchema.index({ 
  'vendorDetails.shopName': 'text', 
  'vendorDetails.shopDescription': 'text',
  'vendorDetails.shopMetaKeywords': 'text',
  'vendorDetails.shopMetaTags': 'text'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate referral code for vendors
userSchema.pre('save', function(next) {
  if (this.role === 'vendor' && !this.vendorDetails.referralCode) {
    this.vendorDetails.referralCode = 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
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

// Verify security questions
userSchema.methods.verifySecurityQuestions = function(answer1, answer2) {
  if (!this.securityQuestions || !this.securityQuestions.question1 || !this.securityQuestions.question2) {
    return false;
  }
  
  const answer1Match = this.securityQuestions.question1.answer.toLowerCase().trim() === answer1.toLowerCase().trim();
  const answer2Match = this.securityQuestions.question2.answer.toLowerCase().trim() === answer2.toLowerCase().trim();
  
  return answer1Match && answer2Match;
};

// Check if vendor has active subscription
userSchema.methods.hasActiveSubscription = function() {
  return this.vendorDetails.subscription && 
         this.vendorDetails.subscription.status === 'active' && 
         this.vendorDetails.subscription.isActive === true;
};

// Check if vendor can list shop
userSchema.methods.canListShop = function() {
  return this.hasActiveSubscription() && this.vendorDetails.isShopListed === true;
};

// Validate employee code
userSchema.statics.validateEmployeeCode = async function(employeeCode) {
  if (!employeeCode) return { valid: false, message: 'Employee code is required' };
  
  const Employee = mongoose.model('Employee');
  const employee = await Employee.findOne({ 
    employeeId: employeeCode.toUpperCase(),
    isActive: true 
  });
  
  if (!employee) {
    return { valid: false, message: 'Invalid employee code' };
  }
  
  return { 
    valid: true, 
    employee: employee,
    message: 'Valid employee code' 
  };
};

// Check if user is assigned to an employee
userSchema.methods.isAssignedToEmployee = function() {
  return !!(this.assignedEmployee || this.employeeCode);
};

module.exports = mongoose.model('User', userSchema);