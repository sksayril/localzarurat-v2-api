# Employee Management System Documentation

## Overview

The Employee Management System provides a comprehensive solution for managing super employees, regular employees, district assignments, and commission distribution for seller subscriptions. This system allows admins to create and manage employees, assign them to districts, and automatically distribute commissions when sellers subscribe.

## System Architecture

### Roles and Hierarchy

1. **Admin** - Full system access, can create and manage all employees
2. **Super Employee** - Can create regular employees, manage assigned districts, receives commissions
3. **Employee** - Regular employee, can view assigned sellers, no commission rights

### Key Features

- **Employee Creation**: Admins can create super employees with district assignments
- **District Management**: Create and assign districts to employees
- **Commission System**: Automatic commission calculation and distribution
- **Wallet System**: Super employees have wallets for commission tracking
- **Seller Assignment**: Sellers can be assigned to employees during registration
- **Multi-level Hierarchy**: Super employees can create and manage regular employees

## Database Models

### Employee Model (`models/employee.model.js`)

```javascript
{
  employeeId: String,           // Auto-generated (SE0001, EMP0001)
  name: String,
  email: String,
  phone: String,
  password: String,
  role: String,                 // 'super_employee' | 'employee'
  superEmployee: ObjectId,      // Reference to super employee (for regular employees)
  assignedDistricts: [{
    district: String,
    state: String,
    assignedAt: Date,
    assignedBy: ObjectId
  }],
  commissionSettings: {
    percentage: Number,
    isActive: Boolean,
    setBy: ObjectId,
    setAt: Date
  },
  wallet: {
    balance: Number,
    transactions: [{
      type: String,             // 'credit' | 'debit'
      amount: Number,
      description: String,
      reference: String,
      date: Date
    }]
  },
  statistics: {
    totalSellersAssigned: Number,
    totalCommissionEarned: Number,
    totalCommissionPaid: Number,
    lastCommissionDate: Date
  }
}
```

### EmployeeCommission Model (`models/employeeCommission.model.js`)

```javascript
{
  employee: ObjectId,           // Reference to Employee
  seller: ObjectId,             // Reference to User (vendor)
  subscription: ObjectId,       // Reference to Subscription
  commission: {
    percentage: Number,
    amount: Number,
    subscriptionAmount: Number
  },
  status: String,               // 'pending' | 'paid' | 'cancelled'
  payment: {
    paidAt: Date,
    transactionId: String,
    paymentMethod: String
  },
  admin: {
    approvedBy: ObjectId,
    approvedAt: Date,
    notes: String
  },
  district: {
    name: String,
    state: String
  },
  period: {
    startDate: Date,
    endDate: Date
  }
}
```

### District Model (`models/district.model.js`)

```javascript
{
  name: String,
  state: String,
  code: String,                 // Auto-generated (e.g., "MUMBOM001")
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  statistics: {
    totalSellers: Number,
    totalSuperEmployees: Number,
    totalEmployees: Number,
    totalRevenue: Number,
    lastUpdated: Date
  },
  isActive: Boolean,
  createdBy: ObjectId
}
```

## API Endpoints

### Employee Authentication

#### POST `/api/employee/login`
Login for employees using employee ID and password.

**Request Body:**
```json
{
  "employeeId": "SE0001",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token",
    "employee": {
      "_id": "employee_id",
      "employeeId": "SE0001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "super_employee",
      "assignedDistricts": [...],
      "commissionSettings": {...},
      "wallet": {...},
      "statistics": {...}
    }
  }
}
```

### Employee Dashboard

#### GET `/api/employee/dashboard`
Get employee dashboard with statistics and recent activities.

**Response:**
```json
{
  "success": true,
  "data": {
    "employee": {...},
    "dashboard": {
      "assignedSellers": 25,
      "pendingCommissions": 5,
      "totalCommissionEarned": 15000,
      "recentSellers": [...],
      "recentCommissions": [...]
    }
  }
}
```

### Seller Management

#### GET `/api/employee/sellers`
Get list of assigned sellers with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (active/inactive)
- `search`: Search by name, email, or shop name

#### GET `/api/employee/sellers/:sellerId`
Get detailed information about a specific seller.

### Commission Management

#### GET `/api/employee/commissions`
Get employee's commission history with filtering.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `status`: Filter by status (pending/paid/cancelled)

#### GET `/api/employee/commissions/:commissionId`
Get detailed commission information.

### Wallet Management (Super Employees Only)

#### GET `/api/employee/wallet`
Get wallet balance and recent transactions.

#### GET `/api/employee/wallet/transactions`
Get paginated wallet transaction history.

### Super Employee Management

#### GET `/api/employee/employees`
Get list of employees created by super employee.

#### POST `/api/employee/employees/create`
Create new regular employee (super employees only).

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "9876543210",
  "password": "password123",
  "assignedDistricts": [
    {
      "district": "Mumbai",
      "state": "Maharashtra"
    }
  ]
}
```

## Admin API Endpoints

### Employee Management

#### POST `/api/admin/employees/super-employee/create`
Create new super employee.

**Request Body:**
```json
{
  "name": "Super Employee Name",
  "email": "super@example.com",
  "phone": "9876543210",
  "password": "password123",
  "assignedDistricts": [
    {
      "district": "Mumbai",
      "state": "Maharashtra"
    }
  ],
  "commissionPercentage": 10
}
```

#### GET `/api/admin/employees`
Get all employees with filtering and pagination.

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `role`: Filter by role (super_employee/employee)
- `status`: Filter by status (active/inactive)

#### GET `/api/admin/employees/:employeeId`
Get detailed employee information with statistics.

#### POST `/api/admin/employees/:employeeId/status`
Update employee status (activate/deactivate).

#### POST `/api/admin/employees/:employeeId/districts`
Assign districts to employee.

#### DELETE `/api/admin/employees/:employeeId/districts`
Remove districts from employee.

#### POST `/api/admin/employees/:employeeId/commission`
Set commission percentage for super employee.

### District Management

#### POST `/api/admin/districts/create`
Create new district.

**Request Body:**
```json
{
  "name": "Mumbai",
  "state": "Maharashtra",
  "coordinates": {
    "latitude": 19.0760,
    "longitude": 72.8777
  }
}
```

#### GET `/api/admin/districts`
Get all districts with filtering and pagination.

### Commission Management

#### GET `/api/admin/employee-commissions`
Get all employee commissions with filtering.

#### POST `/api/admin/employee-commissions/:commissionId/approve`
Approve and pay employee commission.

#### POST `/api/admin/employee-commissions/:commissionId/reject`
Reject employee commission.

## Seller Registration with Employee Code

### Updated Vendor Signup

The vendor signup process now includes employee code validation:

#### POST `/api/auth/vendor-signup`

**Request Body:**
```json
{
  "name": "Seller Name",
  "email": "seller@example.com",
  "password": "password123",
  "phone": "9876543210",
  "gstNumber": "GST123456789",
  "mainCategory": "category_id",
  "subCategory": "subcategory_id",
  "referralCode": "REF123456",      // Optional
  "employeeCode": "SE0001",         // New: Employee code
  "vendorAddress": {...},
  "securityQuestions": {...}
}
```

**Employee Code Validation:**
- Employee code is validated against active employees
- Seller is automatically assigned to the employee
- Employee statistics are updated

## Commission Flow

### Automatic Commission Creation

1. **Seller Registration**: Seller provides employee code during signup
2. **Subscription Purchase**: Seller purchases subscription
3. **Webhook Trigger**: Razorpay webhook triggers subscription activation
4. **Commission Calculation**: System calculates commission based on employee's percentage
5. **Commission Record**: EmployeeCommission record is created with 'pending' status
6. **Admin Approval**: Admin reviews and approves commission
7. **Wallet Credit**: Commission is added to super employee's wallet

### Commission Calculation

```javascript
commissionAmount = (subscriptionAmount * commissionPercentage) / 100
```

### Commission Status Flow

1. **Pending**: Commission created, awaiting admin approval
2. **Paid**: Commission approved and added to employee wallet
3. **Cancelled**: Commission rejected by admin

## Security Features

### Authentication & Authorization

- JWT tokens for employee authentication
- Role-based access control
- Employee-specific permissions
- Secure password hashing with bcrypt

### Data Validation

- Input validation for all API endpoints
- Employee code validation during seller registration
- Commission amount validation
- District assignment validation

### Audit Trail

- All employee actions are logged
- Commission approvals tracked with admin details
- District assignments tracked with timestamps
- Wallet transactions with detailed descriptions

## Usage Examples

### Creating a Super Employee

```javascript
// Admin creates super employee
POST /api/admin/employees/super-employee/create
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "assignedDistricts": [
    {
      "district": "Mumbai",
      "state": "Maharashtra"
    }
  ],
  "commissionPercentage": 10
}
```

### Seller Registration with Employee Code

```javascript
// Seller registers with employee code
POST /api/auth/vendor-signup
{
  "name": "ABC Store",
  "email": "abc@store.com",
  "password": "password123",
  "phone": "9876543210",
  "employeeCode": "SE0001",  // Employee code
  "mainCategory": "category_id",
  "subCategory": "subcategory_id",
  "vendorAddress": {
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

### Employee Login and Dashboard

```javascript
// Employee login
POST /api/employee/login
{
  "employeeId": "SE0001",
  "password": "password123"
}

// Get dashboard
GET /api/employee/dashboard
Authorization: Bearer <token>
```

### Commission Approval

```javascript
// Admin approves commission
POST /api/admin/employee-commissions/commission_id/approve
{
  "adminNotes": "Commission approved for successful seller onboarding"
}
```

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Input validation with detailed error messages
- **Authentication Errors**: Invalid credentials, expired tokens
- **Authorization Errors**: Insufficient permissions
- **Business Logic Errors**: Invalid employee codes, commission conflicts
- **Database Errors**: Connection issues, constraint violations

## Performance Considerations

- **Indexing**: Database indexes on frequently queried fields
- **Pagination**: All list endpoints support pagination
- **Caching**: Employee and district data can be cached
- **Aggregation**: Efficient MongoDB aggregation for statistics

## Future Enhancements

1. **Multi-level Commission**: Support for multiple commission tiers
2. **Automated Payouts**: Automatic commission payments to bank accounts
3. **Performance Metrics**: Advanced analytics and reporting
4. **Mobile App**: Dedicated mobile application for employees
5. **Real-time Notifications**: Push notifications for commission updates
6. **Bulk Operations**: Bulk district assignments and commission approvals

## Testing

The system should be tested for:

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: API endpoint testing
3. **Security Tests**: Authentication and authorization
4. **Performance Tests**: Load testing for high-volume scenarios
5. **End-to-End Tests**: Complete workflow testing

## Deployment Considerations

1. **Environment Variables**: Secure configuration management
2. **Database Migration**: Schema updates and data migration
3. **Backup Strategy**: Regular database backups
4. **Monitoring**: Application and database monitoring
5. **Scaling**: Horizontal scaling for high-traffic scenarios

This comprehensive employee management system provides a robust foundation for managing sales teams, tracking performance, and distributing commissions in a scalable and secure manner.
