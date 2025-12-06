# API Overview Documentation

## 🏗️ System Architecture

This comprehensive API system provides a complete vendor listing platform with employee management, commission tracking, and multi-role access control.

### 🔐 User Roles & Hierarchy

```
Admin
├── Super Employee (SE)
│   ├── Regular Employee (EMP)
│   └── Assigned Sellers (Vendors)
└── Customers
```

### 📊 Role Permissions Matrix

| Feature | Admin | Super Employee | Employee | Vendor | Customer |
|---------|-------|----------------|----------|--------|----------|
| **Employee Management** | ✅ Full | ✅ Create Employees | ❌ View Only | ❌ | ❌ |
| **District Management** | ✅ Full | ❌ View Assigned | ❌ View Assigned | ❌ | ❌ |
| **Commission System** | ✅ Full | ✅ View Own | ❌ | ❌ | ❌ |
| **Vendor Management** | ✅ Full | ✅ View Assigned | ✅ View Assigned | ✅ Own Profile | ❌ |
| **Product Management** | ✅ Full | ❌ | ❌ | ✅ Own Products | ✅ Browse |
| **Order Management** | ✅ Full | ❌ | ❌ | ✅ Own Orders | ✅ Own Orders |
| **Wallet System** | ✅ Full | ✅ Own Wallet | ❌ | ✅ Own Wallet | ❌ |

---

## 🚀 API Endpoints Summary

### 🔑 Authentication APIs
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/vendor-signup` - Vendor registration with employee code
- **POST** `/api/auth/customer-signup` - Customer registration
- **POST** `/api/employee/login` - Employee login

### 👨‍💼 Admin APIs (`/api/admin`)
- **Employee Management**
  - `POST /employees/super-employee/create` - Create super employee
  - `GET /employees` - List all employees
  - `GET /employees/:id` - Get employee details
  - `POST /employees/:id/status` - Update employee status
  - `POST /employees/:id/districts` - Assign districts
  - `DELETE /employees/:id/districts` - Remove districts
  - `POST /employees/:id/commission` - Set commission percentage

- **District Management**
  - `POST /districts/create` - Create district
  - `GET /districts` - List all districts

- **Commission Management**
  - `GET /employee-commissions` - List all commissions
  - `POST /employee-commissions/:id/approve` - Approve commission
  - `POST /employee-commissions/:id/reject` - Reject commission

### 🏢 Super Employee APIs (`/api/employee`)
- **Authentication**
  - `POST /login` - Employee login

- **Dashboard**
  - `GET /dashboard` - Get dashboard data

- **Employee Management**
  - `GET /employees` - List assigned employees
  - `POST /employees/create` - Create regular employee

- **Seller Management**
  - `GET /sellers` - List assigned sellers
  - `GET /sellers/:id` - Get seller details

- **Commission Management**
  - `GET /commissions` - List own commissions
  - `GET /commissions/:id` - Get commission details

- **Wallet Management**
  - `GET /wallet` - Get wallet details
  - `GET /wallet/transactions` - Get wallet transactions

- **Profile Management**
  - `GET /profile` - Get profile
  - `PUT /profile` - Update profile
  - `PUT /change-password` - Change password

### 👷 Employee APIs (`/api/employee`)
- **Authentication**
  - `POST /login` - Employee login

- **Dashboard**
  - `GET /dashboard` - Get dashboard data

- **Seller Management**
  - `GET /sellers` - List assigned sellers
  - `GET /sellers/:id` - Get seller details

- **Profile Management**
  - `GET /profile` - Get profile
  - `PUT /profile` - Update profile
  - `PUT /change-password` - Change password

### 🏪 Vendor APIs (`/api/vendor`)
- **Dashboard**
  - `GET /dashboard` - Get vendor dashboard

- **Profile Management**
  - `GET /profile` - Get profile
  - `PUT /profile` - Update profile
  - `PUT /change-password` - Change password

- **Shop Management**
  - `PUT /shop` - Update shop details
  - `POST /shop/images` - Upload shop images
  - `PUT /shop/categories` - Update categories

- **KYC Management**
  - `POST /kyc` - Upload KYC documents
  - `GET /kyc` - Get KYC status

- **Subscription Management**
  - `GET /subscription/plans` - Get subscription plans
  - `GET /subscription` - Get current subscription
  - `POST /subscription` - Create subscription

- **Wallet Management**
  - `GET /wallet` - Get wallet details
  - `GET /wallet/transactions` - Get wallet transactions

### 🛍️ Customer APIs (`/api/customer`)
- **Dashboard**
  - `GET /dashboard` - Get customer dashboard

- **Profile Management**
  - `GET /profile` - Get profile
  - `PUT /profile` - Update profile
  - `PUT /change-password` - Change password

- **Product Browsing**
  - `GET /products` - Browse products
  - `GET /products/:id` - Get product details
  - `GET /categories` - Get categories

- **Cart Management**
  - `GET /cart` - Get cart
  - `POST /cart` - Add to cart
  - `PUT /cart/:id` - Update cart item
  - `DELETE /cart/:id` - Remove from cart
  - `DELETE /cart` - Clear cart

- **Order Management**
  - `GET /orders` - Get orders
  - `GET /orders/:id` - Get order details
  - `POST /orders` - Create order
  - `PUT /orders/:id/cancel` - Cancel order

- **Reviews & Ratings**
  - `GET /products/:id/reviews` - Get product reviews
  - `POST /products/:id/reviews` - Add product review

---

## 🔄 Data Flow & Business Logic

### 1. **Vendor Registration with Employee Assignment**
```
Vendor Signup → Employee Code Validation → Employee Assignment → Commission Setup
```

### 2. **Commission Distribution Flow**
```
Vendor Subscription → Webhook Trigger → Commission Calculation → Admin Approval → Wallet Credit
```

### 3. **Employee Hierarchy Management**
```
Admin → Create Super Employee → Assign Districts → Super Employee → Create Regular Employee → Assign Sellers
```

---

## 🛡️ Security Features

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)
- Token expiration and refresh
- Password hashing with bcrypt

### **Input Validation**
- Request body validation with Joi
- SQL injection prevention
- XSS protection
- File upload validation

### **Rate Limiting**
- API rate limiting
- Login attempt limiting
- Account lockout after failed attempts

---

## 📊 Database Schema Overview

### **Core Models**
- **User** - Main user model with role-based fields
- **Employee** - Employee-specific data and relationships
- **EmployeeCommission** - Commission tracking and management
- **District** - Geographic district management
- **Product** - Product catalog
- **Order** - Order management
- **Subscription** - Subscription plans and tracking

### **Key Relationships**
- Employee → Super Employee (hierarchy)
- Employee → Districts (assignment)
- Vendor → Employee (assignment via employeeCode)
- Employee → Commissions (earnings)
- Vendor → Products (ownership)
- Customer → Orders (purchases)

---

## 🔧 Configuration & Environment

### **Required Environment Variables**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/vendor-listing

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket
AWS_REGION=your-aws-region

# Server
PORT=3000
NODE_ENV=production
```

---

## 📈 Performance Considerations

### **Database Optimization**
- Indexed fields for fast queries
- Aggregation pipelines for complex data
- Connection pooling
- Query optimization

### **API Performance**
- Pagination for large datasets
- Response caching where appropriate
- Efficient data serialization
- Error handling and logging

### **File Upload Optimization**
- AWS S3 integration
- Image compression
- File type validation
- Size limits

---

## 🧪 Testing Strategy

### **API Testing**
- Unit tests for individual endpoints
- Integration tests for complete workflows
- Authentication and authorization tests
- Error handling tests

### **Data Validation**
- Input validation tests
- Database constraint tests
- Business logic validation
- Edge case handling

---

## 📚 Documentation Structure

### **Role-Specific Documentation**
- `admin-apis.md` - Complete admin API reference
- `super-employee-apis.md` - Super employee API reference
- `employee-apis.md` - Regular employee API reference
- `vendor-apis.md` - Vendor API reference
- `customer-apis.md` - Customer API reference

### **General Documentation**
- `README.md` - Project overview and setup
- `api-overview.md` - This comprehensive overview
- `employee-management.md` - Employee system details
- `SUBSCRIPTION_SETUP.md` - Subscription configuration

---

## 🚀 Getting Started

### **1. Installation**
```bash
npm install
```

### **2. Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

### **3. Database Setup**
```bash
# MongoDB should be running
# Database will be created automatically
```

### **4. Start Server**
```bash
npm start
# or
npm run dev
```

### **5. API Testing**
```bash
# Use Postman or similar tool
# Import the API collection
# Test with different user roles
```

---

## 🔍 API Response Format

### **Success Response**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (if applicable)
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

---

## 📞 Support & Maintenance

### **Monitoring**
- API response times
- Error rates
- Database performance
- User activity metrics

### **Logging**
- Request/response logging
- Error logging
- Authentication events
- Business logic events

### **Backup & Recovery**
- Database backups
- File storage backups
- Configuration backups
- Disaster recovery procedures

---

## 🔮 Future Enhancements

### **Planned Features**
- Real-time notifications
- Advanced analytics dashboard
- Mobile app APIs
- Third-party integrations
- Advanced reporting
- Multi-language support
- Advanced search and filtering
- Recommendation engine

### **Technical Improvements**
- GraphQL API
- Microservices architecture
- Advanced caching
- Real-time updates
- Performance monitoring
- Automated testing
- CI/CD pipeline

---

This comprehensive API system provides a robust foundation for a vendor listing platform with advanced employee management, commission tracking, and multi-role access control. The modular design ensures scalability and maintainability while providing a rich set of features for all user types.
