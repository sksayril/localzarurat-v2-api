const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Product = require('../models/product.model');
const MainCategory = require('../models/mainCategory.model');
const SubCategory = require('../models/subCategory.model');
const VendorRating = require('../models/vendorRating.model');
const { verifyToken, customerOnly, optionalAuth, updateLastLogin } = require('../middleware/auth');
const { searchVendors, searchProducts, getSearchSuggestions, getPopularSearches } = require('../utilities/search');
const mongoose = require('mongoose');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ==================== SEARCH & DISCOVERY ====================

// Search vendors
router.get('/search/vendors', optionalAuth, async (req, res) => {
  try {
    const filters = {
      query: req.query.query,
      category: req.query.category,
      subCategory: req.query.subCategory,
      pincode: req.query.pincode || req.user?.customerDetails?.preferences?.pincode,
      city: req.query.city,
      state: req.query.state,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: parseInt(req.query.sortOrder) || -1
    };

    const result = await searchVendors(filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Search vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search products
router.get('/search/products', optionalAuth, async (req, res) => {
  try {
    const filters = {
      query: req.query.query,
      category: req.query.category,
      subCategory: req.query.subCategory,
      vendor: req.query.vendor,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      pincode: req.query.pincode || req.user?.customerDetails?.preferences?.pincode,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: parseInt(req.query.sortOrder) || -1
    };

    const result = await searchProducts(filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { query, type = 'vendor' } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const result = await getSearchSuggestions(query, type);
    res.json(result);
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get popular searches
router.get('/search/popular', async (req, res) => {
  try {
    const result = await getPopularSearches();
    res.json(result);
  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== CATEGORIES ====================

// Get all main categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await MainCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('name icon description slug vendorCount')
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get sub categories by main category
router.get('/categories/:mainCategoryId/subcategories', async (req, res) => {
  try {
    const { mainCategoryId } = req.params;

    const subCategories = await SubCategory.find({ 
      mainCategory: mainCategoryId,
      isActive: true 
    })
    .populate('mainCategory', 'name icon')
    .sort({ sortOrder: 1, name: 1 })
    .select('name image thumbnail description slug vendorCount')
    .lean();

    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    console.error('Get sub categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all subcategories with vendor counts
router.get('/subcategories', async (req, res) => {
  try {
    const { mainCategory, limit = 50 } = req.query;
    
    let query = { isActive: true };
    if (mainCategory) {
      query.mainCategory = mainCategory;
    }

    const subCategories = await SubCategory.find(query)
      .populate('mainCategory', 'name icon')
      .sort({ sortOrder: 1, name: 1 })
      .limit(parseInt(limit))
      .select('name image thumbnail description slug vendorCount mainCategory')
      .lean();

    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    console.error('Get all subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendors/shops by main category
router.get('/categories/:mainCategoryId/vendors', optionalAuth, async (req, res) => {
  try {
    const { mainCategoryId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;
    const skip = (page - 1) * limit;

    // Verify main category exists and is active
    const mainCategory = await MainCategory.findOne({ 
      _id: mainCategoryId,
      isActive: true 
    }).lean();

    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    // Get vendors in this main category
    const vendors = await User.find({
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true,
      'vendorDetails.mainCategory': mainCategoryId
    })
    .populate('vendorDetails.mainCategory', 'name icon')
    .populate('vendorDetails.subCategory', 'name image thumbnail')
    .select('-password -loginAttempts -lockUntil -email')
    .sort({ [sortBy]: parseInt(sortOrder) })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await User.countDocuments({
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true,
      'vendorDetails.mainCategory': mainCategoryId
    });

    // Check if user has favorited any of these vendors
    let vendorsWithFavorites = vendors;
    if (req.user) {
      const userFavorites = req.user.customerDetails?.favorites || [];
      vendorsWithFavorites = vendors.map(vendor => ({
        ...vendor,
        isFavorited: userFavorites.some(fav => fav.vendor.toString() === vendor._id.toString())
      }));
    }

    res.json({
      success: true,
      data: {
        mainCategory,
        vendors: vendorsWithFavorites
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get vendors by main category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendors/shops by subcategory with full shop information
router.get('/subcategories/:subCategoryId/vendors', async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;
    const skip = (page - 1) * limit;

    // Validate ObjectId
    if (!isValidObjectId(subCategoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subcategory ID format'
      });
    }

    // Verify subcategory exists and is active
    const subCategory = await SubCategory.findOne({ 
      _id: subCategoryId,
      isActive: true 
    })
    .populate('mainCategory', 'name icon')
    .lean();

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Get vendors in this subcategory with full shop information
    const vendors = await User.find({
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true,
      'vendorDetails.subCategory': subCategoryId
    })
    .populate('vendorDetails.mainCategory', 'name icon description slug')
    .populate('vendorDetails.subCategory', 'name image thumbnail description slug')
    .select('-password -loginAttempts -lockUntil -email')
    .sort({ [sortBy]: parseInt(sortOrder) })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await User.countDocuments({
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true,
      'vendorDetails.subCategory': subCategoryId
    });

    // Get product counts for each vendor
    const vendorIds = vendors.map(vendor => vendor._id);
    const productCounts = await Product.aggregate([
      {
        $match: {
          vendor: { $in: vendorIds },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$vendor',
          productCount: { $sum: 1 },
          featuredProductCount: {
            $sum: { $cond: ['$isFeatured', 1, 0] }
          }
        }
      }
    ]);

    // Create a map of vendor ID to product counts
    const productCountMap = {};
    productCounts.forEach(item => {
      productCountMap[item._id.toString()] = {
        totalProducts: item.productCount,
        featuredProducts: item.featuredProductCount
      };
    });

    // Format vendor data with complete shop information
    const formattedVendors = vendors.map(vendor => {
      const productInfo = productCountMap[vendor._id.toString()] || { totalProducts: 0, featuredProducts: 0 };
      
      return {
        _id: vendor._id,
        name: vendor.name,
        phone: vendor.phone,
        email: vendor.email,
        profileImage: vendor.profileImage,
        address: vendor.address,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        vendorDetails: {
          shopName: vendor.vendorDetails.shopName,
          shopDescription: vendor.vendorDetails.shopDescription,
          shopImages: vendor.vendorDetails.shopImages || [],
          shopAddress: vendor.vendorDetails.shopAddress,
          shopContactNumber: vendor.vendorDetails.shopContactNumber,
          shopEmail: vendor.vendorDetails.shopEmail,
          shopWebsite: vendor.vendorDetails.shopWebsite,
          shopTimings: vendor.vendorDetails.shopTimings,
          mainCategory: vendor.vendorDetails.mainCategory,
          subCategory: vendor.vendorDetails.subCategory,
          averageRating: vendor.vendorDetails.averageRating || 0,
          totalRatings: vendor.vendorDetails.totalRatings || 0,
          isShopListed: vendor.vendorDetails.isShopListed,
          shopListedAt: vendor.vendorDetails.shopListedAt,
          subscription: vendor.vendorDetails.subscription,
          businessHours: vendor.vendorDetails.businessHours,
          services: vendor.vendorDetails.services || [],
          specializations: vendor.vendorDetails.specializations || [],
          certifications: vendor.vendorDetails.certifications || [],
          awards: vendor.vendorDetails.awards || [],
          socialMedia: vendor.vendorDetails.socialMedia || {},
          paymentMethods: vendor.vendorDetails.paymentMethods || [],
          deliveryOptions: vendor.vendorDetails.deliveryOptions || [],
          returnPolicy: vendor.vendorDetails.returnPolicy,
          warrantyInfo: vendor.vendorDetails.warrantyInfo
        },
        productInfo,
        lastLogin: vendor.lastLogin
      };
    });

    // Check if user has favorited any of these vendors
    let vendorsWithFavorites = formattedVendors;
    if (req.user) {
      const userFavorites = req.user.customerDetails?.favorites || [];
      vendorsWithFavorites = formattedVendors.map(vendor => ({
        ...vendor,
        isFavorited: userFavorites.some(fav => fav.vendor.toString() === vendor._id.toString())
      }));
    }

    res.json({
      success: true,
      data: {
        subCategory,
        vendors: vendorsWithFavorites
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get vendors by subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== VENDOR DETAILS ====================

// Get vendors/shops with products by subcategory
router.get('/subcategories/:subCategoryId/vendors-with-products', async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const { page = 1, limit = 10, productLimit = 5, sortBy = 'createdAt', sortOrder = -1 } = req.query;
    const skip = (page - 1) * limit;

    // Validate ObjectId
    if (!isValidObjectId(subCategoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subcategory ID format'
      });
    }

    // Verify subcategory exists and is active
    const subCategory = await SubCategory.findOne({ 
      _id: subCategoryId,
      isActive: true 
    })
    .populate('mainCategory', 'name icon description slug')
    .lean();

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Get vendors in this subcategory
    const vendors = await User.find({
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true,
      'vendorDetails.subCategory': subCategoryId
    })
    .populate('vendorDetails.mainCategory', 'name icon description slug')
    .populate('vendorDetails.subCategory', 'name image thumbnail description slug')
    .select('-password -loginAttempts -lockUntil -email')
    .sort({ [sortBy]: parseInt(sortOrder) })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await User.countDocuments({
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true,
      'vendorDetails.subCategory': subCategoryId
    });

    // Get products for each vendor
    const vendorIds = vendors.map(vendor => vendor._id);
    const products = await Product.find({
      vendor: { $in: vendorIds },
      isActive: true
    })
    .populate('category.mainCategory', 'name icon')
    .populate('category.subCategory', 'name image thumbnail')
    .sort({ isFeatured: -1, createdAt: -1 })
    .select('name description price images primaryImage views isFeatured vendor')
    .lean();

    // Group products by vendor
    const productsByVendor = {};
    products.forEach(product => {
      const vendorId = product.vendor.toString();
      if (!productsByVendor[vendorId]) {
        productsByVendor[vendorId] = [];
      }
      productsByVendor[vendorId].push(product);
    });

    // Format vendor data with products and complete shop information
    const formattedVendors = vendors.map(vendor => {
      const vendorProducts = productsByVendor[vendor._id.toString()] || [];
      const featuredProducts = vendorProducts.filter(p => p.isFeatured).slice(0, parseInt(productLimit));
      const recentProducts = vendorProducts
        .filter(p => !p.isFeatured)
        .slice(0, parseInt(productLimit) - featuredProducts.length);
      
      const displayProducts = [...featuredProducts, ...recentProducts];
      
      return {
        _id: vendor._id,
        name: vendor.name,
        phone: vendor.phone,
        email: vendor.email,
        profileImage: vendor.profileImage,
        address: vendor.address,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        vendorDetails: {
          shopName: vendor.vendorDetails.shopName,
          shopDescription: vendor.vendorDetails.shopDescription,
          shopImages: vendor.vendorDetails.shopImages || [],
          shopAddress: vendor.vendorDetails.shopAddress,
          shopContactNumber: vendor.vendorDetails.shopContactNumber,
          shopEmail: vendor.vendorDetails.shopEmail,
          shopWebsite: vendor.vendorDetails.shopWebsite,
          shopTimings: vendor.vendorDetails.shopTimings,
          mainCategory: vendor.vendorDetails.mainCategory,
          subCategory: vendor.vendorDetails.subCategory,
          averageRating: vendor.vendorDetails.averageRating || 0,
          totalRatings: vendor.vendorDetails.totalRatings || 0,
          isShopListed: vendor.vendorDetails.isShopListed,
          shopListedAt: vendor.vendorDetails.shopListedAt,
          subscription: vendor.vendorDetails.subscription,
          businessHours: vendor.vendorDetails.businessHours,
          services: vendor.vendorDetails.services || [],
          specializations: vendor.vendorDetails.specializations || [],
          certifications: vendor.vendorDetails.certifications || [],
          awards: vendor.vendorDetails.awards || [],
          socialMedia: vendor.vendorDetails.socialMedia || {},
          paymentMethods: vendor.vendorDetails.paymentMethods || [],
          deliveryOptions: vendor.vendorDetails.deliveryOptions || [],
          returnPolicy: vendor.vendorDetails.returnPolicy,
          warrantyInfo: vendor.vendorDetails.warrantyInfo
        },
        productInfo: {
          totalProducts: vendorProducts.length,
          featuredProducts: vendorProducts.filter(p => p.isFeatured).length,
          displayProducts: displayProducts
        },
        lastLogin: vendor.lastLogin
      };
    });

    // Check if user has favorited any of these vendors
    let vendorsWithFavorites = formattedVendors;
    if (req.user) {
      const userFavorites = req.user.customerDetails?.favorites || [];
      vendorsWithFavorites = formattedVendors.map(vendor => ({
        ...vendor,
        isFavorited: userFavorites.some(fav => fav.vendor.toString() === vendor._id.toString())
      }));
    }

    res.json({
      success: true,
      data: {
        subCategory,
        vendors: vendorsWithFavorites
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get vendors with products by subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor details
router.get('/vendors/:id',  async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor ID format'
      });
    }

    const vendor = await User.findOne({ 
      _id: id, 
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true
    })
    .populate('vendorDetails.mainCategory', 'name icon')
    .populate('vendorDetails.subCategory', 'name image thumbnail')
    .select('-password -loginAttempts -lockUntil -email')
    .lean();

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get vendor products
    const products = await Product.find({ 
      vendor: id,
      isActive: true 
    })
    .populate('category.mainCategory', 'name icon')
    .populate('category.subCategory', 'name image thumbnail')
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(10)
    .select('name description price images primaryImage views')
    .lean();

    // Get vendor rating statistics
    const ratingStats = await VendorRating.getVendorRatingStats(id);

    // Get recent reviews (top 3)
    const recentReviews = await VendorRating.find({
      vendor: id,
      status: 'approved'
    })
    .populate('customer', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(3)
    .select('rating review createdAt isAnonymous')
    .lean();

    // Check if user has favorited this vendor
    let isFavorited = false;
    if (req.user) {
      isFavorited = req.user.customerDetails.favorites.some(
        fav => fav.vendor.toString() === id
      );
    }

    // Format vendor data for better presentation
    const vendorData = {
      _id: vendor._id,
      name: vendor.name,
      phone: vendor.phone,
      profileImage: vendor.profileImage,
      address: vendor.address,
      vendorDetails: {
        shopName: vendor.vendorDetails.shopName,
        shopDescription: vendor.vendorDetails.shopDescription,
        shopImages: vendor.vendorDetails.shopImages,
        shopAddress: vendor.vendorDetails.shopAddress,
        mainCategory: vendor.vendorDetails.mainCategory,
        subCategory: vendor.vendorDetails.subCategory,
        averageRating: vendor.vendorDetails.averageRating || 0,
        totalRatings: vendor.vendorDetails.totalRatings || 0,
        isShopListed: vendor.vendorDetails.isShopListed,
        shopListedAt: vendor.vendorDetails.shopListedAt
      },
      createdAt: vendor.createdAt
    };

    res.json({
      success: true,
      data: {
        vendor: vendorData,
        products,
        ratingStats,
        recentReviews,
        isFavorited
      }
    });
  } catch (error) {
    console.error('Get vendor details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor products
router.get('/vendors/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Verify vendor exists and is active
    const vendor = await User.findOne({ 
      _id: id, 
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const products = await Product.find({ 
      vendor: id,
      isActive: true 
    })
    .populate('category.mainCategory', 'name icon')
    .populate('category.subCategory', 'name image thumbnail')
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await Product.countDocuments({ 
      vendor: id,
      isActive: true 
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== PRODUCT DETAILS ====================

// Get product details
router.get('/products/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ 
      _id: id,
      isActive: true 
    })
    .populate('vendor', 'name vendorDetails.shopName vendorDetails.shopDescription vendorDetails.shopImages')
    .populate('category.mainCategory', 'name icon')
    .populate('category.subCategory', 'name image thumbnail')
    .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Check if user has favorited this product
    let isFavorited = false;
    if (req.user) {
      isFavorited = product.favorites.some(
        fav => fav.user.toString() === req.user._id.toString()
      );
    }

    // Remove sensitive data
    delete product.favorites;

    res.json({
      success: true,
      data: {
        product,
        isFavorited
      }
    });
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== CUSTOMER FAVORITES (AUTHENTICATED) ====================

// Add vendor to favorites
router.post('/favorites/vendors/:id', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user._id;

    // Check if vendor exists and is active
    const vendor = await User.findOne({ 
      _id: id, 
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if already favorited
    const existingFavorite = req.user.customerDetails.favorites.find(
      fav => fav.vendor.toString() === id
    );

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Vendor is already in your favorites'
      });
    }

    // Add to favorites
    await User.findByIdAndUpdate(customerId, {
      $push: {
        'customerDetails.favorites': {
          vendor: id,
          addedAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Vendor added to favorites successfully'
    });
  } catch (error) {
    console.error('Add vendor to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove vendor from favorites
router.delete('/favorites/vendors/:id', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user._id;

    // Remove from favorites
    await User.findByIdAndUpdate(customerId, {
      $pull: {
        'customerDetails.favorites': { vendor: id }
      }
    });

    res.json({
      success: true,
      message: 'Vendor removed from favorites successfully'
    });
  } catch (error) {
    console.error('Remove vendor from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get customer favorites
router.get('/favorites/vendors', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const customerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const customer = await User.findById(customerId)
      .populate({
        path: 'customerDetails.favorites.vendor',
        match: { 
          role: 'vendor',
          isActive: true,
          'vendorDetails.subscription.isActive': true
        },
        select: 'name vendorDetails.shopName vendorDetails.shopDescription vendorDetails.mainCategory vendorDetails.subCategory',
        populate: [
          { path: 'vendorDetails.mainCategory', select: 'name icon' },
          { path: 'vendorDetails.subCategory', select: 'name image thumbnail' }
        ]
      })
      .select('customerDetails.favorites')
      .lean();

    // Filter out null vendors (deleted or inactive)
    const favorites = customer.customerDetails.favorites
      .filter(fav => fav.vendor)
      .slice(skip, skip + limit);

    const total = customer.customerDetails.favorites.filter(fav => fav.vendor).length;

    res.json({
      success: true,
      data: favorites,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add product to favorites
router.post('/favorites/products/:id', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user._id;

    // Check if product exists and is active
    const product = await Product.findOne({ 
      _id: id,
      isActive: true 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already favorited
    const existingFavorite = product.favorites.find(
      fav => fav.user.toString() === customerId.toString()
    );

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your favorites'
      });
    }

    // Add to favorites
    await Product.findByIdAndUpdate(id, {
      $push: {
        favorites: {
          user: customerId,
          addedAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Product added to favorites successfully'
    });
  } catch (error) {
    console.error('Add product to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove product from favorites
router.delete('/favorites/products/:id', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user._id;

    // Remove from favorites
    await Product.findByIdAndUpdate(id, {
      $pull: {
        favorites: { user: customerId }
      }
    });

    res.json({
      success: true,
      message: 'Product removed from favorites successfully'
    });
  } catch (error) {
    console.error('Remove product from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get favorite products
router.get('/favorites/products', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const customerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      'favorites.user': customerId,
      isActive: true
    })
    .populate('vendor', 'name vendorDetails.shopName')
    .populate('category.mainCategory', 'name icon')
    .populate('category.subCategory', 'name image thumbnail')
    .sort({ 'favorites.addedAt': -1 })
    .skip(skip)
    .limit(limit)
    .select('name description price images primaryImage views')
    .lean();

    const total = await Product.countDocuments({
      'favorites.user': customerId,
      isActive: true
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get favorite products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== CUSTOMER PREFERENCES ====================

// Update customer preferences
router.put('/preferences', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const customerId = req.user._id;
    const { categories, pincode } = req.body;

    const updateData = {};
    if (categories) updateData['customerDetails.preferences.categories'] = categories;
    if (pincode) updateData['customerDetails.preferences.pincode'] = pincode;

    const customer = await User.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true }
    )
    .select('customerDetails.preferences')
    .lean();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: customer.customerDetails.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get customer preferences
router.get('/preferences', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const customerId = req.user._id;

    const customer = await User.findById(customerId)
      .populate('customerDetails.preferences.categories', 'name icon')
      .select('customerDetails.preferences')
      .lean();

    res.json({
      success: true,
      data: customer.customerDetails.preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== NEARBY VENDORS ====================

// Get nearby vendors by pincode
router.get('/nearby/:pincode', optionalAuth, async (req, res) => {
  try {
    const { pincode } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const vendors = await User.find({
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true,
      'address.pincode': pincode
    })
    .populate('vendorDetails.mainCategory', 'name icon')
    .populate('vendorDetails.subCategory', 'name image thumbnail')
    .select('-password -loginAttempts -lockUntil -email')
    .sort({ 'vendorDetails.subscription.isActive': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await User.countDocuments({
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true,
      'address.pincode': pincode
    });

    res.json({
      success: true,
      data: vendors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get nearby vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== VENDOR RATINGS & REVIEWS ====================

// Rate a vendor
router.post('/vendors/:id/rate', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const { id: vendorId } = req.params;
    const customerId = req.user._id;
    const { rating, review, categories, isAnonymous, tags } = req.body;

    // Check if vendor exists and is active
    const vendor = await User.findOne({
      _id: vendorId,
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found or not active'
      });
    }

    // Check if customer can rate this vendor
    const canRate = await VendorRating.canCustomerRateVendor(customerId, vendorId);
    if (!canRate.canRate) {
      return res.status(400).json({
        success: false,
        message: canRate.reason
      });
    }

    // Create rating
    const vendorRating = new VendorRating({
      vendor: vendorId,
      customer: customerId,
      rating,
      review,
      categories,
      isAnonymous,
      tags
    });

    await vendorRating.save();

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: vendorRating.rating,
        review: vendorRating.review,
        submittedAt: vendorRating.createdAt
      }
    });
  } catch (error) {
    console.error('Rate vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update vendor rating
router.put('/vendors/:id/rate', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const { id: vendorId } = req.params;
    const customerId = req.user._id;
    const updateData = req.body;

    // Find existing rating
    const existingRating = await VendorRating.findOne({
      vendor: vendorId,
      customer: customerId
    });

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Update rating
    const updatedRating = await VendorRating.findByIdAndUpdate(
      existingRating._id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: {
        rating: updatedRating.rating,
        review: updatedRating.review,
        updatedAt: updatedRating.updatedAt
      }
    });
  } catch (error) {
    console.error('Update vendor rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete vendor rating
router.delete('/vendors/:id/rate', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const { id: vendorId } = req.params;
    const customerId = req.user._id;

    // Find and delete rating
    const deletedRating = await VendorRating.findOneAndDelete({
      vendor: vendorId,
      customer: customerId
    });

    if (!deletedRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete vendor rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor ratings and reviews
router.get('/vendors/:id/ratings', optionalAuth, async (req, res) => {
  try {
    const { id: vendorId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;
    const skip = (page - 1) * limit;

    // Check if vendor exists
    const vendor = await User.findOne({
      _id: vendorId,
      role: 'vendor',
      isActive: true
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get approved ratings
    const ratings = await VendorRating.find({
      vendor: vendorId,
      status: 'approved'
    })
    .populate('customer', 'name profileImage')
    .sort({ [sortBy]: parseInt(sortOrder) })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await VendorRating.countDocuments({
      vendor: vendorId,
      status: 'approved'
    });

    // Get rating statistics
    const stats = await VendorRating.getVendorRatingStats(vendorId);

    res.json({
      success: true,
      data: {
        ratings,
        statistics: stats,
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          vendorDetails: {
            shopName: vendor.vendorDetails.shopName,
            averageRating: vendor.vendorDetails.averageRating,
            totalRatings: vendor.vendorDetails.totalRatings
          }
        }
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get vendor ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Vote on review helpfulness
router.post('/ratings/:id/helpful', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const { id: ratingId } = req.params;
    const customerId = req.user._id;
    const { isHelpful } = req.body;

    // Find rating
    const rating = await VendorRating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user already voted
    const existingVote = rating.helpfulVotes.find(
      vote => vote.user.toString() === customerId
    );

    if (existingVote) {
      // Update existing vote
      existingVote.isHelpful = isHelpful;
      existingVote.votedAt = new Date();
    } else {
      // Add new vote
      rating.helpfulVotes.push({
        user: customerId,
        isHelpful,
        votedAt: new Date()
      });
    }

    await rating.save();

    res.json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    console.error('Vote on review helpfulness error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get customer's ratings
router.get('/my-ratings', verifyToken, customerOnly, updateLastLogin, async (req, res) => {
  try {
    const customerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ratings = await VendorRating.find({
      customer: customerId
    })
    .populate('vendor', 'name vendorDetails.shopName vendorDetails.shopImages')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await VendorRating.countDocuments({
      customer: customerId
    });

    res.json({
      success: true,
      data: ratings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get customer ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 