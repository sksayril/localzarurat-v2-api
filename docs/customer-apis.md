# Customer APIs Documentation

## Overview
This document covers all APIs available to customers, including registration, profile management, product browsing, and order management.

## Authentication
All customer APIs require authentication with customer role. Include the JWT token in the Authorization header:
```
Authorization: Bearer <customer_jwt_token>
```

---

## 🔐 Authentication

### Customer Registration
**POST** `/api/auth/customer-signup`

Registers a new customer.

**Request Body:**
```json
{
  "name": "John Customer",
  "email": "john@customer.com",
  "phone": "9876543215",
  "password": "SecurePassword123!",
  "address": {
    "street": "456 Customer Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400005",
    "country": "India"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9e7",
      "name": "John Customer",
      "email": "john@customer.com",
      "phone": "9876543215",
      "role": "customer",
      "isActive": true,
      "address": {
        "street": "456 Customer Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400005",
        "country": "India"
      },
      "createdAt": "2024-01-15T16:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Customer with this email already exists"
}
```

### Customer Login
**POST** `/api/auth/login`

Authenticates a customer using email and password.

**Request Body:**
```json
{
  "email": "john@customer.com",
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
      "_id": "64f8a1b2c3d4e5f6a7b8c9e7",
      "name": "John Customer",
      "email": "john@customer.com",
      "phone": "9876543215",
      "role": "customer",
      "isActive": true,
      "address": {
        "street": "456 Customer Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400005",
        "country": "India"
      }
    }
  }
}
```

---

## 📊 Dashboard

### Get Customer Dashboard
**GET** `/api/customer/dashboard`

Retrieves dashboard information for the customer.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customer": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9e7",
      "name": "John Customer",
      "email": "john@customer.com",
      "phone": "9876543215",
      "role": "customer",
      "isActive": true,
      "address": {
        "street": "456 Customer Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400005",
        "country": "India"
      }
    },
    "dashboard": {
      "totalOrders": 15,
      "pendingOrders": 2,
      "completedOrders": 12,
      "cancelledOrders": 1,
      "totalSpent": 45000,
      "averageOrderValue": 3000,
      "favoriteVendors": 3,
      "recentOrders": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e8",
          "orderNumber": "ORD-2024-001",
          "vendor": {
            "name": "ABC Store",
            "vendorDetails": {
              "shopName": "ABC Electronics Store"
            }
          },
          "totalAmount": 99999,
          "status": "pending",
          "createdAt": "2024-01-15T14:00:00.000Z"
        },
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e9",
          "orderNumber": "ORD-2024-002",
          "vendor": {
            "name": "DEF Store",
            "vendorDetails": {
              "shopName": "DEF Fashion Store"
            }
          },
          "totalAmount": 2500,
          "status": "completed",
          "createdAt": "2024-01-14T10:00:00.000Z"
        }
      ],
      "recentProducts": [
        {
          "_id": "64f8a1b2c3d4e5f6a7b8c9ea",
          "name": "iPhone 15 Pro",
          "price": 99999,
          "vendor": {
            "name": "ABC Store",
            "vendorDetails": {
              "shopName": "ABC Electronics Store"
            }
          },
          "addedToCartAt": "2024-01-15T13:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## 👤 Profile Management

### Get Profile
**GET** `/api/customer/profile`

Retrieves the customer's profile information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9e7",
    "name": "John Customer",
    "email": "john@customer.com",
    "phone": "9876543215",
    "role": "customer",
    "isActive": true,
    "isEmailVerified": true,
    "isPhoneVerified": true,
    "profileImage": "https://example.com/customer-profile.jpg",
    "address": {
      "street": "456 Customer Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400005",
      "country": "India"
    },
    "preferences": {
      "notifications": {
        "email": true,
        "sms": true,
        "push": true
      },
      "language": "en",
      "currency": "INR"
    },
    "createdAt": "2024-01-15T16:00:00.000Z",
    "updatedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

### Update Profile
**PUT** `/api/customer/profile`

Updates the customer's profile information.

**Request Body:**
```json
{
  "name": "John Customer Updated",
  "phone": "9876543215",
  "address": {
    "street": "456 Updated Customer Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400005",
    "country": "India"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "language": "en",
    "currency": "INR"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9e7",
    "name": "John Customer Updated",
    "email": "john@customer.com",
    "phone": "9876543215",
    "address": {
      "street": "456 Updated Customer Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400005",
      "country": "India"
    },
    "preferences": {
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      },
      "language": "en",
      "currency": "INR"
    }
  }
}
```

### Change Password
**PUT** `/api/customer/change-password`

Changes the customer's password.

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

## 🛍️ Product Browsing

### Get All Products
**GET** `/api/customer/products`

Retrieves all available products with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by main category
- `subCategory` (optional): Filter by sub category
- `vendor` (optional): Filter by vendor
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `search` (optional): Search by product name or description
- `sortBy` (optional): Sort by (`price`, `rating`, `createdAt`, `name`)
- `sortOrder` (optional): Sort order (`asc`, `desc`)

**Request Example:**
```
GET /api/customer/products?page=1&limit=20&category=Electronics&minPrice=1000&maxPrice=50000&sortBy=price&sortOrder=asc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9e4",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with advanced features",
      "price": 99999,
      "originalPrice": 109999,
      "discount": 10,
      "stock": 10,
      "isActive": true,
      "images": [
        "https://example.com/iphone1.jpg",
        "https://example.com/iphone2.jpg"
      ],
      "vendor": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "name": "ABC Store",
        "vendorDetails": {
          "shopName": "ABC Electronics Store",
          "averageRating": 4.5,
          "totalRatings": 25
        }
      },
      "category": {
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
      },
      "rating": {
        "average": 4.8,
        "total": 15
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  },
  "filters": {
    "categories": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d9",
        "name": "Electronics",
        "count": 50
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9e0",
        "name": "Fashion",
        "count": 30
      }
    ],
    "priceRange": {
      "min": 100,
      "max": 200000
    }
  }
}
```

### Get Product Details
**GET** `/api/customer/products/:productId`

Retrieves detailed information about a specific product.

**Request Example:**
```
GET /api/customer/products/64f8a1b2c3d4e5f6a7b8c9e4
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9e4",
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with advanced features including A17 Pro chip, titanium design, and advanced camera system",
    "price": 99999,
    "originalPrice": 109999,
    "discount": 10,
    "stock": 10,
    "isActive": true,
    "images": [
      "https://example.com/iphone1.jpg",
      "https://example.com/iphone2.jpg",
      "https://example.com/iphone3.jpg"
    ],
    "vendor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "ABC Store",
      "email": "abc@store.com",
      "phone": "9876543213",
      "vendorDetails": {
        "shopName": "ABC Electronics Store",
        "shopDescription": "Leading electronics retailer in Mumbai",
        "averageRating": 4.5,
        "totalRatings": 25,
        "vendorAddress": {
          "street": "Main Street",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001"
        }
      }
    },
    "category": {
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
    },
    "rating": {
      "average": 4.8,
      "total": 15,
      "distribution": {
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 2,
        "5": 12
      }
    },
    "reviews": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9eb",
        "customer": {
          "name": "Customer 1",
          "profileImage": "https://example.com/customer1.jpg"
        },
        "rating": 5,
        "comment": "Excellent product, fast delivery!",
        "createdAt": "2024-01-14T10:00:00.000Z"
      }
    ],
    "specifications": {
      "brand": "Apple",
      "model": "iPhone 15 Pro",
      "color": "Natural Titanium",
      "storage": "256GB",
      "screenSize": "6.1 inches",
      "camera": "48MP Main Camera"
    },
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

### Get Categories
**GET** `/api/customer/categories`

Retrieves all available categories.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "mainCategories": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d9",
        "name": "Electronics",
        "icon": "https://example.com/electronics-icon.png",
        "subCategories": [
          {
            "_id": "64f8a1b2c3d4e5f6a7b8c9da",
            "name": "Mobile Phones",
            "image": "https://example.com/mobile-image.png",
            "thumbnail": "https://example.com/mobile-thumb.png",
            "productCount": 25
          },
          {
            "_id": "64f8a1b2c3d4e5f6a7b8c9db",
            "name": "Laptops",
            "image": "https://example.com/laptop-image.png",
            "thumbnail": "https://example.com/laptop-thumb.png",
            "productCount": 15
          }
        ]
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9e0",
        "name": "Fashion",
        "icon": "https://example.com/fashion-icon.png",
        "subCategories": [
          {
            "_id": "64f8a1b2c3d4e5f6a7b8c9e1",
            "name": "Women's Clothing",
            "image": "https://example.com/womens-clothing-image.png",
            "thumbnail": "https://example.com/womens-clothing-thumb.png",
            "productCount": 30
          }
        ]
      }
    ]
  }
}
```

---

## 🛒 Cart Management

### Get Cart
**GET** `/api/customer/cart`

Retrieves the customer's cart items.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9ec",
        "product": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e4",
          "name": "iPhone 15 Pro",
          "price": 99999,
          "images": ["https://example.com/iphone1.jpg"],
          "vendor": {
            "name": "ABC Store",
            "vendorDetails": {
              "shopName": "ABC Electronics Store"
            }
          }
        },
        "quantity": 1,
        "addedAt": "2024-01-15T13:00:00.000Z"
      }
    ],
    "summary": {
      "totalItems": 1,
      "totalAmount": 99999,
      "totalSavings": 10000
    }
  }
}
```

### Add to Cart
**POST** `/api/customer/cart`

Adds a product to the cart.

**Request Body:**
```json
{
  "productId": "64f8a1b2c3d4e5f6a7b8c9e4",
  "quantity": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "item": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9ec",
      "product": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9e4",
        "name": "iPhone 15 Pro",
        "price": 99999,
        "images": ["https://example.com/iphone1.jpg"]
      },
      "quantity": 1,
      "addedAt": "2024-01-15T13:00:00.000Z"
    }
  }
}
```

### Update Cart Item
**PUT** `/api/customer/cart/:itemId`

Updates the quantity of a cart item.

**Request Body:**
```json
{
  "quantity": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "item": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9ec",
      "product": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9e4",
        "name": "iPhone 15 Pro",
        "price": 99999
      },
      "quantity": 2,
      "updatedAt": "2024-01-15T13:30:00.000Z"
    }
  }
}
```

### Remove from Cart
**DELETE** `/api/customer/cart/:itemId`

Removes a product from the cart.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product removed from cart successfully"
}
```

### Clear Cart
**DELETE** `/api/customer/cart`

Clears all items from the cart.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

## 📦 Order Management

### Get Orders
**GET** `/api/customer/orders`

Retrieves the customer's order history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`)

**Request Example:**
```
GET /api/customer/orders?page=1&limit=10&status=pending
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9e8",
      "orderNumber": "ORD-2024-001",
      "vendor": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "name": "ABC Store",
        "vendorDetails": {
          "shopName": "ABC Electronics Store"
        }
      },
      "items": [
        {
          "product": {
            "_id": "64f8a1b2c3d4e5f6a7b8c9e4",
            "name": "iPhone 15 Pro",
            "price": 99999,
            "images": ["https://example.com/iphone1.jpg"]
          },
          "quantity": 1,
          "totalPrice": 99999
        }
      ],
      "totalAmount": 99999,
      "status": "pending",
      "paymentStatus": "pending",
      "shippingAddress": {
        "street": "456 Customer Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400005",
        "country": "India"
      },
      "createdAt": "2024-01-15T14:00:00.000Z"
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

### Get Order Details
**GET** `/api/customer/orders/:orderId`

Retrieves detailed information about a specific order.

**Request Example:**
```
GET /api/customer/orders/64f8a1b2c3d4e5f6a7b8c9e8
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9e8",
    "orderNumber": "ORD-2024-001",
    "vendor": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "name": "ABC Store",
      "email": "abc@store.com",
      "phone": "9876543213",
      "vendorDetails": {
        "shopName": "ABC Electronics Store",
        "vendorAddress": {
          "street": "Main Street",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001"
        }
      }
    },
    "items": [
      {
        "product": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9e4",
          "name": "iPhone 15 Pro",
          "description": "Latest iPhone with advanced features",
          "price": 99999,
          "images": ["https://example.com/iphone1.jpg"],
          "specifications": {
            "brand": "Apple",
            "model": "iPhone 15 Pro",
            "color": "Natural Titanium",
            "storage": "256GB"
          }
        },
        "quantity": 1,
        "totalPrice": 99999
      }
    ],
    "totalAmount": 99999,
    "status": "pending",
    "paymentStatus": "pending",
    "shippingAddress": {
      "street": "456 Customer Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400005",
      "country": "India"
    },
    "tracking": {
      "trackingNumber": null,
      "carrier": null,
      "status": "pending",
      "updates": []
    },
    "createdAt": "2024-01-15T14:00:00.000Z",
    "updatedAt": "2024-01-15T14:00:00.000Z"
  }
}
```

### Create Order
**POST** `/api/customer/orders`

Creates a new order from cart items.

**Request Body:**
```json
{
  "shippingAddress": {
    "street": "456 Customer Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400005",
    "country": "India"
  },
  "paymentMethod": "razorpay"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9e8",
      "orderNumber": "ORD-2024-001",
      "totalAmount": 99999,
      "status": "pending",
      "paymentStatus": "pending"
    },
    "payment": {
      "id": "pay_1234567890",
      "amount": 99999,
      "currency": "INR",
      "status": "created",
      "orderId": "order_1234567890"
    }
  }
}
```

### Cancel Order
**PUT** `/api/customer/orders/:orderId/cancel`

Cancels a pending order.

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9e8",
      "orderNumber": "ORD-2024-001",
      "status": "cancelled",
      "cancelledAt": "2024-01-15T15:00:00.000Z"
    }
  }
}
```

---

## ⭐ Reviews and Ratings

### Get Product Reviews
**GET** `/api/customer/products/:productId/reviews`

Retrieves reviews for a specific product.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `rating` (optional): Filter by rating (1-5)

**Request Example:**
```
GET /api/customer/products/64f8a1b2c3d4e5f6a7b8c9e4/reviews?page=1&limit=10&rating=5
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9eb",
      "customer": {
        "name": "Customer 1",
        "profileImage": "https://example.com/customer1.jpg"
      },
      "rating": 5,
      "comment": "Excellent product, fast delivery!",
      "createdAt": "2024-01-14T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 5,
    "itemsPerPage": 10
  }
}
```

### Add Product Review
**POST** `/api/customer/products/:productId/reviews`

Adds a review for a product.

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great product, highly recommended!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Review added successfully",
  "data": {
    "review": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9ed",
      "customer": {
        "name": "John Customer",
        "profileImage": "https://example.com/customer-profile.jpg"
      },
      "rating": 5,
      "comment": "Great product, highly recommended!",
      "createdAt": "2024-01-15T16:00:00.000Z"
    }
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
  "message": "Product not found"
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
Authorization: Bearer <customer_jwt_token>
```

### Optional Headers
```
Accept: application/json
User-Agent: YourApp/1.0
```

---

## 📝 Notes

1. **Authentication**: All endpoints require valid customer JWT token
2. **Product Browsing**: Customers can browse and search products
3. **Cart Management**: Customers can manage their shopping cart
4. **Order Management**: Customers can place and track orders
5. **Reviews**: Customers can review and rate products
6. **Profile Management**: Customers can manage their profile and preferences
7. **Validation**: All input data is validated before processing
8. **Pagination**: List endpoints support pagination with default limits
9. **Filtering**: Product browsing supports various filtering options
10. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
11. **Payment Integration**: Orders support Razorpay payment integration
12. **Address Management**: Customers can manage shipping addresses
13. **Notification Preferences**: Customers can set notification preferences
14. **Language Support**: Customers can set language preferences
15. **Currency Support**: Customers can set currency preferences
