# Admin API Documentation

## Overview
Complete step-by-step guide for admin operations including vendor management, KYC approval, category management, subscription oversight, and system administration with AWS S3 integration.

## Base URL
```
http://localhost:3000/api/admin
```

## Authentication
All admin endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Admin Authentication

### Admin Signup (Initial Setup)
**POST** `/auth/admin-signup`

Create the first admin user or additional admins with admin code.

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@elboz.com",
  "password": "AdminPass123!",
  "phone": "9876543210",
  "adminCode": "ADMIN2024"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "admin": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Admin User",
      "email": "admin@elboz.com",
      "phone": "9876543210",
      "role": "admin",
      "isActive": true,
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "adminDetails": {
        "permissions": ["all"],
        "lastLogin": "2024-01-15T10:30:00.000Z",
        "createdBy": null,
        "isSuperAdmin": false,
        "accessLevel": "full"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Admin Signup (Authenticated)
**POST** `/auth/admin-signup/authenticated`

Create additional admin users (requires existing admin authentication).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "name": "Sub Admin",
  "email": "subadmin@elboz.com",
  "password": "SubAdmin123!",
  "phone": "9876543211",
  "permissions": ["dashboard", "vendors", "kyc", "withdrawals"]
}
```

**Available Permissions:**
- `dashboard` - Access to dashboard and analytics
- `vendors` - Vendor management
- `kyc` - KYC verification
- `withdrawals` - Withdrawal management
- `categories` - Category management
- `subscriptions` - Subscription management
- `referrals` - Referral commission management
- `settings` - System settings
- `all` - Full access (default)

**Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "admin": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Sub Admin",
      "email": "subadmin@elboz.com",
      "phone": "9876543211",
      "role": "admin",
      "isActive": true,
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "adminDetails": {
        "permissions": ["dashboard", "vendors", "kyc", "withdrawals"],
        "lastLogin": "2024-01-15T10:30:00.000Z",
        "createdBy": "507f1f77bcf86cd799439011",
        "isSuperAdmin": false,
        "accessLevel": "limited"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Admin Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "admin@elboz.com",
  "password": "AdminPass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Admin User",
      "email": "admin@elboz.com",
      "phone": "9876543210",
      "role": "admin",
      "isActive": true,
      "adminDetails": {
        "permissions": ["all"],
        "lastLogin": "2024-01-15T10:30:00.000Z",
        "isSuperAdmin": false,
        "accessLevel": "full"
      },
      "lastLogin": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 📊 Admin Dashboard

### Get Dashboard Overview
**GET** `/dashboard`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalVendors": 150,
      "activeVendors": 120,
      "pendingKYC": 25,
      "totalCustomers": 500,
      "totalProducts": 1200,
      "totalCategories": 25,
      "totalSubCategories": 150,
      "activeSubscriptions": 120,
      "pendingWithdrawals": 15,
      "monthlyRevenue": 450000
    },
    "recentVendors": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Electronics Store",
        "email": "john@electronics.com",
        "vendorDetails": {
          "shopName": "John Electronics Store",
          "isShopListed": true,
          "hasActiveSubscription": true
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "recentKYCRequests": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Mobile Store",
        "email": "jane@mobile.com",
        "vendorDetails": {
          "kyc": {
            "isVerified": false,
            "panUploaded": true,
            "aadharUploaded": true
          }
        },
        "createdAt": "2024-01-15T09:30:00.000Z"
      }
    ],
    "recentWithdrawals": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "vendor": {
          "name": "Tech Gadgets",
          "email": "tech@gadgets.com"
        },
        "amount": 5000,
        "status": "pending",
        "requestDate": "2024-01-15T08:30:00.000Z"
      }
    ]
  }
}
```

### Get System Statistics
**GET** `/statistics`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 650,
      "vendors": 150,
      "customers": 500,
      "admins": 1
    },
    "categories": {
      "main": 25,
      "sub": 150
    },
    "products": 1200,
    "subscriptions": {
      "total": 150,
      "active": 120,
      "pending": 30,
      "expired": 5
    },
    "kyc": {
      "total": 150,
      "verified": 125,
      "pending": 25
    },
    "withdrawals": {
      "total": 50,
      "approved": 35,
      "pending": 15
    },
    "revenue": {
      "total": 450000,
      "thisMonth": 45000,
      "lastMonth": 42000
    }
  }
}
```

---

## 👥 Vendor Management

### Get All Vendors
**GET** `/vendors?page=1&limit=10&status=all&kyc=all`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (all, active, inactive)
- `kyc` (optional): Filter by KYC status (all, verified, pending)
- `search` (optional): Search by name, email, or shop name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "email": "john@electronics.com",
      "phone": "9876543210",
      "role": "vendor",
      "isActive": true,
      "address": {
        "doorNumber": "123",
        "street": "Electronics Street",
        "location": "Andheri West",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400058",
        "country": "India"
      },
      "vendorDetails": {
        "shopName": "John Electronics Store",
        "shopDescription": "Best electronics store in Mumbai",
        "gstNumber": "22AAAAA0000A1Z5",
        "isShopListed": true,
        "hasActiveSubscription": true,
        "mainCategory": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Electronics",
          "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png"
        },
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mobile Phones",
          "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones.png"
        },
        "subscription": {
          "isActive": true,
          "plan": "6months",
          "amount": 4999,
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-07-01T00:00:00.000Z"
        },
        "kyc": {
          "isVerified": true,
          "verificationDate": "2024-01-10T10:00:00.000Z",
          "verifiedBy": "507f1f77bcf86cd799439011"
        },
        "referralCode": "REF123456",
        "referredBy": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Referrer Name",
          "vendorDetails": {
            "shopName": "Referrer Shop"
          }
        },
        "wallet": {
          "balance": 2500,
          "transactions": [
            {
              "type": "credit",
              "amount": 1000,
              "description": "Product sale",
              "date": "2024-01-15T10:30:00.000Z"
            }
          ]
        },
        "withdrawalRequests": [
          {
            "_id": "507f1f77bcf86cd799439013",
            "amount": 500,
            "paymentMethod": "upi",
            "upiId": "john@paytm",
            "bankDetails": null,
            "status": "pending",
            "requestDate": "2024-01-15T10:30:00.000Z",
            "processedDate": null,
            "processedBy": null,
            "adminNotes": null,
            "transactionId": null
          },
          {
            "_id": "507f1f77bcf86cd799439014",
            "amount": 1000,
            "paymentMethod": "bank",
            "upiId": null,
            "bankDetails": {
              "accountNumber": "1234567890",
              "ifscCode": "SBIN0001234",
              "accountHolderName": "John Electronics Store",
              "bankName": "State Bank of India"
            },
            "status": "approved",
            "requestDate": "2024-01-10T10:30:00.000Z",
            "processedDate": "2024-01-12T14:20:00.000Z",
            "processedBy": "507f1f77bcf86cd799439015",
            "adminNotes": "Payment processed successfully",
            "transactionId": "TXN_1705075200000_507f1f77bcf86cd799439014"
          }
        ]
      },
      "createdAt": "2024-01-01T10:30:00.000Z",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 150,
    "itemsPerPage": 10
  }
}
```

### Get Vendor Details
**GET** `/vendors/507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Electronics Store",
    "email": "john@electronics.com",
    "phone": "9876543210",
    "role": "vendor",
    "isActive": true,
    "address": {
      "doorNumber": "123",
      "street": "Electronics Street",
      "location": "Andheri West",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400058",
      "country": "India"
    },
    "vendorDetails": {
      "shopName": "John Electronics Store",
      "shopDescription": "Best electronics store in Mumbai with premium quality products and excellent customer service. We specialize in mobile phones, laptops, and accessories.",
      "shopMetaTitle": "John Electronics Store - Best Electronics Shop in Mumbai",
      "shopMetaDescription": "Discover premium electronics at John Electronics Store. Best prices, quality products, and excellent service in Mumbai. Mobile phones, laptops, accessories.",
      "shopMetaKeywords": ["electronics", "mobile phones", "laptops", "mumbai", "gadgets"],
      "shopMetaTags": ["trusted", "quality", "authorized dealer"],
      "shopImages": [
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid1.jpg",
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid2.jpg"
      ],
      "gstNumber": "22AAAAA0000A1Z5",
      "isShopListed": true,
      "hasActiveSubscription": true,
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Electronics",
        "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png"
      },
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mobile Phones",
        "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones.png"
      },
      "subscription": {
        "isActive": true,
        "plan": "6months",
        "amount": 4999,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-07-01T00:00:00.000Z",
        "features": {
          "maxProducts": 100,
          "maxImages": 500,
          "prioritySupport": true,
          "featuredListing": false
        }
      },
      "kyc": {
        "panNumber": "ABCDE1234F",
        "panImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/pan/uuid.jpg",
        "aadharNumber": "123456789012",
        "aadharFrontImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid1.jpg",
        "aadharBackImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid2.jpg",
        "isVerified": true,
        "verificationDate": "2024-01-10T10:00:00.000Z",
        "verifiedBy": "507f1f77bcf86cd799439011",
        "adminNotes": "Documents verified successfully"
      },
      "referralCode": "REF123456",
      "referredBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Referrer Name",
        "vendorDetails": {
          "shopName": "Referrer Shop"
        }
      },
      "wallet": {
        "balance": 2500,
        "transactions": [
          {
            "type": "credit",
            "amount": 1000,
            "description": "Product sale - Samsung Galaxy S24 Ultra",
            "date": "2024-01-15T10:30:00.000Z"
          }
        ]
      },
      "withdrawalRequests": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "amount": 500,
          "status": "pending",
          "requestDate": "2024-01-15T10:30:00.000Z"
        }
      ]
    },
    "createdAt": "2024-01-01T10:30:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Vendor Status
**POST** `/vendors/status/update`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "isActive": false,
  "reason": "Violation of terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vendor deactivated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isActive": false,
    "deactivatedAt": "2024-01-15T10:30:00.000Z",
    "deactivatedBy": "507f1f77bcf86cd799439011"
  }
}
```

---

## 📋 KYC Management

### Get Pending KYC Requests
**GET** `/kyc/pending?page=1&limit=10`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jane Mobile Store",
      "email": "jane@mobile.com",
      "phone": "9876543210",
      "vendorDetails": {
        "shopName": "Jane Mobile Store",
        "gstNumber": "22BBBBB0000B2Z6",
        "kyc": {
          "panNumber": "FGHIJ5678G",
          "panImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/jane-mobile-store/pan/uuid.jpg",
          "aadharNumber": "987654321098",
          "aadharFrontImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/jane-mobile-store/aadhar/uuid1.jpg",
          "aadharBackImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/jane-mobile-store/aadhar/uuid2.jpg",
          "isVerified": false,
          "submittedAt": "2024-01-15T09:30:00.000Z"
        }
      },
      "createdAt": "2024-01-10T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### Get All KYC Requests
**GET** `/kyc/all?page=1&limit=10&status=all`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (all, verified, pending, rejected)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "email": "john@electronics.com",
      "vendorDetails": {
        "shopName": "John Electronics Store",
        "kyc": {
          "panNumber": "ABCDE1234F",
          "panImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/pan/uuid.jpg",
          "aadharNumber": "123456789012",
          "aadharFrontImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid1.jpg",
          "aadharBackImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid2.jpg",
          "isVerified": true,
          "verificationDate": "2024-01-10T10:00:00.000Z",
          "verifiedBy": "507f1f77bcf86cd799439011",
          "adminNotes": "Documents verified successfully"
        }
      },
      "createdAt": "2024-01-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 150,
    "itemsPerPage": 10
  }
}
```

### Verify Vendor KYC
**POST** `/kyc/verify`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "vendorId": "507f1f77bcf86cd799439011",
  "isVerified": true,
  "adminNotes": "Documents verified successfully. PAN and Aadhar details match with provided information."
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC verified successfully",
  "data": {
    "vendorId": "507f1f77bcf86cd799439011",
    "vendorName": "Jane Mobile Store",
    "isVerified": true,
    "verificationDate": "2024-01-15T10:30:00.000Z",
    "verifiedBy": "507f1f77bcf86cd799439011",
    "adminNotes": "Documents verified successfully. PAN and Aadhar details match with provided information."
  }
}
```

### Reject Vendor KYC
**PUT** `/kyc/reject/507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "isVerified": false,
  "adminNotes": "PAN card image is blurry and Aadhar number format is incorrect. Please upload clear documents."
}
```

**Response:**
```json
{
  "success": true,
  "message": "KYC rejected successfully",
  "data": {
    "vendorId": "507f1f77bcf86cd799439011",
    "vendorName": "Jane Mobile Store",
    "isVerified": false,
    "rejectionDate": "2024-01-15T10:30:00.000Z",
    "rejectedBy": "507f1f77bcf86cd799439011",
    "adminNotes": "PAN card image is blurry and Aadhar number format is incorrect. Please upload clear documents."
  }
}
```

---

## 💰 Withdrawal Management

### Get All Withdrawal Requests
**GET** `/withdrawals?page=1&limit=10&status=pending&paymentMethod=upi`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (all, pending, approved, rejected)
- `paymentMethod` (optional): Filter by payment method (all, upi, bank)

**Response:**
```json
{
  "success": true,
  "data": {
    "withdrawalRequests": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Electronics Store",
        "email": "john@electronics.com",
        "vendorDetails": {
          "shopName": "John Electronics Store",
          "wallet": {
            "balance": 7500
          }
        },
        "withdrawalRequest": {
          "_id": "507f1f77bcf86cd799439012",
          "amount": 5000,
          "paymentMethod": "upi",
          "upiId": "john@paytm",
          "bankDetails": null,
          "status": "pending",
          "requestDate": "2024-01-15T10:30:00.000Z",
          "processedDate": null,
          "processedBy": null,
          "adminNotes": null,
          "transactionId": null
        }
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Mobile Store",
        "email": "jane@mobile.com",
        "vendorDetails": {
          "shopName": "Jane Mobile Store",
          "wallet": {
            "balance": 3000
          }
        },
        "withdrawalRequest": {
          "_id": "507f1f77bcf86cd799439014",
          "amount": 2000,
          "paymentMethod": "bank",
          "upiId": null,
          "bankDetails": {
            "accountNumber": "1234567890",
            "ifscCode": "SBIN0001234",
            "accountHolderName": "Jane Mobile Store",
            "bankName": "State Bank of India"
          },
          "status": "approved",
          "requestDate": "2024-01-10T10:30:00.000Z",
          "processedDate": "2024-01-12T14:20:00.000Z",
          "processedBy": "507f1f77bcf86cd799439015",
          "adminNotes": "Payment processed successfully",
          "transactionId": "TXN_1705075200000_507f1f77bcf86cd799439014"
        }
      }
    ],
    "summary": {
      "pending": { "count": 5, "amount": 15000 },
      "approved": { "count": 25, "amount": 75000 },
      "rejected": { "count": 3, "amount": 8000 }
    },
    "totals": {
      "totalRequests": 33,
      "totalAmount": 98000
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 4,
    "totalItems": 33,
    "itemsPerPage": 10
  }
}
```

### Get Withdrawal Request Details
**GET** `/withdrawals/507f1f77bcf86cd799439012`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Electronics Store",
    "email": "john@electronics.com",
    "vendorDetails": {
      "shopName": "John Electronics Store",
      "wallet": {
        "balance": 7500
      }
    },
    "withdrawalRequest": {
      "_id": "507f1f77bcf86cd799439012",
      "amount": 5000,
      "paymentMethod": "upi",
      "upiId": "john@paytm",
      "bankDetails": null,
      "status": "pending",
      "requestDate": "2024-01-15T10:30:00.000Z",
      "processedDate": null,
      "processedBy": null,
      "adminNotes": null,
      "transactionId": null
    }
  }
}
```

### Get Withdrawal Statistics
**GET** `/withdrawals/statistics?period=month`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `period` (optional): Time period (month, quarter, year, default: month)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "pending": { "count": 5, "amount": 15000, "averageAmount": 3000 },
      "approved": { "count": 25, "amount": 75000, "averageAmount": 3000 },
      "rejected": { "count": 3, "amount": 8000, "averageAmount": 2667 }
    },
    "paymentMethodDistribution": [
      {
        "_id": "upi",
        "count": 20,
        "totalAmount": 60000
      },
      {
        "_id": "bank",
        "count": 13,
        "totalAmount": 38000
      }
    ],
    "monthlyTrends": [
      {
        "_id": { "year": 2024, "month": 1 },
        "count": 33,
        "totalAmount": 98000,
        "approvedCount": 25,
        "rejectedCount": 3
      }
    ],
    "period": "month"
  }
}
```

### Process Withdrawal Request (Approve/Reject)
**POST** `/withdrawals/process`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (Approve):**
```json
{
  "vendorId": "507f1f77bcf86cd799439011",
  "requestId": "507f1f77bcf86cd799439012",
  "status": "approved",
  "adminNotes": "Payment processed successfully via UPI",
  "transactionId": "TXN_1705312200000_507f1f77bcf86cd799439012"
}
```

**Request Body (Reject):**
```json
{
  "vendorId": "507f1f77bcf86cd799439011",
  "requestId": "507f1f77bcf86cd799439012",
  "status": "rejected",
  "adminNotes": "Invalid UPI ID provided"
}
```

**Response (Approve):**
```json
{
  "success": true,
  "message": "Withdrawal request approved successfully",
  "data": {
    "withdrawalRequest": {
      "_id": "507f1f77bcf86cd799439012",
      "amount": 5000,
      "paymentMethod": "upi",
      "upiId": "john@paytm",
      "bankDetails": null,
      "status": "approved",
      "requestDate": "2024-01-15T10:30:00.000Z",
      "processedDate": "2024-01-15T11:00:00.000Z",
      "processedBy": "507f1f77bcf86cd799439015",
      "adminNotes": "Payment processed successfully via UPI",
      "transactionId": "TXN_1705312200000_507f1f77bcf86cd799439012"
    },
    "vendor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "vendorDetails": {
        "shopName": "John Electronics Store"
      }
    },
    "walletBalance": 2500
  }
}
```

**Response (Reject):**
```json
{
  "success": true,
  "message": "Withdrawal request rejected successfully",
  "data": {
    "withdrawalRequest": {
      "_id": "507f1f77bcf86cd799439012",
      "amount": 5000,
      "paymentMethod": "upi",
      "upiId": "john@paytm",
      "bankDetails": null,
      "status": "rejected",
      "requestDate": "2024-01-15T10:30:00.000Z",
      "processedDate": "2024-01-15T11:00:00.000Z",
      "processedBy": "507f1f77bcf86cd799439015",
      "adminNotes": "Invalid UPI ID provided",
      "transactionId": null
    },
    "vendor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "vendorDetails": {
        "shopName": "John Electronics Store"
      }
    },
    "walletBalance": 7500
  }
}
```

**Important Notes:**
- **For Approved Requests**: Transaction ID is required
- **For Rejected Requests**: Amount remains in vendor's wallet (no deduction)
- **Wallet Balance**: Automatically updated based on approval/rejection
- **Payment Method**: Supports both UPI and Bank Transfer
- **Validation**: All payment details are validated before processing

---

## 📂 Category Management

### Create Main Category
**POST** `/categories/main`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
name: Electronics
description: Electronic devices and gadgets
sortOrder: 1
metaTitle: Electronics - Best Electronic Devices
metaDescription: Discover the best electronic devices and gadgets
icon: [file upload]
```

**Response:**
```json
{
  "success": true,
  "message": "Main category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Electronics",
    "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png",
    "description": "Electronic devices and gadgets",
    "sortOrder": 1,
    "metaTitle": "Electronics - Best Electronic Devices",
    "metaDescription": "Discover the best electronic devices and gadgets",
    "slug": "electronics",
    "isActive": true,
    "vendorCount": 0,
    "subCategoryCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get All Main Categories
**GET** `/categories/main?page=1&limit=10`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Electronics",
      "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png",
      "description": "Electronic devices and gadgets",
      "sortOrder": 1,
      "metaTitle": "Electronics - Best Electronic Devices",
      "metaDescription": "Discover the best electronic devices and gadgets",
      "slug": "electronics",
      "vendorCount": 45,
      "subCategoryCount": 12,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### Update Main Category
**POST** `/categories/main/update`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
id: 507f1f77bcf86cd799439011
name: Updated Electronics
description: Updated description for electronics
sortOrder: 2
metaTitle: Updated Electronics - Best Devices
metaDescription: Updated meta description
icon: [file upload] (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Main category updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Electronics",
    "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/updated-electronics-icon.png",
    "description": "Updated description for electronics",
    "sortOrder": 2,
    "metaTitle": "Updated Electronics - Best Devices",
    "metaDescription": "Updated meta description"
  }
}
```

### Delete Main Category
**POST** `/categories/main/delete`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Main category deleted successfully"
}
```

### Create Sub Category
**POST** `/categories/sub`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
name: Mobile Phones
mainCategory: 507f1f77bcf86cd799439011
description: Smartphones and mobile devices
sortOrder: 1
metaTitle: Mobile Phones - Best Smartphones
metaDescription: Find the best mobile phones and smartphones
keywords[0]: mobile
keywords[1]: phone
keywords[2]: smartphone
features[0]: 5G
features[1]: Camera
features[2]: Battery
popularTags[0]: mobile
popularTags[1]: phone
popularTags[2]: smartphone
image: [file upload]
thumbnail: [file upload]
```

**Response:**
```json
{
  "success": true,
  "message": "Sub category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Mobile Phones",
    "mainCategory": "507f1f77bcf86cd799439011",
    "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones.png",
    "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones-thumb.png",
    "description": "Smartphones and mobile devices",
    "sortOrder": 1,
    "metaTitle": "Mobile Phones - Best Smartphones",
    "metaDescription": "Find the best mobile phones and smartphones",
    "keywords": ["mobile", "phone", "smartphone"],
    "features": ["5G", "Camera", "Battery"],
    "popularTags": ["mobile", "phone", "smartphone"],
    "slug": "mobile-phones",
    "vendorCount": 0,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Sub Category
**POST** `/categories/sub/update`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
id: 507f1f77bcf86cd799439012
name: Updated Mobile Phones
mainCategory: 507f1f77bcf86cd799439011
description: Updated smartphones and mobile devices
sortOrder: 2
metaTitle: Updated Mobile Phones - Best Smartphones
metaDescription: Updated meta description for mobile phones
keywords[0]: mobile
keywords[1]: phone
keywords[2]: smartphone
features[0]: 5G
features[1]: Camera
features[2]: Battery
popularTags[0]: mobile
popularTags[1]: phone
popularTags[2]: smartphone
image: [file upload] (optional)
thumbnail: [file upload] (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Sub category updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Updated Mobile Phones",
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Electronics",
      "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png"
    },
    "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/updated-mobile-phones.png",
    "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/updated-mobile-phones-thumb.png",
    "description": "Updated smartphones and mobile devices",
    "sortOrder": 2,
    "metaTitle": "Updated Mobile Phones - Best Smartphones",
    "metaDescription": "Updated meta description for mobile phones",
    "keywords": ["mobile", "phone", "smartphone"],
    "features": ["5G", "Camera", "Battery"],
    "popularTags": ["mobile", "phone", "smartphone"],
    "slug": "updated-mobile-phones",
    "vendorCount": 15,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Delete Sub Category
**POST** `/categories/sub/delete`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sub category deleted successfully"
}
```

### Get Sub Categories by Main Category
**GET** `/categories/sub/507f1f77bcf86cd799439011?page=1&limit=10`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mobile Phones",
      "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones.png",
      "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones-thumb.png",
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Electronics",
        "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png"
      },
      "description": "Smartphones and mobile devices",
      "vendorCount": 15,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 12,
    "itemsPerPage": 10
  }
}
```

---

## 💳 Subscription Management

### Get All Subscriptions
**GET** `/subscriptions?page=1&limit=10&status=all`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (all, active, pending, expired)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "vendor": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Electronics Store",
        "email": "john@electronics.com",
        "vendorDetails": {
          "shopName": "John Electronics Store"
        }
      },
      "plan": "6months",
      "amount": 4999,
      "status": "active",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-07-01T00:00:00.000Z",
      "features": {
        "maxProducts": 100,
        "maxImages": 500,
        "prioritySupport": true,
        "featuredListing": false
      },
      "razorpay": {
        "subscriptionId": "sub_ABC123",
        "paymentId": "pay_XYZ789",
        "orderId": "order_DEF456"
      },
      "createdAt": "2024-01-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 150,
    "itemsPerPage": 10
  }
}
```

### Get Subscription Statistics
**GET** `/subscriptions/statistics`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 120,
    "pending": 30,
    "expired": 5,
    "byPlan": {
      "3months": 30,
      "6months": 80,
      "1year": 40
    },
    "revenue": {
      "total": 750000,
      "thisMonth": 75000,
      "lastMonth": 70000
    }
  }
}
```

---

## 🔧 System Settings

### Initialize Razorpay Plans
**POST** `/init-razorpay-plans`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Razorpay plans initialized successfully",
  "data": [
    {
      "planId": "3months",
      "razorpayPlanId": "plan_3months",
      "plan": {
        "id": "plan_3months",
        "name": "3 Months Plan",
        "amount": 199,
        "currency": "INR",
        "interval": "month",
        "interval_count": 3
      }
    },
    {
      "planId": "6months",
      "razorpayPlanId": "plan_6months",
      "plan": {
        "id": "plan_6months",
        "name": "6 Months Plan",
        "amount": 4999,
        "currency": "INR",
        "interval": "month",
        "interval_count": 6
      }
    },
    {
      "planId": "1year",
      "razorpayPlanId": "plan_1year",
      "plan": {
        "id": "plan_1year",
        "name": "1 Year Plan",
        "amount": 8999,
        "currency": "INR",
        "interval": "month",
        "interval_count": 12
      }
    }
  ]
}
```

### Get System Configuration
**GET** `/system/config`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "aws": {
      "bucket": "elboz",
      "region": "eu-north-1",
      "status": "connected"
    },
    "razorpay": {
      "status": "connected",
      "plans": {
        "3months": "plan_3months",
        "6months": "plan_6months",
        "1year": "plan_1year"
      }
    },
    "database": {
      "status": "connected",
      "name": "vendor-listing-db"
    },
    "fileUpload": {
      "maxSize": "200MB",
      "supportedFormats": ["jpeg", "jpg", "png", "gif", "webp"]
    }
  }
}
```

---

## 🎯 Referral Commission Management

### Get Referral Commission Settings
**GET** `/referral/settings`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCommission": {
      "percentage": 3,
      "isActive": true,
      "minimumSubscriptionAmount": 100,
      "maximumCommissionPerReferral": 1000
    },
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "updatedBy": "507f1f77bcf86cd799439011"
  }
}
```

### Update Referral Commission Settings
**POST** `/referral/settings/update`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "percentage": 5,
  "isActive": true,
  "minimumSubscriptionAmount": 200,
  "maximumCommissionPerReferral": 1500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral commission settings updated successfully",
  "data": {
    "referralCommission": {
      "percentage": 5,
      "isActive": true,
      "minimumSubscriptionAmount": 200,
      "maximumCommissionPerReferral": 1500
    },
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "updatedBy": "507f1f77bcf86cd799439011"
  }
}
```

### Get All Referral Commissions
**GET** `/referral/commissions?page=1&limit=10&status=all&referrerId=507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (all, pending, paid, cancelled)
- `referrerId` (optional): Filter by specific referrer

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "referrer": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Electronics Store",
        "email": "john@electronics.com",
        "vendorDetails": {
          "shopName": "John Electronics Store"
        }
      },
      "referredVendor": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Mobile Store",
        "email": "jane@mobile.com",
        "vendorDetails": {
          "shopName": "Jane Mobile Store"
        }
      },
      "referralCode": "REF123456",
      "commission": {
        "percentage": 3,
        "amount": 150,
        "currency": "INR"
      },
      "subscription": {
        "plan": "6months",
        "amount": 4999,
        "status": "active"
      },
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totals": {
    "totalAmount": 5000,
    "totalCommissions": 25
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### Get Pending Referral Commissions
**GET** `/referral/commissions/pending?page=1&limit=10`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "referrer": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Electronics Store",
        "email": "john@electronics.com",
        "vendorDetails": {
          "shopName": "John Electronics Store",
          "wallet": {
            "balance": 2500
          }
        }
      },
      "referredVendor": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Mobile Store",
        "email": "jane@mobile.com",
        "vendorDetails": {
          "shopName": "Jane Mobile Store"
        }
      },
      "commission": {
        "percentage": 3,
        "amount": 150,
        "currency": "INR"
      },
      "subscription": {
        "plan": "6months",
        "amount": 4999,
        "status": "active"
      },
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totals": {
    "totalAmount": 1500,
    "totalPending": 10
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 10,
    "itemsPerPage": 10
  }
}
```

### Approve Referral Commission
**POST** `/referral/commissions/approve`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "commissionId": "507f1f77bcf86cd799439011",
  "adminNotes": "Commission approved after verification of subscription payment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral commission approved and paid successfully",
  "data": {
    "commission": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "paid",
      "amount": 150,
      "paidAt": "2024-01-15T10:30:00.000Z",
      "transactionId": "TXN_1705312200000_507f1f77bcf86cd799439011"
    },
    "referrer": {
      "name": "John Electronics Store",
      "newWalletBalance": 2650
    },
    "referredVendor": {
      "name": "Jane Mobile Store",
      "shopName": "Jane Mobile Store"
    }
  }
}
```

### Reject Referral Commission
**POST** `/referral/commissions/reject`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "commissionId": "507f1f77bcf86cd799439011",
  "adminNotes": "Commission rejected due to invalid referral or subscription cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral commission rejected successfully",
  "data": {
    "commission": {
      "_id": "507f1f77bcf86cd799439011",
      "status": "cancelled",
      "amount": 150,
      "rejectedAt": "2024-01-15T10:30:00.000Z"
    },
    "referredVendor": {
      "name": "Jane Mobile Store",
      "shopName": "Jane Mobile Store"
    }
  }
}
```

### Get Referral Statistics
**GET** `/referral/statistics`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 150,
    "pendingCommissions": 25,
    "paidCommissions": 120,
    "cancelledCommissions": 5,
    "totalCommissionAmount": 7500,
    "pendingAmount": 1250,
    "topReferrers": [
      {
        "referrer": {
          "name": "John Electronics Store",
          "email": "john@electronics.com",
          "vendorDetails": {
            "shopName": "John Electronics Store"
          }
        },
        "totalReferrals": 15,
        "totalAmount": 750
      },
      {
        "referrer": {
          "name": "Tech Gadgets",
          "email": "tech@gadgets.com",
          "vendorDetails": {
            "shopName": "Tech Gadgets"
          }
        },
        "totalReferrals": 12,
        "totalAmount": 600
      }
    ]
  }
}
```

### Get Vendor Referral Details
**GET** `/referral/vendor/507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "name": "John Electronics Store",
      "email": "john@electronics.com",
      "shopName": "John Electronics Store",
      "referralCode": "REF123456",
      "walletBalance": 2650,
      "referredBy": {
        "name": "Referrer Name",
        "shopName": "Referrer Shop"
      }
    },
    "referrals": {
      "total": 15,
      "totalCommissionEarned": 750,
      "pendingCommission": 150,
      "referrals": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "referredVendor": {
            "name": "Jane Mobile Store",
            "email": "jane@mobile.com",
            "vendorDetails": {
              "shopName": "Jane Mobile Store"
            }
          },
          "subscription": {
            "plan": "6months",
            "amount": 4999,
            "status": "active"
          },
          "commission": {
            "percentage": 3,
            "amount": 150
          },
          "status": "paid",
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  }
}
```

---

## ⚠️ Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Authorization Error
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Vendor not found"
}
```

### File Upload Error
```json
{
  "success": false,
  "message": "File upload error",
  "error": "Invalid file type. Only jpeg|jpg|png|gif|webp files are allowed!"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📁 File Upload Guidelines

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Image Size Limits
- Maximum file size: **200MB** per image
- Maximum dimensions: 4096x4096 pixels
- Minimum dimensions: 200x200 pixels

### Upload Directory Structure
```
elboz/
├── uploads/
│   ├── categories/
│   │   └── category-icons/
│   ├── subcategories/
│   │   ├── images/
│   │   └── thumbnails/
│   ├── vendors/
│   │   └── vendor-name/
│   ├── shops/
│   │   └── vendor-name/
│   ├── catalog/
│   │   └── product/
│   │       └── vendor-name/
│   │           └── product-name/
│   ├── profiles/
│   │   └── user-id/
│   └── kyc/
│       └── user-id/
│           ├── pan/
│           └── aadhar/
```

---

## 🔒 Security & Rate Limiting

### Rate Limits
- Admin endpoints: 100 requests per 15 minutes
- File uploads: 20 requests per hour
- KYC operations: 50 requests per hour
- Other endpoints: 200 requests per minute

### Security Features
1. **JWT Authentication**: All authenticated requests require valid JWT tokens
2. **Role-based Access**: Admin-only endpoints with proper authorization
3. **File Validation**: All uploaded files are validated for type and size
4. **Input Sanitization**: All user inputs are sanitized and validated
5. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
6. **CORS Protection**: Cross-origin requests are properly configured

---

## 📊 Admin Workflow Summary

### KYC Approval Process:
1. **View Pending KYC** (`GET /kyc/pending`)
2. **Review Documents** (PAN & Aadhar)
3. **Verify KYC** (`POST /kyc/verify`) or **Reject KYC** (`POST /kyc/verify` with `isVerified: false`)

### Withdrawal Management Process:
1. **View Pending Withdrawals** (`GET /withdrawals/pending`)
2. **Review Request** (amount, vendor details)
3. **Process Withdrawal** (`POST /withdrawals/process`) with status "approved" or "rejected"

### Referral Commission Management Process:
1. **Configure Commission Settings** (`POST /referral/settings/update`)
2. **View Pending Commissions** (`GET /referral/commissions/pending`)
3. **Review Commission Details** (referrer, referred vendor, subscription)
4. **Approve Commission** (`POST /referral/commissions/approve`) or **Reject Commission** (`POST /referral/commissions/reject`)

### Vendor Management Process:
1. **View All Vendors** (`GET /vendors`)
2. **Review Vendor Details** (`GET /vendors/:id`)
3. **Manage Status** (`POST /vendors/status/update`)

### Category Management Process:
1. **Create Main Category** (`POST /categories/main`)
2. **Create Sub Categories** (`POST /categories/sub`)
3. **Update Main Categories** (`POST /categories/main/update`)
4. **Update Sub Categories** (`POST /categories/sub/update`)
5. **Delete Main Categories** (`POST /categories/main/delete`)
6. **Delete Sub Categories** (`POST /categories/sub/delete`)

### Rating Moderation Process:
1. **View Pending Ratings** (`GET /ratings?status=pending`)
2. **Review Rating Details** (`GET /ratings/:id`)
3. **Moderate Rating** (`POST /ratings/moderate`) with status "approved" or "rejected"

### Admin Management Process:
1. **View All Admins** (`GET /admins`)
2. **Update Permissions** (`POST /admins/permissions/update`)
3. **Deactivate Admin** (`POST /admins/deactivate`)

---

## 🔄 API Migration Guide

### Changes Made in Version 2.1

All PUT and DELETE operations have been converted to POST requests for better compatibility and consistency.

#### **Before (Old API):**
```bash
# Update vendor status
PUT /api/admin/vendors/507f1f77bcf86cd799439011/status
{
  "isActive": false
}

# Delete category
DELETE /api/admin/categories/main/507f1f77bcf86cd799439011

# Verify KYC
PUT /api/admin/kyc/verify/507f1f77bcf86cd799439011
{
  "isVerified": true
}
```

#### **After (New API):**
```bash
# Update vendor status
POST /api/admin/vendors/status/update
{
  "id": "507f1f77bcf86cd799439011",
  "isActive": false
}

# Delete main category
POST /api/admin/categories/main/delete
{
  "id": "507f1f77bcf86cd799439011"
}

# Update sub category
POST /api/admin/categories/sub/update
{
  "id": "507f1f77bcf86cd799439012",
  "name": "Updated Mobile Phones",
  "mainCategory": "507f1f77bcf86cd799439011"
}

# Delete sub category
POST /api/admin/categories/sub/delete
{
  "id": "507f1f77bcf86cd799439012"
}

# Verify KYC
POST /api/admin/kyc/verify
{
  "vendorId": "507f1f77bcf86cd799439011",
  "isVerified": true
}
```

### Migration Checklist

- [ ] Update all PUT endpoints to POST
- [ ] Move ID parameters from URL to request body
- [ ] Update request body structure to include required ID fields
- [ ] Test all converted endpoints
- [ ] Update frontend API calls
- [ ] Update documentation references

### Benefits of New API Structure

✅ **Better Compatibility**: Works with all HTTP clients and proxies
✅ **Consistent Design**: All operations use POST requests
✅ **Cleaner URLs**: No complex URL parameters
✅ **Easier Debugging**: All data in request body
✅ **Better Validation**: Proper field validation for all parameters

---

## 🧪 Testing Examples

### Test Environment Setup
```bash
# Base URL
http://localhost:3000/api/admin

# Test admin credentials
{
  "email": "admin@elboz.com",
  "password": "AdminPass123!"
}
```

### Sample Test Data
```json
{
  "admin": {
    "name": "Admin User",
    "email": "admin@elboz.com",
    "password": "AdminPass123!"
  },
  "category": {
    "name": "Test Electronics",
    "description": "Test category for electronics",
    "metaTitle": "Test Electronics - Best Devices",
    "metaDescription": "Test meta description for SEO"
  },
  "kyc": {
    "isVerified": true,
    "adminNotes": "Test KYC verification"
  },
  "withdrawal": {
    "status": "approved",
    "adminNotes": "Test withdrawal approval"
  },
  "referralCommission": {
    "percentage": 5,
    "isActive": true,
    "minimumSubscriptionAmount": 200,
    "maximumCommissionPerReferral": 1500,
    "adminNotes": "Test commission approval"
  }
}
```

---

## ⭐ Rating Management

### Get All Ratings for Moderation
**GET** `/ratings?page=1&limit=10&status=pending&vendorId=507f1f77bcf86cd799439011`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status - pending, approved, rejected, all (default: pending)
- `vendorId` (optional): Filter by specific vendor

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b20",
      "rating": 5,
      "review": "Excellent service and quality products!",
      "categories": {
        "service": 5,
        "quality": 4,
        "communication": 5,
        "value": 4
      },
      "vendor": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Electronics Store",
        "vendorDetails": {
          "shopName": "John's Electronics"
        }
      },
      "customer": {
        "_id": "60f7b3b3b3b3b3b3b3b3b14",
        "name": "John Customer",
        "profileImage": "https://bucket.s3.amazonaws.com/profiles/customer1.jpg"
      },
      "isAnonymous": false,
      "tags": ["fast delivery", "good quality"],
      "status": "pending",
      "createdAt": "2023-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### Get Rating Details for Moderation
**GET** `/ratings/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b20",
    "rating": 5,
    "review": "Excellent service and quality products!",
    "categories": {
      "service": 5,
      "quality": 4,
      "communication": 5,
      "value": 4
    },
    "vendor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "vendorDetails": {
        "shopName": "John's Electronics"
      }
    },
    "customer": {
      "_id": "60f7b3b3b3b3b3b3b3b3b14",
      "name": "John Customer",
      "profileImage": "https://bucket.s3.amazonaws.com/profiles/customer1.jpg"
    },
    "isAnonymous": false,
    "tags": ["fast delivery", "good quality"],
    "status": "pending",
    "moderatedBy": null,
    "moderatedAt": null,
    "moderationNotes": null,
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
}
```

### Moderate Rating (Approve/Reject)
**POST** `/ratings/moderate`

**Request Body:**
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b20",
  "status": "approved",
  "moderationNotes": "Review is appropriate and follows guidelines"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rating approved successfully",
  "data": {
    "rating": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b20",
      "status": "approved",
      "moderatedBy": "507f1f77bcf86cd799439011",
      "moderatedAt": "2023-12-01T15:00:00.000Z"
    }
  }
}
```

### Bulk Moderate Ratings
**POST** `/ratings/bulk-moderate`

**Request Body:**
```json
{
  "ratingIds": [
    "60f7b3b3b3b3b3b3b3b3b3b20",
    "60f7b3b3b3b3b3b3b3b3b21",
    "60f7b3b3b3b3b3b3b3b3b22"
  ],
  "status": "approved",
  "moderationNotes": "All reviews are appropriate"
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 ratings approved successfully",
  "data": {
    "modifiedCount": 3
  }
}
```

### Get Rating Statistics
**GET** `/ratings/statistics`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRatings": 150,
    "pendingRatings": 25,
    "approvedRatings": 120,
    "rejectedRatings": 5,
    "averageRating": 4.3,
    "ratingDistribution": {
      "1": 5,
      "2": 10,
      "3": 20,
      "4": 50,
      "5": 65
    },
    "ratingsByMonth": [
      {
        "_id": {
          "year": 2023,
          "month": 12
        },
        "count": 15,
        "averageRating": 4.4
      }
    ],
    "topRatedVendors": [
      {
        "vendor": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Electronics Store",
          "vendorDetails": {
            "shopName": "John's Electronics"
          }
        },
        "averageRating": 4.8,
        "totalRatings": 25
      }
    ]
  }
}
```

### Get Vendor Rating Details
**GET** `/vendors/:vendorId/ratings?page=1&limit=10&status=approved`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status - pending, approved, rejected, all (default: approved)

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "vendorDetails": {
        "shopName": "John's Electronics",
        "averageRating": 4.5,
        "totalRatings": 25
      }
    },
    "ratings": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b20",
        "rating": 5,
        "review": "Excellent service and quality products!",
        "customer": {
          "_id": "60f7b3b3b3b3b3b3b3b3b14",
          "name": "John Customer",
          "profileImage": "https://bucket.s3.amazonaws.com/profiles/customer1.jpg"
        },
        "status": "approved",
        "moderatedBy": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Admin User"
        },
        "createdAt": "2023-12-01T10:00:00.000Z"
      }
    ],
    "statistics": {
      "averageRating": 4.5,
      "totalRatings": 25,
      "ratingDistribution": {
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 8,
        "5": 11
      }
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

---

## 👨‍💼 Admin Management

### Update Admin Permissions
**POST** `/admins/permissions/update`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "adminId": "507f1f77bcf86cd799439012",
  "permissions": ["dashboard", "vendors", "kyc", "withdrawals"],
  "accessLevel": "limited",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin permissions updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Sub Admin",
    "email": "subadmin@elboz.com",
    "adminDetails": {
      "permissions": ["dashboard", "vendors", "kyc", "withdrawals"],
      "accessLevel": "limited",
      "isActive": true,
      "updatedBy": "507f1f77bcf86cd799439011",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Deactivate Admin
**POST** `/admins/deactivate`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "adminId": "507f1f77bcf86cd799439012",
  "reason": "No longer required for system administration"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin deactivated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Sub Admin",
    "isActive": false,
    "deactivatedAt": "2024-01-15T10:30:00.000Z",
    "deactivatedBy": "507f1f77bcf86cd799439011",
    "reason": "No longer required for system administration"
  }
}
```

---

## 📊 Subscription Statistics

### Get Comprehensive Subscription Statistics
**GET** `/subscriptions/statistics?period=month&startDate=2024-01-01&endDate=2024-01-31`

**Query Parameters:**
- `period` (optional): Time period - all, month, quarter, year (default: all)
- `startDate` (optional): Custom start date (YYYY-MM-DD format)
- `endDate` (optional): Custom end date (YYYY-MM-DD format)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSubscriptions": 500,
      "totalAmount": 2500000,
      "averageAmount": 5000,
      "activeSubscriptions": 350,
      "pendingSubscriptions": 50,
      "expiredSubscriptions": 80,
      "cancelledSubscriptions": 20,
      "activeRevenue": 1750000,
      "pendingRevenue": 250000,
      "totalCommissions": 125000,
      "netRevenue": 2375000
    },
    "statusDistribution": [
      {
        "_id": "active",
        "count": 350,
        "totalAmount": 1750000,
        "averageAmount": 5000
      },
      {
        "_id": "pending",
        "count": 50,
        "totalAmount": 250000,
        "averageAmount": 5000
      },
      {
        "_id": "expired",
        "count": 80,
        "totalAmount": 400000,
        "averageAmount": 5000
      },
      {
        "_id": "cancelled",
        "count": 20,
        "totalAmount": 100000,
        "averageAmount": 5000
      }
    ],
    "planDistribution": [
      {
        "_id": "1year",
        "count": 200,
        "totalAmount": 1800000,
        "averageAmount": 9000,
        "activeCount": 150,
        "pendingCount": 20,
        "expiredCount": 25,
        "cancelledCount": 5
      },
      {
        "_id": "6months",
        "count": 200,
        "totalAmount": 1000000,
        "averageAmount": 5000,
        "activeCount": 150,
        "pendingCount": 20,
        "expiredCount": 25,
        "cancelledCount": 5
      },
      {
        "_id": "3months",
        "count": 100,
        "totalAmount": 300000,
        "averageAmount": 3000,
        "activeCount": 50,
        "pendingCount": 10,
        "expiredCount": 30,
        "cancelledCount": 10
      }
    ],
    "monthlyTrends": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "count": 50,
        "totalAmount": 250000,
        "activeCount": 35,
        "pendingCount": 5
      },
      {
        "_id": {
          "year": 2023,
          "month": 12
        },
        "count": 45,
        "totalAmount": 225000,
        "activeCount": 30,
        "pendingCount": 5
      }
    ],
    "topVendors": [
      {
        "vendor": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Electronics Store",
          "email": "john@electronics.com",
          "vendorDetails": {
            "shopName": "John's Electronics"
          }
        },
        "totalSubscriptions": 5,
        "totalAmount": 45000,
        "activeSubscriptions": 3,
        "averageAmount": 9000
      }
    ],
    "commissionDistribution": [
      {
        "_id": 10,
        "count": 400,
        "totalAmount": 100000,
        "averageAmount": 250
      },
      {
        "_id": 15,
        "count": 75,
        "totalAmount": 25000,
        "averageAmount": 333.33
      }
    ],
    "growthMetrics": {
      "subscriptionGrowth": 11.11,
      "revenueGrowth": 11.11,
      "activeGrowth": 16.67
    },
    "period": "month",
    "dateFilter": {
      "createdAt": {
        "$gte": "2024-01-01T00:00:00.000Z",
        "$lte": "2024-01-31T23:59:59.999Z"
      }
    }
  }
}
```

---

## 💰 Vendor Commission Management

### Set Vendor Commission Percentage
**POST** `/vendors/:vendorId/commission`

**Request Body:**
```json
{
  "commissionPercentage": 15,
  "notes": "High-performing vendor, increased commission rate"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Commission set to 15% for vendor",
  "data": {
    "vendor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "vendorDetails": {
        "shopName": "John's Electronics"
      }
    },
    "commissionSettings": {
      "commissionPercentage": 15,
      "isCustomCommission": true,
      "notes": "High-performing vendor, increased commission rate",
      "setBy": "507f1f77bcf86cd799439012",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Vendor Commission Settings
**GET** `/vendors/:vendorId/commission`

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "vendorDetails": {
        "shopName": "John's Electronics"
      }
    },
    "commissionSettings": {
      "commissionPercentage": 15,
      "isCustomCommission": true,
      "notes": "High-performing vendor, increased commission rate",
      "setBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Admin User"
      }
    },
    "statistics": {
      "totalCommissions": 25,
      "totalAmount": 12500,
      "averageCommission": 15
    },
    "recentCommissions": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b20",
        "commission": {
          "percentage": 15,
          "amount": 500,
          "currency": "INR"
        },
        "referredVendor": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "New Vendor Store",
          "vendorDetails": {
            "shopName": "New Vendor's Shop"
          }
        },
        "status": "paid",
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### Get All Vendor Commission Settings
**GET** `/vendors/commissions?page=1&limit=10&filter=custom`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `filter` (optional): Filter by type - all, custom, default (default: all)

**Response:**
```json
{
  "success": true,
  "data": {
    "commissionSettings": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b20",
        "vendor": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Electronics Store",
          "email": "john@electronics.com",
          "vendorDetails": {
            "shopName": "John's Electronics"
          }
        },
        "commissionPercentage": 15,
        "isCustomCommission": true,
        "notes": "High-performing vendor",
        "setBy": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Admin User"
        },
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "summary": {
      "totalVendors": 150,
      "customCommissions": 25,
      "defaultCommissions": 125,
      "averageCommission": 10.5
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 150,
    "itemsPerPage": 10
  }
}
```

### Reset Vendor to Default Commission
**POST** `/vendors/:vendorId/commission/reset`

**Response:**
```json
{
  "success": true,
  "message": "Vendor commission reset to default 10%",
  "data": {
    "vendor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "vendorDetails": {
        "shopName": "John's Electronics"
      }
    },
    "commissionSettings": {
      "commissionPercentage": 10,
      "isCustomCommission": false,
      "notes": "Reset to default commission rate",
      "setBy": "507f1f77bcf86cd799439012",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Bulk Set Commission for Multiple Vendors
**POST** `/vendors/commissions/bulk`

**Request Body:**
```json
{
  "vendorIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "commissionPercentage": 12,
  "notes": "Bulk commission update for premium vendors"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Commission set for 3 vendors, 0 failed",
  "data": {
    "totalVendors": 3,
    "successCount": 3,
    "failureCount": 0,
    "results": [
      {
        "vendorId": "507f1f77bcf86cd799439011",
        "success": true,
        "commissionSettings": {
          "commissionPercentage": 12,
          "isCustomCommission": true
        }
      }
    ]
  }
}
```

### Get Commission Statistics
**GET** `/commissions/statistics`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCommissions": 500,
    "pendingCommissions": 25,
    "paidCommissions": 475,
    "totalAmount": 250000,
    "averageCommission": 10.5,
    "commissionDistribution": [
      {
        "_id": 10,
        "count": 400,
        "totalAmount": 200000
      },
      {
        "_id": 15,
        "count": 75,
        "totalAmount": 50000
      }
    ],
    "topReferrers": [
      {
        "vendor": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Electronics Store",
          "vendorDetails": {
            "shopName": "John's Electronics"
          }
        },
        "totalCommissions": 25,
        "totalAmount": 12500,
        "averageCommission": 15
      }
    ],
    "monthlyCommissions": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "count": 50,
        "totalAmount": 25000
      }
    ]
  }
}
```

### Get Comprehensive Revenue Analytics
**GET** `/revenue/analytics?period=month&startDate=2024-01-01&endDate=2024-01-31`

**Query Parameters:**
- `period` (optional): Time period - all, month, quarter, year (default: all)
- `startDate` (optional): Custom start date (YYYY-MM-DD format)
- `endDate` (optional): Custom end date (YYYY-MM-DD format)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSubscriptionRevenue": 150000,
      "totalWalletBalance": 25000,
      "totalCommissionPaid": 15000,
      "netRevenue": 110000,
      "growthPercentage": 12.5
    },
    "subscriptionAnalytics": {
      "totalSubscriptions": 150,
      "averageSubscriptionValue": 1000,
      "byPlan": [
        {
          "_id": "1year",
          "count": 75,
          "totalRevenue": 675000,
          "averageValue": 9000
        },
        {
          "_id": "6months",
          "count": 50,
          "totalRevenue": 250000,
          "averageValue": 5000
        },
        {
          "_id": "3months",
          "count": 25,
          "totalRevenue": 75000,
          "averageValue": 3000
        }
      ]
    },
    "walletAnalytics": {
      "totalVendors": 200,
      "averageWalletBalance": 125,
      "vendorsWithBalance": 50,
      "topVendorsByWallet": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "John Electronics Store",
          "vendorDetails": {
            "shopName": "John's Electronics",
            "wallet": {
              "balance": 5000,
              "transactions": [
                {
                  "type": "credit",
                  "amount": 500,
                  "description": "Referral commission",
                  "date": "2024-01-15T10:00:00.000Z"
                }
              ]
            }
          }
        }
      ]
    },
    "commissionAnalytics": {
      "totalCommissions": 100,
      "averageCommission": 10.5
    },
    "revenueDistribution": {
      "subscriptionRevenue": 150000,
      "walletBalance": 25000,
      "commissionPaid": 15000,
      "netRevenue": 110000,
      "percentages": {
        "subscription": 78.95,
        "wallet": 13.16,
        "commission": 7.89
      }
    },
    "monthlyTrends": [
      {
        "_id": {
          "year": 2024,
          "month": 1
        },
        "subscriptionRevenue": 150000,
        "subscriptionCount": 150
      },
      {
        "_id": {
          "year": 2023,
          "month": 12
        },
        "subscriptionRevenue": 135000,
        "subscriptionCount": 135
      }
    ],
    "period": "month",
    "dateFilter": {
      "createdAt": {
        "$gte": "2024-01-01T00:00:00.000Z",
        "$lte": "2024-01-31T23:59:59.999Z"
      }
    }
  }
}
```

---

## 📞 Support

For technical support or questions:
- Email: admin@elboz.com
- Phone: +91-9876543210
- Priority support available 24/7

---

*Last updated: January 2024*
*Version: 2.3* 