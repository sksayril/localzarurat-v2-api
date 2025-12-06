const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { S3Client } = require('@aws-sdk/client-s3');
const Joi = require('joi');
const User = require('../models/user.model');
const MainCategory = require('../models/mainCategory.model');
const SubCategory = require('../models/subCategory.model');
const Subscription = require('../models/subscription.model');
const Product = require('../models/product.model');
const ReferralCommission = require('../models/referralCommission.model');
const SystemSettings = require('../models/systemSettings.model');
const VendorRating = require('../models/vendorRating.model');
const VendorCommissionSettings = require('../models/vendorCommissionSettings.model');
const Employee = require('../models/employee.model');
const EmployeeCommission = require('../models/employeeCommission.model');
const District = require('../models/district.model');
const { verifyToken, adminOnly, updateLastLogin } = require('../middleware/auth');
const { validateQuery, validateParams, commonSchemas } = require('../middleware/validation');
const { uploadSingleImage, uploadMultipleImages, uploadSubcategoryImages } = require('../utilities/awsS3');
const { createPlans } = require('../utilities/razorpay');

// S3 Client Setup
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Apply admin middleware to all routes
router.use(verifyToken, adminOnly, updateLastLogin);

// ==================== DASHBOARD & ANALYTICS ====================

// Get admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const activeVendors = await User.countDocuments({ 
      role: 'vendor', 
      'vendorDetails.subscription.isActive': true 
    });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalCategories = await MainCategory.countDocuments({ isActive: true });
    const totalSubCategories = await SubCategory.countDocuments({ isActive: true });

    // Referral commission stats
    const pendingCommissions = await ReferralCommission.countDocuments({ status: 'pending' });
    const totalCommissions = await ReferralCommission.countDocuments({ status: 'paid' });
    const totalCommissionAmount = await ReferralCommission.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    // Recent registrations
    const recentVendors = await User.find({ role: 'vendor' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email vendorDetails.shopName createdAt')
      .lean();

    // Recent referral commissions
    const recentCommissions = await ReferralCommission.find()
      .populate('referrer', 'name vendorDetails.shopName')
      .populate('referredVendor', 'name vendorDetails.shopName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Revenue stats (from subscriptions)
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          startDate: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalVendors,
          activeVendors,
          totalCustomers,
          totalProducts,
          totalCategories,
          totalSubCategories,
          activeSubscriptions,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          pendingCommissions,
          totalCommissions,
          totalCommissionAmount: totalCommissionAmount[0]?.total || 0
        },
        recentVendors,
        recentCommissions
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== CATEGORY MANAGEMENT ====================

// Create main category
router.post('/categories/main', (req, res, next) => {
  // Create dynamic upload middleware with correct field name
  const uploadMiddleware = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET_NAME || 'elboz',
      metadata: function (req, file, cb) {
        cb(null, { 
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          customPath: 'uploads/categories'
        });
      },
      key: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `uploads/categories/${uuidv4()}${fileExtension}`;
        cb(null, fileName);
      }
    }),
    limits: {
      fileSize: 200 * 1024 * 1024, // 200MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Only jpeg|jpg|png|gif|webp files are allowed!`));
      }
    }
  }).single('icon'); // Use 'icon' field name instead of 'image'
  
  uploadMiddleware(req, res, next);
}, async (req, res) => {
  try {
    const { name, description, sortOrder, metaTitle, metaDescription } = req.body;
    
    const icon = req.file ? req.file.location : req.body.icon;
    
    if (!icon) {
      return res.status(400).json({
        success: false,
        message: 'Category icon is required'
      });
    }

    // Check for duplicate category name
    const existingCategory = await MainCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists.'
      });
    }

    const category = new MainCategory({
      name,
      icon,
      description,
      sortOrder,
      metaTitle,
      metaDescription
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Main category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create main category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all main categories
router.get('/categories/main', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const categories = await MainCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MainCategory.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get main categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update main category
router.post('/categories/main/update', (req, res, next) => {
  // Create dynamic upload middleware with correct field name
  const uploadMiddleware = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET_NAME || 'elboz',
      metadata: function (req, file, cb) {
        cb(null, { 
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          customPath: 'uploads/categories'
        });
      },
      key: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `uploads/categories/${uuidv4()}${fileExtension}`;
        cb(null, fileName);
      }
    }),
    limits: {
      fileSize: 200 * 1024 * 1024, // 200MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Only jpeg|jpg|png|gif|webp files are allowed!`));
      }
    }
  }).single('icon'); // Use 'icon' field name instead of 'image'
  
  uploadMiddleware(req, res, next);
}, async (req, res) => {
  try {
    const { id } = req.body;
    const { name, description, sortOrder, metaTitle, metaDescription } = req.body;
    
    const icon = req.file ? req.file.location : req.body.icon;

    const updateData = { name, description, sortOrder };
    if (icon) updateData.icon = icon;
    if (metaTitle) updateData.metaTitle = metaTitle;
    if (metaDescription) updateData.metaDescription = metaDescription;

    const category = await MainCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Main category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update main category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete main category
router.post('/categories/main/delete', async (req, res) => {
  try {
    const { id } = req.body;

    // Check if category has vendors or subcategories
    const vendorCount = await User.countDocuments({ 'vendorDetails.mainCategory': id });
    const subCategoryCount = await SubCategory.countDocuments({ mainCategory: id });

    if (vendorCount > 0 || subCategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${vendorCount} vendors and ${subCategoryCount} subcategories.`
      });
    }

    const category = await MainCategory.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Main category deleted successfully'
    });
  } catch (error) {
    console.error('Delete main category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create sub category
router.post('/categories/sub', uploadSubcategoryImages(), async (req, res) => {
  try {
    const { name, mainCategory, description, sortOrder, metaTitle, metaDescription, keywords, features, popularTags } = req.body;
    
    let image, thumbnail;
    
    if (req.files && req.files.image && req.files.thumbnail) {
      image = req.files.image[0].location;
      thumbnail = req.files.thumbnail[0].location;
    } else {
      image = req.body.image;
      thumbnail = req.body.thumbnail;
    }
    
    if (!image || !thumbnail) {
      return res.status(400).json({
        success: false,
        message: 'Both image and thumbnail are required'
      });
    }

    // Verify main category exists
    const mainCat = await MainCategory.findById(mainCategory);
    if (!mainCat) {
      return res.status(400).json({
        success: false,
        message: 'Main category not found'
      });
    }

    // Check for duplicate subcategory name under the same main category
    const existingSubCategory = await SubCategory.findOne({ 
      mainCategory: mainCategory, 
      name: name,
      isActive: true 
    });
    if (existingSubCategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory with this name already exists under this main category.'
      });
    }

    const subCategory = new SubCategory({
      name,
      mainCategory,
      image,
      thumbnail,
      description,
      sortOrder,
      metaTitle,
      metaDescription,
      keywords,
      features,
      popularTags
    });

    await subCategory.save();

    // Update main category subcategory count
    await MainCategory.findByIdAndUpdate(mainCategory, {
      $inc: { subCategoryCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Sub category created successfully',
      data: subCategory
    });
  } catch (error) {
    console.error('Create sub category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update sub category
router.post('/categories/sub/update', uploadSubcategoryImages(), async (req, res) => {
  try {
    const { id, name, mainCategory, description, sortOrder, metaTitle, metaDescription, keywords, features, popularTags } = req.body;
    
    let image, thumbnail;
    
    if (req.files && req.files.image && req.files.thumbnail) {
      image = req.files.image[0].location;
      thumbnail = req.files.thumbnail[0].location;
    } else {
      image = req.body.image;
      thumbnail = req.body.thumbnail;
    }

    // Check if subcategory exists
    const existingSubCategory = await SubCategory.findById(id);
    if (!existingSubCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    // Verify main category exists if it's being changed
    if (mainCategory && mainCategory !== existingSubCategory.mainCategory.toString()) {
      const mainCat = await MainCategory.findById(mainCategory);
      if (!mainCat) {
        return res.status(400).json({
          success: false,
          message: 'Main category not found'
        });
      }
    }

    // Check for duplicate subcategory name if name is being changed
    if (name && name !== existingSubCategory.name) {
      const duplicateSubCategory = await SubCategory.findOne({ 
        mainCategory: mainCategory || existingSubCategory.mainCategory, 
        name: name,
        isActive: true,
        _id: { $ne: id } // Exclude current subcategory from check
      });
      if (duplicateSubCategory) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory with this name already exists under this main category.'
        });
      }
    }

    const updateData = { name, description, sortOrder, metaTitle, metaDescription, keywords, features, popularTags };
    if (mainCategory) updateData.mainCategory = mainCategory;
    if (image) updateData.image = image;
    if (thumbnail) updateData.thumbnail = thumbnail;

    const subCategory = await SubCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('mainCategory', 'name icon');

    res.json({
      success: true,
      message: 'Sub category updated successfully',
      data: subCategory
    });
  } catch (error) {
    console.error('Update sub category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete sub category
router.post('/categories/sub/delete', async (req, res) => {
  try {
    const { id } = req.body;

    // Check if subcategory has vendors
    const vendorCount = await User.countDocuments({ 'vendorDetails.subCategory': id });

    if (vendorCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subcategory. It has ${vendorCount} vendors.`
      });
    }

    const subCategory = await SubCategory.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    // Update main category subcategory count
    await MainCategory.findByIdAndUpdate(subCategory.mainCategory, {
      $inc: { subCategoryCount: -1 }
    });

    res.json({
      success: true,
      message: 'Sub category deleted successfully'
    });
  } catch (error) {
    console.error('Delete sub category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get sub categories by main category
router.get('/categories/sub/:mainCategoryId', validateParams(Joi.object({ mainCategoryId: commonSchemas.id })), validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { mainCategoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const subCategories = await SubCategory.find({ 
      mainCategory: mainCategoryId,
      isActive: true 
    })
    .populate('mainCategory', 'name icon')
    .sort({ sortOrder: 1, name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await SubCategory.countDocuments({ 
      mainCategory: mainCategoryId,
      isActive: true 
    });

    res.json({
      success: true,
      data: subCategories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get sub categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== VENDOR MANAGEMENT ====================

// Get all vendors
router.get('/vendors', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const vendors = await User.find({ role: 'vendor' })
      .populate('vendorDetails.mainCategory', 'name icon')
      .populate('vendorDetails.subCategory', 'name image thumbnail')
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({ role: 'vendor' });

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
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor details
router.get('/vendors/:id', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findById(id)
      .populate('vendorDetails.mainCategory', 'name icon')
      .populate('vendorDetails.subCategory', 'name image thumbnail')
      .populate('vendorDetails.referredBy', 'name vendorDetails.shopName')
      .select('-password -loginAttempts -lockUntil');

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Get vendor details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update vendor status
router.post('/vendors/status/update', async (req, res) => {
  try {
    const { id } = req.body;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const vendor = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    )
    .populate('vendorDetails.mainCategory', 'name icon')
    .populate('vendorDetails.subCategory', 'name image thumbnail')
    .select('-password -loginAttempts -lockUntil');

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: `Vendor ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Get all subscriptions
router.get('/subscriptions', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const subscriptions = await Subscription.find()
      .populate('vendor', 'name email vendorDetails.shopName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Subscription.countDocuments();

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Process withdrawal request
router.post('/withdrawals/process', async (req, res) => {
  try {
    const { vendorId } = req.body;
    const { requestId, status, adminNotes, transactionId } = req.body;
    const adminId = req.user._id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Find the withdrawal request
    const withdrawalRequest = vendor.vendorDetails.withdrawalRequests.id(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request has already been processed'
      });
    }

    // Update withdrawal request
    withdrawalRequest.status = status;
    withdrawalRequest.processedDate = new Date();
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.adminNotes = adminNotes || '';

    if (status === 'approved') {
      // Validate transaction ID for approved requests
      if (!transactionId || transactionId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required for approved withdrawals'
        });
      }
      withdrawalRequest.transactionId = transactionId.trim();

      // Check if vendor still has sufficient balance
      if (vendor.vendorDetails.wallet.balance < withdrawalRequest.amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }

      // Deduct from wallet
      vendor.vendorDetails.wallet.balance -= withdrawalRequest.amount;
      vendor.vendorDetails.wallet.transactions.push({
        type: 'debit',
        amount: withdrawalRequest.amount,
        description: `Withdrawal processed via ${withdrawalRequest.paymentMethod.toUpperCase()}`,
        date: new Date()
      });

    } else if (status === 'rejected') {
      // For rejected requests, the amount remains in wallet (no deduction needed)
      // Add a transaction record for tracking
      vendor.vendorDetails.wallet.transactions.push({
        type: 'credit',
        amount: 0, // No amount change, just for record
        description: `Withdrawal request rejected: ${adminNotes || 'No reason provided'}`,
        date: new Date()
      });
    }

    await vendor.save();

    res.json({
      success: true,
      message: `Withdrawal request ${status} successfully`,
      data: {
        withdrawalRequest: {
          _id: withdrawalRequest._id,
          amount: withdrawalRequest.amount,
          paymentMethod: withdrawalRequest.paymentMethod,
          upiId: withdrawalRequest.upiId,
          bankDetails: withdrawalRequest.bankDetails,
          status: withdrawalRequest.status,
          requestDate: withdrawalRequest.requestDate,
          processedDate: withdrawalRequest.processedDate,
          processedBy: withdrawalRequest.processedBy,
          adminNotes: withdrawalRequest.adminNotes,
          transactionId: withdrawalRequest.transactionId
        },
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          vendorDetails: {
            shopName: vendor.vendorDetails.shopName
          }
        },
        walletBalance: vendor.vendorDetails.wallet.balance
      }
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== WITHDRAWAL MANAGEMENT ====================

// Get all withdrawal requests
router.get('/withdrawals', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentMethod } = req.query;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline = [
      { $match: { role: 'vendor' } },
      { $unwind: '$vendorDetails.withdrawalRequests' },
      {
        $addFields: {
          'withdrawalRequest': '$vendorDetails.withdrawalRequests'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          'vendorDetails.shopName': 1,
          'vendorDetails.wallet.balance': 1,
          withdrawalRequest: 1
        }
      }
    ];

    // Add status filter
    if (status && status !== 'all') {
      pipeline[0].$match['vendorDetails.withdrawalRequests.status'] = status;
    }

    // Add payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      pipeline[0].$match['vendorDetails.withdrawalRequests.paymentMethod'] = paymentMethod;
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { 'withdrawalRequest.requestDate': -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const withdrawalRequests = await User.aggregate(pipeline);

    // Get total count
    const countPipeline = [
      { $match: { role: 'vendor' } },
      { $unwind: '$vendorDetails.withdrawalRequests' }
    ];

    if (status && status !== 'all') {
      countPipeline[0].$match['vendorDetails.withdrawalRequests.status'] = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      countPipeline[0].$match['vendorDetails.withdrawalRequests.paymentMethod'] = paymentMethod;
    }

    countPipeline.push({ $count: 'total' });

    const totalResult = await User.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    // Get summary statistics
    const statsPipeline = [
      { $match: { role: 'vendor' } },
      { $unwind: '$vendorDetails.withdrawalRequests' },
      {
        $group: {
          _id: '$vendorDetails.withdrawalRequests.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$vendorDetails.withdrawalRequests.amount' }
        }
      }
    ];

    const stats = await User.aggregate(statsPipeline);

    const summary = {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 }
    };

    stats.forEach(stat => {
      summary[stat._id] = { count: stat.count, amount: stat.totalAmount };
    });

    res.json({
      success: true,
      data: {
        withdrawalRequests,
        summary,
        totals: {
          totalRequests: total,
          totalAmount: Object.values(summary).reduce((sum, stat) => sum + stat.amount, 0)
        }
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get withdrawal request details
router.get('/withdrawals/:requestId', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { requestId } = req.params;

    const result = await User.aggregate([
      { $match: { role: 'vendor' } },
      { $unwind: '$vendorDetails.withdrawalRequests' },
      { $match: { 'vendorDetails.withdrawalRequests._id': new mongoose.Types.ObjectId(requestId) } },
      {
        $addFields: {
          'withdrawalRequest': '$vendorDetails.withdrawalRequests'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          'vendorDetails.shopName': 1,
          'vendorDetails.wallet.balance': 1,
          withdrawalRequest: 1
        }
      }
    ]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    const withdrawalData = result[0];

    res.json({
      success: true,
      data: withdrawalData
    });
  } catch (error) {
    console.error('Get withdrawal request details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get withdrawal statistics
router.get('/withdrawals/statistics', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Build date filter
    let dateFilter = {};
    if (period === 'month') {
      const now = new Date();
      dateFilter = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      dateFilter = {
        $gte: new Date(now.getFullYear(), quarter * 3, 1),
        $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
      };
    } else if (period === 'year') {
      const now = new Date();
      dateFilter = {
        $gte: new Date(now.getFullYear(), 0, 1),
        $lte: new Date(now.getFullYear(), 11, 31)
      };
    }

    const stats = await User.aggregate([
      { $match: { role: 'vendor' } },
      { $unwind: '$vendorDetails.withdrawalRequests' },
      {
        $match: {
          'vendorDetails.withdrawalRequests.requestDate': dateFilter
        }
      },
      {
        $group: {
          _id: '$vendorDetails.withdrawalRequests.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$vendorDetails.withdrawalRequests.amount' },
          averageAmount: { $avg: '$vendorDetails.withdrawalRequests.amount' }
        }
      }
    ]);

    // Get payment method distribution
    const paymentMethodStats = await User.aggregate([
      { $match: { role: 'vendor' } },
      { $unwind: '$vendorDetails.withdrawalRequests' },
      {
        $match: {
          'vendorDetails.withdrawalRequests.requestDate': dateFilter
        }
      },
      {
        $group: {
          _id: '$vendorDetails.withdrawalRequests.paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$vendorDetails.withdrawalRequests.amount' }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await User.aggregate([
      { $match: { role: 'vendor' } },
      { $unwind: '$vendorDetails.withdrawalRequests' },
      {
        $group: {
          _id: {
            year: { $year: '$vendorDetails.withdrawalRequests.requestDate' },
            month: { $month: '$vendorDetails.withdrawalRequests.requestDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$vendorDetails.withdrawalRequests.amount' },
          approvedCount: {
            $sum: {
              $cond: [
                { $eq: ['$vendorDetails.withdrawalRequests.status', 'approved'] },
                1,
                0
              ]
            }
          },
          rejectedCount: {
            $sum: {
              $cond: [
                { $eq: ['$vendorDetails.withdrawalRequests.status', 'rejected'] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const summary = {
      pending: { count: 0, amount: 0, averageAmount: 0 },
      approved: { count: 0, amount: 0, averageAmount: 0 },
      rejected: { count: 0, amount: 0, averageAmount: 0 }
    };

    stats.forEach(stat => {
      summary[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount,
        averageAmount: stat.averageAmount
      };
    });

    res.json({
      success: true,
      data: {
        summary,
        paymentMethodDistribution: paymentMethodStats,
        monthlyTrends,
        period
      }
    });
  } catch (error) {
    console.error('Get withdrawal statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== SYSTEM SETTINGS ====================

// Initialize Razorpay plans
router.post('/init-razorpay-plans', async (req, res) => {
  try {
    const result = await createPlans();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Razorpay plans initialized successfully',
        data: result.plans
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to initialize Razorpay plans',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Init Razorpay plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== KYC MANAGEMENT ====================

// Get pending KYC requests
router.get('/kyc/pending', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const vendors = await User.find({
      role: 'vendor',
      'vendorDetails.kyc.panNumber': { $exists: true, $ne: null },
      'vendorDetails.kyc.isVerified': false
    })
    .populate('vendorDetails.mainCategory', 'name icon')
    .populate('vendorDetails.subCategory', 'name image thumbnail')
    .select('-password -loginAttempts -lockUntil')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await User.countDocuments({
      role: 'vendor',
      'vendorDetails.kyc.panNumber': { $exists: true, $ne: null },
      'vendorDetails.kyc.isVerified': false
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
    console.error('Get pending KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify vendor KYC
router.post('/kyc/verify', async (req, res) => {
  try {
    const { vendorId } = req.body;
    const { isVerified, adminNotes } = req.body;
    const adminId = req.user._id;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isVerified must be a boolean value'
      });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Update KYC status
    vendor.vendorDetails.kyc.isVerified = isVerified;
    vendor.vendorDetails.kyc.verificationDate = new Date();
    vendor.vendorDetails.kyc.verifiedBy = adminId;

    await vendor.save();

    res.json({
      success: true,
      message: `KYC ${isVerified ? 'verified' : 'rejected'} successfully`,
      data: {
        vendorId,
        isVerified,
        verificationDate: vendor.vendorDetails.kyc.verificationDate
      }
    });
  } catch (error) {
    console.error('Verify KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get system statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        vendors: await User.countDocuments({ role: 'vendor' }),
        customers: await User.countDocuments({ role: 'customer' }),
        admins: await User.countDocuments({ role: 'admin' })
      },
      categories: {
        main: await MainCategory.countDocuments({ isActive: true }),
        sub: await SubCategory.countDocuments({ isActive: true })
      },
      products: await Product.countDocuments({ isActive: true }),
      subscriptions: {
        total: await Subscription.countDocuments(),
        active: await Subscription.countDocuments({ status: 'active' }),
        pending: await Subscription.countDocuments({ status: 'pending' })
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== REFERRAL COMMISSION MANAGEMENT ====================

// Get referral commission settings
router.get('/referral/settings', async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    
    res.json({
      success: true,
      data: {
        referralCommission: settings.referralCommission,
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy
      }
    });
  } catch (error) {
    console.error('Get referral settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update referral commission settings
router.post('/referral/settings/update', async (req, res) => {
  try {
    const { percentage, isActive, minimumSubscriptionAmount, maximumCommissionPerReferral } = req.body;
    const adminId = req.user._id;

    const settings = await SystemSettings.getSettings();
    
    if (percentage !== undefined) {
      if (percentage < 0 || percentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Commission percentage must be between 0 and 100'
        });
      }
      settings.referralCommission.percentage = percentage;
    }

    if (isActive !== undefined) {
      settings.referralCommission.isActive = isActive;
    }

    if (minimumSubscriptionAmount !== undefined) {
      if (minimumSubscriptionAmount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Minimum subscription amount cannot be negative'
        });
      }
      settings.referralCommission.minimumSubscriptionAmount = minimumSubscriptionAmount;
    }

    if (maximumCommissionPerReferral !== undefined) {
      if (maximumCommissionPerReferral < 0) {
        return res.status(400).json({
          success: false,
          message: 'Maximum commission per referral cannot be negative'
        });
      }
      settings.referralCommission.maximumCommissionPerReferral = maximumCommissionPerReferral;
    }

    settings.updatedBy = adminId;
    await settings.save();

    res.json({
      success: true,
      message: 'Referral commission settings updated successfully',
      data: {
        referralCommission: settings.referralCommission,
        updatedAt: settings.updatedAt,
        updatedBy: adminId
      }
    });
  } catch (error) {
    console.error('Update referral settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all referral commissions
router.get('/referral/commissions',  async (req, res) => {
  try {
    const { page = 1, limit = 10, status, referrerId } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (referrerId) filter.referrer = referrerId;

    const commissions = await ReferralCommission.find(filter)
      .populate('referrer', 'name email vendorDetails.shopName')
      .populate('referredVendor', 'name email vendorDetails.shopName')
      .populate('subscription', 'plan amount status')
      .populate('admin.approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReferralCommission.countDocuments(filter);

    // Calculate totals
    const totalAmount = await ReferralCommission.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    res.json({
      success: true,
      data: commissions,
      totals: {
        totalAmount: totalAmount[0]?.total || 0,
        totalCommissions: total
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get referral commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending referral commissions
router.get('/referral/commissions/pending', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const commissions = await ReferralCommission.find({ status: 'pending' })
      .populate('referrer', 'name email vendorDetails.shopName vendorDetails.wallet')
      .populate('referredVendor', 'name email vendorDetails.shopName')
      .populate('subscription', 'plan amount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReferralCommission.countDocuments({ status: 'pending' });

    const totalAmount = await ReferralCommission.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    res.json({
      success: true,
      data: commissions,
      totals: {
        totalAmount: totalAmount[0]?.total || 0,
        totalPending: total
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get pending commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Approve referral commission
router.post('/referral/commissions/approve', async (req, res) => {
  try {
    const { commissionId } = req.body;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const commission = await ReferralCommission.findById(commissionId)
      .populate('referrer', 'vendorDetails.wallet')
      .populate('referredVendor', 'name vendorDetails.shopName');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission record not found'
      });
    }

    if (commission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Commission has already been processed'
      });
    }

    // Update commission status
    commission.status = 'paid';
    commission.payment.paidAt = new Date();
    commission.payment.transactionId = `TXN_${Date.now()}_${commissionId}`;
    commission.payment.adminNotes = adminNotes;
    commission.admin.approvedBy = adminId;
    commission.admin.approvedAt = new Date();

    await commission.save();

    // Add commission to referrer's wallet
    const referrer = await User.findById(commission.referrer._id);
    referrer.vendorDetails.wallet.balance += commission.commission.amount;
    referrer.vendorDetails.wallet.transactions.push({
      type: 'credit',
      amount: commission.commission.amount,
      description: `Referral commission for ${commission.referredVendor.name} (${commission.referredVendor.vendorDetails.shopName})`,
      date: new Date()
    });

    await referrer.save();

    res.json({
      success: true,
      message: 'Referral commission approved and paid successfully',
      data: {
        commission: {
          _id: commission._id,
          status: commission.status,
          amount: commission.commission.amount,
          paidAt: commission.payment.paidAt,
          transactionId: commission.payment.transactionId
        },
        referrer: {
          name: referrer.name,
          newWalletBalance: referrer.vendorDetails.wallet.balance
        },
        referredVendor: {
          name: commission.referredVendor.name,
          shopName: commission.referredVendor.vendorDetails.shopName
        }
      }
    });
  } catch (error) {
    console.error('Approve commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reject referral commission
router.post('/referral/commissions/reject', async (req, res) => {
  try {
    const { commissionId } = req.body;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const commission = await ReferralCommission.findById(commissionId)
      .populate('referredVendor', 'name vendorDetails.shopName');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission record not found'
      });
    }

    if (commission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Commission has already been processed'
      });
    }

    // Update commission status
    commission.status = 'cancelled';
    commission.admin.approvedBy = adminId;
    commission.admin.approvedAt = new Date();
    commission.admin.notes = adminNotes;

    await commission.save();

    res.json({
      success: true,
      message: 'Referral commission rejected successfully',
      data: {
        commission: {
          _id: commission._id,
          status: commission.status,
          amount: commission.commission.amount,
          rejectedAt: commission.admin.approvedAt
        },
        referredVendor: {
          name: commission.referredVendor.name,
          shopName: commission.referredVendor.vendorDetails.shopName
        }
      }
    });
  } catch (error) {
    console.error('Reject commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get referral statistics
router.get('/referral/statistics', async (req, res) => {
  try {
    const stats = {
      totalReferrals: await ReferralCommission.countDocuments(),
      pendingCommissions: await ReferralCommission.countDocuments({ status: 'pending' }),
      paidCommissions: await ReferralCommission.countDocuments({ status: 'paid' }),
      cancelledCommissions: await ReferralCommission.countDocuments({ status: 'cancelled' }),
      totalCommissionAmount: await ReferralCommission.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } }
      ]),
      pendingAmount: await ReferralCommission.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } }
      ]),
      topReferrers: await ReferralCommission.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: '$referrer',
            totalReferrals: { $sum: 1 },
            totalAmount: { $sum: '$commission.amount' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'referrer'
          }
        },
        { $unwind: '$referrer' },
        {
          $project: {
            referrer: {
              name: 1,
              email: 1,
              'vendorDetails.shopName': 1
            },
            totalReferrals: 1,
            totalAmount: 1
          }
        }
      ])
    };

    res.json({
      success: true,
      data: {
        ...stats,
        totalCommissionAmount: stats.totalCommissionAmount[0]?.total || 0,
        pendingAmount: stats.pendingAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get referral statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor referral details
router.get('/referral/vendor/:vendorId', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await User.findById(vendorId)
      .select('name email vendorDetails.shopName vendorDetails.referralCode vendorDetails.referredBy vendorDetails.wallet')
      .populate('vendorDetails.referredBy', 'name vendorDetails.shopName')
      .lean();

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get referrals made by this vendor
    const referralsMade = await ReferralCommission.find({ referrer: vendorId })
      .populate('referredVendor', 'name email vendorDetails.shopName')
      .populate('subscription', 'plan amount status')
      .sort({ createdAt: -1 })
      .lean();

    // Get referral that brought this vendor
    const referredBy = vendor.vendorDetails.referredBy;

    // Calculate totals
    const totalReferrals = referralsMade.length;
    const totalCommissionEarned = referralsMade
      .filter(ref => ref.status === 'paid')
      .reduce((sum, ref) => sum + ref.commission.amount, 0);
    const pendingCommission = referralsMade
      .filter(ref => ref.status === 'pending')
      .reduce((sum, ref) => sum + ref.commission.amount, 0);

    res.json({
      success: true,
      data: {
        vendor: {
          name: vendor.name,
          email: vendor.email,
          shopName: vendor.vendorDetails.shopName,
          referralCode: vendor.vendorDetails.referralCode,
          walletBalance: vendor.vendorDetails.wallet.balance,
          referredBy: referredBy ? {
            name: referredBy.name,
            shopName: referredBy.vendorDetails.shopName
          } : null
        },
        referrals: {
          total: totalReferrals,
          totalCommissionEarned,
          pendingCommission,
          referrals: referralsMade
        }
      }
    });
  } catch (error) {
    console.error('Get vendor referral details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== ADMIN MANAGEMENT ====================

// Get all admins
router.get('/admins', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const admins = await User.find({ role: 'admin' })
      .populate('adminDetails.createdBy', 'name email')
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments({ role: 'admin' });

    res.json({
      success: true,
      data: admins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get admin details
router.get('/admins/:adminId', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findOne({ _id: adminId, role: 'admin' })
      .populate('adminDetails.createdBy', 'name email')
      .select('-password -loginAttempts -lockUntil')
      .lean();

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get admin details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update admin permissions
router.post('/admins/permissions/update', async (req, res) => {
  try {
    const { adminId } = req.body;
    const { permissions, accessLevel, isActive } = req.body;
    const updatedBy = req.user._id;

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent updating own permissions
    if (adminId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update your own permissions'
      });
    }

    // Update admin details
    if (permissions) {
      admin.adminDetails.permissions = permissions;
    }
    if (accessLevel) {
      admin.adminDetails.accessLevel = accessLevel;
    }
    if (typeof isActive === 'boolean') {
      admin.isActive = isActive;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Admin permissions updated successfully',
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          isActive: admin.isActive,
          adminDetails: admin.adminDetails
        }
      }
    });
  } catch (error) {
    console.error('Update admin permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Deactivate admin
router.post('/admins/deactivate', async (req, res) => {
  try {
    const { adminId } = req.body;
    const { reason } = req.body;

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent deactivating own account
    if (adminId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    admin.isActive = false;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin deactivated successfully',
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          isActive: false
        }
      }
    });
  } catch (error) {
    console.error('Deactivate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get admin activity logs
router.get('/admins/:adminId/activity', validateParams(commonSchemas.id), validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Get admin activity (this would require an activity log model)
    // For now, return basic admin info
    const activity = {
      lastLogin: admin.lastLogin,
      adminDetails: admin.adminDetails,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    };

    res.json({
      success: true,
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email
        },
        activity
      }
    });
  } catch (error) {
    console.error('Get admin activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get admin statistics
router.get('/admins/statistics', async (req, res) => {
  try {
    const stats = {
      totalAdmins: await User.countDocuments({ role: 'admin' }),
      activeAdmins: await User.countDocuments({ role: 'admin', isActive: true }),
      inactiveAdmins: await User.countDocuments({ role: 'admin', isActive: false }),
      superAdmins: await User.countDocuments({ 
        role: 'admin', 
        'adminDetails.isSuperAdmin': true 
      }),
      adminsByAccessLevel: await User.aggregate([
        { $match: { role: 'admin' } },
        {
          $group: {
            _id: '$adminDetails.accessLevel',
            count: { $sum: 1 }
          }
        }
      ]),
      recentAdmins: await User.find({ role: 'admin' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt adminDetails.permissions')
        .lean()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get admin statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== RATING MANAGEMENT ====================

// Get all ratings for moderation
router.get('/ratings', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'pending', vendorId } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (vendorId) {
      query.vendor = vendorId;
    }

    const ratings = await VendorRating.find(query)
      .populate('vendor', 'name vendorDetails.shopName')
      .populate('customer', 'name profileImage')
      .populate('moderatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await VendorRating.countDocuments(query);

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
    console.error('Get ratings for moderation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get rating details for moderation
router.get('/ratings/:id', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { id: ratingId } = req.params;

    const rating = await VendorRating.findById(ratingId)
      .populate('vendor', 'name vendorDetails.shopName')
      .populate('customer', 'name profileImage')
      .populate('moderatedBy', 'name')
      .lean();

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Get rating details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Moderate rating (approve/reject)
router.post('/ratings/moderate', async (req, res) => {
  try {
    const { id: ratingId } = req.body;
    const { status, moderationNotes } = req.body;
    const adminId = req.user._id;

    const rating = await VendorRating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Update rating status
    rating.status = status;
    rating.moderationNotes = moderationNotes;
    rating.moderatedBy = adminId;
    rating.moderatedAt = new Date();

    await rating.save();

    res.json({
      success: true,
      message: `Rating ${status} successfully`,
      data: {
        rating: {
          _id: rating._id,
          status: rating.status,
          moderatedBy: rating.moderatedBy,
          moderatedAt: rating.moderatedAt
        }
      }
    });
  } catch (error) {
    console.error('Moderate rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk moderate ratings
router.post('/ratings/bulk-moderate', async (req, res) => {
  try {
    const { ratingIds, status, moderationNotes } = req.body;
    const adminId = req.user._id;

    if (!ratingIds || !Array.isArray(ratingIds) || ratingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rating IDs array is required'
      });
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const updateResult = await VendorRating.updateMany(
      { _id: { $in: ratingIds } },
      {
        status,
        moderationNotes,
        moderatedBy: adminId,
        moderatedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${updateResult.modifiedCount} ratings ${status} successfully`,
      data: {
        modifiedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk moderate ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get rating statistics
router.get('/ratings/statistics', async (req, res) => {
  try {
    const stats = {
      totalRatings: await VendorRating.countDocuments(),
      pendingRatings: await VendorRating.countDocuments({ status: 'pending' }),
      approvedRatings: await VendorRating.countDocuments({ status: 'approved' }),
      rejectedRatings: await VendorRating.countDocuments({ status: 'rejected' }),
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      ratingsByMonth: [],
      topRatedVendors: []
    };

    // Calculate average rating
    const avgResult = await VendorRating.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);
    stats.averageRating = avgResult[0]?.average || 0;

    // Get rating distribution
    const distribution = await VendorRating.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);
    distribution.forEach(item => {
      stats.ratingDistribution[item._id] = item.count;
    });

    // Get ratings by month
    stats.ratingsByMonth = await VendorRating.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get top rated vendors
    stats.topRatedVendors = await VendorRating.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$vendor',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      },
      { $sort: { averageRating: -1, totalRatings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          vendor: {
            _id: '$vendor._id',
            name: '$vendor.name',
            'vendorDetails.shopName': '$vendor.vendorDetails.shopName'
          },
          averageRating: 1,
          totalRatings: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get rating statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor rating details
router.get('/vendors/:vendorId/ratings', validateParams(commonSchemas.id), validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, status = 'approved' } = req.query;
    const skip = (page - 1) * limit;

    // Check if vendor exists
    const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Build query
    const query = { vendor: vendorId };
    if (status !== 'all') {
      query.status = status;
    }

    const ratings = await VendorRating.find(query)
      .populate('customer', 'name profileImage')
      .populate('moderatedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await VendorRating.countDocuments(query);

    // Get rating statistics for this vendor
    const stats = await VendorRating.getVendorRatingStats(vendorId);

    res.json({
      success: true,
      data: {
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          vendorDetails: {
            shopName: vendor.vendorDetails.shopName,
            averageRating: vendor.vendorDetails.averageRating,
            totalRatings: vendor.vendorDetails.totalRatings
          }
        },
        ratings,
        statistics: stats
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

// ==================== VENDOR COMMISSION MANAGEMENT ====================

// Set vendor commission percentage
router.post('/vendors/:vendorId/commission',  async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { commissionPercentage, notes } = req.body;
    const adminId = req.user._id;

    // Validate commission percentage
    if (!commissionPercentage || commissionPercentage < 0 || commissionPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Valid commission percentage (0-100) is required'
      });
    }

    // Check if vendor exists
    const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Set commission for vendor
    const commissionSettings = await VendorCommissionSettings.setCommission(
      vendorId, 
      commissionPercentage, 
      adminId, 
      notes || ''
    );

    res.json({
      success: true,
      message: `Commission set to ${commissionPercentage}% for vendor`,
      data: {
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          vendorDetails: {
            shopName: vendor.vendorDetails.shopName
          }
        },
        commissionSettings: {
          commissionPercentage: commissionSettings.commissionPercentage,
          isCustomCommission: commissionSettings.isCustomCommission,
          notes: commissionSettings.notes,
          setBy: adminId,
          updatedAt: commissionSettings.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Set vendor commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor commission settings
router.get('/vendors/:vendorId/commission', async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Check if vendor exists
    const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get commission settings
    const commissionSettings = await VendorCommissionSettings.findOne({ vendor: vendorId })
      .populate('setBy', 'name')
      .lean();

    // Get commission statistics
    const commissionStats = await ReferralCommission.aggregate([
      { $match: { referrer: vendorId } },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' },
          averageCommission: { $avg: '$commission.percentage' }
        }
      }
    ]);

    // Get recent commissions
    const recentCommissions = await ReferralCommission.find({ referrer: vendorId })
      .populate('referredVendor', 'name vendorDetails.shopName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          vendorDetails: {
            shopName: vendor.vendorDetails.shopName
          }
        },
        commissionSettings: commissionSettings || {
          commissionPercentage: 10,
          isCustomCommission: false,
          notes: 'Using default commission rate'
        },
        statistics: commissionStats[0] || {
          totalCommissions: 0,
          totalAmount: 0,
          averageCommission: 0
        },
        recentCommissions
      }
    });
  } catch (error) {
    console.error('Get vendor commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all vendor commission settings
router.get('/vendors/commissions', async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'all' } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (filter === 'custom') {
      query.isCustomCommission = true;
    } else if (filter === 'default') {
      query.isCustomCommission = false;
    }

    const commissionSettings = await VendorCommissionSettings.find(query)
      .populate('vendor', 'name email vendorDetails.shopName')
      .populate('setBy', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await VendorCommissionSettings.countDocuments(query);

    // Get summary statistics
    const stats = await VendorCommissionSettings.aggregate([
      {
        $group: {
          _id: null,
          totalVendors: { $sum: 1 },
          customCommissions: { $sum: { $cond: ['$isCustomCommission', 1, 0] } },
          defaultCommissions: { $sum: { $cond: ['$isCustomCommission', 0, 1] } },
          averageCommission: { $avg: '$commissionPercentage' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        commissionSettings,
        summary: stats[0] || {
          totalVendors: 0,
          customCommissions: 0,
          defaultCommissions: 0,
          averageCommission: 10
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
    console.error('Get all vendor commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset vendor to default commission
router.post('/vendors/:vendorId/commission/reset', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { vendorId } = req.params;
    const adminId = req.user._id;

    // Check if vendor exists
    const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Reset to default commission (10%)
    const commissionSettings = await VendorCommissionSettings.setCommission(
      vendorId, 
      10, 
      adminId, 
      'Reset to default commission rate'
    );

    res.json({
      success: true,
      message: 'Vendor commission reset to default 10%',
      data: {
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          vendorDetails: {
            shopName: vendor.vendorDetails.shopName
          }
        },
        commissionSettings: {
          commissionPercentage: commissionSettings.commissionPercentage,
          isCustomCommission: commissionSettings.isCustomCommission,
          notes: commissionSettings.notes,
          setBy: adminId,
          updatedAt: commissionSettings.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Reset vendor commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk set commission for multiple vendors
router.post('/vendors/commissions/bulk', async (req, res) => {
  try {
    const { vendorIds, commissionPercentage, notes } = req.body;
    const adminId = req.user._id;

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vendor IDs array is required'
      });
    }

    if (!commissionPercentage || commissionPercentage < 0 || commissionPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Valid commission percentage (0-100) is required'
      });
    }

    // Check if all vendors exist
    const vendors = await User.find({ _id: { $in: vendorIds }, role: 'vendor' });
    if (vendors.length !== vendorIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some vendors not found'
      });
    }

    // Set commission for all vendors
    const results = [];
    for (const vendorId of vendorIds) {
      try {
        const commissionSettings = await VendorCommissionSettings.setCommission(
          vendorId,
          commissionPercentage,
          adminId,
          notes || `Bulk commission setting: ${commissionPercentage}%`
        );
        results.push({
          vendorId,
          success: true,
          commissionSettings
        });
      } catch (error) {
        results.push({
          vendorId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Commission set for ${successCount} vendors, ${failureCount} failed`,
      data: {
        totalVendors: vendorIds.length,
        successCount,
        failureCount,
        results
      }
    });
  } catch (error) {
    console.error('Bulk set commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get commission statistics
router.get('/commissions/statistics', async (req, res) => {
  try {
    const stats = {
      totalCommissions: await ReferralCommission.countDocuments(),
      pendingCommissions: await ReferralCommission.countDocuments({ status: 'pending' }),
      paidCommissions: await ReferralCommission.countDocuments({ status: 'paid' }),
      totalAmount: 0,
      averageCommission: 0,
      commissionDistribution: [],
      topReferrers: [],
      monthlyCommissions: []
    };

    // Get total amount and average commission
    const amountStats = await ReferralCommission.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$commission.amount' },
          averageCommission: { $avg: '$commission.percentage' }
        }
      }
    ]);

    if (amountStats[0]) {
      stats.totalAmount = amountStats[0].totalAmount;
      stats.averageCommission = amountStats[0].averageCommission;
    }

    // Get commission distribution
    stats.commissionDistribution = await ReferralCommission.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$commission.percentage',
          count: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top referrers
    stats.topReferrers = await ReferralCommission.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$referrer',
          totalCommissions: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' },
          averageCommission: { $avg: '$commission.percentage' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          vendor: {
            _id: '$vendor._id',
            name: '$vendor.name',
            'vendorDetails.shopName': '$vendor.vendorDetails.shopName'
          },
          totalCommissions: 1,
          totalAmount: 1,
          averageCommission: 1
        }
      }
    ]);

    // Get monthly commissions
    stats.monthlyCommissions = await ReferralCommission.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get commission statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get comprehensive revenue analytics
router.get('/revenue/analytics', async (req, res) => {
  try {
    const { period = 'all', startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (period === 'month') {
      const now = new Date();
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }
      };
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), quarter * 3, 1),
          $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        }
      };
    } else if (period === 'year') {
      const now = new Date();
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31)
        }
      };
    } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // 1. Subscription Revenue Analytics
    const subscriptionStats = await Subscription.aggregate([
      { $match: { status: 'active', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          averageSubscriptionValue: { $avg: '$amount' }
        }
      }
    ]);

    // Get subscription breakdown by plan
    const subscriptionByPlan = await Subscription.aggregate([
      { $match: { status: 'active', ...dateFilter } },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          averageValue: { $avg: '$amount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // 2. Wallet Balance Analytics (Money owed to vendors)
    const walletStats = await User.aggregate([
      { $match: { role: 'vendor' } },
      {
        $group: {
          _id: null,
          totalVendors: { $sum: 1 },
          totalWalletBalance: { $sum: '$vendorDetails.wallet.balance' },
          averageWalletBalance: { $avg: '$vendorDetails.wallet.balance' },
          vendorsWithBalance: {
            $sum: {
              $cond: [{ $gt: ['$vendorDetails.wallet.balance', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get top vendors by wallet balance
    const topVendorsByWallet = await User.aggregate([
      { $match: { role: 'vendor' } },
      { $sort: { 'vendorDetails.wallet.balance': -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          name: 1,
          'vendorDetails.shopName': 1,
          'vendorDetails.wallet.balance': 1,
          'vendorDetails.wallet.transactions': { $slice: ['$vendorDetails.wallet.transactions', 5] }
        }
      }
    ]);

    // 3. Referral Commission Analytics (Money paid to referrers)
    const commissionStats = await ReferralCommission.aggregate([
      { $match: { status: 'paid', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: 1 },
          totalCommissionAmount: { $sum: '$commission.amount' },
          averageCommission: { $avg: '$commission.percentage' }
        }
      }
    ]);

    // 4. Net Revenue Calculation
    const subscriptionRevenue = subscriptionStats[0]?.totalRevenue || 0;
    const totalWalletBalance = walletStats[0]?.totalWalletBalance || 0;
    const totalCommissionAmount = commissionStats[0]?.totalCommissionAmount || 0;
    
    // Net Revenue = Subscription Revenue - (Wallet Balance + Commission Paid)
    const netRevenue = subscriptionRevenue - (totalWalletBalance + totalCommissionAmount);

    // 5. Monthly Revenue Trends
    const monthlyRevenue = await Subscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          subscriptionRevenue: { $sum: '$amount' },
          subscriptionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // 6. Revenue Growth Analysis
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    const currentMonthRevenue = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          createdAt: {
            $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
            $lte: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const lastMonthRevenue = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          createdAt: {
            $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            $lte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const currentMonthAmount = currentMonthRevenue[0]?.total || 0;
    const lastMonthAmount = lastMonthRevenue[0]?.total || 0;
    const growthPercentage = lastMonthAmount > 0 ? ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 : 0;

    // 7. Revenue Distribution
    const revenueDistribution = {
      subscriptionRevenue: subscriptionRevenue,
      walletBalance: totalWalletBalance,
      commissionPaid: totalCommissionAmount,
      netRevenue: netRevenue,
      percentages: {
        subscription: subscriptionRevenue > 0 ? (subscriptionRevenue / (subscriptionRevenue + totalWalletBalance + totalCommissionAmount)) * 100 : 0,
        wallet: (subscriptionRevenue + totalWalletBalance + totalCommissionAmount) > 0 ? (totalWalletBalance / (subscriptionRevenue + totalWalletBalance + totalCommissionAmount)) * 100 : 0,
        commission: (subscriptionRevenue + totalWalletBalance + totalCommissionAmount) > 0 ? (totalCommissionAmount / (subscriptionRevenue + totalWalletBalance + totalCommissionAmount)) * 100 : 0
      }
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalSubscriptionRevenue: subscriptionRevenue,
          totalWalletBalance: totalWalletBalance,
          totalCommissionPaid: totalCommissionAmount,
          netRevenue: netRevenue,
          growthPercentage: Math.round(growthPercentage * 100) / 100
        },
        subscriptionAnalytics: {
          totalSubscriptions: subscriptionStats[0]?.totalSubscriptions || 0,
          averageSubscriptionValue: subscriptionStats[0]?.averageSubscriptionValue || 0,
          byPlan: subscriptionByPlan
        },
        walletAnalytics: {
          totalVendors: walletStats[0]?.totalVendors || 0,
          averageWalletBalance: walletStats[0]?.averageWalletBalance || 0,
          vendorsWithBalance: walletStats[0]?.vendorsWithBalance || 0,
          topVendorsByWallet: topVendorsByWallet
        },
        commissionAnalytics: {
          totalCommissions: commissionStats[0]?.totalCommissions || 0,
          averageCommission: commissionStats[0]?.averageCommission || 0
        },
        revenueDistribution: revenueDistribution,
        monthlyTrends: monthlyRevenue,
        period: period,
        dateFilter: dateFilter
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get comprehensive subscription statistics
router.get('/subscriptions/statistics', async (req, res) => {
  try {
    const { period = 'all', startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (period === 'month') {
      const now = new Date();
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }
      };
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), quarter * 3, 1),
          $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        }
      };
    } else if (period === 'year') {
      const now = new Date();
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31)
        }
      };
    } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // 1. Overall Subscription Statistics
    const overallStats = await Subscription.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    // 2. Status-wise Statistics
    const statusStats = await Subscription.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 3. Plan-wise Statistics
    const planStats = await Subscription.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          expiredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // 4. Monthly Subscription Trends
    const monthlyTrends = await Subscription.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // 5. Top Vendors by Subscription Value
    const topVendorsBySubscription = await Subscription.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$vendor',
          totalSubscriptions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          vendor: {
            _id: '$vendor._id',
            name: '$vendor.name',
            email: '$vendor.email',
            'vendorDetails.shopName': '$vendor.vendorDetails.shopName'
          },
          totalSubscriptions: 1,
          totalAmount: 1,
          activeSubscriptions: 1,
          averageAmount: 1
        }
      }
    ]);

    // 6. Commission Distribution Analysis
    const commissionDistribution = await ReferralCommission.aggregate([
      { $match: { status: 'paid', ...dateFilter } },
      {
        $group: {
          _id: '$commission.percentage',
          count: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' },
          averageAmount: { $avg: '$commission.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 7. Subscription Growth Analysis
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    const currentMonthStats = await Subscription.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
            $lte: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    const lastMonthStats = await Subscription.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            $lte: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
          }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    const currentMonthData = currentMonthStats[0] || { count: 0, totalAmount: 0, activeCount: 0 };
    const lastMonthData = lastMonthStats[0] || { count: 0, totalAmount: 0, activeCount: 0 };

    const growthMetrics = {
      subscriptionGrowth: lastMonthData.count > 0 ? ((currentMonthData.count - lastMonthData.count) / lastMonthData.count) * 100 : 0,
      revenueGrowth: lastMonthData.totalAmount > 0 ? ((currentMonthData.totalAmount - lastMonthData.totalAmount) / lastMonthData.totalAmount) * 100 : 0,
      activeGrowth: lastMonthData.activeCount > 0 ? ((currentMonthData.activeCount - lastMonthData.activeCount) / lastMonthData.activeCount) * 100 : 0
    };

    // 8. Revenue Summary
    const totalRevenue = overallStats[0]?.totalAmount || 0;
    const activeRevenue = statusStats.find(s => s._id === 'active')?.totalAmount || 0;
    const pendingRevenue = statusStats.find(s => s._id === 'pending')?.totalAmount || 0;
    const totalCommissions = commissionDistribution.reduce((sum, c) => sum + c.totalAmount, 0);
    const netRevenue = totalRevenue - totalCommissions;

    res.json({
      success: true,
      data: {
        summary: {
          totalSubscriptions: overallStats[0]?.totalSubscriptions || 0,
          totalAmount: totalRevenue,
          averageAmount: overallStats[0]?.averageAmount || 0,
          activeSubscriptions: statusStats.find(s => s._id === 'active')?.count || 0,
          pendingSubscriptions: statusStats.find(s => s._id === 'pending')?.count || 0,
          expiredSubscriptions: statusStats.find(s => s._id === 'expired')?.count || 0,
          cancelledSubscriptions: statusStats.find(s => s._id === 'cancelled')?.count || 0,
          activeRevenue: activeRevenue,
          pendingRevenue: pendingRevenue,
          totalCommissions: totalCommissions,
          netRevenue: netRevenue
        },
        statusDistribution: statusStats,
        planDistribution: planStats,
        monthlyTrends: monthlyTrends,
        topVendors: topVendorsBySubscription,
        commissionDistribution: commissionDistribution,
        growthMetrics: {
          subscriptionGrowth: Math.round(growthMetrics.subscriptionGrowth * 100) / 100,
          revenueGrowth: Math.round(growthMetrics.revenueGrowth * 100) / 100,
          activeGrowth: Math.round(growthMetrics.activeGrowth * 100) / 100
        },
        period: period,
        dateFilter: dateFilter
      }
    });
  } catch (error) {
    console.error('Get subscription statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== EMPLOYEE MANAGEMENT ====================

// Create super employee
router.post('/employees/super-employee/create', async (req, res) => {
  try {
    const { name, email, phone, password, assignedDistricts, commissionPercentage } = req.body;
    const adminId = req.user._id;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required'
      });
    }

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Check if phone already exists
    const existingPhone = await Employee.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this phone number already exists'
      });
    }

    // Create new super employee
    const superEmployee = new Employee({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'super_employee',
      assignedDistricts: assignedDistricts || [],
      commissionSettings: {
        percentage: commissionPercentage || 0,
        isActive: true,
        setBy: adminId
      },
      createdBy: adminId
    });

    await superEmployee.save();

    res.status(201).json({
      success: true,
      message: 'Super employee created successfully',
      data: {
        _id: superEmployee._id,
        employeeId: superEmployee.employeeId,
        name: superEmployee.name,
        email: superEmployee.email,
        phone: superEmployee.phone,
        role: superEmployee.role,
        assignedDistricts: superEmployee.assignedDistricts,
        commissionSettings: superEmployee.commissionSettings
      }
    });
  } catch (error) {
    console.error('Create super employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all employees
router.get('/employees', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role && role !== 'all') {
      query.role = role;
    }
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const employees = await Employee.find(query)
      .populate('superEmployee', 'employeeId name email')
      .populate('createdBy', 'name email')
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Employee.countDocuments(query);

    res.json({
      success: true,
      data: employees,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee details
router.get('/employees/:employeeId', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId)
      .populate('superEmployee', 'employeeId name email')
      .populate('createdBy', 'name email')
      .select('-password -loginAttempts -lockUntil');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get assigned sellers count
    const assignedSellers = await User.countDocuments({
      assignedEmployee: employeeId,
      role: 'vendor',
      isActive: true
    });

    // Get commission statistics
    const commissionStats = await EmployeeCommission.aggregate([
      { $match: { employee: new mongoose.Types.ObjectId(employeeId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        employee,
        statistics: {
          assignedSellers,
          commissionStats
        }
      }
    });
  } catch (error) {
    console.error('Get employee details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update employee status
router.post('/employees/:employeeId/status', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { isActive } = req.body;
    const adminId = req.user._id;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { 
        isActive,
        updatedBy: adminId
      },
      { new: true }
    )
    .populate('superEmployee', 'employeeId name email')
    .select('-password -loginAttempts -lockUntil');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: employee
    });
  } catch (error) {
    console.error('Update employee status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Assign districts to employee
router.post('/employees/:employeeId/districts', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { districts } = req.body;
    const adminId = req.user._id;

    if (!districts || !Array.isArray(districts)) {
      return res.status(400).json({
        success: false,
        message: 'Districts array is required'
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Add new districts
    const newDistricts = districts.map(district => ({
      district: district.district,
      state: district.state,
      assignedAt: new Date(),
      assignedBy: adminId
    }));

    employee.assignedDistricts.push(...newDistricts);
    employee.updatedBy = adminId;
    await employee.save();

    res.json({
      success: true,
      message: 'Districts assigned successfully',
      data: {
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          assignedDistricts: employee.assignedDistricts
        }
      }
    });
  } catch (error) {
    console.error('Assign districts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove districts from employee
router.delete('/employees/:employeeId/districts', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { districtIds } = req.body;
    const adminId = req.user._id;

    if (!districtIds || !Array.isArray(districtIds)) {
      return res.status(400).json({
        success: false,
        message: 'District IDs array is required'
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Remove districts
    employee.assignedDistricts = employee.assignedDistricts.filter(
      (district, index) => !districtIds.includes(index)
    );
    employee.updatedBy = adminId;
    await employee.save();

    res.json({
      success: true,
      message: 'Districts removed successfully',
      data: {
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          assignedDistricts: employee.assignedDistricts
        }
      }
    });
  } catch (error) {
    console.error('Remove districts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Set commission percentage for super employee
router.post('/employees/:employeeId/commission', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { commissionPercentage } = req.body;
    const adminId = req.user._id;

    if (!commissionPercentage || commissionPercentage < 0 || commissionPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Valid commission percentage (0-100) is required'
      });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.role !== 'super_employee') {
      return res.status(400).json({
        success: false,
        message: 'Only super employees can have commission settings'
      });
    }

    employee.commissionSettings.percentage = commissionPercentage;
    employee.commissionSettings.setBy = adminId;
    employee.commissionSettings.setAt = new Date();
    employee.updatedBy = adminId;
    await employee.save();

    res.json({
      success: true,
      message: `Commission set to ${commissionPercentage}% for super employee`,
      data: {
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          commissionSettings: employee.commissionSettings
        }
      }
    });
  } catch (error) {
    console.error('Set employee commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== DISTRICT MANAGEMENT ====================

// Create district
router.post('/districts/create', async (req, res) => {
  try {
    const { name, state, coordinates } = req.body;
    const adminId = req.user._id;

    if (!name || !state) {
      return res.status(400).json({
        success: false,
        message: 'District name and state are required'
      });
    }

    // Check if district already exists
    const existingDistrict = await District.findOne({
      name: new RegExp(name, 'i'),
      state: new RegExp(state, 'i')
    });

    if (existingDistrict) {
      return res.status(400).json({
        success: false,
        message: 'District already exists'
      });
    }

    const district = new District({
      name: name.toUpperCase(),
      state: state.toUpperCase(),
      coordinates: coordinates || {},
      createdBy: adminId
    });

    await district.save();

    res.status(201).json({
      success: true,
      message: 'District created successfully',
      data: district
    });
  } catch (error) {
    console.error('Create district error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all districts
router.get('/districts', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10, state, search } = req.query;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (state && state !== 'all') {
      query.state = new RegExp(state, 'i');
    }
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { state: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') }
      ];
    }

    const districts = await District.find(query)
      .populate('createdBy', 'name email')
      .sort({ state: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await District.countDocuments(query);

    res.json({
      success: true,
      data: districts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== EMPLOYEE COMMISSION MANAGEMENT ====================

// Get all employee commissions
router.get('/employee-commissions', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, employeeId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (employeeId) {
      query.employee = employeeId;
    }

    const commissions = await EmployeeCommission.find(query)
      .populate('employee', 'employeeId name email role')
      .populate('seller', 'name email vendorDetails.shopName')
      .populate('subscription', 'plan amount status')
      .populate('admin.approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EmployeeCommission.countDocuments(query);

    // Get commission statistics
    const stats = await EmployeeCommission.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' }
        }
      }
    ]);

    const summary = {
      pending: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 }
    };

    stats.forEach(stat => {
      summary[stat._id] = { count: stat.count, amount: stat.totalAmount };
    });

    res.json({
      success: true,
      data: {
        commissions,
        summary
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get employee commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Approve employee commission
router.post('/employee-commissions/:commissionId/approve', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const commission = await EmployeeCommission.findById(commissionId)
      .populate('employee', 'name email wallet')
      .populate('seller', 'name vendorDetails.shopName');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission record not found'
      });
    }

    if (commission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Commission has already been processed'
      });
    }

    // Approve commission
    await commission.approve(adminId, adminNotes);

    // Add commission to employee's wallet
    const employee = await Employee.findById(commission.employee._id);
    if (employee && employee.role === 'super_employee') {
      await employee.addCommission(
        commission.commission.amount,
        `Commission for seller: ${commission.seller.name} (${commission.seller.vendorDetails.shopName})`,
        commissionId
      );
    }

    res.json({
      success: true,
      message: 'Employee commission approved and paid successfully',
      data: {
        commission: {
          _id: commission._id,
          status: commission.status,
          amount: commission.commission.amount,
          paidAt: commission.payment.paidAt,
          transactionId: commission.payment.transactionId
        },
        employee: {
          name: employee.name,
          newWalletBalance: employee.wallet.balance
        },
        seller: {
          name: commission.seller.name,
          shopName: commission.seller.vendorDetails.shopName
        }
      }
    });
  } catch (error) {
    console.error('Approve employee commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reject employee commission
router.post('/employee-commissions/:commissionId/reject', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const commission = await EmployeeCommission.findById(commissionId)
      .populate('seller', 'name vendorDetails.shopName');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission record not found'
      });
    }

    if (commission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Commission has already been processed'
      });
    }

    // Reject commission
    await commission.cancel(adminId, adminNotes);

    res.json({
      success: true,
      message: 'Employee commission rejected successfully',
      data: {
        commission: {
          _id: commission._id,
          status: commission.status,
          amount: commission.commission.amount,
          rejectedAt: commission.admin.approvedAt
        },
        seller: {
          name: commission.seller.name,
          shopName: commission.seller.vendorDetails.shopName
        }
      }
    });
  } catch (error) {
    console.error('Reject employee commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 