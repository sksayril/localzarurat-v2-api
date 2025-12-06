# Super Employee APIs Documentation

## Overview
This document covers all APIs available to super employees, including employee management, seller oversight, commission tracking, and wallet management. Super employees can create and manage regular employees, track assigned sellers, view commissions, and manage their wallet.

## Authentication
All super employee APIs require authentication with super_employee role. Include the JWT token in the Authorization header:
```
Authorization: Bearer <super_employee_jwt_token>
```

## 🎯 Super Employee Capabilities

### What Super Employees Can Do:
1. **Employee Management**
   - Create and manage regular employees
   - View all employees under their supervision
   - Assign districts to employees

2. **Seller Management**
   - View all sellers assigned to them
   - Track seller performance and statistics
   - Monitor seller subscriptions and activities

3. **Commission System**
   - Earn commissions from seller subscriptions
   - View commission history and details
   - Track pending and paid commissions

4. **Wallet Management**
   - View wallet balance and transactions
   - Track commission earnings
   - Monitor financial performance

5. **District Management**
   - Work within assigned districts
   - Manage sellers in their districts
   - Track district-wise performance

### Super Employee Workflow:
1. **Login** → Use employee ID and password to authenticate
2. **Dashboard** → View overview of assigned sellers and commissions
3. **Create Employees** → Add regular employees to manage sellers
4. **Track Sellers** → Monitor assigned sellers and their performance
5. **View Commissions** → Check earned commissions and wallet balance
6. **Manage Profile** → Update personal information and change password

---

## 🔐 Authentication

### Employee Login
**POST** `/api/employee/login`

Authenticates a super employee using either employee ID + password OR email + password.

**Request Body Options:**

**Option 1: Employee ID + Password**
```json
{
  "employeeId": "SE0001",
  "password": "SecurePassword123!"
}
```

**Option 2: Email + Password**
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePassword123!"
}
```

**Required Fields:**
- `password` (string): The super employee's password
- Either `employeeId` (string) OR `email` (string): Employee identifier

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "role": "super_employee",
      "assignedDistricts": [
        {
          "district": "Mumbai",
          "state": "Maharashtra",
          "assignedAt": "2024-01-15T10:30:00.000Z",
          "assignedBy": "64f8a1b2c3d4e5f6a7b8c9d1"
        },
        {
          "district": "Pune",
          "state": "Maharashtra",
          "assignedAt": "2024-01-15T10:30:00.000Z",
          "assignedBy": "64f8a1b2c3d4e5f6a7b8c9d1"
        }
      ],
      "commissionSettings": {
        "percentage": 15,
        "isActive": true,
        "setBy": "64f8a1b2c3d4e5f6a7b8c9d1",
        "setAt": "2024-01-15T10:30:00.000Z"
      },
      "wallet": {
        "balance": 15000,
        "transactions": []
      },
      "statistics": {
        "totalSellersAssigned": 25,
        "totalCommissionEarned": 15000,
        "totalCommissionPaid": 12000,
        "lastCommissionDate": "2024-01-14T15:30:00.000Z"
      }
    }
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Password:**
```json
{
  "success": false,
  "message": "Password is required"
}
```

**400 Bad Request - Missing Credentials:**
```json
{
  "success": false,
  "message": "Either Employee ID or Email is required"
}
```

**401 Unauthorized - Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**401 Unauthorized - Account Locked:**
```json
{
  "success": false,
  "message": "Account is temporarily locked due to multiple failed login attempts"
}
```

---

## 📋 Available Endpoints Summary

### 🔐 Authentication Endpoints
- **POST** `/api/employee/login` - Employee login with employee ID and password

### 📊 Dashboard & Analytics
- **GET** `/api/employee/dashboard` - Get comprehensive dashboard with statistics

### 👥 Employee Management (Super Employee Only)
- **GET** `/api/employee/employees` - List all employees created by super employee
- **POST** `/api/employee/employees/create` - Create new regular employee
- **GET** `/api/employee/employees/:employeeId` - Get specific employee details
- **GET** `/api/employee/employees/:employeeId/wallet` - Get employee wallet balance
- **GET** `/api/employee/employees/:employeeId/referral-code` - Get employee referral code
- **PUT** `/api/employee/employees/:employeeId/reset-password` - Reset employee password
- **PUT** `/api/employee/employees/:employeeId/status` - Block/unblock employee
- **GET** `/api/employee/employees/:employeeId/activity` - Get employee activity and login history
- **PUT** `/api/employee/employees/:employeeId/commission` - Set commission percentage for employee
- **GET** `/api/employee/employees/:employeeId/commission` - Get employee commission details

### 🏪 Seller Management
- **GET** `/api/employee/sellers` - List all sellers assigned to super employee
- **GET** `/api/employee/sellers/:sellerId` - Get detailed seller information

### 💰 Commission Management (Super Employee Only)
- **GET** `/api/employee/commissions` - List all commissions earned
- **GET** `/api/employee/commissions/:commissionId` - Get detailed commission information

### 💳 Wallet Management (Super Employee Only)
- **GET** `/api/employee/wallet` - Get wallet balance and recent transactions
- **GET** `/api/employee/wallet/transactions` - Get paginated wallet transaction history

### 👤 Profile Management
- **GET** `/api/employee/profile` - Get employee profile information
- **PUT** `/api/employee/profile` - Update employee profile
- **PUT** `/api/employee/change-password` - Change employee password

---

## 📊 Dashboard

### Get Dashboard
**GET** `/api/employee/dashboard`

Retrieves comprehensive dashboard information for the super employee.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "role": "super_employee",
      "assignedDistricts": [
        {
          "district": "Mumbai",
          "state": "Maharashtra",
          "assignedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "commissionSettings": {
        "percentage": 15,
        "isActive": true
      },
      "wallet": {
        "balance": 15000,
        "transactions": []
      },
      "statistics": {
        "totalSellersAssigned": 25,
        "totalCommissionEarned": 15000,
        "totalCommissionPaid": 12000,
        "lastCommissionDate": "2024-01-14T15:30:00.000Z"
      }
    },
    "dashboard": {
      "assignedSellers": 25,
      "pendingCommissions": 3,
      "totalCommissionEarned": 15000,
      "recentSellers": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
          "name": "ABC Store",
          "email": "abc@store.com",
          "vendorDetails": {
            "shopName": "ABC Electronics Store"
          },
          "createdAt": "2024-01-15T14:00:00.000Z"
        },
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
          "name": "XYZ Mart",
          "email": "xyz@mart.com",
          "vendorDetails": {
            "shopName": "XYZ Fashion Mart"
          },
          "createdAt": "2024-01-15T13:30:00.000Z"
        }
      ],
      "recentCommissions": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
          "seller": {
            "name": "ABC Store",
            "vendorDetails": {
              "shopName": "ABC Electronics Store"
            }
          },
          "commission": {
            "amount": 750,
            "percentage": 15
          },
          "status": "pending",
          "createdAt": "2024-01-15T14:30:00.000Z"
        }
      ]
    }
  }
}
```

---

## 👥 Employee Management

### Get Assigned Employees
**GET** `/api/employee/employees`

Retrieves all employees created by the super employee. This endpoint is only available to super employees.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Request Example:**
```
GET /api/employee/employees?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
      "employeeId": "EMP0001",
      "name": "Jane Smith",
      "email": "jane.smith@company.com",
      "phone": "9876543211",
      "role": "employee",
      "isActive": true,
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
      },
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 3,
    "itemsPerPage": 10
  }
}
```

### Create New Employee
**POST** `/api/employee/employees/create`

Creates a new regular employee under the super employee. Only super employees can create regular employees.

**Request Body:**
```json
{
  "name": "Mike Johnson",
  "email": "mike.johnson@company.com",
  "phone": "9876543212",
  "password": "SecurePassword123!",
  "assignedDistricts": [
    {
      "district": "Pune",
      "state": "Maharashtra"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d8",
    "employeeId": "EMP0002",
    "name": "Mike Johnson",
    "email": "mike.johnson@company.com",
    "phone": "9876543212",
    "role": "employee",
    "assignedDistricts": [
      {
        "district": "Pune",
        "state": "Maharashtra",
        "assignedAt": "2024-01-15T16:00:00.000Z"
      }
    ]
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Employee with this email already exists"
}
```

### Get Specific Employee Details
**GET** `/api/employee/employees/:employeeId`

Retrieves detailed information about a specific employee created by the super employee.

**Request Example:**
```
GET /api/employee/employees/EMP0001
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
      "employeeId": "EMP0001",
      "name": "Jane Smith",
      "email": "jane.smith@company.com",
      "phone": "9876543211",
      "role": "employee",
      "isActive": true,
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
      },
      "createdAt": "2024-01-15T11:00:00.000Z"
    },
    "statistics": {
      "assignedSellers": 8,
      "totalSellers": 10
    }
  }
}
```

### Get Employee Wallet Balance
**GET** `/api/employee/employees/:employeeId/wallet`

Retrieves wallet balance and statistics for a specific employee.

**Request Example:**
```
GET /api/employee/employees/EMP0001/wallet
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employeeId": "EMP0001",
    "wallet": {
      "balance": 0,
      "transactions": []
    },
    "statistics": {
      "totalSellersAssigned": 8,
      "totalCommissionEarned": 0,
      "totalCommissionPaid": 0
    }
  }
}
```

### Get Employee Referral Code
**GET** `/api/employee/employees/:employeeId/referral-code`

Retrieves the referral code (employee ID) for a specific employee.

**Request Example:**
```
GET /api/employee/employees/EMP0001/referral-code
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employeeId": "EMP0001",
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "referralCode": "EMP0001"
  }
}
```

### Reset Employee Password
**PUT** `/api/employee/employees/:employeeId/reset-password`

Resets the password for a specific employee.

**Request Body:**
```json
{
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee password reset successfully",
  "data": {
    "employeeId": "EMP0001",
    "name": "Jane Smith",
    "email": "jane.smith@company.com"
  }
}
```

### Block/Unblock Employee
**PUT** `/api/employee/employees/:employeeId/status`

Blocks or unblocks a specific employee.

**Request Body:**
```json
{
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee blocked successfully",
  "data": {
    "employeeId": "EMP0001",
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "isActive": false
  }
}
```

### Get Employee Activity
**GET** `/api/employee/employees/:employeeId/activity`

Retrieves login history and activity information for a specific employee.

**Request Example:**
```
GET /api/employee/employees/EMP0001/activity
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "employeeId": "EMP0001",
      "lastLogin": "2024-01-15T16:00:00.000Z",
      "loginAttempts": 0,
      "isActive": true,
      "createdAt": "2024-01-15T11:00:00.000Z"
    },
    "recentActivity": {
      "recentSellers": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9de",
          "name": "DEF Store",
          "email": "def@store.com",
          "vendorDetails": {
            "shopName": "DEF Fashion Store"
          },
          "createdAt": "2024-01-15T13:00:00.000Z"
        }
      ],
      "totalSellers": 8
    }
  }
}
```

### Set Employee Commission Percentage
**PUT** `/api/employee/employees/:employeeId/commission`

Sets the commission percentage for a regular employee. When sellers assigned to this employee subscribe, the super employee will earn this percentage as commission.

**Request Body:**
```json
{
  "commissionPercentage": 10
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Commission percentage set to 10% for employee",
  "data": {
    "employeeId": "EMP0001",
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "commissionPercentage": 10
  }
}
```

### Get Employee Commission Details
**GET** `/api/employee/employees/:employeeId/commission`

Retrieves commission details and statistics for a specific employee.

**Request Example:**
```
GET /api/employee/employees/EMP0001/commission
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "employeeId": "EMP0001",
      "name": "Jane Smith",
      "email": "jane.smith@company.com",
      "commissionPercentage": 10
    },
    "commissionStats": {
      "totalCommissionsEarned": 2500,
      "totalCommissionsCount": 5,
      "averageCommission": 500,
      "assignedSellers": 8
    }
  }
}
```

---

## 💰 Commission Distribution System

### How the Commission System Works

1. **Vendor Registration with Employee Code**
   - Vendor provides employee code during registration
   - System links vendor to the specific employee
   - Employee can be either super employee or regular employee

2. **Commission Flow for Regular Employees**
   - When a vendor (assigned to regular employee) subscribes
   - Commission is calculated using the regular employee's commission percentage
   - Commission goes to the **super employee's wallet**
   - Regular employee gets credit for bringing the seller

3. **Commission Flow for Super Employees**
   - When a vendor (assigned to super employee) subscribes
   - Commission is calculated using super employee's commission percentage
   - Commission goes to the **super employee's wallet**

4. **Commission Calculation**
   - Commission = Subscription Amount × Commission Percentage
   - Example: ₹5000 subscription × 10% = ₹500 commission

### Commission Management Features

- **Set Commission Percentage**: Super employees can set commission percentage for their regular employees
- **Track Commission Earnings**: View total commissions earned from each employee
- **Monitor Performance**: Track which employees are bringing in the most sellers
- **Commission Statistics**: View detailed commission statistics per employee

---

## 📈 Employee Tracking & Management

### Employee Performance Tracking
Super employees can track the performance of their regular employees through:

1. **Employee Statistics**
   - Total sellers assigned to each employee
   - Commission earned by each employee
   - Employee activity and performance metrics

2. **Employee Management**
   - View all employees created by the super employee
   - Monitor employee activity and performance
   - Track employee-seller relationships

3. **District-wise Tracking**
   - Monitor which employees are working in which districts
   - Track district-wise performance
   - Manage district assignments

### Employee Creation Process
1. **Create Employee** → Super employee creates a new regular employee
2. **Assign Districts** → Assign specific districts to the employee
3. **Employee Login** → Employee can login with their employee ID
4. **Track Performance** → Super employee monitors employee performance
5. **Manage Sellers** → Employee manages assigned sellers

---

## 🏪 Seller Management

### Get Assigned Sellers
**GET** `/api/employee/sellers`

Retrieves all sellers assigned to the super employee. This includes sellers who registered with the super employee's employee code.

### Seller Assignment System
1. **Seller Registration**
   - Sellers provide an employee code during registration
   - Employee code links seller to specific super employee
   - Super employee automatically gets assigned to the seller

2. **Seller Tracking**
   - View all sellers assigned to the super employee
   - Monitor seller subscription status
   - Track seller performance and activity
   - View seller details and statistics

3. **Commission Generation**
   - When assigned sellers activate subscriptions
   - Commissions are automatically generated for the super employee
   - Commission percentage is set by admin

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`active`, `inactive`, `all`)
- `search` (optional): Search by name, email, or shop name

**Request Example:**
```
GET /api/employee/sellers?page=1&limit=10&status=active&search=electronics
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "ABC Store",
      "email": "abc@store.com",
      "phone": "9876543213",
      "isActive": true,
      "employeeCode": "SE0001",
      "assignedEmployee": "64f8a1b2c3d4e5f6a7b8c9d0",
      "vendorDetails": {
        "shopName": "ABC Electronics Store",
        "shopDescription": "Leading electronics retailer",
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
      },
      "address": {
        "street": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "country": "India"
      },
      "createdAt": "2024-01-15T14:00:00.000Z"
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

### Get Seller Details
**GET** `/api/employee/sellers/:sellerId`

Retrieves detailed information about a specific seller.

**Request Example:**
```
GET /api/employee/sellers/64f8a1b2c3d4e5f6a7b8c9d4
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "seller": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "ABC Store",
      "email": "abc@store.com",
      "phone": "9876543213",
      "isActive": true,
      "employeeCode": "SE0001",
      "assignedEmployee": "64f8a1b2c3d4e5f6a7b8c9d0",
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
    },
    "subscriptions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9db",
        "plan": "1year",
        "amount": 5000,
        "status": "active",
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": "2025-01-15T00:00:00.000Z",
        "createdAt": "2024-01-15T14:30:00.000Z"
      }
    ],
    "commissions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9dc",
        "commission": {
          "percentage": 15,
          "amount": 750,
          "subscriptionAmount": 5000
        },
        "status": "pending",
        "createdAt": "2024-01-15T14:30:00.000Z"
      }
    ]
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

### How the Commission System Works

1. **Commission Earning Process**
   - When a seller (assigned to a super employee) activates a subscription
   - A commission is automatically calculated based on the super employee's commission percentage
   - The commission is added to the super employee's wallet
   - Commission status starts as "pending" until admin approval

2. **Commission Calculation**
   - Commission = Subscription Amount × Commission Percentage
   - Example: ₹5000 subscription × 15% = ₹750 commission

3. **Commission Status Flow**
   - **Pending** → Commission earned but not yet approved by admin
   - **Paid** → Commission approved and added to wallet
   - **Cancelled** → Commission rejected by admin

4. **Wallet Management**
   - All commissions are automatically added to the super employee's wallet
   - Wallet balance shows total available funds
   - Transaction history tracks all commission credits

### Commission Tracking Features
- View all commissions (pending, paid, cancelled)
- Filter commissions by status
- View detailed commission information
- Track commission history and trends
- Monitor wallet balance and transactions

---

### Get Commissions
**GET** `/api/employee/commissions`

Retrieves commission history for the super employee.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`pending`, `paid`, `cancelled`, `all`)

**Request Example:**
```
GET /api/employee/commissions?page=1&limit=10&status=pending
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "commissions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9dc",
        "seller": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
          "name": "ABC Store",
          "email": "abc@store.com",
          "vendorDetails": {
            "shopName": "ABC Electronics Store"
          }
        },
        "subscription": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9db",
          "plan": "1year",
          "amount": 5000,
          "status": "active"
        },
        "commission": {
          "percentage": 15,
          "amount": 750,
          "subscriptionAmount": 5000
        },
        "status": "pending",
        "district": {
          "name": "Mumbai",
          "state": "Maharashtra"
        },
        "period": {
          "startDate": "2024-01-15T00:00:00.000Z",
          "endDate": "2025-01-15T00:00:00.000Z"
        },
        "createdAt": "2024-01-15T14:30:00.000Z"
      }
    ],
    "summary": {
      "pending": {
        "count": 3,
        "amount": 2250
      },
      "paid": {
        "count": 12,
        "amount": 15000
      },
      "cancelled": {
        "count": 1,
        "amount": 500
      }
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 16,
    "itemsPerPage": 10
  }
}
```

### Get Commission Details
**GET** `/api/employee/commissions/:commissionId`

Retrieves detailed information about a specific commission.

**Request Example:**
```
GET /api/employee/commissions/64f8a1b2c3d4e5f6a7b8c9dc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9dc",
    "employee": "64f8a1b2c3d4e5f6a7b8c9d0",
    "seller": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "ABC Store",
      "email": "abc@store.com",
      "vendorDetails": {
        "shopName": "ABC Electronics Store"
      }
    },
    "subscription": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9db",
      "plan": "1year",
      "amount": 5000,
      "status": "active"
    },
    "commission": {
      "percentage": 15,
      "amount": 750,
      "subscriptionAmount": 5000
    },
    "status": "pending",
    "payment": {
      "paidAt": null,
      "transactionId": null,
      "paymentMethod": "wallet"
    },
    "admin": {
      "approvedBy": null,
      "approvedAt": null,
      "notes": null
    },
    "district": {
      "name": "Mumbai",
      "state": "Maharashtra"
    },
    "period": {
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2025-01-15T00:00:00.000Z"
    },
    "createdAt": "2024-01-15T14:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

---

## 💳 Wallet Management

### Get Wallet Details
**GET** `/api/employee/wallet`

Retrieves wallet balance and recent transactions.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "balance": 15000,
    "transactions": [
      {
        "type": "credit",
        "amount": 750,
        "description": "Commission for seller: ABC Store (ABC Electronics Store)",
        "reference": "64f8a1b2c3d4e5f6a7b8c9dc",
        "date": "2024-01-15T15:00:00.000Z"
      },
      {
        "type": "credit",
        "amount": 500,
        "description": "Commission for seller: XYZ Mart (XYZ Fashion Mart)",
        "reference": "64f8a1b2c3d4e5f6a7b8c9dd",
        "date": "2024-01-14T16:30:00.000Z"
      },
      {
        "type": "debit",
        "amount": 2000,
        "description": "Withdrawal to bank account",
        "date": "2024-01-13T10:00:00.000Z"
      }
    ],
    "statistics": {
      "totalSellersAssigned": 25,
      "totalCommissionEarned": 15000,
      "totalCommissionPaid": 12000,
      "lastCommissionDate": "2024-01-15T15:00:00.000Z"
    }
  }
}
```

### Get Wallet Transactions
**GET** `/api/employee/wallet/transactions`

Retrieves paginated wallet transaction history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by type (`credit`, `debit`, `all`)

**Request Example:**
```
GET /api/employee/wallet/transactions?page=1&limit=20&type=credit
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "type": "credit",
      "amount": 750,
      "description": "Commission for seller: ABC Store (ABC Electronics Store)",
      "reference": "64f8a1b2c3d4e5f6a7b8c9dc",
      "date": "2024-01-15T15:00:00.000Z"
    },
    {
      "type": "credit",
      "amount": 500,
      "description": "Commission for seller: XYZ Mart (XYZ Fashion Mart)",
      "reference": "64f8a1b2c3d4e5f6a7b8c9dd",
      "date": "2024-01-14T16:30:00.000Z"
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

## 👤 Profile Management

### Get Profile
**GET** `/api/employee/profile`

Retrieves the super employee's profile information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "employeeId": "SE0001",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "9876543210",
    "role": "super_employee",
    "isActive": true,
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "profileImage": "https://example.com/profile.jpg",
    "address": {
      "street": "456 Employee Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400002",
      "country": "India"
    },
    "assignedDistricts": [
      {
        "district": "Mumbai",
        "state": "Maharashtra",
        "assignedAt": "2024-01-15T10:30:00.000Z",
        "assignedBy": "64f8a1b2c3d4e5f6a7b8c9d1"
      }
    ],
    "commissionSettings": {
      "percentage": 15,
      "isActive": true,
      "setBy": "64f8a1b2c3d4e5f6a7b8c9d1",
      "setAt": "2024-01-15T10:30:00.000Z"
    },
    "wallet": {
      "balance": 15000,
      "transactions": []
    },
    "statistics": {
      "totalSellersAssigned": 25,
      "totalCommissionEarned": 15000,
      "totalCommissionPaid": 12000,
      "lastCommissionDate": "2024-01-14T15:30:00.000Z"
    },
    "lastLogin": "2024-01-15T16:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

### Update Profile
**PUT** `/api/employee/profile`

Updates the super employee's profile information.

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone": "9876543210",
  "address": {
    "street": "456 Updated Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400002",
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
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "employeeId": "SE0001",
    "name": "John Doe Updated",
    "email": "john.doe@company.com",
    "phone": "9876543210",
    "address": {
      "street": "456 Updated Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400002",
      "country": "India"
    }
  }
}
```

### Change Password
**PUT** `/api/employee/change-password`

Changes the super employee's password.

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
Authorization: Bearer <super_employee_jwt_token>
```

### Optional Headers
```
Accept: application/json
User-Agent: YourApp/1.0
```

---

## 📝 Notes

1. **Authentication**: All endpoints require valid super employee JWT token
2. **Role Restrictions**: Some endpoints are only available to super employees
3. **Employee Creation**: Super employees can only create regular employees, not other super employees
4. **Commission Access**: Only super employees have access to commission and wallet features
5. **Seller Assignment**: Super employees can only view sellers assigned to them
6. **District Management**: Super employees can only view their assigned districts
7. **Validation**: All input data is validated before processing
8. **Pagination**: List endpoints support pagination with default limits
9. **Filtering**: Most list endpoints support various filtering options
10. **Timestamps**: All timestamps are in ISO 8601 format (UTC)

## 🚀 API Usage Examples

### Complete Super Employee Workflow

#### 1. Login as Super Employee

**Option A: Using Employee ID**
```bash
curl -X POST http://localhost:3000/api/employee/login \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "SE0001",
    "password": "SecurePassword123!"
  }'
```

**Option B: Using Email**
```bash
curl -X POST http://localhost:3000/api/employee/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "SecurePassword123!"
  }'
```

#### 2. Get Dashboard Overview
```bash
curl -X GET http://localhost:3000/api/employee/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Create a New Employee
```bash
curl -X POST http://localhost:3000/api/employee/employees/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "phone": "9876543211",
    "password": "SecurePassword123!",
    "assignedDistricts": [
      {
        "district": "Mumbai",
        "state": "Maharashtra"
      }
    ]
  }'
```

#### 4. Get Specific Employee Details
```bash
curl -X GET http://localhost:3000/api/employee/employees/EMP0001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Get Employee Wallet Balance
```bash
curl -X GET http://localhost:3000/api/employee/employees/EMP0001/wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 6. Get Employee Referral Code
```bash
curl -X GET http://localhost:3000/api/employee/employees/EMP0001/referral-code \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 7. Reset Employee Password
```bash
curl -X PUT http://localhost:3000/api/employee/employees/EMP0001/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "newPassword": "NewSecurePassword123!"
  }'
```

#### 8. Block/Unblock Employee
```bash
curl -X PUT http://localhost:3000/api/employee/employees/EMP0001/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "isActive": false
  }'
```

#### 9. Get Employee Activity
```bash
curl -X GET http://localhost:3000/api/employee/employees/EMP0001/activity \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 10. Set Employee Commission Percentage
```bash
curl -X PUT http://localhost:3000/api/employee/employees/EMP0001/commission \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "commissionPercentage": 10
  }'
```

#### 11. Get Employee Commission Details
```bash
curl -X GET http://localhost:3000/api/employee/employees/EMP0001/commission \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 12. View Assigned Sellers
```bash
curl -X GET "http://localhost:3000/api/employee/sellers?page=1&limit=10&status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 13. Check Commissions
```bash
curl -X GET "http://localhost:3000/api/employee/commissions?status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 14. View Wallet Balance
```bash
curl -X GET http://localhost:3000/api/employee/wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Best Practices

### 1. **Authentication**
- Always include the JWT token in the Authorization header
- Handle token expiration gracefully
- Implement proper error handling for authentication failures

### 2. **Data Management**
- Use pagination for large datasets
- Implement proper filtering and search functionality
- Cache frequently accessed data when appropriate

### 3. **Error Handling**
- Check for success status in API responses
- Handle different error codes appropriately
- Provide meaningful error messages to users

### 4. **Performance**
- Use appropriate page sizes for pagination
- Implement loading states for API calls
- Cache dashboard data for better user experience

### 5. **Security**
- Never expose sensitive data in client-side code
- Validate all input data
- Use HTTPS in production environments

## 📊 Monitoring & Analytics

### Key Metrics to Track
1. **Employee Performance**
   - Number of employees created
   - Employee activity levels
   - Employee-seller relationships

2. **Seller Management**
   - Total sellers assigned
   - Active vs inactive sellers
   - Seller subscription rates

3. **Commission Performance**
   - Total commissions earned
   - Commission approval rates
   - Wallet balance trends

4. **District Performance**
   - Sellers per district
   - Commission per district
   - District-wise growth

### Dashboard KPIs
- Total assigned sellers
- Pending commissions count
- Total commission earned
- Recent seller registrations
- Employee performance metrics
