const User = require('../models/user.model');
const Product = require('../models/product.model');
const MainCategory = require('../models/mainCategory.model');
const SubCategory = require('../models/subCategory.model');

// Search vendors with filters
const searchVendors = async (filters = {}) => {
  try {
    const {
      query = '',
      category = null,
      subCategory = null,
      pincode = null,
      city = null,
      state = null,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = -1
    } = filters;

    // Build search query
    let searchQuery = {
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true
    };

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Category filter
    if (category) {
      searchQuery['vendorDetails.mainCategory'] = category;
    }

    // Subcategory filter
    if (subCategory) {
      searchQuery['vendorDetails.subCategory'] = subCategory;
    }

    // Location filters
    if (pincode) {
      searchQuery['address.pincode'] = pincode;
    }

    if (city) {
      searchQuery['address.city'] = { $regex: city, $options: 'i' };
    }

    if (state) {
      searchQuery['address.state'] = { $regex: state, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Execute search with pagination
    const skip = (page - 1) * limit;
    
    const vendors = await User.find(searchQuery)
      .populate('vendorDetails.mainCategory', 'name icon')
      .populate('vendorDetails.subCategory', 'name image thumbnail')
      .select('-password -loginAttempts -lockUntil')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: vendors,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    };
  } catch (error) {
    console.error('Error searching vendors:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Search products with filters
const searchProducts = async (filters = {}) => {
  try {
    const {
      query = '',
      category = null,
      subCategory = null,
      vendor = null,
      minPrice = null,
      maxPrice = null,
      pincode = null,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = -1
    } = filters;

    // Build search query
    let searchQuery = {
      isActive: true
    };

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Category filter
    if (category) {
      searchQuery['category.mainCategory'] = category;
    }

    // Subcategory filter
    if (subCategory) {
      searchQuery['category.subCategory'] = subCategory;
    }

    // Vendor filter
    if (vendor) {
      searchQuery.vendor = vendor;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery['price.amount'] = {};
      if (minPrice) searchQuery['price.amount'].$gte = minPrice;
      if (maxPrice) searchQuery['price.amount'].$lte = maxPrice;
    }

    // Location filter
    if (pincode) {
      searchQuery.availableInPincodes = pincode;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Execute search with pagination
    const skip = (page - 1) * limit;
    
    const products = await Product.find(searchQuery)
      .populate('vendor', 'name vendorDetails.shopName vendorDetails.shopDescription')
      .populate('category.mainCategory', 'name icon')
      .populate('category.subCategory', 'name image thumbnail')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(searchQuery);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get search suggestions
const getSearchSuggestions = async (query, type = 'vendor') => {
  try {
    if (!query || query.length < 2) {
      return {
        success: true,
        data: []
      };
    }

    let suggestions = [];

    if (type === 'vendor') {
      // Get vendor suggestions
      const vendors = await User.find({
        role: 'vendor',
        isActive: true,
        $or: [
          { 'vendorDetails.shopName': { $regex: query, $options: 'i' } },
          { 'vendorDetails.shopDescription': { $regex: query, $options: 'i' } },
          { 'vendorDetails.metaTags': { $regex: query, $options: 'i' } }
        ]
      })
      .select('vendorDetails.shopName vendorDetails.shopDescription')
      .limit(5)
      .lean();

      suggestions = vendors.map(vendor => ({
        type: 'vendor',
        text: vendor.vendorDetails.shopName,
        description: vendor.vendorDetails.shopDescription
      }));
    } else if (type === 'product') {
      // Get product suggestions
      const products = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      })
      .select('name description price')
      .limit(5)
      .lean();

      suggestions = products.map(product => ({
        type: 'product',
        text: product.name,
        description: product.description,
        price: product.price.amount
      }));
    }

    return {
      success: true,
      data: suggestions
    };
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get popular searches
const getPopularSearches = async () => {
  try {
    // This would typically come from analytics/logs
    // For now, returning some sample popular searches
    const popularSearches = [
      'restaurants',
      'plumbers',
      'electricians',
      'doctors',
      'dentists',
      'beauty salons',
      'gyms',
      'schools',
      'hotels',
      'shopping'
    ];

    return {
      success: true,
      data: popularSearches
    };
  } catch (error) {
    console.error('Error getting popular searches:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get search analytics
const getSearchAnalytics = async (filters = {}) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date(),
      category = null
    } = filters;

    // Build date filter
    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Get vendor analytics
    const vendorStats = await User.aggregate([
      {
        $match: {
          role: 'vendor',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get product analytics
    const productStats = await Product.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get category distribution
    const categoryStats = await User.aggregate([
      {
        $match: {
          role: 'vendor',
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: 'maincategories',
          localField: 'vendorDetails.mainCategory',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return {
      success: true,
      data: {
        vendorStats,
        productStats,
        categoryStats
      }
    };
  } catch (error) {
    console.error('Error getting search analytics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Advanced search with multiple criteria
const advancedSearch = async (criteria = {}) => {
  try {
    const {
      query = '',
      categories = [],
      subCategories = [],
      locations = [],
      priceRange = {},
      features = [],
      rating = null,
      page = 1,
      limit = 10
    } = criteria;

    // Build complex search query
    let searchQuery = {
      role: 'vendor',
      isActive: true,
      'vendorDetails.subscription.isActive': true
    };

    // Text search
    if (query) {
      searchQuery.$text = { $search: query };
    }

    // Category filters
    if (categories.length > 0) {
      searchQuery['vendorDetails.mainCategory'] = { $in: categories };
    }

    if (subCategories.length > 0) {
      searchQuery['vendorDetails.subCategory'] = { $in: subCategories };
    }

    // Location filters
    if (locations.length > 0) {
      searchQuery.$or = [
        { 'address.pincode': { $in: locations } },
        { 'address.city': { $in: locations } },
        { 'address.state': { $in: locations } }
      ];
    }

    // Execute search
    const skip = (page - 1) * limit;
    
    const results = await User.find(searchQuery)
      .populate('vendorDetails.mainCategory', 'name icon')
      .populate('vendorDetails.subCategory', 'name image thumbnail')
      .select('-password')
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(searchQuery);

    return {
      success: true,
      data: results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Error in advanced search:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  searchVendors,
  searchProducts,
  getSearchSuggestions,
  getPopularSearches,
  getSearchAnalytics,
  advancedSearch
}; 