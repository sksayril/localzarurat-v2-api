# Vendor Listing Platform API Documentation

## Overview
This is a comprehensive vendor listing platform API similar to JustDial, built with Node.js, Express, and MongoDB. The platform supports three types of users: Admin, Vendor, and Customer.

## Features

### Core Features
- **Multi-role Authentication**: Admin, Vendor, and Customer panels
- **Category Management**: Main categories with icons and sub-categories with images
- **Product Management**: Vendors can add products with up to 50 images
- **Subscription Plans**: 3 months (₹559), 6 months (₹779), 1 year (₹899)
- **Payment Integration**: Razorpay for subscription payments
- **KYC Verification**: PAN card and Aadhar card verification for vendors
- **Referral System**: 3% bonus for parent vendors
- **Wallet System**: Withdrawal requests and transaction history
- **Advanced Search**: Elastic search-like functionality with location-based search

### Technical Features
- **AWS S3 Integration**: Image upload and management
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting for security
- **Input Validation**: Comprehensive validation using Joi
- **Error Handling**: Standardized error responses
- **Pagination**: Efficient data pagination
- **File Upload**: Support for multiple image uploads

## API Documentation

### [Admin API Documentation](./admin.md)
Complete API documentation for the Admin panel including:
- Dashboard and analytics
- Category management (main and sub-categories)
- Vendor management and KYC verification
- Subscription management
- System settings and Razorpay plan initialization

### [Vendor API Documentation](./vendor.md)
Complete API documentation for the Vendor panel including:
- Profile and KYC management
- Product management (CRUD operations)
- Subscription management
- Wallet and withdrawal management
- Referral system
- Analytics and reporting

### [Customer API Documentation](./customer.md)
Complete API documentation for the Customer panel including:
- Authentication and registration
- Search and discovery features
- Vendor and product browsing
- Favorites management
- Location-based search
- Personalized recommendations

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- AWS S3 account
- Razorpay account

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd basic-apiBuilding

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

### Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/vendor-listing

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Base URLs

### Development
- **Admin API**: `http://localhost:3000/api/admin`
- **Vendor API**: `http://localhost:3000/api/vendor`
- **Customer API**: `http://localhost:3000/api/customer`
- **Auth API**: `http://localhost:3000/api/auth`
- **Payment API**: `http://localhost:3000/api/payment`

### Production
- **Admin API**: `https://your-domain.com/api/admin`
- **Vendor API**: `https://your-domain.com/api/vendor`
- **Customer API**: `https://your-domain.com/api/customer`
- **Auth API**: `https://your-domain.com/api/auth`
- **Payment API**: `https://your-domain.com/api/payment`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- **Admin endpoints**: 100 requests per 15 minutes
- **Vendor endpoints**: 200 requests per 15 minutes
- **Customer endpoints**: 300 requests per 15 minutes

## File Upload Limits

- **Maximum file size**: 5MB
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Maximum images per product**: 50
- **Maximum files per request**: 50

## Database Models

### User Model
- Supports multiple roles (admin, vendor, customer)
- Vendor-specific fields (shop details, KYC, wallet, referrals)
- Customer-specific fields (preferences, favorites)

### MainCategory Model
- Category name, icon, description
- SEO fields (meta title, description)
- Sort order and active status

### SubCategory Model
- Sub-category name, images, description
- Associated main category
- Features, keywords, and popular tags

### Product Model
- Product details (name, description, price)
- Multiple images with primary image support
- Category associations and vendor reference
- SEO and meta information

### Subscription Model
- Subscription plan details
- Razorpay integration
- Start and end dates
- Status tracking

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Comprehensive validation using Joi
- **Rate Limiting**: API rate limiting for security
- **CORS Protection**: Cross-origin resource sharing protection
- **Helmet Security**: Security headers middleware
- **Request Sanitization**: Input sanitization and validation

## Testing

### API Testing
You can test the APIs using tools like:
- **Postman**: Import the provided collection
- **Insomnia**: Use the provided workspace
- **cURL**: Command-line testing

### Example cURL Commands

#### Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

#### Vendor Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "9876543210",
    "role": "vendor",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "vendorDetails": {
      "shopName": "John's Pizza",
      "shopDescription": "Best pizza in town",
      "mainCategory": "60f7b3b3b3b3b3b3b3b3b3b3",
      "subCategory": "60f7b3b3b3b3b3b3b3b3b3b4"
    }
  }'
```

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting guide

## License

This project is licensed under the MIT License - see the LICENSE file for details. 