const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    mainCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MainCategory',
      required: true
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true
    }
  },
  images: [{
    url: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    alt: String
  }],
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    isNegotiable: {
      type: Boolean,
      default: false
    }
  },
  specifications: [{
    name: String,
    value: String
  }],
  features: [String],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  stock: {
    quantity: {
      type: Number,
      default: 0
    },
    isInStock: {
      type: Boolean,
      default: true
    }
  },
  // SEO fields
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Location based
  availableInPincodes: [String],
  // Contact information
  contactInfo: {
    phone: String,
    whatsapp: String,
    email: String
  }
}, {
  timestamps: true
});

// Generate slug from name
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Index for search optimization
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text',
  features: 'text'
});

// Index for category-based queries
productSchema.index({ 'category.mainCategory': 1, 'category.subCategory': 1 });

// Index for vendor-based queries
productSchema.index({ vendor: 1 });

// Index for location-based queries
productSchema.index({ availableInPincodes: 1 });

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema); 