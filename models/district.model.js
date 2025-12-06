const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  // District information
  name: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  state: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  // District code for easy reference
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Geographic information
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
  },
  
  // District statistics
  statistics: {
    totalSellers: {
      type: Number,
      default: 0
    },
    totalSuperEmployees: {
      type: Number,
      default: 0
    },
    totalEmployees: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
districtSchema.index({ name: 1, state: 1 }, { unique: true });
districtSchema.index({ code: 1 });
districtSchema.index({ state: 1 });
districtSchema.index({ isActive: 1 });

// Virtual for full district name
districtSchema.virtual('fullName').get(function() {
  return `${this.name}, ${this.state}`;
});

// Pre-save middleware to generate district code
districtSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    const stateCode = this.state.substring(0, 2).toUpperCase();
    const districtCode = this.name.substring(0, 3).toUpperCase();
    const count = await this.constructor.countDocuments({ 
      state: this.state,
      name: this.name 
    });
    this.code = `${stateCode}${districtCode}${String(count + 1).padStart(2, '0')}`;
  }
  next();
});

// Method to update statistics
districtSchema.methods.updateStatistics = async function() {
  const Employee = mongoose.model('Employee');
  const User = mongoose.model('User');
  
  // Count super employees assigned to this district
  const superEmployees = await Employee.countDocuments({
    role: 'super_employee',
    isActive: true,
    'assignedDistricts.district': this.name,
    'assignedDistricts.state': this.state
  });
  
  // Count regular employees assigned to this district
  const employees = await Employee.countDocuments({
    role: 'employee',
    isActive: true,
    'assignedDistricts.district': this.name,
    'assignedDistricts.state': this.state
  });
  
  // Count sellers in this district (assuming sellers have district info in their address)
  const sellers = await User.countDocuments({
    role: 'vendor',
    isActive: true,
    'vendorDetails.vendorAddress.state': this.state,
    $or: [
      { 'vendorDetails.vendorAddress.city': new RegExp(this.name, 'i') },
      { 'vendorDetails.shopAddress.location': new RegExp(this.name, 'i') }
    ]
  });
  
  // Update statistics
  this.statistics.totalSuperEmployees = superEmployees;
  this.statistics.totalEmployees = employees;
  this.statistics.totalSellers = sellers;
  this.statistics.lastUpdated = new Date();
  
  return this.save();
};

// Static method to get districts by state
districtSchema.statics.getDistrictsByState = function(state) {
  return this.find({ 
    state: new RegExp(state, 'i'),
    isActive: true 
  }).sort({ name: 1 });
};

// Static method to search districts
districtSchema.statics.searchDistricts = function(query) {
  return this.find({
    $or: [
      { name: new RegExp(query, 'i') },
      { state: new RegExp(query, 'i') },
      { code: new RegExp(query, 'i') }
    ],
    isActive: true
  }).sort({ state: 1, name: 1 });
};

// Static method to get district statistics
districtSchema.statics.getDistrictStatistics = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$state',
        totalDistricts: { $sum: 1 },
        totalSellers: { $sum: '$statistics.totalSellers' },
        totalSuperEmployees: { $sum: '$statistics.totalSuperEmployees' },
        totalEmployees: { $sum: '$statistics.totalEmployees' },
        totalRevenue: { $sum: '$statistics.totalRevenue' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('District', districtSchema);
