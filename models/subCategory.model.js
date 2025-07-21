const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  mainCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MainCategory',
    required: true
  },
  image: {
    type: String, // AWS S3 URL for subcategory image
    required: true
  },
  thumbnail: {
    type: String, // AWS S3 URL for subcategory thumbnail
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
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
    lowercase: true,
    trim: true
  },
  vendorCount: {
    type: Number,
    default: 0
  },
  // SEO fields
  keywords: [String],
  // Additional fields for better categorization
  features: [String], // Array of features this subcategory offers
  popularTags: [String] // Popular tags associated with this subcategory
}, {
  timestamps: true
});

// Generate slug from name
subCategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Compound index for mainCategory and name to ensure uniqueness within main category
subCategorySchema.index({ mainCategory: 1, name: 1 }, { unique: true });

// Index for search optimization
subCategorySchema.index({ name: 'text', description: 'text', keywords: 'text' });

// Virtual for full slug (mainCategory.slug/subCategory.slug)
subCategorySchema.virtual('fullSlug').get(function() {
  // Check if mainCategory is populated and has slug
  if (this.mainCategory && typeof this.mainCategory === 'object' && this.mainCategory.slug) {
    return `${this.mainCategory.slug}/${this.slug || ''}`;
  }
  // Fallback if mainCategory is not populated or doesn't have slug
  return this.slug || '';
});

// Ensure virtual fields are serialized
subCategorySchema.set('toJSON', { virtuals: true });
subCategorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SubCategory', subCategorySchema); 