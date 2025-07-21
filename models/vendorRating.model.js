const mongoose = require('mongoose');

const vendorRatingSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Rating categories
  categories: {
    service: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    }
  },
  // Review metadata
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Admin moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderationNotes: {
    type: String,
    trim: true
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  // Helpful votes
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isHelpful: {
      type: Boolean,
      required: true
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Review images
  images: [{
    url: String,
    alt: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Review tags
  tags: [{
    type: String,
    trim: true
  }],
  // Vendor reply
  vendorReply: {
    content: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    repliedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
vendorRatingSchema.index({ vendor: 1, customer: 1 }, { unique: true });
vendorRatingSchema.index({ vendor: 1, status: 1 });
vendorRatingSchema.index({ customer: 1 });
vendorRatingSchema.index({ rating: 1 });
vendorRatingSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate average rating
vendorRatingSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('rating')) {
    try {
      // Calculate average rating for the vendor
      const ratings = await this.constructor.find({
        vendor: this.vendor,
        status: 'approved'
      });
      
      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / ratings.length;
        
        // Update vendor's average rating
        await mongoose.model('User').findByIdAndUpdate(this.vendor, {
          'vendorDetails.averageRating': Math.round(averageRating * 10) / 10,
          'vendorDetails.totalRatings': ratings.length
        });
      }
    } catch (error) {
      console.error('Error updating vendor rating:', error);
    }
  }
  next();
});

// Static method to get vendor rating statistics
vendorRatingSchema.statics.getVendorRatingStats = async function(vendorId) {
  try {
    const stats = await this.aggregate([
      {
        $match: {
          vendor: new mongoose.Types.ObjectId(vendorId),
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const stat = stats[0];
    const distribution = stat.ratingDistribution.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    return {
      averageRating: Math.round(stat.averageRating * 10) / 10,
      totalRatings: stat.totalRatings,
      ratingDistribution: {
        1: distribution[1] || 0,
        2: distribution[2] || 0,
        3: distribution[3] || 0,
        4: distribution[4] || 0,
        5: distribution[5] || 0
      }
    };
  } catch (error) {
    console.error('Error getting vendor rating stats:', error);
    throw error;
  }
};

// Instance method to check if customer can rate vendor
vendorRatingSchema.statics.canCustomerRateVendor = async function(customerId, vendorId) {
  try {
    // Check if customer has already rated this vendor
    const existingRating = await this.findOne({
      customer: customerId,
      vendor: vendorId
    });

    if (existingRating) {
      return {
        canRate: false,
        reason: 'You have already rated this vendor',
        existingRating
      };
    }

    // Check if customer has interacted with vendor (optional business logic)
    // For now, we'll allow any customer to rate any vendor
    
    return {
      canRate: true,
      reason: 'You can rate this vendor'
    };
  } catch (error) {
    console.error('Error checking if customer can rate vendor:', error);
    throw error;
  }
};

module.exports = mongoose.model('VendorRating', vendorRatingSchema); 