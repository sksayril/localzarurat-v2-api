# Admin APIs Documentation

## Overview
This document covers all admin-specific APIs for managing the employee system, including super employee creation, district management, and commission oversight.

## Authentication
All admin APIs require authentication with admin role. Include the JWT token in the Authorization header:
```
Authorization: Bearer <admin_jwt_token>
```

---

## 🏢 Super Employee Management

### Create Super Employee
**POST** `/api/admin/employees/super-employee/create`

Creates a new super employee with district assignments and commission settings.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "phone": "9876543210",
  "password": "SecurePassword123!",
  "assignedDistricts": [
    {
      "district": "Mumbai",
      "state": "Maharashtra"
    },
    {
      "district": "Pune",
      "state": "Maharashtra"
    }
  ],
  "commissionPercentage": 15
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Super employee created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "employeeId": "SE0001",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "phone": "9876543210",
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
    }
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

### Get All Employees
**GET** `/api/admin/employees`

Retrieves all employees with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role (`super_employee`, `employee`, `all`)
- `status` (optional): Filter by status (`active`, `inactive`, `all`)

**Request Example:**
```
GET /api/admin/employees?page=1&limit=10&role=super_employee&status=active
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "phone": "9876543210",
      "role": "super_employee",
      "isActive": true,
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
      "statistics": {
        "totalSellersAssigned": 25,
        "totalCommissionEarned": 15000,
        "totalCommissionPaid": 12000
      },
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

### Get Employee Details
**GET** `/api/admin/employees/:employeeId`

Retrieves detailed information about a specific employee.

**Request Example:**
```
GET /api/admin/employees/64f8a1b2c3d4e5f6a7b8c9d0
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "email": "john.doe@company.com",
      "phone": "9876543210",
      "role": "super_employee",
      "isActive": true,
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
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "statistics": {
      "assignedSellers": 25,
      "commissionStats": [
        {
          "_id": "pending",
          "count": 3,
          "totalAmount": 4500
        },
        {
          "_id": "paid",
          "count": 12,
          "totalAmount": 15000
        }
      ]
    }
  }
}
```

### Update Employee Status
**POST** `/api/admin/employees/:employeeId/status`

Activates or deactivates an employee.

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
  "message": "Employee deactivated successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "employeeId": "SE0001",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "isActive": false,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Assign Districts to Employee
**POST** `/api/admin/employees/:employeeId/districts`

Assigns new districts to an employee.

**Request Body:**
```json
{
  "districts": [
    {
      "district": "Delhi",
      "state": "Delhi"
    },
    {
      "district": "Gurgaon",
      "state": "Haryana"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Districts assigned successfully",
  "data": {
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "assignedDistricts": [
        {
          "district": "Mumbai",
          "state": "Maharashtra",
          "assignedAt": "2024-01-15T10:30:00.000Z"
        },
        {
          "district": "Delhi",
          "state": "Delhi",
          "assignedAt": "2024-01-15T11:00:00.000Z"
        },
        {
          "district": "Gurgaon",
          "state": "Haryana",
          "assignedAt": "2024-01-15T11:00:00.000Z"
        }
      ]
    }
  }
}
```

### Remove Districts from Employee
**DELETE** `/api/admin/employees/:employeeId/districts`

Removes specific districts from an employee.

**Request Body:**
```json
{
  "districtIds": [0, 2]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Districts removed successfully",
  "data": {
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "assignedDistricts": [
        {
          "district": "Pune",
          "state": "Maharashtra",
          "assignedAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  }
}
```

### Set Commission Percentage
**POST** `/api/admin/employees/:employeeId/commission`

Sets commission percentage for a super employee.

**Request Body:**
```json
{
  "commissionPercentage": 20
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Commission set to 20% for super employee",
  "data": {
    "employee": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "employeeId": "SE0001",
      "name": "John Doe",
      "commissionSettings": {
        "percentage": 20,
        "isActive": true,
        "setBy": "64f8a1b2c3d4e5f6a7b8c9d1",
        "setAt": "2024-01-15T11:30:00.000Z"
      }
    }
  }
}
```

---

## 🗺️ District Management

### Create District
**POST** `/api/admin/districts/create`

Creates a new district.

**Request Body:**
```json
{
  "name": "Bangalore",
  "state": "Karnataka",
  "coordinates": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "District created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "BANGALORE",
    "state": "KARNATAKA",
    "code": "KABAN01",
    "coordinates": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "statistics": {
      "totalSellers": 0,
      "totalSuperEmployees": 0,
      "totalEmployees": 0,
      "totalRevenue": 0,
      "lastUpdated": "2024-01-15T12:00:00.000Z"
    },
    "isActive": true,
    "createdBy": "64f8a1b2c3d4e5f6a7b8c9d1",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Get All Districts
**GET** `/api/admin/districts`

Retrieves all districts with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `state` (optional): Filter by state
- `search` (optional): Search by name, state, or code

**Request Example:**
```
GET /api/admin/districts?page=1&limit=10&state=Maharashtra&search=Mumbai
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "MUMBAI",
      "state": "MAHARASHTRA",
      "code": "MAMUM01",
      "coordinates": {
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "statistics": {
        "totalSellers": 45,
        "totalSuperEmployees": 3,
        "totalEmployees": 8,
        "totalRevenue": 125000,
        "lastUpdated": "2024-01-15T12:00:00.000Z"
      },
      "isActive": true,
      "createdBy": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Admin User",
        "email": "admin@company.com"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 15,
    "itemsPerPage": 10
  }
}
```

---

## 💰 Employee Commission Management

### Get All Employee Commissions
**GET** `/api/admin/employee-commissions`

Retrieves all employee commissions with filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`pending`, `paid`, `cancelled`, `all`)
- `employeeId` (optional): Filter by specific employee

**Request Example:**
```
GET /api/admin/employee-commissions?page=1&limit=10&status=pending&employeeId=64f8a1b2c3d4e5f6a7b8c9d0
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "commissions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "employee": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "employeeId": "SE0001",
          "name": "John Doe",
          "email": "john.doe@company.com",
          "role": "super_employee"
        },
        "seller": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
          "name": "ABC Store",
          "email": "abc@store.com",
          "vendorDetails": {
            "shopName": "ABC Electronics Store"
          }
        },
        "subscription": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
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
        "count": 5,
        "amount": 3750
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
    "totalItems": 18,
    "itemsPerPage": 10
  }
}
```

### Approve Employee Commission
**POST** `/api/admin/employee-commissions/:commissionId/approve`

Approves and pays an employee commission.

**Request Body:**
```json
{
  "adminNotes": "Commission approved for successful seller onboarding and subscription"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee commission approved and paid successfully",
  "data": {
    "commission": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "status": "paid",
      "amount": 750,
      "paidAt": "2024-01-15T15:00:00.000Z",
      "transactionId": "TXN_1705327200000_64f8a1b2c3d4e5f6a7b8c9d3"
    },
    "employee": {
      "name": "John Doe",
      "newWalletBalance": 15750
    },
    "seller": {
      "name": "ABC Store",
      "shopName": "ABC Electronics Store"
    }
  }
}
```

### Reject Employee Commission
**POST** `/api/admin/employee-commissions/:commissionId/reject`

Rejects an employee commission.

**Request Body:**
```json
{
  "adminNotes": "Commission rejected due to invalid subscription or seller issues"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee commission rejected successfully",
  "data": {
    "commission": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "status": "cancelled",
      "amount": 750,
      "rejectedAt": "2024-01-15T15:30:00.000Z"
    },
    "seller": {
      "name": "ABC Store",
      "shopName": "ABC Electronics Store"
    }
  }
}
```

---

## 📊 Dashboard & Analytics

### Get Admin Dashboard
**GET** `/api/admin/dashboard`

Retrieves comprehensive dashboard statistics.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalVendors": 150,
      "activeVendors": 120,
      "totalCustomers": 500,
      "totalProducts": 2500,
      "totalCategories": 15,
      "totalSubCategories": 45,
      "activeSubscriptions": 120,
      "monthlyRevenue": 600000,
      "pendingCommissions": 8,
      "totalCommissions": 45,
      "totalCommissionAmount": 67500
    },
    "recentVendors": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "name": "ABC Store",
        "email": "abc@store.com",
        "vendorDetails": {
          "shopName": "ABC Electronics Store"
        },
        "createdAt": "2024-01-15T14:00:00.000Z"
      }
    ],
    "recentCommissions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "referrer": {
          "name": "John Doe",
          "vendorDetails": {
            "shopName": "John's Electronics"
          }
        },
        "referredVendor": {
          "name": "ABC Store",
          "vendorDetails": {
            "shopName": "ABC Electronics Store"
          }
        },
        "commission": {
          "amount": 750
        },
        "status": "pending",
        "createdAt": "2024-01-15T14:30:00.000Z"
      }
    ]
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
Authorization: Bearer <jwt_token>
```

### Optional Headers
```
Accept: application/json
User-Agent: YourApp/1.0
```

---

## 📝 Notes

1. **Authentication**: All endpoints require valid admin JWT token
2. **Validation**: All input data is validated before processing
3. **Pagination**: List endpoints support pagination with default limits
4. **Filtering**: Most list endpoints support various filtering options
5. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
6. **IDs**: All MongoDB ObjectIds are represented as 24-character hex strings
7. **Commission**: Commission amounts are calculated automatically based on subscription amounts
8. **Districts**: District names and states are automatically converted to uppercase
9. **Employee IDs**: Auto-generated in format SE0001, EMP0001, etc.
10. **Security**: Passwords are hashed using bcrypt with salt rounds
