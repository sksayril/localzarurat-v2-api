# Employee APIs Documentation

## Overview
This document covers all APIs available to regular employees, including seller management, profile management, and basic dashboard functionality.

## Authentication
All employee APIs require authentication with employee role. Include the JWT token in the Authorization header:
```
Authorization: Bearer <employee_jwt_token>
```

---

## 🔐 Authentication

### Employee Login
**POST** `/api/employee/login`

Authenticates a regular employee using employee ID and password.

**Request Body:**
```json
{
  "employeeId": "EMP0001",
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
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
      "employeeId": "EMP0001",
      "name": "Jane Smith",
      "email": "jane.smith@company.com",
      "role": "employee",
      "superEmployee": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "employeeId": "SE0001",
        "name": "John Doe",
        "email": "john.doe@company.com"
      },
      "assignedDistricts": [
        {
          "district": "Mumbai",
          "state": "Maharashtra",
          "assignedAt": "2024-01-15T11:00:00.000Z",
          "assignedBy": "64f8a1b2c3d4e5f6a7b8c9d0"
        }
      ],
      "statistics": {
        "totalSellersAssigned": 8,
        "totalCommissionEarned": 0,
        "totalCommissionPaid": 0
      }
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid employee ID or password"
}
```

---

## 📊 Dashboard

### Get Dashboard
**GET** `/api/employee/dashboard`

Retrieves dashboard information for the regular employee.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
      "employeeId": "EMP0001",
      "name": "Jane Smith",
      "role": "employee",
      "assignedDistricts": [
        {
          "district": "Mumbai",
          "state": "Maharashtra",
          "assignedAt": "2024-01-15T11:00:00.000Z"
        }
      ],
      "statistics": {
        "totalSellersAssigned": 8,
        "totalCommissionEarned": 0,
        "totalCommissionPaid": 0
      }
    },
    "dashboard": {
      "assignedSellers": 8,
      "pendingCommissions": 0,
      "totalCommissionEarned": 0,
      "recentSellers": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9de",
          "name": "DEF Store",
          "email": "def@store.com",
          "vendorDetails": {
            "shopName": "DEF Fashion Store"
          },
          "createdAt": "2024-01-15T13:00:00.000Z"
        },
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9df",
          "name": "GHI Mart",
          "email": "ghi@mart.com",
          "vendorDetails": {
            "shopName": "GHI Grocery Mart"
          },
          "createdAt": "2024-01-15T12:30:00.000Z"
        }
      ],
      "recentCommissions": []
    }
  }
}
```

---

## 🏪 Seller Management

### Get Assigned Sellers
**GET** `/api/employee/sellers`

Retrieves all sellers assigned to the regular employee.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`active`, `inactive`, `all`)
- `search` (optional): Search by name, email, or shop name

**Request Example:**
```
GET /api/employee/sellers?page=1&limit=10&status=active&search=fashion
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9de",
      "name": "DEF Store",
      "email": "def@store.com",
      "phone": "9876543214",
      "isActive": true,
      "employeeCode": "EMP0001",
      "assignedEmployee": "64f8a1b2c3d4e5f6a7b8c9d7",
      "vendorDetails": {
        "shopName": "DEF Fashion Store",
        "shopDescription": "Trendy fashion store in Mumbai",
        "mainCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e0",
          "name": "Fashion",
          "icon": "https://example.com/fashion-icon.png"
        },
        "subCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e1",
          "name": "Women's Clothing",
          "image": "https://example.com/womens-clothing-image.png",
          "thumbnail": "https://example.com/womens-clothing-thumb.png"
        },
        "subscription": {
          "currentPlan": "6months",
          "status": "active",
          "amount": 3000,
          "startDate": "2024-01-10T00:00:00.000Z",
          "endDate": "2024-07-10T00:00:00.000Z",
          "isActive": true
        },
        "wallet": {
          "balance": 1200
        },
        "averageRating": 4.2,
        "totalRatings": 18
      },
      "address": {
        "street": "789 Fashion Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400003",
        "country": "India"
      },
      "createdAt": "2024-01-15T13:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 8,
    "itemsPerPage": 10
  }
}
```

### Get Seller Details
**GET** `/api/employee/sellers/:sellerId`

Retrieves detailed information about a specific seller assigned to the employee.

**Request Example:**
```
GET /api/employee/sellers/64f8a1b2c3d4e5f6a7b8c9de
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "seller": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9de",
      "name": "DEF Store",
      "email": "def@store.com",
      "phone": "9876543214",
      "isActive": true,
      "employeeCode": "EMP0001",
      "assignedEmployee": "64f8a1b2c3d4e5f6a7b8c9d7",
      "vendorDetails": {
        "shopName": "DEF Fashion Store",
        "shopDescription": "Trendy fashion store in Mumbai",
        "shopMetaTitle": "DEF Fashion - Best Women's Clothing in Mumbai",
        "shopMetaDescription": "Shop for latest women's fashion at DEF Store",
        "shopImages": [
          "https://example.com/shop3.jpg",
          "https://example.com/shop4.jpg"
        ],
        "isShopListed": true,
        "shopListedAt": "2024-01-15T14:00:00.000Z",
        "gstNumber": "27FGHIJ5678K2L6",
        "vendorAddress": {
          "doorNumber": "789",
          "street": "Fashion Street",
          "location": "Bandra West",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400003",
          "country": "India"
        },
        "mainCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e0",
          "name": "Fashion",
          "icon": "https://example.com/fashion-icon.png"
        },
        "subCategory": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e1",
          "name": "Women's Clothing",
          "image": "https://example.com/womens-clothing-image.png",
          "thumbnail": "https://example.com/womens-clothing-thumb.png"
        },
        "kyc": {
          "panNumber": "FGHIJ5678K",
          "panImage": "https://example.com/pan2.jpg",
          "aadharNumber": "234567890123",
          "aadharFrontImage": "https://example.com/aadhar-front2.jpg",
          "aadharBackImage": "https://example.com/aadhar-back2.jpg",
          "isVerified": true,
          "verificationDate": "2024-01-15T11:30:00.000Z",
          "verifiedBy": "64f8a1b2c3d4e5f6a7b8c9d1"
        },
        "subscription": {
          "currentPlan": "6months",
          "status": "active",
          "amount": 3000,
          "startDate": "2024-01-10T00:00:00.000Z",
          "endDate": "2024-07-10T00:00:00.000Z",
          "isActive": true,
          "razorpaySubscriptionId": "sub_2345678901",
          "razorpayPaymentId": "pay_2345678901",
          "features": {
            "maxProducts": 500,
            "maxImages": 2500,
            "prioritySupport": false,
            "featuredListing": false
          }
        },
        "wallet": {
          "balance": 1200,
          "transactions": [
            {
              "type": "credit",
              "amount": 300,
              "description": "Referral commission",
              "date": "2024-01-12T09:00:00.000Z"
            }
          ]
        },
        "averageRating": 4.2,
        "totalRatings": 18,
        "ratingDistribution": {
          "1": 0,
          "2": 1,
          "3": 3,
          "4": 6,
          "5": 8
        }
      },
      "address": {
        "street": "789 Fashion Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400003",
        "country": "India"
      },
      "createdAt": "2024-01-15T13:00:00.000Z",
      "updatedAt": "2024-01-15T14:00:00.000Z"
    },
    "subscriptions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9e2",
        "plan": "6months",
        "amount": 3000,
        "status": "active",
        "startDate": "2024-01-10T00:00:00.000Z",
        "endDate": "2024-07-10T00:00:00.000Z",
        "createdAt": "2024-01-10T13:30:00.000Z"
      }
    ],
    "commissions": []
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Seller not found or not assigned to you"
}
```

---

## 💰 Commission Management

### Get Commissions
**GET** `/api/employee/commissions`

Retrieves commission history for the regular employee (typically empty as regular employees don't receive commissions).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`pending`, `paid`, `cancelled`, `all`)

**Request Example:**
```
GET /api/employee/commissions?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "commissions": [],
    "summary": {
      "pending": {
        "count": 0,
        "amount": 0
      },
      "paid": {
        "count": 0,
        "amount": 0
      },
      "cancelled": {
        "count": 0,
        "amount": 0
      }
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 0,
    "totalItems": 0,
    "itemsPerPage": 10
  }
}
```

### Get Commission Details
**GET** `/api/employee/commissions/:commissionId`

Retrieves detailed information about a specific commission (typically returns 404 for regular employees).

**Request Example:**
```
GET /api/employee/commissions/64f8a1b2c3d4e5f6a7b8c9e3
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Commission not found"
}
```

---

## 💳 Wallet Management

### Get Wallet Details
**GET** `/api/employee/wallet`

Regular employees don't have wallets, so this endpoint returns an error.

**Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Only super employees have wallets"
}
```

### Get Wallet Transactions
**GET** `/api/employee/wallet/transactions`

Regular employees don't have wallets, so this endpoint returns an error.

**Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Only super employees have wallets"
}
```

---

## 👤 Profile Management

### Get Profile
**GET** `/api/employee/profile`

Retrieves the regular employee's profile information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
    "employeeId": "EMP0001",
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "phone": "9876543211",
    "role": "employee",
    "isActive": true,
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "profileImage": "https://example.com/profile2.jpg",
    "address": {
      "street": "321 Employee Avenue",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400004",
      "country": "India"
    },
    "superEmployee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "email": "john.doe@company.com"
    },
    "assignedDistricts": [
      {
        "district": "Mumbai",
        "state": "Maharashtra",
        "assignedAt": "2024-01-15T11:00:00.000Z",
        "assignedBy": "64f8a1b2c3d4e5f6a7b8c9d0"
      }
    ],
    "statistics": {
      "totalSellersAssigned": 8,
      "totalCommissionEarned": 0,
      "totalCommissionPaid": 0
    },
    "lastLogin": "2024-01-15T16:30:00.000Z",
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T16:30:00.000Z"
  }
}
```

### Update Profile
**PUT** `/api/employee/profile`

Updates the regular employee's profile information.

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "phone": "9876543211",
  "address": {
    "street": "321 Updated Avenue",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400004",
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
    "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
    "employeeId": "EMP0001",
    "name": "Jane Smith Updated",
    "email": "jane.smith@company.com",
    "phone": "9876543211",
    "address": {
      "street": "321 Updated Avenue",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400004",
      "country": "India"
    }
  }
}
```

### Change Password
**PUT** `/api/employee/change-password`

Changes the regular employee's password.

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
  "message": "Only super employees can view assigned employees"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Employee not found"
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
Authorization: Bearer <employee_jwt_token>
```

### Optional Headers
```
Accept: application/json
User-Agent: YourApp/1.0
```

---

## 📝 Notes

1. **Authentication**: All endpoints require valid employee JWT token
2. **Role Restrictions**: Regular employees have limited access compared to super employees
3. **No Commission Access**: Regular employees cannot access commission or wallet features
4. **No Employee Creation**: Regular employees cannot create other employees
5. **Seller Assignment**: Regular employees can only view sellers assigned to them
6. **District Management**: Regular employees can only view their assigned districts
7. **Super Employee Reference**: Regular employees can see their super employee information
8. **Validation**: All input data is validated before processing
9. **Pagination**: List endpoints support pagination with default limits
10. **Filtering**: Most list endpoints support various filtering options
11. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
12. **Commission System**: Regular employees don't participate in the commission system
13. **Wallet System**: Regular employees don't have wallets or financial transactions
14. **Hierarchy**: Regular employees work under super employees and report to them
15. **Permissions**: Regular employees have read-only access to most seller information
