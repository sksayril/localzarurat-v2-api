require("dotenv").config();
require("./utilities/database");
require("./utilities/awsS3");

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const vendorRouter = require('./routes/vendor');
const customerRouter = require('./routes/customer');
const paymentRouter = require('./routes/payment');
const employeeRouter = require('./routes/employee');

const app = express();

// Security middleware
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));

// CORS configuration
app.use(cors());

// Compression middleware
app.use(compression());

// Logging middleware
app.use(logger('dev'));

// Body parsing middleware - Increased to 100MB for file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Cookie parser
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/', indexRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/vendor', vendorRouter);
app.use('/api/customer', customerRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/employee', employeeRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vendor Listing API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Handle multer errors with detailed error messages
  if (err.name === 'MulterError') {
    let errorMessage = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File size too large. Maximum allowed size is 100MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage = 'Too many files uploaded. Please reduce the number of files.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = 'Unexpected file field. Please check your form configuration.';
        break;
      case 'LIMIT_PART_COUNT':
        errorMessage = 'Too many parts in the request.';
        break;
      case 'LIMIT_FIELD_KEY':
        errorMessage = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        errorMessage = 'Field value too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        errorMessage = 'Too many fields in the request.';
        break;
      default:
        errorMessage = err.message || 'File upload error occurred.';
    }
    
    return res.status(400).json({
      success: false,
      message: errorMessage,
      error: err.message,
      code: err.code
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Handle MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value',
        field: Object.keys(err.keyPattern)[0]
      });
    }
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

module.exports = app;
