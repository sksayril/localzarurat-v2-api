const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Subscription = require('../models/subscription.model');
const VendorRating = require('../models/vendorRating.model');
const { verifyToken, vendorOnly, updateLastLogin } = require('../middleware/auth');
const { validateQuery, validateParams, commonSchemas } = require('../middleware/validation');
const { uploadMultipleImages, uploadSingleImage, uploadProductImages, uploadShopImages, uploadKYCImage, uploadVendorImages } = require('../utilities/awsS3');
const { createOrder, verifyPaymentSignature, getPaymentDetails } = require('../utilities/razorpay');

// Apply vendor middleware to all routes
router.use(verifyToken, vendorOnly, updateLastLogin);

// ==================== VENDOR DASHBOARD ====================

// Get vendor dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get vendor stats
    const totalProducts = await Product.countDocuments({ vendor: vendorId, isActive: true });
    const totalViews = await Product.aggregate([
      { $match: { vendor: vendorId } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    // Get active subscription
    const activeSubscription = await Subscription.findOne({
      vendor: vendorId,
      status: 'active'
    }).sort({ endDate: -1 });

    // Get recent products
    const recentProducts = await Product.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name price views isActive createdAt')
      .lean();

    // Get wallet balance
    const vendor = await User.findById(vendorId).select('vendorDetails.wallet vendorDetails.subscription vendorDetails.isShopListed');
    const walletBalance = vendor.vendorDetails.wallet.balance;

    // Get pending withdrawal requests
    const pendingWithdrawals = vendor.vendorDetails.withdrawalRequests
      ? vendor.vendorDetails.withdrawalRequests.filter(req => req.status === 'pending').length
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalViews: totalViews[0]?.total || 0,
          walletBalance,
          pendingWithdrawals
        },
        subscription: activeSubscription,
        shopStatus: {
          isListed: vendor.vendorDetails.isShopListed,
          hasActiveSubscription: vendor.hasActiveSubscription()
        },
        recentProducts
      }
    });
  } catch (error) {
    console.error('Vendor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Get subscription plans
router.get('/subscription/plans', async (req, res) => {
  try {
    const plans = {
      "3months": {
        name: "3 Months Plan",
        amount: 199,
        duration: 90,
        features: {
          maxProducts: 50,
          maxImages: 200,
          prioritySupport: true,
          featuredListing: false
        },
        description: "Perfect for new vendors starting their journey. Premium features ka access with priority customer support."
      },
      "6months": {
        name: "6 Months Plan",
        amount: 349,
        duration: 180,
        features: {
          maxProducts: 100,
          maxImages: 500,
          prioritySupport: true,
          featuredListing: false
        },
        description: "Great value for growing businesses. 1 month ki bachat vs 3-month plan with premium features and priority support."
      },
      "1year": {
        name: "12 Months Plan",
        amount: 599,
        duration: 365,
        features: {
          maxProducts: 200,
          maxImages: 1000,
          prioritySupport: true,
          featuredListing: true
        },
        description: "Best value for established vendors. 3 months ki bachat vs 3-month plan with exclusive benefits and updates."
      }
    };

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create subscription
router.post('/subscription', async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { plan } = req.body;

    // Check if vendor already has an active subscription
    const existingSubscription = await Subscription.findOne({
      vendor: vendorId,
      status: { $in: ['active', 'pending'] }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending subscription'
      });
    }

    const vendor = await User.findById(vendorId);
    const planDetails = {
      "3months": {
        name: "3 Months Plan",
        amount: 199,
        duration: 90,
        features: {
          maxProducts: 50,
          maxImages: 200,
          prioritySupport: true,
          featuredListing: false
        }
      },
      "6months": {
        name: "6 Months Plan",
        amount: 349,
        duration: 180,
        features: {
          maxProducts: 100,
          maxImages: 500,
          prioritySupport: true,
          featuredListing: false
        }
      },
      "1year": {
        name: "12 Months Plan",
        amount: 599,
        duration: 365,
        features: {
          maxProducts: 200,
          maxImages: 1000,
          prioritySupport: true,
          featuredListing: true
        }
      }
    }[plan];

    if (!planDetails) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Create Razorpay order for one-time payment
    const razorpayResult = await createOrder(
      planDetails.amount,
      'INR',
      `sub_${vendorId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`
    );

    if (!razorpayResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create payment order',
        error: razorpayResult.error
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.duration);

    // Create subscription record
    const subscription = new Subscription({
      vendor: vendorId,
      plan,
      amount: planDetails.amount,
      status: 'pending',
      startDate,
      endDate,
      razorpay: {
        orderId: razorpayResult.order.id
      },
      features: planDetails.features
    });

    await subscription.save();

    // Update vendor subscription details
    await User.findByIdAndUpdate(vendorId, {
      'vendorDetails.subscription.currentPlan': plan,
      'vendorDetails.subscription.status': 'pending',
      'vendorDetails.subscription.amount': planDetails.amount,
      'vendorDetails.subscription.startDate': startDate,
      'vendorDetails.subscription.endDate': endDate,
      'vendorDetails.subscription.razorpayOrderId': razorpayResult.order.id,
      'vendorDetails.subscription.features': planDetails.features
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription,
        razorpayOrder: razorpayResult.order
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify subscription payment
router.post('/subscription/verify', async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { subscriptionId, orderId, paymentId, signature } = req.body;

    // Verify payment signature using order ID
    console.log('Verifying payment signature:', {
      orderId,
      paymentId,
      signature: signature ? signature.substring(0, 10) + '...' : 'undefined'
    });
    
    const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isValidSignature) {
      console.error('Payment signature verification failed:', {
        orderId,
        paymentId,
        receivedSignature: signature,
        expectedSignature: 'calculated_signature_here'
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
        details: {
          orderId,
          paymentId
        }
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(paymentId);
    
    if (!paymentDetails.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to verify payment with Razorpay'
      });
    }

    // Update subscription status
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.vendor.toString() !== vendorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to subscription'
      });
    }

    // Update subscription
    subscription.status = 'active';
    subscription.razorpay.paymentId = paymentId;
    subscription.razorpay.paymentStatus = paymentDetails.payment.status;
    await subscription.save();

    // Update vendor subscription details
    await User.findByIdAndUpdate(vendorId, {
      'vendorDetails.subscription.status': 'active',
      'vendorDetails.subscription.isActive': true,
      'vendorDetails.subscription.razorpayPaymentId': paymentId
    });

    // Handle referral commission
    let commissionData = null;
    const vendor = await User.findById(vendorId).select('vendorDetails.referredBy');
    
    if (vendor.vendorDetails.referredBy) {
      try {
        const ReferralCommission = require('../models/referralCommission.model');
        const VendorCommissionSettings = require('../models/vendorCommissionSettings.model');
        
        // Get commission percentage for the referrer (default 10%)
        const commissionPercentage = await VendorCommissionSettings.getCommissionPercentage(vendor.vendorDetails.referredBy);
        const commissionAmount = Math.round((subscription.amount * commissionPercentage) / 100);
        
        // Create referral commission record
        const referralCommission = new ReferralCommission({
          referrer: vendor.vendorDetails.referredBy,
          referredVendor: vendorId,
          referralCode: vendor.vendorDetails.referralCode || 'REFERRAL',
          commission: {
            percentage: commissionPercentage,
            amount: commissionAmount,
            currency: 'INR'
          },
          subscription: {
            plan: subscription.plan,
            amount: subscription.amount,
            subscriptionId: subscription._id
          },
          status: 'paid', // Auto-pay commission
          payment: {
            paidAt: new Date(),
            transactionId: `REF_COMM_${Date.now()}_${vendorId}`
          }
        });
        
        await referralCommission.save();
        
        // Add commission to referrer's wallet
        await User.findByIdAndUpdate(
          vendor.vendorDetails.referredBy,
          {
            $inc: { 'vendorDetails.wallet.balance': commissionAmount },
            $push: {
              'vendorDetails.wallet.transactions': {
                type: 'credit',
                amount: commissionAmount,
                description: `Referral commission for ${vendor.name} (${subscription.plan} plan)`,
                date: new Date()
              }
            }
          }
        );
        
        commissionData = {
          referrerId: vendor.vendorDetails.referredBy,
          commissionAmount,
          commissionPercentage,
          transactionId: referralCommission.payment.transactionId
        };
        
        console.log(`✅ Referral commission processed: ${commissionAmount} INR for referrer ${vendor.vendorDetails.referredBy}`);
        
      } catch (commissionError) {
        console.error('❌ Referral commission error:', commissionError);
        // Don't fail the subscription verification if commission fails
        commissionData = {
          error: 'Commission processing failed',
          details: commissionError.message
        };
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        subscription,
        payment: paymentDetails.payment,
        referralCommission: commissionData
      }
    });
  } catch (error) {
    console.error('Verify subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor subscriptions
router.get('/subscription', async (req, res) => {
  try {
    const vendorId = req.user._id;

    const subscriptions = await Subscription.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get detailed subscription information
router.get('/subscription/details', async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get vendor with subscription details
    const vendor = await User.findById(vendorId)
      .select('vendorDetails.subscription vendorDetails.isShopListed')
      .lean();

    // Get active subscription from Subscription collection
    const activeSubscription = await Subscription.findOne({
      vendor: vendorId,
      status: 'active'
    }).sort({ endDate: -1 });

    // Get all subscriptions for history
    const allSubscriptions = await Subscription.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate subscription statistics
    const subscriptionStats = {
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: allSubscriptions.filter(sub => sub.status === 'active').length,
      expiredSubscriptions: allSubscriptions.filter(sub => sub.status === 'expired').length,
      cancelledSubscriptions: allSubscriptions.filter(sub => sub.status === 'cancelled').length,
      totalAmountSpent: allSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0)
    };

    // Get current subscription details
    let currentSubscriptionDetails = null;
    if (activeSubscription) {
      const now = new Date();
      const endDate = new Date(activeSubscription.endDate);
      const remainingDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      const isExpired = remainingDays <= 0;
      const isExpiringSoon = remainingDays <= 7 && remainingDays > 0;

      // Get plan details
      const planDetails = {
        "3months": {
          name: "3 Months Plan",
          amount: 199,
          duration: 90,
          features: {
            maxProducts: 50,
            maxImages: 200,
            prioritySupport: true,
            featuredListing: false
          }
        },
        "6months": {
          name: "6 Months Plan",
          amount: 349,
          duration: 180,
          features: {
            maxProducts: 100,
            maxImages: 500,
            prioritySupport: true,
            featuredListing: false
          }
        },
        "1year": {
          name: "12 Months Plan",
          amount: 599,
          duration: 365,
          features: {
            maxProducts: 200,
            maxImages: 1000,
            prioritySupport: true,
            featuredListing: true
          }
        }
      }[activeSubscription.plan];

      currentSubscriptionDetails = {
        id: activeSubscription._id,
        plan: activeSubscription.plan,
        planName: planDetails?.name || activeSubscription.plan,
        amount: activeSubscription.amount,
        status: isExpired ? 'expired' : activeSubscription.status,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        remainingDays: Math.max(0, remainingDays),
        isExpired,
        isExpiringSoon,
        canRenew: isExpired || isExpiringSoon,
        features: planDetails?.features || activeSubscription.features,
        razorpay: activeSubscription.razorpay,
        createdAt: activeSubscription.createdAt,
        updatedAt: activeSubscription.updatedAt
      };
    }

    // Get subscription history (last 5)
    const subscriptionHistory = allSubscriptions.slice(0, 5).map(sub => {
      const planDetails = {
        "3months": { name: "3 Months Plan", amount: 199 },
        "6months": { name: "6 Months Plan", amount: 349 },
        "1year": { name: "12 Months Plan", amount: 599 }
      }[sub.plan];

      return {
        id: sub._id,
        plan: sub.plan,
        planName: planDetails?.name || sub.plan,
        amount: sub.amount,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        createdAt: sub.createdAt,
        razorpay: sub.razorpay
      };
    });

    // Get available plans for renewal
    const availablePlans = {
      "3months": {
        name: "3 Months Plan",
        amount: 199,
        duration: 90,
        features: {
          maxProducts: 50,
          maxImages: 200,
          prioritySupport: true,
          featuredListing: false
        },
        description: "Perfect for new vendors starting their journey. Premium features ka access with priority customer support."
      },
      "6months": {
        name: "6 Months Plan",
        amount: 349,
        duration: 180,
        features: {
          maxProducts: 100,
          maxImages: 500,
          prioritySupport: true,
          featuredListing: false
        },
        description: "Great value for growing businesses. 1 month ki bachat vs 3-month plan with premium features and priority support."
      },
      "1year": {
        name: "12 Months Plan",
        amount: 599,
        duration: 365,
        features: {
          maxProducts: 200,
          maxImages: 1000,
          prioritySupport: true,
          featuredListing: true
        },
        description: "Best value for established vendors. 3 months ki bachat vs 3-month plan with exclusive benefits and updates."
      }
    };

    // Calculate renewal recommendations
    let renewalRecommendation = null;
    if (currentSubscriptionDetails && (currentSubscriptionDetails.isExpired || currentSubscriptionDetails.isExpiringSoon)) {
      const currentPlan = currentSubscriptionDetails.plan;
      const currentPlanDetails = availablePlans[currentPlan];
      
      // Recommend same plan or upgrade
      if (currentPlan === '3months') {
        renewalRecommendation = {
          recommended: '6months',
          reason: 'Upgrade to 6 months for 1 month ki bachat and better value',
          savings: (currentPlanDetails.amount * 2) - availablePlans['6months'].amount
        };
      } else if (currentPlan === '6months') {
        renewalRecommendation = {
          recommended: '1year',
          reason: 'Upgrade to 12 months for 3 months ki bachat and exclusive benefits',
          savings: (currentPlanDetails.amount * 2) - availablePlans['1year'].amount
        };
      } else {
        renewalRecommendation = {
          recommended: '1year',
          reason: 'Renew your 12 months plan for continued premium benefits',
          savings: 0
        };
      }
    }

    res.json({
      success: true,
      data: {
        currentSubscription: currentSubscriptionDetails,
        subscriptionStats,
        subscriptionHistory,
        availablePlans,
        renewalRecommendation,
        shopStatus: {
          isListed: vendor.vendorDetails.isShopListed,
          hasActiveSubscription: currentSubscriptionDetails && !currentSubscriptionDetails.isExpired
        },
        nextRenewalDate: currentSubscriptionDetails && !currentSubscriptionDetails.isExpired 
          ? currentSubscriptionDetails.endDate 
          : null,
        daysUntilRenewal: currentSubscriptionDetails ? currentSubscriptionDetails.remainingDays : null
      }
    });
  } catch (error) {
    console.error('Get subscription details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== SHOP LISTING MANAGEMENT ====================

// List shop (requires active subscription)
router.post('/shop/listing', uploadShopImages('vendor-shop'), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendor = await User.findById(vendorId);
    const { 
      shopName, 
      shopDescription, 
      shopMetaTitle, 
      shopMetaDescription, 
      shopMetaKeywords, 
      shopMetaTags,
      mainCategory,
      subCategory,
      shopPincode,
      shopAddressLine1,
      shopAddressLine2,
      shopLocation,
      nearbyLocation,
      latitude,
      longitude
    } = req.body;

    // Check if vendor has active subscription
    if (!vendor.hasActiveSubscription()) {
      return res.status(400).json({
        success: false,
        message: 'Active subscription required to list your shop'
      });
    }

    // Validate main category
    if (!mainCategory) {
      return res.status(400).json({
        success: false,
        message: 'Main category is required'
      });
    }

    // Validate sub category
    if (!subCategory) {
      return res.status(400).json({
        success: false,
        message: 'Sub category is required'
      });
    }

    // Validate shop address details
    if (!shopPincode) {
      return res.status(400).json({
        success: false,
        message: 'Shop pincode is required'
      });
    }

    if (!shopAddressLine1) {
      return res.status(400).json({
        success: false,
        message: 'Shop address line 1 is required'
      });
    }

    if (!shopLocation) {
      return res.status(400).json({
        success: false,
        message: 'Shop location is required'
      });
    }

    // Verify main category exists
    const MainCategory = require('../models/mainCategory.model');
    const mainCategoryExists = await MainCategory.findById(mainCategory);
    if (!mainCategoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid main category'
      });
    }

    // Verify sub category exists and belongs to main category
    const SubCategory = require('../models/subCategory.model');
    const subCategoryExists = await SubCategory.findOne({
      _id: subCategory,
      mainCategory: mainCategory
    });
    if (!subCategoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sub category or sub category does not belong to selected main category'
      });
    }

    // Handle uploaded shop images
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        uploadedImages.push(file.location);
      });
    }

    // Combine uploaded images with provided image URLs
    const finalShopImages = [...uploadedImages, ...(req.body.shopImages || [])];

    // Check image limit based on subscription
    const maxImages = vendor.vendorDetails.subscription.features.maxImages;
    if (finalShopImages.length > maxImages) {
      return res.status(400).json({
        success: false,
        message: `Image limit exceeded. You can upload up to ${maxImages} images with your current plan.`
      });
    }

    // Update vendor shop listing
    const updatedVendor = await User.findByIdAndUpdate(
      vendorId,
      {
        'vendorDetails.shopName': shopName,
        'vendorDetails.shopDescription': shopDescription,
        'vendorDetails.shopMetaTitle': shopMetaTitle,
        'vendorDetails.shopMetaDescription': shopMetaDescription,
        'vendorDetails.shopMetaKeywords': shopMetaKeywords,
        'vendorDetails.shopMetaTags': shopMetaTags || [],
        'vendorDetails.shopImages': finalShopImages,
        'vendorDetails.mainCategory': mainCategory,
        'vendorDetails.subCategory': subCategory,
        'vendorDetails.shopAddress': {
          pincode: shopPincode,
          addressLine1: shopAddressLine1,
          addressLine2: shopAddressLine2 || '',
          location: shopLocation,
          nearbyLocation: nearbyLocation || '',
          coordinates: latitude && longitude ? {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          } : null
        },
        'vendorDetails.isShopListed': true,
        'vendorDetails.shopListedAt': new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('vendorDetails.mainCategory', 'name icon slug')
    .populate('vendorDetails.subCategory', 'name image thumbnail slug')
    .select('-password -loginAttempts -lockUntil');

    res.status(201).json({
      success: true,
      message: 'Shop listed successfully',
      data: {
        shop: {
          shopName: updatedVendor.vendorDetails.shopName,
          shopDescription: updatedVendor.vendorDetails.shopDescription,
          shopMetaTitle: updatedVendor.vendorDetails.shopMetaTitle,
          shopMetaDescription: updatedVendor.vendorDetails.shopMetaDescription,
          shopMetaKeywords: updatedVendor.vendorDetails.shopMetaKeywords,
          shopMetaTags: updatedVendor.vendorDetails.shopMetaTags,
          shopImages: updatedVendor.vendorDetails.shopImages,
          category: {
            mainCategory: updatedVendor.vendorDetails.mainCategory,
            subCategory: updatedVendor.vendorDetails.subCategory
          },
          address: updatedVendor.vendorDetails.shopAddress,
          isListed: updatedVendor.vendorDetails.isShopListed,
          listedAt: updatedVendor.vendorDetails.shopListedAt
        }
      }
    });
  } catch (error) {
    console.error('List shop error:', error);
    
    // Handle Multer errors specifically
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `File upload error: ${error.message}. Please ensure you're using the correct field name 'shopImages' for shop images.`
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum file size is 200MB.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded. Maximum 10 shop images allowed.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get shop listing
router.get('/shop/listing', async (req, res) => {
  try {
    const vendorId = req.user._id;

    const vendor = await User.findById(vendorId)
      .populate('vendorDetails.mainCategory', 'name icon slug')
      .populate('vendorDetails.subCategory', 'name image thumbnail slug')
      .select('vendorDetails.shopName vendorDetails.shopDescription vendorDetails.shopMetaTitle vendorDetails.shopMetaDescription vendorDetails.shopMetaKeywords vendorDetails.shopMetaTags vendorDetails.shopImages vendorDetails.shopAddress vendorDetails.isShopListed vendorDetails.shopListedAt vendorDetails.subscription');

    if (!vendor.vendorDetails.isShopListed) {
      return res.status(404).json({
        success: false,
        message: 'Shop not listed yet'
      });
    }

    res.json({
      success: true,
      data: {
        shop: {
          shopName: vendor.vendorDetails.shopName,
          shopDescription: vendor.vendorDetails.shopDescription,
          shopMetaTitle: vendor.vendorDetails.shopMetaTitle,
          shopMetaDescription: vendor.vendorDetails.shopMetaDescription,
          shopMetaKeywords: vendor.vendorDetails.shopMetaKeywords,
          shopMetaTags: vendor.vendorDetails.shopMetaTags,
          shopImages: vendor.vendorDetails.shopImages,
          address: {
            ...vendor.vendorDetails.shopAddress,
            coordinates: vendor.vendorDetails.shopAddress?.coordinates || null
          },
          isListed: vendor.vendorDetails.isShopListed,
          listedAt: vendor.vendorDetails.shopListedAt,
          category: {
            mainCategory: vendor.vendorDetails.mainCategory,
            subCategory: vendor.vendorDetails.subCategory
          }
        },
        subscription: vendor.vendorDetails.subscription
      }
    });
  } catch (error) {
    console.error('Get shop listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update shop listing
router.post('/shop/listing/update', uploadShopImages('vendor-shop'), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const updateData = req.body;

    // Check if vendor has active subscription and shop is listed
    const vendor = await User.findById(vendorId);
    if (!vendor.hasActiveSubscription()) {
      return res.status(400).json({
        success: false,
        message: 'Active subscription required to update shop listing'
      });
    }

    if (!vendor.vendorDetails.isShopListed) {
      return res.status(400).json({
        success: false,
        message: 'Shop must be listed before updating'
      });
    }

    // Handle uploaded shop images
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(file => file.location);
      const existingImages = vendor.vendorDetails.shopImages || [];
      const newImages = [...uploadedImages, ...(updateData.shopImages || [])];

      // Check image limit based on subscription
      const maxImages = vendor.vendorDetails.subscription.features.maxImages;
      if (newImages.length > maxImages) {
        return res.status(400).json({
          success: false,
          message: `Image limit exceeded. You can upload up to ${maxImages} images with your current plan.`
        });
      }

      updateData.shopImages = newImages;
    }

    // Validate categories if provided
    if (updateData.mainCategory) {
      const MainCategory = require('../models/mainCategory.model');
      const mainCategoryExists = await MainCategory.findById(updateData.mainCategory);
      if (!mainCategoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid main category'
        });
      }
    }

    if (updateData.subCategory) {
      const SubCategory = require('../models/subCategory.model');
      const mainCategoryId = updateData.mainCategory || vendor.vendorDetails.mainCategory;
      const subCategoryExists = await SubCategory.findOne({
        _id: updateData.subCategory,
        mainCategory: mainCategoryId
      });
      if (!subCategoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sub category or sub category does not belong to selected main category'
        });
      }
    }

    // Validate address fields if provided
    if (updateData.shopPincode && !updateData.shopPincode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shop pincode cannot be empty'
      });
    }

    if (updateData.shopAddressLine1 && !updateData.shopAddressLine1.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shop address line 1 cannot be empty'
      });
    }

    if (updateData.shopLocation && !updateData.shopLocation.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Shop location cannot be empty'
      });
    }

    // Prepare update object
    const updateObject = {};
    if (updateData.shopName) updateObject['vendorDetails.shopName'] = updateData.shopName;
    if (updateData.shopDescription) updateObject['vendorDetails.shopDescription'] = updateData.shopDescription;
    if (updateData.shopMetaTitle) updateObject['vendorDetails.shopMetaTitle'] = updateData.shopMetaTitle;
    if (updateData.shopMetaDescription) updateObject['vendorDetails.shopMetaDescription'] = updateData.shopMetaDescription;
    if (updateData.shopMetaKeywords) updateObject['vendorDetails.shopMetaKeywords'] = updateData.shopMetaKeywords;
    if (updateData.shopMetaTags) updateObject['vendorDetails.shopMetaTags'] = updateData.shopMetaTags;
    if (updateData.shopImages) updateObject['vendorDetails.shopImages'] = updateData.shopImages;
    if (updateData.mainCategory) updateObject['vendorDetails.mainCategory'] = updateData.mainCategory;
    if (updateData.subCategory) updateObject['vendorDetails.subCategory'] = updateData.subCategory;

    // Handle address updates
    if (updateData.shopPincode || updateData.shopAddressLine1 || updateData.shopAddressLine2 || updateData.shopLocation || updateData.nearbyLocation || updateData.latitude || updateData.longitude) {
      const currentAddress = vendor.vendorDetails.shopAddress || {};
      const currentCoordinates = currentAddress.coordinates || {};
      
      updateObject['vendorDetails.shopAddress'] = {
        pincode: updateData.shopPincode || currentAddress.pincode,
        addressLine1: updateData.shopAddressLine1 || currentAddress.addressLine1,
        addressLine2: updateData.shopAddressLine2 || currentAddress.addressLine2 || '',
        location: updateData.shopLocation || currentAddress.location,
        nearbyLocation: updateData.nearbyLocation || currentAddress.nearbyLocation || '',
        coordinates: (updateData.latitude && updateData.longitude) ? {
          latitude: parseFloat(updateData.latitude),
          longitude: parseFloat(updateData.longitude)
        } : (currentCoordinates.latitude && currentCoordinates.longitude ? currentCoordinates : null)
      };
    }

    const updatedVendor = await User.findByIdAndUpdate(
      vendorId,
      updateObject,
      { new: true, runValidators: true }
    )
    .populate('vendorDetails.mainCategory', 'name icon slug')
    .populate('vendorDetails.subCategory', 'name image thumbnail slug')
    .select('-password -loginAttempts -lockUntil');

    res.json({
      success: true,
      message: 'Shop listing updated successfully',
      data: {
        shop: {
          shopName: updatedVendor.vendorDetails.shopName,
          shopDescription: updatedVendor.vendorDetails.shopDescription,
          shopMetaTitle: updatedVendor.vendorDetails.shopMetaTitle,
          shopMetaDescription: updatedVendor.vendorDetails.shopMetaDescription,
          shopMetaKeywords: updatedVendor.vendorDetails.shopMetaKeywords,
          shopMetaTags: updatedVendor.vendorDetails.shopMetaTags,
          shopImages: updatedVendor.vendorDetails.shopImages,
          category: {
            mainCategory: updatedVendor.vendorDetails.mainCategory,
            subCategory: updatedVendor.vendorDetails.subCategory
          },
          address: updatedVendor.vendorDetails.shopAddress,
          isListed: updatedVendor.vendorDetails.isShopListed,
          listedAt: updatedVendor.vendorDetails.shopListedAt
        }
      }
    });
  } catch (error) {
    console.error('Update shop listing error:', error);
    
    // Handle Multer errors specifically
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `File upload error: ${error.message}. Please ensure you're using the correct field name 'shopImages' for shop images.`
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum file size is 200MB.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded. Maximum 10 shop images allowed.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get All Main Categories
router.get('/categories/main', async (req, res) => {
  try {
    const MainCategory = require('../models/mainCategory.model');
    
    const mainCategories = await MainCategory.find({ isActive: true })
      .select('name _id icon slug description')
      .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: mainCategories.map(category => ({
        _id: category._id,
        title: category.name,
        icon: category.icon,
        slug: category.slug,
        description: category.description
      }))
    });
  } catch (error) {
    console.error('Get main categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Sub Categories by Main Category ID
router.get('/categories/sub/:mainCategoryId', async (req, res) => {
  try {
    const { mainCategoryId } = req.params;
    const SubCategory = require('../models/subCategory.model');
    
    // Validate main category exists
    const MainCategory = require('../models/mainCategory.model');
    const mainCategory = await MainCategory.findById(mainCategoryId);
    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    const subCategories = await SubCategory.find({ 
      mainCategory: mainCategoryId,
      isActive: true 
    })
    .select('name _id image thumbnail slug description')
    .sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      data: {
        mainCategory: {
          _id: mainCategory._id,
          title: mainCategory.name,
          icon: mainCategory.icon,
          slug: mainCategory.slug
        },
        subCategories: subCategories.map(subCategory => ({
          _id: subCategory._id,
          title: subCategory.name,
          image: subCategory.image,
          thumbnail: subCategory.thumbnail,
          slug: subCategory.slug,
          description: subCategory.description
        }))
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

// Get All Categories (Main + Sub) in Tree Structure
router.get('/categories/all', async (req, res) => {
  try {
    const MainCategory = require('../models/mainCategory.model');
    const SubCategory = require('../models/subCategory.model');
    
    const mainCategories = await MainCategory.find({ isActive: true })
      .select('name _id icon slug description')
      .sort({ sortOrder: 1, name: 1 });

    const categoriesTree = await Promise.all(
      mainCategories.map(async (mainCategory) => {
        const subCategories = await SubCategory.find({ 
          mainCategory: mainCategory._id,
          isActive: true 
        })
        .select('name _id image thumbnail slug description')
        .sort({ sortOrder: 1, name: 1 });

        return {
          _id: mainCategory._id,
          title: mainCategory.name,
          icon: mainCategory.icon,
          slug: mainCategory.slug,
          description: mainCategory.description,
          subCategories: subCategories.map(subCategory => ({
            _id: subCategory._id,
            title: subCategory.name,
            image: subCategory.image,
            thumbnail: subCategory.thumbnail,
            slug: subCategory.slug,
            description: subCategory.description
          }))
        };
      })
    );

    res.json({
      success: true,
      data: categoriesTree
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Vendor Referral Analytics & Wallet Balance
router.get('/referral/analytics', async (req, res) => {
  try {
    const vendorId = req.user._id;
    const User = require('../models/user.model');
    const ReferralCommission = require('../models/referralCommission.model');

    // Get vendor details with wallet and referral info
    const vendor = await User.findById(vendorId)
      .select('vendorDetails.referralCode vendorDetails.wallet vendorDetails.referredBy name email');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Get all vendors referred by this vendor
    const referredVendors = await User.find({
      'vendorDetails.referredBy': vendorId
    })
    .select('name email vendorDetails.shopName vendorDetails.subscription vendorDetails.isShopListed createdAt')
    .sort({ createdAt: -1 });

    // Get referral commissions for this vendor
    const commissions = await ReferralCommission.find({
      referrer: vendorId
    })
    .populate('referredVendor', 'name email vendorDetails.shopName')
    .populate('subscription', 'plan amount status startDate endDate')
    .sort({ createdAt: -1 });

    // Calculate analytics
    const totalReferrals = referredVendors.length;
    const activeSubscriptions = referredVendors.filter(v => 
      v.vendorDetails.subscription && v.vendorDetails.subscription.status === 'active'
    ).length;
    const expiredSubscriptions = referredVendors.filter(v => 
      v.vendorDetails.subscription && v.vendorDetails.subscription.status === 'expired'
    ).length;
    const pendingSubscriptions = referredVendors.filter(v => 
      v.vendorDetails.subscription && v.vendorDetails.subscription.status === 'pending'
    ).length;
    const noSubscription = referredVendors.filter(v => 
      !v.vendorDetails.subscription || v.vendorDetails.subscription.status === 'inactive'
    ).length;

    // Calculate commission statistics
    const totalCommissions = commissions.length;
    const paidCommissions = commissions.filter(c => c.status === 'paid').length;
    const pendingCommissions = commissions.filter(c => c.status === 'pending').length;
    const totalEarned = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const pendingAmount = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    // Get wallet balance
    const walletBalance = vendor.vendorDetails.wallet?.balance || 0;
    const withdrawalRequests = vendor.vendorDetails.wallet?.withdrawalRequests || [];

    // Calculate conversion rates
    const subscriptionConversionRate = totalReferrals > 0 ? 
      ((activeSubscriptions + expiredSubscriptions) / totalReferrals * 100).toFixed(2) : 0;
    const activeConversionRate = totalReferrals > 0 ? 
      (activeSubscriptions / totalReferrals * 100).toFixed(2) : 0;

    // Get recent referral activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReferrals = referredVendors.filter(v => 
      new Date(v.createdAt) >= thirtyDaysAgo
    ).length;

    const recentCommissions = commissions.filter(c => 
      new Date(c.createdAt) >= thirtyDaysAgo
    ).length;

    // Get commission by plan type
    const commissionByPlan = await ReferralCommission.aggregate([
      { $match: { referrer: vendorId } },
      { $lookup: { from: 'subscriptions', localField: 'subscription', foreignField: '_id', as: 'subscriptionData' } },
      { $unwind: '$subscriptionData' },
      {
        $group: {
          _id: '$subscriptionData.plan',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
            }
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'paid'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        vendorInfo: {
          name: vendor.name,
          email: vendor.email,
          referralCode: vendor.vendorDetails.referralCode,
          referredBy: vendor.vendorDetails.referredBy ? {
            _id: vendor.vendorDetails.referredBy,
            name: 'Referrer Name' // You might want to populate this
          } : null
        },
        wallet: {
          balance: walletBalance,
          withdrawalRequests: withdrawalRequests.map(req => ({
            _id: req._id,
            amount: req.amount,
            paymentMethod: req.paymentMethod,
            upiId: req.upiId,
            bankDetails: req.bankDetails,
            status: req.status,
            requestDate: req.requestDate,
            processedDate: req.processedDate,
            processedBy: req.processedBy,
            adminNotes: req.adminNotes,
            transactionId: req.transactionId
          }))
        },
        referralStats: {
          totalReferrals,
          activeSubscriptions,
          expiredSubscriptions,
          pendingSubscriptions,
          noSubscription,
          subscriptionConversionRate: parseFloat(subscriptionConversionRate),
          activeConversionRate: parseFloat(activeConversionRate),
          recentReferrals,
          recentCommissions
        },
        commissionStats: {
          totalCommissions,
          paidCommissions,
          pendingCommissions,
          totalEarned,
          pendingAmount,
          commissionByPlan
        },
        referredVendors: referredVendors.map(vendor => ({
          _id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          shopName: vendor.vendorDetails.shopName,
          subscription: vendor.vendorDetails.subscription ? {
            plan: vendor.vendorDetails.subscription.currentPlan,
            status: vendor.vendorDetails.subscription.status,
            isActive: vendor.vendorDetails.subscription.isActive,
            startDate: vendor.vendorDetails.subscription.startDate,
            endDate: vendor.vendorDetails.subscription.endDate
          } : null,
          isShopListed: vendor.vendorDetails.isShopListed,
          joinedAt: vendor.createdAt
        })),
        recentCommissions: commissions.slice(0, 10).map(commission => ({
          _id: commission._id,
          referredVendor: {
            _id: commission.referredVendor._id,
            name: commission.referredVendor.name,
            shopName: commission.referredVendor.vendorDetails.shopName
          },
          subscription: commission.subscription ? {
            plan: commission.subscription.plan,
            amount: commission.subscription.amount,
            status: commission.subscription.status
          } : null,
          commission: {
            percentage: commission.percentage,
            amount: commission.amount
          },
          status: commission.status,
          createdAt: commission.createdAt,
          paidAt: commission.paidAt
        }))
      }
    });
  } catch (error) {
    console.error('Get referral analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Vendor Profile Details
router.get('/profile', async (req, res) => {
  try {
    const vendorId = req.user._id;
    const User = require('../models/user.model');

    const vendor = await User.findById(vendorId)
      .populate('vendorDetails.mainCategory', 'name icon slug')
      .populate('vendorDetails.subCategory', 'name image thumbnail slug')
      .populate('vendorDetails.referredBy', 'name vendorDetails.shopName')
      .select('-password -loginAttempts -lockUntil -securityQuestions');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: {
        // Basic user information
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        role: vendor.role,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        lastLogin: vendor.lastLogin,

        // Vendor specific details
        vendorDetails: {
          // Shop information
          shopName: vendor.vendorDetails.shopName,
          shopDescription: vendor.vendorDetails.shopDescription,
          shopMetaTitle: vendor.vendorDetails.shopMetaTitle,
          shopMetaDescription: vendor.vendorDetails.shopMetaDescription,
          shopMetaKeywords: vendor.vendorDetails.shopMetaKeywords,
          shopMetaTags: vendor.vendorDetails.shopMetaTags,
          shopImages: vendor.vendorDetails.shopImages,
          isShopListed: vendor.vendorDetails.isShopListed,
          shopListedAt: vendor.vendorDetails.shopListedAt,

          // Shop address
          shopAddress: vendor.vendorDetails.shopAddress,

          // Business information
          gstNumber: vendor.vendorDetails.gstNumber,

          // Vendor address (personal/business address)
          vendorAddress: vendor.vendorDetails.vendorAddress,

          // Categories
          mainCategory: vendor.vendorDetails.mainCategory,
          subCategory: vendor.vendorDetails.subCategory,

          // KYC information
          kyc: {
            panNumber: vendor.vendorDetails.kyc?.panNumber,
            panImage: vendor.vendorDetails.kyc?.panImage,
            aadharNumber: vendor.vendorDetails.kyc?.aadharNumber,
            aadharFrontImage: vendor.vendorDetails.kyc?.aadharFrontImage,
            aadharBackImage: vendor.vendorDetails.kyc?.aadharBackImage,
            isVerified: vendor.vendorDetails.kyc?.isVerified || false,
            verificationDate: vendor.vendorDetails.kyc?.verificationDate,
            verifiedBy: vendor.vendorDetails.kyc?.verifiedBy
          },

          // Subscription information
          subscription: vendor.vendorDetails.subscription ? {
            currentPlan: vendor.vendorDetails.subscription.currentPlan,
            status: vendor.vendorDetails.subscription.status,
            amount: vendor.vendorDetails.subscription.amount,
            startDate: vendor.vendorDetails.subscription.startDate,
            endDate: vendor.vendorDetails.subscription.endDate,
            isActive: vendor.vendorDetails.subscription.isActive,
            razorpaySubscriptionId: vendor.vendorDetails.subscription.razorpaySubscriptionId,
            razorpayPaymentId: vendor.vendorDetails.subscription.razorpayPaymentId,
            features: vendor.vendorDetails.subscription.features
          } : null,

          // Referral information
          referralCode: vendor.vendorDetails.referralCode,
          referredBy: vendor.vendorDetails.referredBy,

          // Wallet information
          wallet: vendor.vendorDetails.wallet ? {
            balance: vendor.vendorDetails.wallet.balance || 0,
            transactions: vendor.vendorDetails.wallet.transactions || []
          } : { balance: 0, transactions: [] },

          // Withdrawal requests
          withdrawalRequests: vendor.vendorDetails.withdrawalRequests || [],

          // Rating and review statistics
          averageRating: vendor.vendorDetails.averageRating || 0,
          totalRatings: vendor.vendorDetails.totalRatings || 0,
          ratingDistribution: vendor.vendorDetails.ratingDistribution || {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
          }
        },

        // Subscription status helper
        hasActiveSubscription: vendor.hasActiveSubscription ? vendor.hasActiveSubscription() : false,

        // Profile completion status
        profileCompletion: {
          basicInfo: !!(vendor.name && vendor.email && vendor.phone),
          businessInfo: !!(vendor.vendorDetails.gstNumber),
          address: !!(vendor.vendorDetails.vendorAddress?.pincode && vendor.vendorDetails.vendorAddress?.location),
          shopInfo: !!(vendor.vendorDetails.shopName && vendor.vendorDetails.shopDescription),
          shopAddress: !!(vendor.vendorDetails.shopAddress?.pincode && vendor.vendorDetails.shopAddress?.addressLine1 && vendor.vendorDetails.shopAddress?.location),
          categories: !!(vendor.vendorDetails.mainCategory && vendor.vendorDetails.subCategory),
          kyc: !!(vendor.vendorDetails.kyc?.panNumber && vendor.vendorDetails.kyc?.aadharNumber),
          subscription: !!(vendor.vendorDetails.subscription?.isActive),
          shopListed: !!(vendor.vendorDetails.isShopListed)
        }
      }
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== PRODUCT MANAGEMENT ====================

// Create product (requires active subscription and shop listing)
router.post('/products', uploadProductImages('vendor', 'product'), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const productData = req.body;

    // Check if vendor has active subscription and shop is listed
    const vendor = await User.findById(vendorId);
    if (!vendor.hasActiveSubscription()) {
      return res.status(400).json({
        success: false,
        message: 'Active subscription required to create products'
      });
    }

    if (!vendor.vendorDetails.isShopListed) {
      return res.status(400).json({
        success: false,
        message: 'Shop must be listed before creating products'
      });
    }

    // Check subscription limits
    const currentProductCount = await Product.countDocuments({ vendor: vendorId, isActive: true });
    const maxProducts = vendor.vendorDetails.subscription.features.maxProducts;
    
    if (currentProductCount >= maxProducts) {
      return res.status(400).json({
        success: false,
        message: `Product limit reached. You can create up to ${maxProducts} products with your current plan.`
      });
    }

    // Automatically use shop's categories if not provided
    if (!productData.category) {
      productData.category = {
        mainCategory: vendor.vendorDetails.mainCategory,
        subCategory: vendor.vendorDetails.subCategory
      };
    } else {
      // If categories are provided, validate they match shop's categories
      if (productData.category.mainCategory && 
          productData.category.mainCategory.toString() !== vendor.vendorDetails.mainCategory.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Product main category must match your shop\'s main category'
        });
      }
      
      if (productData.category.subCategory && 
          productData.category.subCategory.toString() !== vendor.vendorDetails.subCategory.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Product sub category must match your shop\'s sub category'
        });
      }
    }

    // Handle product images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        images.push({
          url: file.location,
          isPrimary: index === 0, // First image is primary
          alt: productData.name
        });
      });
    }

    // Check image limit
    const maxImages = vendor.vendorDetails.subscription.features.maxImages;
    if (images.length > maxImages) {
      return res.status(400).json({
        success: false,
        message: `Image limit exceeded. You can upload up to ${maxImages} images with your current plan.`
      });
    }

    const product = new Product({
      ...productData,
      vendor: vendorId,
      images
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get vendor products
router.get('/products', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const products = await Product.find({ vendor: vendorId })
      .populate('category.mainCategory', 'name icon')
      .populate('category.subCategory', 'name image thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments({ vendor: vendorId });

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

// Get single product
router.get('/products/:id', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user._id;

    const product = await Product.findOne({ _id: id, vendor: vendorId })
      .populate('category.mainCategory', 'name icon')
      .populate('category.subCategory', 'name image thumbnail')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update product
router.post('/products/update', uploadMultipleImages('products', [], 10), async (req, res) => {
  try {
    const { id } = req.body;
    const vendorId = req.user._id;
    const updateData = req.body;

    // Check if product belongs to vendor
    const existingProduct = await Product.findOne({ _id: id, vendor: vendorId });
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get vendor details for category validation
    const vendor = await User.findById(vendorId).select('vendorDetails.mainCategory vendorDetails.subCategory');
    
    // Validate categories if provided in update
    if (updateData.category) {
      if (updateData.category.mainCategory && 
          updateData.category.mainCategory.toString() !== vendor.vendorDetails.mainCategory.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Product main category must match your shop\'s main category'
        });
      }
      
      if (updateData.category.subCategory && 
          updateData.category.subCategory.toString() !== vendor.vendorDetails.subCategory.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Product sub category must match your shop\'s sub category'
        });
      }
    }

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: file.location,
        isPrimary: index === 0,
        alt: updateData.name || existingProduct.name
      }));

      // Check subscription image limit
      const activeSubscription = await Subscription.findOne({
        vendor: vendorId,
        status: 'active'
      });

      if (newImages.length > activeSubscription.features.maxImages) {
        return res.status(400).json({
          success: false,
          message: `Image limit exceeded. You can upload up to ${activeSubscription.features.maxImages} images with your current plan.`
        });
      }

      updateData.images = newImages;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('category.mainCategory', 'name icon')
    .populate('category.subCategory', 'name image thumbnail');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete product
router.post('/products/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const vendorId = req.user._id;

    const product = await Product.findOneAndDelete({ _id: id, vendor: vendorId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== WALLET MANAGEMENT ====================

// Get wallet details
router.get('/wallet', async (req, res) => {
  try {
    const vendorId = req.user._id;

    const vendor = await User.findById(vendorId)
      .select('vendorDetails.wallet vendorDetails.withdrawalRequests')
      .lean();

    res.json({
      success: true,
      data: {
        balance: vendor.vendorDetails.wallet.balance,
        transactions: vendor.vendorDetails.wallet.transactions,
        withdrawalRequests: vendor.vendorDetails.withdrawalRequests || []
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Request withdrawal
router.post('/wallet/withdraw', async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { 
      amount, 
      paymentMethod, 
      upiId, 
      bankDetails 
    } = req.body;

    // Validate required fields
    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment method are required'
      });
    }

    if (!['upi', 'bank'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Payment method must be either "upi" or "bank"'
      });
    }

    // Validate UPI ID if UPI method is selected
    if (paymentMethod === 'upi') {
      if (!upiId || upiId.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'UPI ID is required for UPI payment method'
        });
      }
      // Basic UPI ID validation (format: name@upi)
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
      if (!upiRegex.test(upiId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UPI ID format. Use format: name@upi'
        });
      }
    }

    // Validate bank details if bank method is selected
    if (paymentMethod === 'bank') {
      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || 
          !bankDetails.accountHolderName || !bankDetails.bankName) {
        return res.status(400).json({
          success: false,
          message: 'All bank details are required: accountNumber, ifscCode, accountHolderName, bankName'
        });
      }

      // Validate IFSC code format
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(bankDetails.ifscCode.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid IFSC code format'
        });
      }

      // Validate account number (should be numeric and 9-18 digits)
      const accountRegex = /^[0-9]{9,18}$/;
      if (!accountRegex.test(bankDetails.accountNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid account number format'
        });
      }
    }

    const vendor = await User.findById(vendorId);
    
    if (vendor.vendorDetails.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Check minimum withdrawal amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹100'
      });
    }

    // Initialize withdrawalRequests array if it doesn't exist
    if (!vendor.vendorDetails.withdrawalRequests) {
      vendor.vendorDetails.withdrawalRequests = [];
    }

    // Create withdrawal request object
    const withdrawalRequest = {
      amount,
      paymentMethod,
      status: 'pending',
      requestDate: new Date()
    };

    // Add payment method specific details
    if (paymentMethod === 'upi') {
      withdrawalRequest.upiId = upiId.trim();
    } else if (paymentMethod === 'bank') {
      withdrawalRequest.bankDetails = {
        accountNumber: bankDetails.accountNumber.trim(),
        ifscCode: bankDetails.ifscCode.trim().toUpperCase(),
        accountHolderName: bankDetails.accountHolderName.trim(),
        bankName: bankDetails.bankName.trim()
      };
    }

    // Add withdrawal request
    vendor.vendorDetails.withdrawalRequests.push(withdrawalRequest);

    await vendor.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        requestId: vendor.vendorDetails.withdrawalRequests[vendor.vendorDetails.withdrawalRequests.length - 1]._id,
        amount,
        paymentMethod,
        status: 'pending',
        requestDate: new Date()
      }
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== REFERRAL MANAGEMENT ====================

// Get referral details
router.get('/referral', async (req, res) => {
  try {
    const vendorId = req.user._id;

    const vendor = await User.findById(vendorId)
      .populate('vendorDetails.referredBy', 'name vendorDetails.shopName')
      .select('vendorDetails.referralCode vendorDetails.referredBy vendorDetails.wallet')
      .lean();

    // Get referred vendors
    const referredVendors = await User.find({
      'vendorDetails.referredBy': vendorId,
      role: 'vendor'
    })
    .select('name email vendorDetails.shopName createdAt vendorDetails.subscription')
    .sort({ createdAt: -1 })
    .lean();

    // Get referral commissions
    const ReferralCommission = require('../models/referralCommission.model');
    const commissions = await ReferralCommission.find({ referrer: vendorId })
      .populate('referredVendor', 'name vendorDetails.shopName')
      .populate('subscription', 'plan amount status')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate commission statistics
    const totalCommissions = commissions.length;
    const paidCommissions = commissions.filter(c => c.status === 'paid');
    const pendingCommissions = commissions.filter(c => c.status === 'pending');
    
    const totalEarned = paidCommissions.reduce((sum, c) => sum + c.commission.amount, 0);
    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + c.commission.amount, 0);

    // Get system settings for commission percentage
    const SystemSettings = require('../models/systemSettings.model');
    const settings = await SystemSettings.getSettings();

    res.json({
      success: true,
      data: {
        referralCode: vendor.vendorDetails.referralCode,
        referredBy: vendor.vendorDetails.referredBy,
        referredVendors,
        totalReferrals: referredVendors.length,
        commissions: {
          total: totalCommissions,
          paid: paidCommissions.length,
          pending: pendingCommissions.length,
          totalEarned,
          pendingAmount
        },
        commissionSettings: {
          percentage: settings.referralCommission.percentage,
          isActive: settings.referralCommission.isActive,
          minimumAmount: settings.referralCommission.minimumSubscriptionAmount,
          maximumAmount: settings.referralCommission.maximumCommissionPerReferral
        },
        walletBalance: vendor.vendorDetails.wallet.balance,
        recentCommissions: commissions.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get referral details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get detailed referral commissions
router.get('/referral/commissions', async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const ReferralCommission = require('../models/referralCommission.model');
    
    const filter = { referrer: vendorId };
    if (status) filter.status = status;

    const commissions = await ReferralCommission.find(filter)
      .populate('referredVendor', 'name email vendorDetails.shopName')
      .populate('subscription', 'plan amount status startDate endDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ReferralCommission.countDocuments(filter);

    // Calculate totals
    const totalAmount = await ReferralCommission.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    const paidAmount = await ReferralCommission.aggregate([
      { $match: { ...filter, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    const pendingAmount = await ReferralCommission.aggregate([
      { $match: { ...filter, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        commissions,
        totals: {
          totalCommissions: total,
          totalAmount: totalAmount[0]?.total || 0,
          paidAmount: paidAmount[0]?.total || 0,
          pendingAmount: pendingAmount[0]?.total || 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
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

// Get referral analytics
router.get('/referral/analytics', async (req, res) => {
  try {
    const vendorId = req.user._id;

    const ReferralCommission = require('../models/referralCommission.model');
    
    // Get monthly commission data for the last 12 months
    const monthlyCommissions = await ReferralCommission.aggregate([
      { $match: { referrer: vendorId, status: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$commission.amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get commission by subscription plan
    const commissionByPlan = await ReferralCommission.aggregate([
      { $match: { referrer: vendorId, status: 'paid' } },
      {
        $group: {
          _id: '$subscription.plan',
          totalAmount: { $sum: '$commission.amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get top referred vendors by commission
    const topReferredVendors = await ReferralCommission.aggregate([
      { $match: { referrer: vendorId, status: 'paid' } },
      {
        $group: {
          _id: '$referredVendor',
          totalAmount: { $sum: '$commission.amount' },
          count: { $sum: 1 }
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
            name: 1,
            email: 1,
            'vendorDetails.shopName': 1
          },
          totalAmount: 1,
          count: 1
        }
      }
    ]);

    // Get overall statistics
    const totalReferrals = await ReferralCommission.countDocuments({ referrer: vendorId });
    const totalPaidCommissions = await ReferralCommission.countDocuments({ 
      referrer: vendorId, 
      status: 'paid' 
    });
    const totalPendingCommissions = await ReferralCommission.countDocuments({ 
      referrer: vendorId, 
      status: 'pending' 
    });

    const totalEarned = await ReferralCommission.aggregate([
      { $match: { referrer: vendorId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    const totalPending = await ReferralCommission.aggregate([
      { $match: { referrer: vendorId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalReferrals,
          totalPaidCommissions,
          totalPendingCommissions,
          totalEarned: totalEarned[0]?.total || 0,
          totalPending: totalPending[0]?.total || 0
        },
        monthlyCommissions,
        commissionByPlan,
        topReferredVendors
      }
    });
  } catch (error) {
    console.error('Get referral analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== KYC MANAGEMENT ====================

// Upload PAN Card
router.post('/kyc/pan', (req, res, next) => {
  // Create dynamic upload middleware with user ID
  const uploadMiddleware = uploadKYCImage(req.user._id.toString(), 'pan');
  uploadMiddleware(req, res, next);
}, async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { panNumber } = req.body;

    if (!panNumber || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'PAN number and image are required'
      });
    }

    // Validate PAN number format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PAN number format'
      });
    }

    const panImage = req.file.location;

    // Update vendor KYC
    await User.findByIdAndUpdate(vendorId, {
      'vendorDetails.kyc.panNumber': panNumber.toUpperCase(),
      'vendorDetails.kyc.panImage': panImage
    });

    res.json({
      success: true,
      message: 'PAN card uploaded successfully',
      data: {
        panNumber: panNumber.toUpperCase(),
        panImage
      }
    });
  } catch (error) {
    console.error('Upload PAN card error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload Aadhar Card
router.post('/kyc/aadhar', (req, res, next) => {
  // Create dynamic upload middleware with user ID
  const uploadMiddleware = uploadMultipleImages('uploads/kyc', [req.user._id.toString(), 'aadhar'], 2);
  uploadMiddleware(req, res, next);
}, async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { aadharNumber } = req.body;

    if (!aadharNumber || !req.files || req.files.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number and both front/back images are required'
      });
    }

    // Validate Aadhar number format
    const aadharRegex = /^[0-9]{12}$/;
    if (!aadharRegex.test(aadharNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhar number format (should be 12 digits)'
      });
    }

    const aadharFrontImage = req.files[0].location;
    const aadharBackImage = req.files[1].location;

    // Update vendor KYC
    await User.findByIdAndUpdate(vendorId, {
      'vendorDetails.kyc.aadharNumber': aadharNumber,
      'vendorDetails.kyc.aadharFrontImage': aadharFrontImage,
      'vendorDetails.kyc.aadharBackImage': aadharBackImage
    });

    res.json({
      success: true,
      message: 'Aadhar card uploaded successfully',
      data: {
        aadharNumber,
        aadharFrontImage,
        aadharBackImage
      }
    });
  } catch (error) {
    console.error('Upload Aadhar card error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get KYC status
router.get('/kyc/status', async (req, res) => {
  try {
    const vendorId = req.user._id;

    const vendor = await User.findById(vendorId)
      .select('vendorDetails.kyc')
      .lean();

    res.json({
      success: true,
      data: vendor.vendorDetails.kyc
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== ANALYTICS ====================

// Get product analytics
router.get('/analytics/products', async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get product views
    const productViews = await Product.aggregate([
      { $match: { vendor: vendorId } },
      { $group: { _id: '$name', views: { $sum: '$views' } } },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);

    // Get total views
    const totalViews = await Product.aggregate([
      { $match: { vendor: vendorId } },
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $match: { vendor: vendorId } },
      {
        $lookup: {
          from: 'subcategories',
          localField: 'category.subCategory',
          foreignField: '_id',
          as: 'subCategory'
        }
      },
      { $unwind: '$subCategory' },
      {
        $group: {
          _id: '$subCategory.name',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        productViews,
        totalViews: totalViews[0]?.total || 0,
        productsByCategory
      }
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== RATINGS & REVIEWS ====================

// Get vendor's ratings and reviews
router.get('/ratings', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { page = 1, limit = 10, status = 'approved' } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { vendor: vendorId };
    if (status !== 'all') {
      query.status = status;
    }

    const ratings = await VendorRating.find(query)
      .populate('customer', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await VendorRating.countDocuments(query);

    // Get rating statistics
    const stats = await VendorRating.getVendorRatingStats(vendorId);

    res.json({
      success: true,
      data: {
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

// Get rating details
router.get('/ratings/:id', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id: ratingId } = req.params;

    const rating = await VendorRating.findOne({
      _id: ratingId,
      vendor: vendorId
    })
    .populate('customer', 'name profileImage')
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

// Reply to a review
router.post('/ratings/:id/reply', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { id: ratingId } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const rating = await VendorRating.findOne({
      _id: ratingId,
      vendor: vendorId
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Add vendor reply
    rating.vendorReply = {
      content: reply.trim(),
      repliedAt: new Date()
    };

    await rating.save();

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: {
        reply: rating.vendorReply
      }
    });
  } catch (error) {
    console.error('Reply to review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get rating analytics
router.get('/analytics/ratings', async (req, res) => {
  try {
    const vendorId = req.user._id;

    // Get rating statistics
    const stats = await VendorRating.getVendorRatingStats(vendorId);

    // Get ratings by month
    const ratingsByMonth = await VendorRating.aggregate([
      {
        $match: {
          vendor: vendorId,
          status: 'approved'
        }
      },
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
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    // Get category ratings
    const categoryRatings = await VendorRating.aggregate([
      {
        $match: {
          vendor: vendorId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          service: { $avg: '$categories.service' },
          quality: { $avg: '$categories.quality' },
          communication: { $avg: '$categories.communication' },
          value: { $avg: '$categories.value' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        statistics: stats,
        ratingsByMonth,
        categoryRatings: categoryRatings[0] || {
          service: 0,
          quality: 0,
          communication: 0,
          value: 0
        }
      }
    });
  } catch (error) {
    console.error('Get rating analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 