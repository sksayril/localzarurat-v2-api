# Vendor Subscription System Setup Guide

## Overview
This is a complete vendor subscription management system with Razorpay integration for payment processing. The system includes both backend API endpoints and a modern frontend interface.

## Features
- ✅ Vendor dashboard with statistics
- ✅ Subscription plan management (3 months, 6 months, 1 year)
- ✅ Razorpay payment integration
- ✅ Payment verification and subscription activation
- ✅ Wallet management with withdrawal requests
- ✅ Modern responsive UI with Tailwind CSS
- ✅ Real-time subscription status updates

## API Endpoints

### Authentication
- `POST /api/auth/login` - Vendor login
- `POST /api/auth/register` - Vendor registration
- `GET /api/auth/verify-token` - Verify authentication token

### Vendor Dashboard
- `GET /api/vendor/dashboard` - Get vendor dashboard data
- `GET /api/vendor/wallet` - Get wallet details
- `POST /api/vendor/wallet/withdraw` - Request withdrawal

### Subscription Management
- `GET /api/vendor/subscription/plans` - Get available subscription plans
- `POST /api/vendor/subscription` - Create new subscription
- `POST /api/vendor/subscription/verify` - Verify payment and activate subscription
- `GET /api/vendor/subscription` - Get vendor subscriptions

## Frontend Pages

### Main Dashboard (`/`)
- Vendor statistics (products, views, wallet balance, pending withdrawals)
- Current subscription status
- Subscription plan selection
- Recent products display

### Login Page (`/login.html`)
- Vendor login form
- Vendor registration form
- Test credentials provided

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

### 2. Razorpay Configuration
1. Sign up for a Razorpay account
2. Get your test API keys from the Razorpay dashboard
3. Update the Razorpay key in `public/index.html` (line with `rzp_test_YOUR_KEY_ID`)

### 3. Database Setup
The system uses MongoDB with the following models:
- `User` - Vendor accounts with subscription details
- `Subscription` - Subscription records
- `Product` - Vendor products
- `VendorRating` - Vendor ratings and reviews

### 4. Running the Application
```bash
npm install
npm start
```

### 5. Testing the System
1. Visit `http://localhost:3000/login.html`
2. Register a new vendor account or use test credentials:
   - Email: `vendor@test.com`
   - Password: `password123`
3. Login and access the dashboard
4. Select a subscription plan and complete payment

## Subscription Plans

### 3 Months Plan - ₹2,999
- 50 products maximum
- 200 images maximum
- Standard support
- Standard listing

### 6 Months Plan - ₹4,999
- 100 products maximum
- 500 images maximum
- Priority support
- Standard listing

### 1 Year Plan - ₹8,999
- 200 products maximum
- 1000 images maximum
- Priority support
- Featured listing

## Payment Flow

1. **Plan Selection**: Vendor selects a subscription plan
2. **Order Creation**: Backend creates Razorpay order
3. **Payment Gateway**: Razorpay payment form opens
4. **Payment Processing**: User completes payment
5. **Verification**: Backend verifies payment signature
6. **Activation**: Subscription is activated and vendor can list products

## Security Features

- JWT token authentication
- Payment signature verification
- Input validation and sanitization
- Role-based access control
- Secure password hashing

## Error Handling

The system includes comprehensive error handling for:
- Authentication failures
- Payment processing errors
- Database connection issues
- Invalid subscription plans
- Insufficient wallet balance

## Customization

### Adding New Subscription Plans
1. Update the plans object in `routes/vendor.js`
2. Add corresponding plan details in `utilities/razorpay.js`
3. Update the frontend plan display

### Modifying Payment Gateway
The system is designed to work with Razorpay but can be easily modified for other payment gateways by updating the payment utility functions.

### Styling Customization
The frontend uses Tailwind CSS and can be customized by:
- Modifying the CSS classes in HTML
- Adding custom styles in `public/stylesheets/style.css`
- Updating the color scheme and gradients

## Troubleshooting

### Common Issues

1. **Payment Creation Fails**
   - Check Razorpay API keys
   - Verify receipt ID length (max 40 characters)
   - Ensure proper amount format (in paise for Razorpay)

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check user role is 'vendor'
   - Ensure token is included in request headers

3. **Dashboard Loading Issues**
   - Check database connection
   - Verify vendor has proper vendorDetails structure
   - Ensure all required fields are initialized

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

## Support

For technical support or questions about the subscription system, please refer to the API documentation or contact the development team.

## License

This subscription system is part of the vendor management platform and follows the same licensing terms. 