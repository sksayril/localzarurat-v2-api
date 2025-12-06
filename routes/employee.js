const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const Employee = require('../models/employee.model');
const EmployeeCommission = require('../models/employeeCommission.model');
const District = require('../models/district.model');
const User = require('../models/user.model');
const { verifyToken, updateLastLogin } = require('../middleware/auth');
const { validateQuery, validateParams, commonSchemas } = require('../middleware/validation');

// ==================== EMPLOYEE AUTHENTICATION ====================

// Employee login (NO AUTHENTICATION REQUIRED)
router.post('/login', async (req, res) => {
  try {
    const { employeeId, email, password } = req.body;

    // Validate input - either employeeId or email must be provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (!employeeId && !email) {
      return res.status(400).json({
        success: false,
        message: 'Either Employee ID or Email is required'
      });
    }

    // Find employee by employee ID or email
    let employee;
    if (employeeId) {
      employee = await Employee.findOne({ 
        employeeId: employeeId.toUpperCase(),
        isActive: true 
      });
    } else if (email) {
      employee = await Employee.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      });
    }

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (employee.isLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      await employee.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (employee.loginAttempts > 0) {
      employee.loginAttempts = 0;
      employee.lockUntil = undefined;
      await employee.save();
    }

    // Update last login
    employee.lastLogin = new Date();
    await employee.save();

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        employeeId: employee._id,
        role: employee.role,
        employeeCode: employee.employeeId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          assignedDistricts: employee.assignedDistricts,
          commissionSettings: employee.commissionSettings,
          wallet: employee.wallet,
          statistics: employee.statistics
        }
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Apply authentication middleware to all routes except login
router.use(verifyToken, updateLastLogin);

// ==================== EMPLOYEE DASHBOARD ====================

// Get employee dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const employee = await Employee.findById(employeeId)
      .populate('superEmployee', 'employeeId name email')
      .lean();

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

    // Get pending commissions
    const pendingCommissions = await EmployeeCommission.countDocuments({
      employee: employeeId,
      status: 'pending'
    });

    // Get total commission earned
    const totalCommissionEarned = await EmployeeCommission.aggregate([
      { $match: { employee: new mongoose.Types.ObjectId(employeeId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$commission.amount' } } }
    ]);

    // Get recent sellers
    const recentSellers = await User.find({
      assignedEmployee: employeeId,
      role: 'vendor'
    })
    .select('name email vendorDetails.shopName createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    // Get recent commissions
    const recentCommissions = await EmployeeCommission.find({
      employee: employeeId
    })
    .populate('seller', 'name vendorDetails.shopName')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    res.json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          role: employee.role,
          assignedDistricts: employee.assignedDistricts,
          commissionSettings: employee.commissionSettings,
          wallet: employee.wallet,
          statistics: employee.statistics
        },
        dashboard: {
          assignedSellers,
          pendingCommissions,
          totalCommissionEarned: totalCommissionEarned[0]?.total || 0,
          recentSellers,
          recentCommissions
        }
      }
    });
  } catch (error) {
    console.error('Get employee dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== SELLER MANAGEMENT ====================

// Get assigned sellers
router.get('/sellers', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      assignedEmployee: employeeId,
      role: 'vendor'
    };

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { 'vendorDetails.shopName': new RegExp(search, 'i') }
      ];
    }

    const sellers = await User.find(query)
      .populate('vendorDetails.mainCategory', 'name icon')
      .populate('vendorDetails.subCategory', 'name image thumbnail')
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: sellers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get assigned sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get seller details
router.get('/sellers/:sellerId', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { sellerId } = req.params;
    const employeeId = req.user.employeeId;

    const seller = await User.findOne({
      _id: sellerId,
      assignedEmployee: employeeId,
      role: 'vendor'
    })
    .populate('vendorDetails.mainCategory', 'name icon')
    .populate('vendorDetails.subCategory', 'name image thumbnail')
    .populate('vendorDetails.referredBy', 'name vendorDetails.shopName')
    .select('-password -loginAttempts -lockUntil');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found or not assigned to you'
      });
    }

    // Get seller's subscription history
    const Subscription = require('../models/subscription.model');
    const subscriptions = await Subscription.find({ vendor: sellerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get seller's commission history
    const commissions = await EmployeeCommission.find({
      employee: employeeId,
      seller: sellerId
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

    res.json({
      success: true,
      data: {
        seller,
        subscriptions,
        commissions
      }
    });
  } catch (error) {
    console.error('Get seller details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== COMMISSION MANAGEMENT ====================

// Get employee commissions
router.get('/commissions', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { employee: employeeId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const commissions = await EmployeeCommission.find(query)
      .populate('seller', 'name email vendorDetails.shopName')
      .populate('subscription', 'plan amount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await EmployeeCommission.countDocuments(query);

    // Get commission statistics
    const stats = await EmployeeCommission.aggregate([
      { $match: { employee: new mongoose.Types.ObjectId(employeeId) } },
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

// Get commission details
router.get('/commissions/:commissionId', validateParams(commonSchemas.id), async (req, res) => {
  try {
    const { commissionId } = req.params;
    const employeeId = req.user.employeeId;

    const commission = await EmployeeCommission.findOne({
      _id: commissionId,
      employee: employeeId
    })
    .populate('seller', 'name email vendorDetails.shopName')
    .populate('subscription', 'plan amount status')
    .populate('admin.approvedBy', 'name')
    .lean();

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    res.json({
      success: true,
      data: commission
    });
  } catch (error) {
    console.error('Get commission details error:', error);
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
    const employeeId = req.user.employeeId;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.role !== 'super_employee') {
      return res.status(403).json({
        success: false,
        message: 'Only super employees have wallets'
      });
    }

    // Get recent transactions
    const recentTransactions = employee.wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        balance: employee.wallet.balance,
        transactions: recentTransactions,
        statistics: employee.statistics
      }
    });
  } catch (error) {
    console.error('Get wallet details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get wallet transactions
router.get('/wallet/transactions', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    const employee = await Employee.findById(employeeId);
    if (!employee || employee.role !== 'super_employee') {
      return res.status(403).json({
        success: false,
        message: 'Only super employees have wallets'
      });
    }

    let transactions = employee.wallet.transactions;
    
    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.type === type);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = transactions.length;
    const paginatedTransactions = transactions.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== SUPER EMPLOYEE SPECIFIC ROUTES ====================

// Get assigned employees (for super employees)
router.get('/employees', validateQuery(commonSchemas.pagination), async (req, res) => {
  try {
    const superEmployeeId = req.user.employeeId;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const employee = await Employee.findById(superEmployeeId);
    if (!employee || employee.role !== 'super_employee') {
      return res.status(403).json({
        success: false,
        message: 'Only super employees can view assigned employees'
      });
    }

    const employees = await Employee.find({
      superEmployee: superEmployeeId,
      isActive: true
    })
    .select('-password -loginAttempts -lockUntil')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const total = await Employee.countDocuments({
      superEmployee: superEmployeeId,
      isActive: true
    });

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
    console.error('Get assigned employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new employee (for super employees)
router.post('/employees/create', async (req, res) => {
  try {
    const superEmployeeId = req.user.employeeId;
    const { name, email, phone, password, assignedDistricts } = req.body;

    const superEmployee = await Employee.findById(superEmployeeId);
    if (!superEmployee || superEmployee.role !== 'super_employee') {
      return res.status(403).json({
        success: false,
        message: 'Only super employees can create new employees'
      });
    }

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

    // Create new employee
    const newEmployee = new Employee({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'employee',
      superEmployee: superEmployeeId,
      assignedDistricts: assignedDistricts || [],
      createdBy: superEmployeeId // This should be admin ID, but for now using super employee
    });

    await newEmployee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        _id: newEmployee._id,
        employeeId: newEmployee.employeeId,
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        role: newEmployee.role,
        assignedDistricts: newEmployee.assignedDistricts
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== EMPLOYEE MANAGEMENT BY SUPER EMPLOYEE ====================

// Get specific employee details by employee ID
router.get('/employees/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const superEmployeeId = req.user.employeeId;

    // Find the employee and verify it belongs to this super employee
    const employee = await Employee.findOne({
      employeeId: employeeId.toUpperCase(),
      superEmployee: superEmployeeId,
      role: 'employee'
    }).select('-password -loginAttempts -lockUntil');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not assigned to you'
      });
    }

    // Get employee statistics
    const assignedSellers = await User.countDocuments({
      assignedEmployee: employee._id,
      role: 'vendor',
      isActive: true
    });

    res.json({
      success: true,
      data: {
        employee: employee,
        statistics: {
          assignedSellers: assignedSellers,
          totalSellers: await User.countDocuments({
            assignedEmployee: employee._id,
            role: 'vendor'
          })
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

// Get employee wallet balance
router.get('/employees/:employeeId/wallet', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const superEmployeeId = req.user.employeeId;

    // Find the employee and verify it belongs to this super employee
    const employee = await Employee.findOne({
      employeeId: employeeId.toUpperCase(),
      superEmployee: superEmployeeId,
      role: 'employee'
    }).select('wallet statistics');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not assigned to you'
      });
    }

    res.json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        wallet: employee.wallet,
        statistics: employee.statistics
      }
    });
  } catch (error) {
    console.error('Get employee wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee referral code (employee ID)
router.get('/employees/:employeeId/referral-code', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const superEmployeeId = req.user.employeeId;

    // Find the employee and verify it belongs to this super employee
    const employee = await Employee.findOne({
      employeeId: employeeId.toUpperCase(),
      superEmployee: superEmployeeId,
      role: 'employee'
    }).select('employeeId name email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not assigned to you'
      });
    }

    res.json({
      success: true,
      data: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        referralCode: employee.employeeId // Employee ID is the referral code
      }
    });
  } catch (error) {
    console.error('Get employee referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset employee password
router.put('/employees/:employeeId/reset-password', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { newPassword } = req.body;
    const superEmployeeId = req.user.employeeId;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find the employee and verify it belongs to this super employee
    const employee = await Employee.findOne({
      employeeId: employeeId.toUpperCase(),
      superEmployee: superEmployeeId,
      role: 'employee'
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not assigned to you'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    employee.password = newPassword;
    await employee.save();

    res.json({
      success: true,
      message: 'Employee password reset successfully',
      data: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email
      }
    });
  } catch (error) {
    console.error('Reset employee password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Block/Unblock employee
router.put('/employees/:employeeId/status', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { isActive } = req.body;
    const superEmployeeId = req.user.employeeId;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value (true/false)'
      });
    }

    // Find the employee and verify it belongs to this super employee
    const employee = await Employee.findOne({
      employeeId: employeeId.toUpperCase(),
      superEmployee: superEmployeeId,
      role: 'employee'
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not assigned to you'
      });
    }

    // Update employee status
    employee.isActive = isActive;
    await employee.save();

    res.json({
      success: true,
      message: `Employee ${isActive ? 'activated' : 'blocked'} successfully`,
      data: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        isActive: employee.isActive
      }
    });
  } catch (error) {
    console.error('Update employee status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get employee login history and activity
router.get('/employees/:employeeId/activity', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const superEmployeeId = req.user.employeeId;

    // Find the employee and verify it belongs to this super employee
    const employee = await Employee.findOne({
      employeeId: employeeId.toUpperCase(),
      superEmployee: superEmployeeId,
      role: 'employee'
    }).select('lastLogin loginAttempts isActive createdAt');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not assigned to you'
      });
    }

    // Get recent sellers assigned to this employee
    const recentSellers = await User.find({
      assignedEmployee: employee._id,
      role: 'vendor'
    })
    .select('name email vendorDetails.shopName createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    res.json({
      success: true,
      data: {
        employee: {
          employeeId: employee.employeeId,
          lastLogin: employee.lastLogin,
          loginAttempts: employee.loginAttempts,
          isActive: employee.isActive,
          createdAt: employee.createdAt
        },
        recentActivity: {
          recentSellers: recentSellers,
          totalSellers: await User.countDocuments({
            assignedEmployee: employee._id,
            role: 'vendor'
          })
        }
      }
    });
  } catch (error) {
    console.error('Get employee activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Set commission percentage for regular employee
router.put('/employees/:employeeId/commission', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { commissionPercentage } = req.body;
    const superEmployeeId = req.user.employeeId;

    if (typeof commissionPercentage !== 'number' || commissionPercentage < 0 || commissionPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Commission percentage must be a number between 0 and 100'
      });
    }

    // Find the employee and verify it belongs to this super employee
    const employee = await Employee.findOne({
      employeeId: employeeId.toUpperCase(),
      superEmployee: superEmployeeId,
      role: 'employee'
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not assigned to you'
      });
    }

    // Update commission percentage
    employee.employeeCommissionPercentage = commissionPercentage;
    await employee.save();

    res.json({
      success: true,
      message: `Commission percentage set to ${commissionPercentage}% for employee`,
      data: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        commissionPercentage: employee.employeeCommissionPercentage
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

// Get employee commission details
router.get('/employees/:employeeId/commission', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const superEmployeeId = req.user.employeeId;

    // Find the employee and verify it belongs to this super employee
    const employee = await Employee.findOne({
      employeeId: employeeId.toUpperCase(),
      superEmployee: superEmployeeId,
      role: 'employee'
    }).select('employeeId name email employeeCommissionPercentage statistics');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or not assigned to you'
      });
    }

    // Get commission statistics for this employee
    const commissionStats = await EmployeeCommission.aggregate([
      {
        $match: {
          employee: employee._id,
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: '$commission.amount' },
          totalCount: { $sum: 1 },
          averageCommission: { $avg: '$commission.amount' }
        }
      }
    ]);

    const stats = commissionStats[0] || {
      totalCommissions: 0,
      totalCount: 0,
      averageCommission: 0
    };

    res.json({
      success: true,
      data: {
        employee: {
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          commissionPercentage: employee.employeeCommissionPercentage
        },
        commissionStats: {
          totalCommissionsEarned: stats.totalCommissions,
          totalCommissionsCount: stats.totalCount,
          averageCommission: stats.averageCommission,
          assignedSellers: employee.statistics.totalSellersAssigned
        }
      }
    });
  } catch (error) {
    console.error('Get employee commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== PROFILE MANAGEMENT ====================

// Get employee profile
router.get('/profile', async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const employee = await Employee.findById(employeeId)
      .populate('superEmployee', 'employeeId name email')
      .select('-password -loginAttempts -lockUntil')
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update employee profile
router.put('/profile', async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { name, phone, address } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update allowed fields
    if (name) employee.name = name;
    if (phone) employee.phone = phone;
    if (address) employee.address = address;

    await employee.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        address: employee.address
      }
    });
  } catch (error) {
    console.error('Update employee profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
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

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await employee.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password (will be hashed by pre-save middleware)
    employee.password = newPassword;
    await employee.save();

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

module.exports = router;
