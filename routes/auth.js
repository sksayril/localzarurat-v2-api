const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { generateToken, verifyToken, adminOnly, vendorOnly, customerOnly, checkLoginAttempts, updateLastLogin } = require('../middleware/auth');
// Validation removed - using Mongoose schema validation only
const { uploadSingleImage, uploadMultipleImages, uploadVendorImages } = require('../utilities/awsS3');

// Admin signup (only for initial admin creation or by existing admin)
router.post('/admin-signup', async (req, res) => {
  try {
    const { name, email, password, phone, adminCode } = req.body;

    // Check if admin code is provided and valid
    const validAdminCode = process.env.ADMIN_SIGNUP_CODE || 'ADMIN2024';
    if (!adminCode || adminCode !== validAdminCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin signup code'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    // If admin exists and no authentication, only allow if it's the first admin
    if (existingAdmin && !req.user) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists. Only existing admin can create additional admins.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create admin user
    const admin = new User({
      name,
      email,
      password,
      phone,
      role: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      // Admin-specific fields
      adminDetails: {
        permissions: ['all'], // Full permissions
        lastLogin: new Date(),
        createdBy: req.user ? req.user._id : null,
        isSuperAdmin: !existingAdmin // First admin is super admin
      }
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin._id, admin.role);

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: existingAdmin ? 'Admin created successfully' : 'First admin created successfully',
      data: {
        admin: adminResponse,
        token
      }
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin signup with authentication (for existing admin to create new admin)
router.post('/admin-signup/authenticated', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, permissions } = req.body;
    const createdBy = req.user._id;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create admin user with permissions
    const admin = new User({
      name,
      email,
      password,
      phone,
      role: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
      adminDetails: {
        permissions: permissions || ['dashboard', 'vendors', 'kyc', 'withdrawals', 'categories'],
        lastLogin: new Date(),
        createdBy: createdBy
      }
    });

    await admin.save();

    // Generate token
    const token = generateToken(admin._id, admin.role);

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin: adminResponse,
        token
      }
    });
  } catch (error) {
    console.error('Authenticated admin signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      role,
      address
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enhanced vendor signup with all required fields
router.post('/vendor-signup', uploadVendorImages('vendor-signup'), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      gstNumber,
      mainCategory, 
      subCategory, 
      referralCode, 
      vendorAddress,
      securityQuestions,
      shopImages 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Check if GST number already exists (if provided)
    if (gstNumber) {
      const existingGST = await User.findOne({
        'vendorDetails.gstNumber': gstNumber.toUpperCase()
      });

      if (existingGST) {
        return res.status(400).json({
          success: false,
          message: 'GST number already registered'
        });
      }
    }

    // Check if referral code exists
    let referredBy = null;
    if (referralCode) {
      referredBy = await User.findOne({
        'vendorDetails.referralCode': referralCode,
        role: 'vendor'
      });

      if (!referredBy) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code'
        });
      }
    }

    // Handle uploaded shop images
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        uploadedImages.push(file.location);
      });
    }

    // Combine uploaded images with provided image URLs
    const finalShopImages = [...uploadedImages, ...(shopImages || [])];

    // Create new vendor
    const vendor = new User({
      name,
      email,
      password,
      phone,
      role: 'vendor',
      address: vendorAddress, // Use vendor address as main address
      securityQuestions,
      vendorDetails: {
        gstNumber: gstNumber ? gstNumber.toUpperCase() : undefined,
        vendorAddress,
        mainCategory,
        subCategory,
        referredBy: referredBy?._id,
        shopImages: finalShopImages
      }
    });

    await vendor.save();

    // Generate token
    const token = generateToken(vendor._id, vendor.role);

    // Remove password from response
    const vendorResponse = vendor.toObject();
    delete vendorResponse.password;

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully',
      data: {
        vendor: vendorResponse,
        token
      }
    });
  } catch (error) {
    console.error('Vendor signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', checkLoginAttempts, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Update last login and reset login attempts
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password - Step 1: Send security questions
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.securityQuestions || !user.securityQuestions.question1 || !user.securityQuestions.question2) {
      return res.status(400).json({
        success: false,
        message: 'Security questions not set up for this account'
      });
    }

    res.json({
      success: true,
      message: 'Security questions retrieved successfully',
      data: {
        question1: user.securityQuestions.question1.question,
        question2: user.securityQuestions.question2.question
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password - Step 2: Verify security questions
router.post('/verify-security-questions', async (req, res) => {
  try {
    const { email, answer1, answer2 } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isVerified = user.verifySecurityQuestions(answer1, answer2);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect answers to security questions'
      });
    }

    res.json({
      success: true,
      message: 'Security questions verified successfully'
    });
  } catch (error) {
    console.error('Verify security questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password - Step 3: Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, answer1, answer2, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isVerified = user.verifySecurityQuestions(answer1, answer2);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect answers to security questions'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', verifyToken, updateLastLogin, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('vendorDetails.mainCategory', 'name icon')
      .populate('vendorDetails.subCategory', 'name image thumbnail')
      .populate('vendorDetails.referredBy', 'name vendorDetails.shopName')
      .select('-password -loginAttempts -lockUntil');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, updateLastLogin, async (req, res) => {
  try {
    const { name, phone, profileImage, address } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('vendorDetails.mainCategory', 'name icon')
    .populate('vendorDetails.subCategory', 'name image thumbnail')
    .select('-password -loginAttempts -lockUntil');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update vendor profile
router.put('/vendor-profile', verifyToken, vendorOnly, updateLastLogin, async (req, res) => {
  try {
    const { shopName, shopDescription, metaTitle, metaTags, shopImages } = req.body;

    const updateData = {
      'vendorDetails.shopName': shopName,
      'vendorDetails.shopDescription': shopDescription
    };

    if (metaTitle) updateData['vendorDetails.metaTitle'] = metaTitle;
    if (metaTags) updateData['vendorDetails.metaTags'] = metaTags;
    if (shopImages) updateData['vendorDetails.shopImages'] = shopImages;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('vendorDetails.mainCategory', 'name icon')
    .populate('vendorDetails.subCategory', 'name image thumbnail')
    .select('-password -loginAttempts -lockUntil');

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload profile image
router.post('/upload-profile-image', verifyToken, updateLastLogin, (req, res, next) => {
  // Create dynamic upload middleware with user ID
  const uploadMiddleware = uploadSingleImage('uploads/profiles', [req.user._id.toString()]);
  uploadMiddleware(req, res, next);
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imageUrl = req.file.location;

    // Update user profile with new image
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: imageUrl },
      { new: true }
    )
    .select('-password -loginAttempts -lockUntil');

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: imageUrl,
        user
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', verifyToken, updateLastLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', verifyToken, updateLastLogin, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token
router.get('/verify-token', verifyToken, updateLastLogin, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 