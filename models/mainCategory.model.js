const mongoose = require('mongoose');

const mainCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  icon: {
    type: String, // AWS S3 URL for category icon
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
    unique: true,
    lowercase: true,
    trim: true
  },
  vendorCount: {
    type: Number,
    default: 0
  },
  subCategoryCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate slug from name
mainCategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

// Index for search optimization
mainCategorySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MainCategory', mainCategorySchema); 