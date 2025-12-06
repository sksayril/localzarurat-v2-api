const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Employee = require('../models/employee.model');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
  );
};

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's an employee token
    if (decoded.employeeId) {
      const employee = await Employee.findById(decoded.employeeId).select('-password');
      
      if (!employee) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (!employee.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      req.user = employee;
      req.user.role = employee.role;
      req.user.employeeId = employee._id;
      next();
      return;
    }
    
    // Regular user token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorize('admin');

// Vendor only middleware
const vendorOnly = authorize('vendor');

// Customer only middleware
const customerOnly = authorize('customer');

// Super employee only middleware
const superEmployeeOnly = authorize('super_employee');

// Employee only middleware
const employeeOnly = authorize('employee');

// Admin or vendor middleware
const adminOrVendor = authorize('admin', 'vendor');

// Admin or customer middleware
const adminOrCustomer = authorize('admin', 'customer');

// Admin or employee middleware
const adminOrEmployee = authorize('admin', 'super_employee', 'employee');

// Super employee or employee middleware
const superEmployeeOrEmployee = authorize('super_employee', 'employee');

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Rate limiting for login attempts
const checkLoginAttempts = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (user && user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Update last login
const updateLastLogin = async (req, res, next) => {
  try {
    if (req.user) {
      // Check if it's an employee
      if (req.user.employeeId) {
        await Employee.findByIdAndUpdate(req.user._id, {
          lastLogin: new Date(),
          loginAttempts: 0,
          lockUntil: null
        });
      } else {
        // Regular user
        await User.findByIdAndUpdate(req.user._id, {
          lastLogin: new Date(),
          loginAttempts: 0,
          lockUntil: null
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authorize,
  adminOnly,
  vendorOnly,
  customerOnly,
  superEmployeeOnly,
  employeeOnly,
  adminOrVendor,
  adminOrCustomer,
  adminOrEmployee,
  superEmployeeOrEmployee,
  optionalAuth,
  checkLoginAttempts,
  updateLastLogin
}; 