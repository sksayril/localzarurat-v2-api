# Customer API Documentation

## Overview
This document describes the customer-facing API endpoints for browsing vendors, products, and managing customer preferences.

## Base URL
```
/api/customer
```

## Authentication
- Most endpoints support optional authentication
- Protected endpoints require valid JWT token in Authorization header
- Format: `Authorization: Bearer <token>`

## Endpoints

### Customer Authentication

#### Customer Signup
```
POST /auth/register
```
Register a new customer account.

**Base URL:** `/api/auth`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "role": "customer",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "address": {
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      },
      "isEmailVerified": false,
      "isPhoneVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### Customer Login
```
POST /auth/login
```
Login with email and password.

**Base URL:** `/api/auth`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "address": {
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      },
      "isEmailVerified": false,
      "isPhoneVerified": false,
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### Forgot Password - Step 1: Get Security Questions
```
POST /auth/forgot-password
```
Get security questions for password reset.

**Base URL:** `/api/auth`

**Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Security questions retrieved successfully",
  "data": {
    "question1": "What was your first pet's name?",
    "question2": "In which city were you born?"
  }
}
```

#### Forgot Password - Step 2: Verify Security Questions
```
POST /auth/verify-security-questions
```
Verify answers to security questions.

**Base URL:** `/api/auth`

**Body:**
```json
{
  "email": "john@example.com",
  "answer1": "Buddy",
  "answer2": "Mumbai"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Security questions verified successfully"
}
```

#### Forgot Password - Step 3: Reset Password
```
POST /auth/reset-password
```
Reset password using security question answers.

**Base URL:** `/api/auth`

**Body:**
```json
{
  "email": "john@example.com",
  "answer1": "Buddy",
  "answer2": "Mumbai",
  "newPassword": "newsecurepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Get Customer Profile
```
GET /auth/profile
```
Get current customer profile information.

**Base URL:** `/api/auth`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "customer",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    },
    "profileImage": "profile_image_url",
    "isEmailVerified": false,
    "isPhoneVerified": false,
    "isActive": true,
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Customer Profile
```
PUT /auth/profile
```
Update customer profile information.

**Base URL:** `/api/auth`

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567891",
  "profileImage": "new_profile_image_url",
  "address": {
    "street": "456 Oak Ave",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400002"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "user_id",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1234567891",
    "role": "customer",
    "address": {
      "street": "456 Oak Ave",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400002"
    },
    "profileImage": "new_profile_image_url",
    "isEmailVerified": false,
    "isPhoneVerified": false,
    "isActive": true,
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Change Password
```
PUT /auth/change-password
```
Change customer password.

**Base URL:** `/api/auth`

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Logout
```
POST /auth/logout
```
Logout customer (client-side token removal).

**Base URL:** `/api/auth`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Verify Token
```
GET /auth/verify-token
```
Verify if the current token is valid.

**Base URL:** `/api/auth`

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

### Categories & Subcategories

#### Get All Main Categories
```
GET /categories
```
Returns all active main categories with basic information.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "category_id",
      "name": "Electronics",
      "icon": "icon_url",
      "description": "Electronic items",
      "slug": "electronics",
      "vendorCount": 25
    }
  ]
}
```

#### Get Subcategories by Main Category
```
GET /categories/:mainCategoryId/subcategories
```
Returns all subcategories for a specific main category.

**Parameters:**
- `mainCategoryId` (path): ID of the main category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "subcategory_id",
      "name": "Smartphones",
      "image": "image_url",
      "thumbnail": "thumbnail_url",
      "description": "Mobile phones and accessories",
      "slug": "smartphones",
      "vendorCount": 15,
      "mainCategory": {
        "_id": "category_id",
        "name": "Electronics",
        "icon": "icon_url"
      }
    }
  ]
}
```

#### Get All Subcategories
```
GET /subcategories
```
Returns all active subcategories with optional filtering.

**Query Parameters:**
- `mainCategory` (optional): Filter by main category ID
- `limit` (optional): Maximum number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "subcategory_id",
      "name": "Smartphones",
      "image": "image_url",
      "thumbnail": "thumbnail_url",
      "description": "Mobile phones and accessories",
      "slug": "smartphones",
      "vendorCount": 15,
      "mainCategory": {
        "_id": "category_id",
        "name": "Electronics",
        "icon": "icon_url"
      }
    }
  ]
}
```

### Vendor Listing by Categories

#### Get Vendors by Main Category
```
GET /categories/:mainCategoryId/vendors
```
Returns all vendors/shops in a specific main category.

**Parameters:**
- `mainCategoryId` (path): ID of the main category

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: 'createdAt')
- `sortOrder` (optional): Sort order: 1 for ascending, -1 for descending (default: -1)

**Response:**
```json
{
  "success": true,
  "data": {
    "mainCategory": {
      "_id": "category_id",
      "name": "Electronics",
      "icon": "icon_url"
    },
    "vendors": [
      {
        "_id": "vendor_id",
        "name": "John Doe",
        "phone": "+1234567890",
        "profileImage": "profile_image_url",
        "address": {
          "street": "123 Main St",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001"
        },
        "vendorDetails": {
          "shopName": "Tech Store",
          "shopDescription": "Best electronics store",
          "shopImages": ["image1_url", "image2_url"],
          "shopAddress": {
            "pincode": "400001",
            "addressLine1": "123 Main St",
            "location": "Andheri West",
            "coordinates": {
              "latitude": 19.0760,
              "longitude": 72.8777
            }
          },
          "mainCategory": {
            "_id": "category_id",
            "name": "Electronics",
            "icon": "icon_url"
          },
          "subCategory": {
            "_id": "subcategory_id",
            "name": "Smartphones",
            "image": "image_url",
            "thumbnail": "thumbnail_url"
          },
          "averageRating": 4.5,
          "totalRatings": 25,
          "isShopListed": true,
          "shopListedAt": "2024-01-01T00:00:00.000Z"
        },
        "isFavorited": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

#### Get Vendors by Subcategory
```
GET /subcategories/:subCategoryId/vendors
```
Returns all vendors/shops in a specific subcategory.

**Parameters:**
- `subCategoryId` (path): ID of the subcategory

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: 'createdAt')
- `sortOrder` (optional): Sort order: 1 for ascending, -1 for descending (default: -1)

**Response:**
```json
{
  "success": true,
  "data": {
    "subCategory": {
      "_id": "subcategory_id",
      "name": "Smartphones",
      "image": "image_url",
      "thumbnail": "thumbnail_url",
      "description": "Mobile phones and accessories",
      "slug": "smartphones",
      "vendorCount": 15,
      "mainCategory": {
        "_id": "category_id",
        "name": "Electronics",
        "icon": "icon_url"
      }
    },
    "vendors": [
      {
        "_id": "vendor_id",
        "name": "John Doe",
        "phone": "+1234567890",
        "profileImage": "profile_image_url",
        "address": {
          "street": "123 Main St",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001"
        },
        "vendorDetails": {
          "shopName": "Tech Store",
          "shopDescription": "Best electronics store",
          "shopImages": ["image1_url", "image2_url"],
          "shopAddress": {
            "pincode": "400001",
            "addressLine1": "123 Main St",
            "location": "Andheri West",
            "coordinates": {
              "latitude": 19.0760,
              "longitude": 72.8777
            }
          },
          "mainCategory": {
            "_id": "category_id",
            "name": "Electronics",
            "icon": "icon_url"
          },
          "subCategory": {
            "_id": "subcategory_id",
            "name": "Smartphones",
            "image": "image_url",
            "thumbnail": "thumbnail_url"
          },
          "averageRating": 4.5,
          "totalRatings": 25,
          "isShopListed": true,
          "shopListedAt": "2024-01-01T00:00:00.000Z"
        },
        "isFavorited": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### Vendor Details

#### Get Vendor Details
```
GET /vendors/:id
```
Returns detailed information about a specific vendor including products, ratings, and reviews.

**Parameters:**
- `id` (path): Vendor ID

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "_id": "vendor_id",
      "name": "John Doe",
      "phone": "+1234567890",
      "profileImage": "profile_image_url",
      "address": {
        "street": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      },
      "vendorDetails": {
        "shopName": "Tech Store",
        "shopDescription": "Best electronics store",
        "shopImages": ["image1_url", "image2_url"],
        "shopAddress": {
          "pincode": "400001",
          "addressLine1": "123 Main St",
          "location": "Andheri West",
          "coordinates": {
            "latitude": 19.0760,
            "longitude": 72.8777
          }
        },
        "mainCategory": {
          "_id": "category_id",
          "name": "Electronics",
          "icon": "icon_url"
        },
        "subCategory": {
          "_id": "subcategory_id",
          "name": "Smartphones",
          "image": "image_url",
          "thumbnail": "thumbnail_url"
        },
        "averageRating": 4.5,
        "totalRatings": 25,
        "isShopListed": true,
        "shopListedAt": "2024-01-01T00:00:00.000Z"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "products": [
      {
        "_id": "product_id",
        "name": "iPhone 15",
        "description": "Latest iPhone model",
        "price": 79999,
        "images": ["image1_url", "image2_url"],
        "primaryImage": "primary_image_url",
        "views": 150,
        "category": {
          "mainCategory": {
            "_id": "category_id",
            "name": "Electronics",
            "icon": "icon_url"
          },
          "subCategory": {
            "_id": "subcategory_id",
            "name": "Smartphones",
            "image": "image_url",
            "thumbnail": "thumbnail_url"
          }
        }
      }
    ],
    "ratingStats": {
      "averageRating": 4.5,
      "totalRatings": 25,
      "ratingDistribution": {
        "5": 10,
        "4": 8,
        "3": 4,
        "2": 2,
        "1": 1
      }
    },
    "recentReviews": [
      {
        "_id": "review_id",
        "rating": 5,
        "review": "Great service and quality products!",
        "createdAt": "2024-01-15T00:00:00.000Z",
        "isAnonymous": false,
        "customer": {
          "_id": "customer_id",
          "name": "Jane Smith",
          "profileImage": "profile_image_url"
        }
      }
    ],
    "isFavorited": false
  }
}
```

#### Get Vendor Products
```
GET /vendors/:id/products
```
Returns all products from a specific vendor.

**Parameters:**
- `id` (path): Vendor ID

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "iPhone 15",
      "description": "Latest iPhone model",
      "price": 79999,
      "images": ["image1_url", "image2_url"],
      "primaryImage": "primary_image_url",
      "views": 150,
      "category": {
        "mainCategory": {
          "_id": "category_id",
          "name": "Electronics",
          "icon": "icon_url"
        },
        "subCategory": {
          "_id": "subcategory_id",
          "name": "Smartphones",
          "image": "image_url",
          "thumbnail": "thumbnail_url"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### Search Functionality

#### Search Vendors
```
GET /search/vendors
```
Search for vendors based on various criteria.

**Query Parameters:**
- `query` (optional): Search term
- `category` (optional): Main category ID
- `subCategory` (optional): Subcategory ID
- `pincode` (optional): Location pincode
- `city` (optional): City name
- `state` (optional): State name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: 'createdAt')
- `sortOrder` (optional): Sort order (default: -1)

#### Search Products
```
GET /search/products
```
Search for products based on various criteria.

**Query Parameters:**
- `query` (optional): Search term
- `category` (optional): Main category ID
- `subCategory` (optional): Subcategory ID
- `vendor` (optional): Vendor ID
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `pincode` (optional): Location pincode
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: 'createdAt')
- `sortOrder` (optional): Sort order (default: -1)

### Favorites (Authenticated)

#### Add Vendor to Favorites
```
POST /favorites/vendors/:id
```
Add a vendor to customer's favorites.

**Parameters:**
- `id` (path): Vendor ID

**Headers:**
- `Authorization: Bearer <token>`

#### Remove Vendor from Favorites
```
DELETE /favorites/vendors/:id
```
Remove a vendor from customer's favorites.

**Parameters:**
- `id` (path): Vendor ID

**Headers:**
- `Authorization: Bearer <token>`

#### Get Favorite Vendors
```
GET /favorites/vendors
```
Get all vendors in customer's favorites.

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### Ratings & Reviews

#### Rate a Vendor
```
POST /vendors/:id/rate
```
Submit a rating and review for a vendor.

**Parameters:**
- `id` (path): Vendor ID

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "rating": 5,
  "review": "Great service and quality products!",
  "categories": ["service", "quality"],
  "isAnonymous": false,
  "tags": ["helpful", "professional"]
}
```

#### Get Vendor Ratings
```
GET /vendors/:id/ratings
```
Get all ratings and reviews for a vendor.

**Parameters:**
- `id` (path): Vendor ID

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: 'createdAt')
- `sortOrder` (optional): Sort order (default: -1)

### Nearby Vendors

#### Get Nearby Vendors
```
GET /nearby/:pincode
```
Get vendors in a specific pincode area.

**Parameters:**
- `pincode` (path): 6-digit pincode

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Usage Examples

### Get all vendors in Electronics category
```bash
GET /api/customer/categories/electronics_id/vendors?page=1&limit=20
```

### Get vendors in Smartphones subcategory
```bash
GET /api/customer/subcategories/smartphones_id/vendors?sortBy=averageRating&sortOrder=-1
```

### Get vendor details with products and reviews
```bash
GET /api/customer/vendors/vendor_id
```

### Search for vendors in Mumbai
```bash
GET /api/customer/search/vendors?city=Mumbai&category=electronics_id
```

## Notes

1. **Authentication**: Most endpoints support optional authentication. When authenticated, additional features like favorites status are included.

2. **Pagination**: All listing endpoints support pagination with `page` and `limit` parameters.

3. **Sorting**: Vendor listing endpoints support sorting by various fields like `createdAt`, `averageRating`, etc.

4. **Filtering**: Search endpoints support multiple filters for precise results.

5. **Vendor Status**: Only active vendors with active subscriptions are returned in listings.

6. **Favorites**: The `isFavorited` field is only included when the user is authenticated. 