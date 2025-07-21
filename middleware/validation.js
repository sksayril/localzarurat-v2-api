const Joi = require('joi');

// Common validation schemas
const commonSchemas = {
  id: Joi.string().hex().length(24).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  name: Joi.string().min(2).max(50).trim().required(),
  pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/).required(),
  image: Joi.string().uri().optional(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    phone: commonSchemas.phone,
    role: Joi.string().valid('customer', 'vendor').default('customer'),
    address: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      pincode: commonSchemas.pincode.optional(),
      country: Joi.string().trim().default('India')
    }).optional()
  }),

  adminSignup: Joi.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'string.min': 'Password must be at least 8 characters long'
      }),
    phone: commonSchemas.phone,
    adminCode: Joi.string().trim().required(),
    permissions: Joi.array().items(Joi.string().valid(
      'dashboard', 'vendors', 'kyc', 'withdrawals', 'categories', 
      'subscriptions', 'referrals', 'settings', 'all'
    )).optional()
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password
  }),

  updateProfile: Joi.object({
    name: commonSchemas.name.optional(),
    phone: commonSchemas.phone.optional(),
    profileImage: commonSchemas.image,
    address: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      pincode: commonSchemas.pincode.optional(),
      country: Joi.string().trim().optional()
    }).optional()
  }),

  vendorSignup: Joi.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    phone: commonSchemas.phone,
    gstNumber: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
    mainCategory: commonSchemas.id,
    subCategory: commonSchemas.id,
    referralCode: Joi.string().trim().optional(),
    // Security questions
    securityQuestions: Joi.object({
      question1: Joi.object({
        question: Joi.string().valid(
          'What was your first pet\'s name?',
          'In which city were you born?',
          'What was your mother\'s maiden name?',
          'What was the name of your first school?',
          'What is your favorite movie?',
          'What was your childhood nickname?',
          'What is the name of the street you grew up on?',
          'What was your favorite food as a child?'
        ).required(),
        answer: Joi.string().min(2).max(100).trim().required()
      }).required(),
      question2: Joi.object({
        question: Joi.string().valid(
          'What was your first pet\'s name?',
          'In which city were you born?',
          'What was your mother\'s maiden name?',
          'What was the name of your first school?',
          'What is your favorite movie?',
          'What was your childhood nickname?',
          'What is the name of the street you grew up on?',
          'What was your favorite food as a child?'
        ).required(),
        answer: Joi.string().min(2).max(100).trim().required()
      }).required()
    }).required(),
    // Detailed vendor address
    vendorAddress: Joi.object({
      doorNumber: Joi.string().trim().required(),
      street: Joi.string().trim().required(),
      location: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      pincode: commonSchemas.pincode,
      country: Joi.string().trim().default('India')
    }).required(),
    // Shop images (optional during signup, can be added later)
    shopImages: Joi.array().items(commonSchemas.image).max(10).optional()
  }),

  // Shop listing validation
  shopListing: Joi.object({
    shopName: Joi.string().min(2).max(100).trim().required(),
    shopDescription: Joi.string().min(10).max(2000).trim().required(),
    shopMetaTitle: Joi.string().min(5).max(60).trim().required(),
    shopMetaDescription: Joi.string().min(10).max(160).trim().required(),
    shopMetaKeywords: Joi.array().items(Joi.string().trim()).max(20).required(),
    shopMetaTags: Joi.array().items(Joi.string().trim()).max(15).optional(),
    shopImages: Joi.array().items(commonSchemas.image).min(1).max(20).required()
  }),

  // Update shop listing
  updateShopListing: Joi.object({
    shopName: Joi.string().min(2).max(100).trim().optional(),
    shopDescription: Joi.string().min(10).max(2000).trim().optional(),
    shopMetaTitle: Joi.string().min(5).max(60).trim().optional(),
    shopMetaDescription: Joi.string().min(10).max(160).trim().optional(),
    shopMetaKeywords: Joi.array().items(Joi.string().trim()).max(20).optional(),
    shopMetaTags: Joi.array().items(Joi.string().trim()).max(15).optional(),
    shopImages: Joi.array().items(commonSchemas.image).max(20).optional()
  }),

  // Forgot password schemas
  forgotPassword: Joi.object({
    email: commonSchemas.email
  }),

  verifySecurityQuestions: Joi.object({
    email: commonSchemas.email,
    answer1: Joi.string().min(2).max(100).trim().required(),
    answer2: Joi.string().min(2).max(100).trim().required()
  }),

  resetPassword: Joi.object({
    email: commonSchemas.email,
    answer1: Joi.string().min(2).max(100).trim().required(),
    answer2: Joi.string().min(2).max(100).trim().required(),
    newPassword: commonSchemas.password
  })
};

// Category validation schemas
const categorySchemas = {
  mainCategory: Joi.object({
    name: Joi.string().min(2).max(50).trim().required(),
    icon: commonSchemas.image,
    description: Joi.string().max(500).trim().optional(),
    sortOrder: Joi.number().integer().min(0).default(0),
    metaTitle: Joi.string().min(5).max(60).trim().optional(),
    metaDescription: Joi.string().max(160).trim().optional()
  }),

  mainCategoryUpdate: Joi.object({
    id: commonSchemas.id,
    name: Joi.string().min(2).max(50).trim().required(),
    icon: commonSchemas.image,
    description: Joi.string().max(500).trim().optional(),
    sortOrder: Joi.number().integer().min(0).default(0),
    metaTitle: Joi.string().min(5).max(60).trim().optional(),
    metaDescription: Joi.string().max(160).trim().optional()
  }),

  subCategory: Joi.object({
    name: Joi.string().min(2).max(50).trim().required(),
    mainCategory: commonSchemas.id,
    image: commonSchemas.image,
    thumbnail: commonSchemas.image,
    description: Joi.string().max(500).trim().optional(),
    sortOrder: Joi.number().integer().min(0).default(0),
    metaTitle: Joi.string().min(5).max(60).trim().optional(),
    metaDescription: Joi.string().max(160).trim().optional(),
    keywords: Joi.array().items(Joi.string().trim()).max(20).optional(),
    features: Joi.array().items(Joi.string().trim()).max(10).optional(),
    popularTags: Joi.array().items(Joi.string().trim()).max(15).optional()
  }),

  subCategoryUpdate: Joi.object({
    id: commonSchemas.id,
    name: Joi.string().min(2).max(50).trim().required(),
    mainCategory: commonSchemas.id,
    image: commonSchemas.image,
    thumbnail: commonSchemas.image,
    description: Joi.string().max(500).trim().optional(),
    sortOrder: Joi.number().integer().min(0).default(0),
    metaTitle: Joi.string().min(5).max(60).trim().optional(),
    metaDescription: Joi.string().max(160).trim().optional(),
    keywords: Joi.array().items(Joi.string().trim()).max(20).optional(),
    features: Joi.array().items(Joi.string().trim()).max(10).optional(),
    popularTags: Joi.array().items(Joi.string().trim()).max(15).optional()
  })
};

// Product validation schemas
const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).trim().required(),
    description: Joi.string().min(10).max(2000).trim().required(),
    category: Joi.object({
      mainCategory: commonSchemas.id,
      subCategory: commonSchemas.id
    }).required(),
    price: Joi.object({
      amount: Joi.number().positive().required(),
      currency: Joi.string().valid('INR').default('INR'),
      isNegotiable: Joi.boolean().default(false)
    }).required(),
    specifications: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().required(),
        value: Joi.string().trim().required()
      })
    ).max(20).optional(),
    features: Joi.array().items(Joi.string().trim()).max(15).optional(),
    tags: Joi.array().items(Joi.string().trim()).max(10).optional(),
    stock: Joi.object({
      quantity: Joi.number().integer().min(0).default(0),
      isInStock: Joi.boolean().default(true)
    }).optional(),
    metaTitle: Joi.string().min(5).max(60).trim().optional(),
    metaDescription: Joi.string().max(160).trim().optional(),
    availableInPincodes: Joi.array().items(commonSchemas.pincode).max(50).optional(),
    contactInfo: Joi.object({
      phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
      whatsapp: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
      email: commonSchemas.email.optional()
    }).optional()
  }),

  update: Joi.object({
    id: commonSchemas.id,
    name: Joi.string().min(2).max(100).trim().optional(),
    description: Joi.string().min(10).max(2000).trim().optional(),
    category: Joi.object({
      mainCategory: commonSchemas.id,
      subCategory: commonSchemas.id
    }).optional(),
    price: Joi.object({
      amount: Joi.number().positive().optional(),
      currency: Joi.string().valid('INR').optional(),
      isNegotiable: Joi.boolean().optional()
    }).optional(),
    specifications: Joi.array().items(
      Joi.object({
        name: Joi.string().trim().required(),
        value: Joi.string().trim().required()
      })
    ).max(20).optional(),
    features: Joi.array().items(Joi.string().trim()).max(15).optional(),
    tags: Joi.array().items(Joi.string().trim()).max(10).optional(),
    stock: Joi.object({
      quantity: Joi.number().integer().min(0).optional(),
      isInStock: Joi.boolean().optional()
    }).optional(),
    metaTitle: Joi.string().min(5).max(60).trim().optional(),
    metaDescription: Joi.string().max(160).trim().optional(),
    availableInPincodes: Joi.array().items(commonSchemas.pincode).max(50).optional(),
    contactInfo: Joi.object({
      phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
      whatsapp: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
      email: commonSchemas.email.optional()
    }).optional()
  })
};

// Subscription validation schemas
const subscriptionSchemas = {
  create: Joi.object({
    plan: Joi.string().valid('3months', '6months', '1year').required()
  }),

  withdrawal: Joi.object({
    amount: Joi.number().positive().min(100).required()
  })
};

// KYC validation schemas
const kycSchemas = {
  panCard: Joi.object({
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required()
  }),

  aadharCard: Joi.object({
    aadharNumber: Joi.string().pattern(/^[0-9]{12}$/).required()
  }),

  kycVerification: Joi.object({
    vendorId: commonSchemas.id,
    isVerified: Joi.boolean().required(),
    adminNotes: Joi.string().max(500).optional()
  })
};

// Search validation schemas
const searchSchemas = {
  vendorSearch: Joi.object({
    query: Joi.string().trim().min(2).max(100).optional(),
    category: commonSchemas.id.optional(),
    subCategory: commonSchemas.id.optional(),
    pincode: commonSchemas.pincode.optional(),
    city: Joi.string().trim().optional(),
    state: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),

  productSearch: Joi.object({
    query: Joi.string().trim().min(2).max(100).optional(),
    category: commonSchemas.id.optional(),
    subCategory: commonSchemas.id.optional(),
    vendor: commonSchemas.id.optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    pincode: commonSchemas.pincode.optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  })
};

// Rating validation schemas
const ratingSchemas = {
  create: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().trim().max(1000).optional(),
    categories: Joi.object({
      service: Joi.number().integer().min(1).max(5).default(5),
      quality: Joi.number().integer().min(1).max(5).default(5),
      communication: Joi.number().integer().min(1).max(5).default(5),
      value: Joi.number().integer().min(1).max(5).default(5)
    }).optional(),
    isAnonymous: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string().trim()).max(10).optional()
  }),

  update: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    review: Joi.string().trim().max(1000).optional(),
    categories: Joi.object({
      service: Joi.number().integer().min(1).max(5).optional(),
      quality: Joi.number().integer().min(1).max(5).optional(),
      communication: Joi.number().integer().min(1).max(5).optional(),
      value: Joi.number().integer().min(1).max(5).optional()
    }).optional(),
    isAnonymous: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string().trim()).max(10).optional()
  }),

  moderation: Joi.object({
    id: commonSchemas.id,
    status: Joi.string().valid('pending', 'approved', 'rejected').required(),
    moderationNotes: Joi.string().trim().max(500).optional()
  }),

  helpfulVote: Joi.object({
    isHelpful: Joi.boolean().required()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.query = value;
    next();
  };
};

// Params validation middleware
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.params = value;
    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  commonSchemas,
  userSchemas,
  categorySchemas,
  productSchemas,
  subscriptionSchemas,
  kycSchemas,
  searchSchemas,
  ratingSchemas
}; 