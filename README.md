# Vendor Listing Platform API

A comprehensive vendor listing platform similar to JustDial with admin, vendor, and customer panels. Built with Node.js, Express, MongoDB, and integrated with AWS S3 and Razorpay.

## 🚀 Features

### Admin Panel
- Dashboard with analytics and statistics
- Category management (Main categories and subcategories)
- Vendor management and approval
- Subscription management
- Withdrawal request processing
- System settings and configuration

### Vendor Panel
- Vendor registration with category selection
- Product management with image uploads
- Subscription plans (3 months: ₹559, 6 months: ₹779, 1 year: ₹899)
- Wallet system with withdrawal requests
- Referral system with 3% bonus
- Analytics and performance tracking

### Customer Panel
- Advanced search with filters (location, category, price)
- Vendor and product discovery
- Favorites management
- Location-based vendor recommendations
- Search suggestions and popular searches

### Core Features
- JWT-based authentication with role-based access
- AWS S3 integration for image storage
- Razorpay payment integration
- Elasticsearch-like search functionality
- Referral system with wallet integration
- Comprehensive validation and error handling
- Rate limiting and security measures

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- AWS Account (for S3)
- Razorpay Account (for payments)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vendor-listing-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   FRONTEND_URL=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/vendor-listing

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here

   # AWS S3
   AWS_ACCESS_KEY_ID=your-aws-access-key-id
   AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET_NAME=vendor-listing-images

   # Razorpay
   RAZORPAY_KEY_ID=rzp_test_your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-secret-key
   RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
├── models/                 # Database models
│   ├── user.model.js      # User, Vendor, Customer model
│   ├── mainCategory.model.js
│   ├── subCategory.model.js
│   ├── product.model.js
│   └── subscription.model.js
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   ├── admin.js          # Admin panel routes
│   ├── vendor.js         # Vendor panel routes
│   ├── customer.js       # Customer panel routes
│   └── payment.js        # Payment webhooks
├── middleware/           # Custom middleware
│   ├── auth.js          # Authentication middleware
│   └── validation.js    # Request validation
├── utilities/           # Utility functions
│   ├── database.js      # Database connection
│   ├── awsS3.js        # AWS S3 integration
│   ├── razorpay.js     # Razorpay integration
│   └── search.js       # Search functionality
└── config/             # Configuration files
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/vendor-signup` - Vendor registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/vendor-profile` - Update vendor profile

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard
- `POST /api/admin/categories/main` - Create main category
- `GET /api/admin/categories/main` - Get main categories
- `POST /api/admin/categories/sub` - Create sub category
- `GET /api/admin/vendors` - Get all vendors
- `PUT /api/admin/vendors/:id/status` - Update vendor status

### Vendor Routes
- `GET /api/vendor/dashboard` - Vendor dashboard
- `POST /api/vendor/products` - Create product
- `GET /api/vendor/products` - Get vendor products
- `POST /api/vendor/subscription` - Create subscription
- `GET /api/vendor/wallet` - Get wallet details
- `POST /api/vendor/wallet/withdraw` - Request withdrawal

### Customer Routes
- `GET /api/customer/search/vendors` - Search vendors
- `GET /api/customer/search/products` - Search products
- `GET /api/customer/categories` - Get categories
- `GET /api/customer/vendors/:id` - Get vendor details
- `GET /api/customer/products/:id` - Get product details
- `POST /api/customer/favorites/vendors/:id` - Add vendor to favorites

### Payment Routes
- `POST /api/payment/webhook/subscription.activated` - Razorpay webhook
- `POST /api/payment/verify-subscription` - Verify subscription payment
- `POST /api/payment/verify-payment` - Verify one-time payment

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Models

### User Model
- Supports admin, vendor, and customer roles
- Vendor-specific fields: shop details, subscription, wallet, referrals
- Customer-specific fields: preferences, favorites

### Category Models
- MainCategory: name, icon, description, meta fields
- SubCategory: name, image, thumbnail, parent category reference

### Product Model
- Vendor reference, category, images, price, specifications
- Analytics: views, favorites
- Location-based availability

### Subscription Model
- Plan details, payment history, Razorpay integration
- Features based on plan type

## 🔍 Search Functionality

The platform includes advanced search capabilities:
- Text-based search with MongoDB text indexes
- Category and location filtering
- Price range filtering
- Search suggestions and popular searches
- Location-based vendor recommendations

## 💳 Payment Integration

### Razorpay Integration
- Subscription-based payments
- Webhook handling for payment events
- Payment verification and status tracking
- Automatic referral bonus processing

### Subscription Plans
- 3 Months: ₹559
- 6 Months: ₹779
- 1 Year: ₹899

## 🗄️ AWS S3 Integration

- Automatic bucket creation and configuration
- Image upload with validation
- Multiple image support for products
- Secure file access with signed URLs

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation with Joi
- CORS configuration
- Helmet security headers
- Password hashing with bcrypt

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up AWS S3 bucket
4. Configure Razorpay production keys
5. Set up webhook endpoints
6. Configure SSL certificates

### Environment Variables
Ensure all required environment variables are set in production:
- Database connection strings
- JWT secrets
- AWS credentials
- Razorpay keys
- Webhook secrets

## 📝 API Documentation

### Request/Response Format
All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (if applicable)
  }
}
```

### Error Handling
Errors are returned with appropriate HTTP status codes:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if applicable)
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Complete vendor listing platform
- Admin, vendor, and customer panels
- Payment integration
- Search functionality
- Image management
