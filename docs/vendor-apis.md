# Vendor APIs Documentation

## Overview
This document covers all APIs available to vendors (sellers), including registration, profile management, product management, and subscription handling.

## Authentication
All vendor APIs require authentication with vendor role. Include the JWT token in the Authorization header:
```
Authorization: Bearer <vendor_jwt_token>
```

---

## 🔐 Authentication

### Vendor Registration
**POST** `/api/auth/vendor-signup`

Registers a new vendor with optional employee code assignment.

**Request Body:**
```json
{
  "name": "ABC Store",
  "email": "abc@store.com",
  "phone": "9876543213",
  "password": "SecurePassword123!",
  "employeeCode": "SE0001",
  "vendorDetails": {
    "shopName": "ABC Electronics Store",
    "shopDescription": "Leading electronics retailer in Mumbai",
    "mainCategory": "64f8a1b2c3d4e5f6a7b8c9d9",
    "subCategory": "64f8a1b2c3d4e5f6a7b8c9da",
    "gstNumber": "27ABCDE1234F1Z5",
    "vendorAddress": {
      "doorNumber": "123",
      "street": "Main Street",
      "location": "Andheri West",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    }
  },
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Vendor registered successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "ABC Store",
      "email": "abc@store.com",
      "phone": "9876543213",
      "role": "vendor",
      "isActive": true,
      "employeeCode": "SE0001",
      "assignedEmployee": "64f8a1b2c3d4e5f6a7b8c9d0",
      "vendorDetails": {
        "shopName": "ABC Electronics Store",
        "shopDescription": "Leading electronics retailer in Mumbai",
        "mainCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d9",
          "name": "Electronics",
          "icon": "https://example.com/electronics-icon.png"
        },
        "subCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9da",
          "name": "Mobile Phones",
          "image": "https://example.com/mobile-image.png",
          "thumbnail": "https://example.com/mobile-thumb.png"
        },
        "gstNumber": "27ABCDE1234F1Z5",
        "vendorAddress": {
          "doorNumber": "123",
          "street": "Main Street",
          "location": "Andheri West",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001",
          "country": "India"
        },
        "subscription": {
          "currentPlan": null,
          "status": "inactive",
          "amount": 0,
          "startDate": null,
          "endDate": null,
          "isActive": false
        },
        "wallet": {
          "balance": 0
        },
        "averageRating": 0,
        "totalRatings": 0
      },
      "address": {
        "street": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "country": "India"
      },
      "createdAt": "2024-01-15T14:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid employee code"
}
```

### Vendor Login
**POST** `/api/auth/login`

Authenticates a vendor using email and password.

**Request Body:**
```json
{
  "email": "abc@store.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "ABC Store",
      "email": "abc@store.com",
      "phone": "9876543213",
      "role": "vendor",
      "isActive": true,
      "employeeCode": "SE0001",
      "assignedEmployee": "64f8a1b2c3d4e5f6a7b8c9d0",
      "vendorDetails": {
        "shopName": "ABC Electronics Store",
        "shopDescription": "Leading electronics retailer in Mumbai",
        "mainCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d9",
          "name": "Electronics",
          "icon": "https://example.com/electronics-icon.png"
        },
        "subCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9da",
          "name": "Mobile Phones",
          "image": "https://example.com/mobile-image.png",
          "thumbnail": "https://example.com/mobile-thumb.png"
        },
        "subscription": {
          "currentPlan": "1year",
          "status": "active",
          "amount": 5000,
          "startDate": "2024-01-15T00:00:00.000Z",
          "endDate": "2025-01-15T00:00:00.000Z",
          "isActive": true
        },
        "wallet": {
          "balance": 2500
        },
        "averageRating": 4.5,
        "totalRatings": 25
      }
    }
  }
}
```

---

## 📊 Dashboard

### Get Vendor Dashboard
**GET** `/api/vendor/dashboard`

Retrieves comprehensive dashboard information for the vendor.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "ABC Store",
      "email": "abc@store.com",
      "role": "vendor",
      "isActive": true,
      "employeeCode": "SE0001",
      "assignedEmployee": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "employeeId": "SE0001",
        "name": "John Doe",
        "email": "john.doe@company.com"
      },
      "vendorDetails": {
        "shopName": "ABC Electronics Store",
        "shopDescription": "Leading electronics retailer in Mumbai",
        "mainCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d9",
          "name": "Electronics",
          "icon": "https://example.com/electronics-icon.png"
        },
        "subCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9da",
          "name": "Mobile Phones",
          "image": "https://example.com/mobile-image.png",
          "thumbnail": "https://example.com/mobile-thumb.png"
        },
        "subscription": {
          "currentPlan": "1year",
          "status": "active",
          "amount": 5000,
          "startDate": "2024-01-15T00:00:00.000Z",
          "endDate": "2025-01-15T00:00:00.000Z",
          "isActive": true
        },
        "wallet": {
          "balance": 2500
        },
        "averageRating": 4.5,
        "totalRatings": 25
      }
    },
    "dashboard": {
      "totalProducts": 150,
      "activeProducts": 120,
      "totalOrders": 500,
      "pendingOrders": 25,
      "completedOrders": 450,
      "totalRevenue": 250000,
      "monthlyRevenue": 45000,
      "averageRating": 4.5,
      "totalRatings": 25,
      "subscriptionStatus": "active",
      "subscriptionExpiry": "2025-01-15T00:00:00.000Z",
      "walletBalance": 2500,
      "recentProducts": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e4",
          "name": "iPhone 15 Pro",
          "price": 99999,
          "stock": 10,
          "isActive": true,
          "createdAt": "2024-01-15T10:00:00.000Z"
        },
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e5",
          "name": "Samsung Galaxy S24",
          "price": 79999,
          "stock": 15,
          "isActive": true,
          "createdAt": "2024-01-15T09:30:00.000Z"
        }
      ],
      "recentOrders": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e6",
          "orderNumber": "ORD-2024-001",
          "customer": {
            "name": "John Customer",
            "email": "john@customer.com"
          },
          "totalAmount": 99999,
          "status": "pending",
          "createdAt": "2024-01-15T14:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## 👤 Profile Management

### Get Profile
**GET** `/api/vendor/profile`

Retrieves the vendor's profile information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "ABC Store",
    "email": "abc@store.com",
    "phone": "9876543213",
    "role": "vendor",
    "isActive": true,
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "profileImage": "https://example.com/vendor-profile.jpg",
    "employeeCode": "SE0001",
    "assignedEmployee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "email": "john.doe@company.com"
    },
    "vendorDetails": {
      "shopName": "ABC Electronics Store",
      "shopDescription": "Leading electronics retailer in Mumbai",
      "shopMetaTitle": "ABC Electronics - Best Mobile Phones in Mumbai",
      "shopMetaDescription": "Shop for latest mobile phones and electronics at ABC Store",
      "shopImages": [
        "https://example.com/shop1.jpg",
        "https://example.com/shop2.jpg"
      ],
      "isShopListed": true,
      "shopListedAt": "2024-01-15T15:00:00.000Z",
      "gstNumber": "27ABCDE1234F1Z5",
      "vendorAddress": {
        "doorNumber": "123",
        "street": "Main Street",
        "location": "Andheri West",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "country": "India"
      },
      "mainCategory": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d9",
        "name": "Electronics",
        "icon": "https://example.com/electronics-icon.png"
      },
      "subCategory": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9da",
        "name": "Mobile Phones",
        "image": "https://example.com/mobile-image.png",
        "thumbnail": "https://example.com/mobile-thumb.png"
      },
      "kyc": {
        "panNumber": "ABCDE1234F",
        "panImage": "https://example.com/pan.jpg",
        "aadharNumber": "123456789012",
        "aadharFrontImage": "https://example.com/aadhar-front.jpg",
        "aadharBackImage": "https://example.com/aadhar-back.jpg",
        "isVerified": true,
        "verificationDate": "2024-01-15T12:00:00.000Z",
        "verifiedBy": "64f8a1b2c3d4e5f6a7b8c9d1"
      },
      "subscription": {
        "currentPlan": "1year",
        "status": "active",
        "amount": 5000,
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2025-01-15T00:00:00.000Z",
        "isActive": true,
        "razorpaySubscriptionId": "sub_1234567890",
        "razorpayPaymentId": "pay_1234567890",
        "features": {
          "maxProducts": 1000,
          "maxImages": 5000,
          "prioritySupport": true,
          "featuredListing": true
        }
      },
      "wallet": {
        "balance": 2500,
        "transactions": [
          {
            "type": "credit",
            "amount": 500,
            "description": "Referral commission",
            "date": "2024-01-14T10:00:00.000Z"
          }
        ]
      },
      "averageRating": 4.5,
      "totalRatings": 25,
      "ratingDistribution": {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 7,
        "5": 15
      }
    },
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    },
    "createdAt": "2024-01-15T14:00:00.000Z",
    "updatedAt": "2024-01-15T15:00:00.000Z"
  }
}
```

### Update Profile
**PUT** `/api/vendor/profile`

Updates the vendor's profile information.

**Request Body:**
```json
{
  "name": "ABC Store Updated",
  "phone": "9876543213",
  "vendorDetails": {
    "shopName": "ABC Electronics Store Updated",
    "shopDescription": "Leading electronics retailer in Mumbai - Updated",
    "shopMetaTitle": "ABC Electronics - Best Mobile Phones in Mumbai - Updated",
    "shopMetaDescription": "Shop for latest mobile phones and electronics at ABC Store - Updated"
  },
  "address": {
    "street": "123 Updated Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "name": "ABC Store Updated",
    "email": "abc@store.com",
    "phone": "9876543213",
    "vendorDetails": {
      "shopName": "ABC Electronics Store Updated",
      "shopDescription": "Leading electronics retailer in Mumbai - Updated",
      "shopMetaTitle": "ABC Electronics - Best Mobile Phones in Mumbai - Updated",
      "shopMetaDescription": "Shop for latest mobile phones and electronics at ABC Store - Updated"
    },
    "address": {
      "street": "123 Updated Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    }
  }
}
```

### Change Password
**PUT** `/api/vendor/change-password`

Changes the vendor's password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## 🏪 Shop Management

### Update Shop Details
**PUT** `/api/vendor/shop`

Updates shop-specific information.

**Request Body:**
```json
{
  "shopName": "ABC Electronics Store",
  "shopDescription": "Leading electronics retailer in Mumbai",
  "shopMetaTitle": "ABC Electronics - Best Mobile Phones in Mumbai",
  "shopMetaDescription": "Shop for latest mobile phones and electronics at ABC Store",
  "gstNumber": "27ABCDE1234F1Z5",
  "vendorAddress": {
    "doorNumber": "123",
    "street": "Main Street",
    "location": "Andheri West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Shop details updated successfully",
  "data": {
    "shopName": "ABC Electronics Store",
    "shopDescription": "Leading electronics retailer in Mumbai",
    "shopMetaTitle": "ABC Electronics - Best Mobile Phones in Mumbai",
    "shopMetaDescription": "Shop for latest mobile phones and electronics at ABC Store",
    "gstNumber": "27ABCDE1234F1Z5",
    "vendorAddress": {
      "doorNumber": "123",
      "street": "Main Street",
      "location": "Andheri West",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India"
    }
  }
}
```

### Upload Shop Images
**POST** `/api/vendor/shop/images`

Uploads shop images.

**Request Body (multipart/form-data):**
```
images: [file1, file2, file3]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Shop images uploaded successfully",
  "data": {
    "shopImages": [
      "https://example.com/shop1.jpg",
      "https://example.com/shop2.jpg",
      "https://example.com/shop3.jpg"
    ]
  }
}
```

### Update Shop Categories
**PUT** `/api/vendor/shop/categories`

Updates shop's main and sub categories.

**Request Body:**
```json
{
  "mainCategory": "64f8a1b2c3d4e5f6a7b8c9d9",
  "subCategory": "64f8a1b2c3d4e5f6a7b8c9da"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Shop categories updated successfully",
  "data": {
    "mainCategory": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d9",
      "name": "Electronics",
      "icon": "https://example.com/electronics-icon.png"
    },
    "subCategory": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9da",
      "name": "Mobile Phones",
      "image": "https://example.com/mobile-image.png",
      "thumbnail": "https://example.com/mobile-thumb.png"
    }
  }
}
```

---

## 📋 KYC Management

### Upload KYC Documents
**POST** `/api/vendor/kyc`

Uploads KYC documents (PAN and Aadhar).

**Request Body (multipart/form-data):**
```
panNumber: "ABCDE1234F"
panImage: [file]
aadharNumber: "123456789012"
aadharFrontImage: [file]
aadharBackImage: [file]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "KYC documents uploaded successfully",
  "data": {
    "kyc": {
      "panNumber": "ABCDE1234F",
      "panImage": "https://example.com/pan.jpg",
      "aadharNumber": "123456789012",
      "aadharFrontImage": "https://example.com/aadhar-front.jpg",
      "aadharBackImage": "https://example.com/aadhar-back.jpg",
      "isVerified": false,
      "verificationDate": null,
      "verifiedBy": null
    }
  }
}
```

### Get KYC Status
**GET** `/api/vendor/kyc`

Retrieves KYC verification status.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "kyc": {
      "panNumber": "ABCDE1234F",
      "panImage": "https://example.com/pan.jpg",
      "aadharNumber": "123456789012",
      "aadharFrontImage": "https://example.com/aadhar-front.jpg",
      "aadharBackImage": "https://example.com/aadhar-back.jpg",
      "isVerified": true,
      "verificationDate": "2024-01-15T12:00:00.000Z",
      "verifiedBy": "64f8a1b2c3d4e5f6a7b8c9d1"
    }
  }
}
```

---

## 💳 Subscription Management

### Get Subscription Plans
**GET** `/api/vendor/subscription/plans`

Retrieves available subscription plans.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "1month",
        "name": "1 Month Plan",
        "duration": 1,
        "durationUnit": "month",
        "price": 1000,
        "features": {
          "maxProducts": 100,
          "maxImages": 500,
          "prioritySupport": false,
          "featuredListing": false
        },
        "isPopular": false
      },
      {
        "id": "6months",
        "name": "6 Months Plan",
        "duration": 6,
        "durationUnit": "months",
        "price": 3000,
        "features": {
          "maxProducts": 500,
          "maxImages": 2500,
          "prioritySupport": false,
          "featuredListing": false
        },
        "isPopular": true
      },
      {
        "id": "1year",
        "name": "1 Year Plan",
        "duration": 12,
        "durationUnit": "months",
        "price": 5000,
        "features": {
          "maxProducts": 1000,
          "maxImages": 5000,
          "prioritySupport": true,
          "featuredListing": true
        },
        "isPopular": false
      }
    ]
  }
}
```

### Get Current Subscription
**GET** `/api/vendor/subscription`

Retrieves current subscription details.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "currentPlan": "1year",
      "status": "active",
      "amount": 5000,
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2025-01-15T00:00:00.000Z",
      "isActive": true,
      "razorpaySubscriptionId": "sub_1234567890",
      "razorpayPaymentId": "pay_1234567890",
      "features": {
        "maxProducts": 1000,
        "maxImages": 5000,
        "prioritySupport": true,
        "featuredListing": true
      }
    }
  }
}
```

### Create Subscription
**POST** `/api/vendor/subscription`

Creates a new subscription.

**Request Body:**
```json
{
  "plan": "1year"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "id": "sub_1234567890",
      "amount": 5000,
      "currency": "INR",
      "plan": "1year",
      "status": "created"
    },
    "payment": {
      "id": "pay_1234567890",
      "amount": 5000,
      "currency": "INR",
      "status": "created",
      "orderId": "order_1234567890"
    }
  }
}
```

---

## 💰 Wallet Management

### Get Wallet Details
**GET** `/api/vendor/wallet`

Retrieves wallet balance and recent transactions.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "balance": 2500,
    "transactions": [
      {
        "type": "credit",
        "amount": 500,
        "description": "Referral commission",
        "date": "2024-01-14T10:00:00.000Z"
      },
      {
        "type": "debit",
        "amount": 100,
        "description": "Product listing fee",
        "date": "2024-01-13T15:30:00.000Z"
      }
    ]
  }
}
```

### Get Wallet Transactions
**GET** `/api/vendor/wallet/transactions`

Retrieves paginated wallet transaction history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by type (`credit`, `debit`, `all`)

**Request Example:**
```
GET /api/vendor/wallet/transactions?page=1&limit=20&type=credit
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "type": "credit",
      "amount": 500,
      "description": "Referral commission",
      "date": "2024-01-14T10:00:00.000Z"
    },
    {
      "type": "credit",
      "amount": 200,
      "description": "Bonus reward",
      "date": "2024-01-12T14:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 25,
    "itemsPerPage": 20
  }
}
```

---

## ❌ Error Responses

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access token required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Vendor not found"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Name, email, phone, and password are required"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🔧 Request/Response Headers

### Required Headers
```
Content-Type: application/json
Authorization: Bearer <vendor_jwt_token>
```

### Optional Headers
```
Accept: application/json
User-Agent: YourApp/1.0
```

---

## 📝 Notes

1. **Authentication**: All endpoints require valid vendor JWT token
2. **Employee Assignment**: Vendors can be assigned to employees during registration
3. **KYC Verification**: KYC documents must be uploaded and verified by admin
4. **Subscription Required**: Most features require an active subscription
5. **Wallet System**: Vendors have wallets for managing transactions
6. **Shop Management**: Vendors can manage their shop details and images
7. **Category Management**: Vendors can update their main and sub categories
8. **Validation**: All input data is validated before processing
9. **File Uploads**: Image uploads are handled via multipart/form-data
10. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
11. **Employee Code**: Optional during registration, links vendor to employee
12. **Commission System**: Vendors don't directly participate in commission system
13. **Rating System**: Vendors receive ratings from customers
14. **Product Management**: Vendors can manage their products (separate API)
15. **Order Management**: Vendors can manage orders (separate API)
