# Vendor API Documentation

## Overview
Complete step-by-step guide for vendor operations including registration, authentication, KYC verification, and product management with AWS S3 file uploads.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All vendor endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication & Registration

### Step 1: Vendor Signup
**POST** `/auth/vendor-signup`

Register a new vendor with comprehensive details, KYC information, and security questions.

**Request Body (multipart/form-data):**
```
name: John Electronics Store
email: john@electronics.com
password: SecurePass123!
phone: 9876543210
gstNumber: 22AAAAA0000A1Z5
mainCategory: 507f1f77bcf86cd799439011
subCategory: 507f1f77bcf86cd799439012
referralCode: REF123456
securityQuestions[question1][question]: What was your first pet's name?
securityQuestions[question1][answer]: Buddy
securityQuestions[question2][question]: In which city were you born?
securityQuestions[question2][answer]: Mumbai
vendorAddress[doorNumber]: 123
vendorAddress[street]: Electronics Street
vendorAddress[location]: Andheri West
vendorAddress[city]: Mumbai
vendorAddress[state]: Maharashtra
vendorAddress[pincode]: 400058
vendorAddress[country]: India
shopImages: [file upload 1]
shopImages: [file upload 2]
```

**Available Security Questions:**
- What was your first pet's name?
- In which city were you born?
- What was your mother's maiden name?
- What was the name of your first school?
- What is your favorite movie?
- What was your childhood nickname?
- What is the name of the street you grew up on?
- What was your favorite food as a child?

**Response:**
```json
{
  "success": true,
  "message": "Vendor registered successfully",
  "data": {
    "vendor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Electronics Store",
      "email": "john@electronics.com",
      "phone": "9876543210",
      "role": "vendor",
      "isActive": true,
      "vendorDetails": {
        "gstNumber": "22AAAAA0000A1Z5",
        "vendorAddress": {
          "doorNumber": "123",
          "street": "Electronics Street",
          "location": "Andheri West",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400058",
          "country": "India"
        },
        "mainCategory": "507f1f77bcf86cd799439011",
        "subCategory": "507f1f77bcf86cd799439012",
        "referralCode": "REF123456",
        "shopImages": [
          "https://elboz.s3.eu-north-1.amazonaws.com/uploads/vendors/john-electronics-store/uuid1.jpg",
          "https://elboz.s3.eu-north-1.amazonaws.com/uploads/vendors/john-electronics-store/uuid2.jpg"
        ],
        "kyc": {
          "isVerified": false
        },
        "subscription": {
          "hasActiveSubscription": false
        },
        "isShopListed": false
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Step 2: Vendor Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@electronics.com",
  "password": "SecurePass123!"
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
      "name": "John Electronics Store",
      "email": "john@electronics.com",
      "phone": "9876543210",
      "role": "vendor",
      "isActive": true,
      "vendorDetails": {
        "gstNumber": "22AAAAA0000A1Z5",
        "isShopListed": false,
        "hasActiveSubscription": false
      },
      "lastLogin": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Step 3: Forgot Password Process

#### 3.1 Get Security Questions
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@electronics.com"
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

#### 3.2 Verify Security Questions
**POST** `/auth/verify-security-questions`

**Request Body:**
```json
{
  "email": "john@electronics.com",
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

#### 3.3 Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "email": "john@electronics.com",
  "answer1": "Buddy",
  "answer2": "Mumbai",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 📊 Vendor Dashboard

### Get Dashboard Overview
**GET** `/vendor/dashboard`

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
      "totalProducts": 0,
      "totalViews": 0,
      "walletBalance": 0,
      "pendingWithdrawals": 0
    },
    "subscription": null,
    "shopStatus": {
      "isListed": false,
      "hasActiveSubscription": false
    },
    "recentProducts": [],
    "kycStatus": {
      "isVerified": false,
      "panUploaded": false,
      "aadharUploaded": false
    }
  }
}
```

---

## 💳 Subscription Management

### Step 4: View Subscription Plans
**GET** `/vendor/subscription/plans`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "3months": {
      "name": "3 Months Plan",
      "amount": 199,
      "duration": 90,
      "features": {
        "maxProducts": 50,
        "maxImages": 200,
        "prioritySupport": true,
        "featuredListing": false
      },
      "description": "Perfect for new vendors starting their journey. Premium features ka access with priority customer support."
    },
    "6months": {
      "name": "6 Months Plan",
      "amount": 349,
      "duration": 180,
      "features": {
        "maxProducts": 100,
        "maxImages": 500,
        "prioritySupport": true,
        "featuredListing": false
      },
      "description": "Great value for growing businesses. 1 month ki bachat vs 3-month plan with premium features and priority support."
    },
    "1year": {
      "name": "12 Months Plan",
      "amount": 599,
      "duration": 365,
      "features": {
        "maxProducts": 200,
        "maxImages": 1000,
        "prioritySupport": true,
        "featuredListing": true
      },
      "description": "Best value for established vendors. 3 months ki bachat vs 3-month plan with exclusive benefits and updates."
    }
  }
}
```

### Step 4.1: Get All Vendor Subscriptions
**GET** `/vendor/subscription`

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
      "vendor": "507f1f77bcf86cd799439011",
      "plan": "6months",
      "amount": 4999,
      "status": "active",
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-07-15T10:30:00.000Z",
      "features": {
        "maxProducts": 100,
        "maxImages": 500,
        "prioritySupport": true,
        "featuredListing": false
      },
      "razorpay": {
        "orderId": "order_1234567890",
        "paymentId": "pay_1234567890"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "vendor": "507f1f77bcf86cd799439011",
      "plan": "3months",
      "amount": 2999,
      "status": "expired",
      "startDate": "2023-10-15T10:30:00.000Z",
      "endDate": "2024-01-15T10:30:00.000Z",
      "features": {
        "maxProducts": 50,
        "maxImages": 200,
        "prioritySupport": false,
        "featuredListing": false
      },
      "razorpay": {
        "orderId": "order_0987654321",
        "paymentId": "pay_0987654321"
      },
      "createdAt": "2023-10-15T10:30:00.000Z"
    }
  ]
}
```

### Step 5: Create Subscription
**POST** `/vendor/subscription`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "plan": "6months"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "_id": "507f1f77bcf86cd799439011",
      "vendor": "507f1f77bcf86cd799439011",
      "plan": "6months",
      "amount": 4999,
      "status": "pending",
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-07-15T10:30:00.000Z",
      "features": {
        "maxProducts": 100,
        "maxImages": 500,
        "prioritySupport": true,
        "featuredListing": false
      },
      "razorpay": {
        "orderId": "order_1234567890"
      }
    },
    "razorpayOrder": {
      "id": "order_1234567890",
      "amount": 499900,
      "currency": "INR",
      "receipt": "sub_123456_1705312200",
      "status": "created"
    }
  }
}
```

### Step 5.1: Get Detailed Subscription Information
**GET** `/vendor/subscription/details`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentSubscription": {
      "id": "507f1f77bcf86cd799439011",
      "plan": "6months",
      "planName": "6 Months Plan",
      "amount": 4999,
      "status": "active",
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-07-15T10:30:00.000Z",
      "remainingDays": 45,
      "isExpired": false,
      "isExpiringSoon": false,
      "canRenew": false,
      "features": {
        "maxProducts": 100,
        "maxImages": 500,
        "prioritySupport": true,
        "featuredListing": false
      },
      "razorpay": {
        "orderId": "order_1234567890",
        "paymentId": "pay_1234567890"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "subscriptionStats": {
      "totalSubscriptions": 3,
      "activeSubscriptions": 1,
      "expiredSubscriptions": 1,
      "cancelledSubscriptions": 1,
      "totalAmountSpent": 14997
    },
    "subscriptionHistory": [
      {
        "id": "507f1f77bcf86cd799439011",
        "plan": "6months",
        "planName": "6 Months Plan",
        "amount": 4999,
        "status": "active",
        "startDate": "2024-01-15T10:30:00.000Z",
        "endDate": "2024-07-15T10:30:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "razorpay": {
          "orderId": "order_1234567890",
          "paymentId": "pay_1234567890"
        }
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "plan": "3months",
        "planName": "3 Months Plan",
        "amount": 2999,
        "status": "expired",
        "startDate": "2023-10-15T10:30:00.000Z",
        "endDate": "2024-01-15T10:30:00.000Z",
        "createdAt": "2023-10-15T10:30:00.000Z",
        "razorpay": {
          "orderId": "order_0987654321",
          "paymentId": "pay_0987654321"
        }
      }
    ],
            "availablePlans": {
          "3months": {
            "name": "3 Months Plan",
            "amount": 199,
            "duration": 90,
            "features": {
              "maxProducts": 50,
              "maxImages": 200,
              "prioritySupport": true,
              "featuredListing": false
            },
            "description": "Perfect for new vendors starting their journey. Premium features ka access with priority customer support."
          },
          "6months": {
            "name": "6 Months Plan",
            "amount": 349,
            "duration": 180,
            "features": {
              "maxProducts": 100,
              "maxImages": 500,
              "prioritySupport": true,
              "featuredListing": false
            },
            "description": "Great value for growing businesses. 1 month ki bachat vs 3-month plan with premium features and priority support."
          },
          "1year": {
            "name": "12 Months Plan",
            "amount": 599,
            "duration": 365,
            "features": {
              "maxProducts": 200,
              "maxImages": 1000,
              "prioritySupport": true,
              "featuredListing": true
            },
            "description": "Best value for established vendors. 3 months ki bachat vs 3-month plan with exclusive benefits and updates."
          }
        },
    "renewalRecommendation": {
      "recommended": "1year",
      "reason": "Upgrade to 1 year for maximum value and featured listing",
      "savings": 999
    },
    "shopStatus": {
      "isListed": true,
      "hasActiveSubscription": true
    },
    "nextRenewalDate": "2024-07-15T10:30:00.000Z",
    "daysUntilRenewal": 45
  }
}
```

### Step 5.2: Verify Subscription Payment
**POST** `/vendor/subscription/verify`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**
```json
{
  "subscriptionId": "507f1f77bcf86cd799439011",
  "orderId": "order_1234567890",
  "paymentId": "pay_1234567890",
  "signature": "abc123def456ghi789..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "subscription": {
      "_id": "507f1f77bcf86cd799439011",
      "vendor": "507f1f77bcf86cd799439011",
      "plan": "6months",
      "amount": 4999,
      "status": "active",
      "startDate": "2024-01-15T10:30:00.000Z",
      "endDate": "2024-07-15T10:30:00.000Z",
      "features": {
        "maxProducts": 100,
        "maxImages": 500,
        "prioritySupport": true,
        "featuredListing": false
      },
      "razorpay": {
        "orderId": "order_1234567890",
        "paymentId": "pay_1234567890",
        "paymentStatus": "captured"
      }
    },
    "payment": {
      "id": "pay_1234567890",
      "amount": 499900,
      "currency": "INR",
      "status": "captured",
      "method": "card",
      "captured": true
    },
    "referralCommission": {
      "referrerId": "507f1f77bcf86cd799439012",
      "commissionAmount": 500,
      "commissionPercentage": 10,
      "transactionId": "REF_COMM_1705312200000_507f1f77bcf86cd799439011"
    }
  }
}
```

**Note:** If the vendor was referred by another vendor, a 10% commission is automatically added to the referrer's wallet balance upon successful subscription payment verification.

---

## 🏪 Shop Listing Management

### Step 6: List Your Shop (Requires Active Subscription)
**POST** `/vendor/shop/listing`

**Note:** Main category, sub category, and shop address details are required fields. The sub category must belong to the selected main category. Address fields include pincode, address line 1, and location which are mandatory. For file uploads, use the field name `shopImages` for shop images (maximum 10 images, 200MB each).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
shopName: John Electronics Store
shopDescription: Best electronics store in Mumbai with premium quality products and excellent customer service. We specialize in mobile phones, laptops, and accessories.
shopMetaTitle: John Electronics Store - Best Electronics Shop in Mumbai
shopMetaDescription: Discover premium electronics at John Electronics Store. Best prices, quality products, and excellent service in Mumbai. Mobile phones, laptops, accessories.
shopMetaKeywords[0]: electronics
shopMetaKeywords[1]: mobile phones
shopMetaKeywords[2]: laptops
shopMetaKeywords[3]: mumbai
shopMetaKeywords[4]: gadgets
shopMetaTags[0]: trusted
shopMetaTags[1]: quality
shopMetaTags[2]: authorized dealer
mainCategory: 507f1f77bcf86cd799439011
subCategory: 507f1f77bcf86cd799439012
shopPincode: 400058
shopAddressLine1: Shop No. 123, Electronics Plaza
shopAddressLine2: Near Andheri Station
shopLocation: Andheri West
nearbyLocation: Andheri Station, Metro Station
shopImages: [file upload 1]
shopImages: [file upload 2]
shopImages: [file upload 3]
```

**Response:**
```json
{
  "success": true,
  "message": "Shop listed successfully",
  "data": {
    "shop": {
      "shopName": "John Electronics Store",
      "shopDescription": "Best electronics store in Mumbai with premium quality products and excellent customer service. We specialize in mobile phones, laptops, and accessories.",
      "shopMetaTitle": "John Electronics Store - Best Electronics Shop in Mumbai",
      "shopMetaDescription": "Discover premium electronics at John Electronics Store. Best prices, quality products, and excellent service in Mumbai. Mobile phones, laptops, accessories.",
      "shopMetaKeywords": ["electronics", "mobile phones", "laptops", "mumbai", "gadgets"],
      "shopMetaTags": ["trusted", "quality", "authorized dealer"],
      "shopImages": [
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid1.jpg",
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid2.jpg",
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid3.jpg"
      ],
      "category": {
        "mainCategory": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Electronics",
          "icon": "https://example.com/electronics-icon.png"
        },
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mobile Phones",
          "image": "https://example.com/mobile-phones-image.png",
          "thumbnail": "https://example.com/mobile-phones-thumbnail.png"
        }
      },
      "address": {
        "pincode": "400058",
        "addressLine1": "Shop No. 123, Electronics Plaza",
        "addressLine2": "Near Andheri Station",
        "location": "Andheri West",
        "nearbyLocation": "Andheri Station, Metro Station"
      },
      "isListed": true,
      "listedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Shop Listing Details
**GET** `/vendor/shop/listing`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shop": {
      "shopName": "John Electronics Store",
      "shopDescription": "Best electronics store in Mumbai with premium quality products and excellent customer service. We specialize in mobile phones, laptops, and accessories.",
      "shopMetaTitle": "John Electronics Store - Best Electronics Shop in Mumbai",
      "shopMetaDescription": "Discover premium electronics at John Electronics Store. Best prices, quality products, and excellent service in Mumbai. Mobile phones, laptops, accessories.",
      "shopMetaKeywords": ["electronics", "mobile phones", "laptops", "mumbai", "gadgets"],
      "shopMetaTags": ["trusted", "quality", "authorized dealer"],
      "shopImages": [
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid1.jpg",
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid2.jpg",
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid3.jpg"
      ],
      "category": {
        "mainCategory": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Electronics",
          "icon": "https://example.com/electronics-icon.png",
          "slug": "electronics"
        },
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mobile Phones",
          "image": "https://example.com/mobile-phones-image.png",
          "thumbnail": "https://example.com/mobile-phones-thumbnail.png",
          "slug": "mobile-phones"
        }
      },
      "address": {
        "pincode": "400058",
        "addressLine1": "Shop No. 123, Electronics Plaza",
        "addressLine2": "Near Andheri Station",
        "location": "Andheri West",
        "nearbyLocation": "Andheri Station, Metro Station"
      },
      "isListed": true,
      "listedAt": "2024-01-15T10:30:00.000Z"
    },
    "subscription": {
      "currentPlan": "6months",
      "status": "active",
      "features": {
        "maxProducts": 100,
        "maxImages": 500,
        "prioritySupport": true,
        "featuredListing": false
      }
    }
  }
}
```

### Update Shop Listing
**POST** `/vendor/shop/listing/update`

**Note:** This API allows updating shop details including name, description, meta information, categories, address, and images. You can update individual fields or multiple fields at once. For file uploads, use the field name `shopImages` for shop images (maximum 10 images, 200MB each).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
shopName: John Electronics Store (Updated)
shopDescription: Updated description with latest offerings and services
shopMetaTitle: John Electronics Store - Updated Title
shopMetaDescription: Updated meta description for better SEO
shopMetaKeywords[0]: updated
shopMetaKeywords[1]: electronics
shopMetaKeywords[2]: gadgets
shopMetaTags[0]: trusted
shopMetaTags[1]: premium
mainCategory: 507f1f77bcf86cd799439011
subCategory: 507f1f77bcf86cd799439012
shopPincode: 400059
shopAddressLine1: Shop No. 456, New Electronics Plaza
shopAddressLine2: Near Metro Station
shopLocation: Andheri East
nearbyLocation: Metro Station, Bus Stand
shopImages: [new file upload 1]
shopImages: [new file upload 2]
```

**Response:**
```json
{
  "success": true,
  "message": "Shop listing updated successfully",
  "data": {
    "shop": {
      "shopName": "John Electronics Store (Updated)",
      "shopDescription": "Updated description with latest offerings and services",
      "shopMetaTitle": "John Electronics Store - Updated Title",
      "shopMetaDescription": "Updated meta description for better SEO",
      "shopMetaKeywords": ["updated", "electronics", "gadgets"],
      "shopMetaTags": ["trusted", "premium"],
      "shopImages": [
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid4.jpg",
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid5.jpg"
      ],
      "category": {
        "mainCategory": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Electronics",
          "icon": "https://example.com/electronics-icon.png",
          "slug": "electronics"
        },
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mobile Phones",
          "image": "https://example.com/mobile-phones-image.png",
          "thumbnail": "https://example.com/mobile-phones-thumbnail.png",
          "slug": "mobile-phones"
        }
      },
      "address": {
        "pincode": "400059",
        "addressLine1": "Shop No. 456, New Electronics Plaza",
        "addressLine2": "Near Metro Station",
        "location": "Andheri East",
        "nearbyLocation": "Metro Station, Bus Stand"
      },
      "isListed": true,
      "listedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Add More Shop Images
**POST** `/vendor/shop/images/add`

**Note:** This API allows adding more images to existing shop listing without replacing current images. For file uploads, use the field name `shopImages` for shop images (maximum 10 images total, 200MB each).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
shopImages: [new file upload 1]
shopImages: [new file upload 2]
shopImages: [new file upload 3]
```

**Response:**
```json
{
  "success": true,
  "message": "Shop images added successfully",
  "data": {
    "addedImages": [
      "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid6.jpg",
      "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid7.jpg",
      "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid8.jpg"
    ],
    "totalImages": 6,
    "maxImagesAllowed": 10,
    "remainingSlots": 4
  }
}
```

---

## 📋 KYC Management

### Step 7: Upload PAN Card
**POST** `/vendor/kyc/pan`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
panNumber: ABCDE1234F
panImage: [file upload]
```

**Response:**
```json
{
  "success": true,
  "message": "PAN card uploaded successfully",
  "data": {
    "panNumber": "ABCDE1234F",
    "panImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/pan/uuid.jpg"
  }
}
```

### Step 8: Upload Aadhar Card
**POST** `/vendor/kyc/aadhar`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
aadharNumber: 123456789012
aadharFrontImage: [file upload]
aadharBackImage: [file upload]
```

**Response:**
```json
{
  "success": true,
  "message": "Aadhar card uploaded successfully",
  "data": {
    "aadharNumber": "123456789012",
    "aadharFrontImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid1.jpg",
    "aadharBackImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid2.jpg"
  }
}
```

### Get KYC Status
**GET** `/vendor/kyc/status`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "panNumber": "ABCDE1234F",
    "panImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/pan/uuid.jpg",
    "aadharNumber": "123456789012",
    "aadharFrontImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid1.jpg",
    "aadharBackImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid2.jpg",
    "isVerified": false,
    "verificationDate": null,
    "verifiedBy": null
  }
}
```

---

## 📂 Category Management

### Get All Main Categories
**GET** `/vendor/categories/main`

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
      "title": "Electronics",
      "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png",
      "slug": "electronics",
      "description": "Electronic gadgets and devices"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Fashion",
      "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/fashion-icon.png",
      "slug": "fashion",
      "description": "Clothing and fashion accessories"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Home & Garden",
      "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/home-garden-icon.png",
      "slug": "home-garden",
      "description": "Home improvement and garden supplies"
    }
  ]
}
```

### Get Sub Categories by Main Category
**GET** `/vendor/categories/sub/:mainCategoryId`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Electronics",
      "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png",
      "slug": "electronics"
    },
    "subCategories": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Mobile Phones",
        "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones-image.png",
        "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones-thumbnail.png",
        "slug": "mobile-phones",
        "description": "Smartphones and mobile devices"
      },
      {
        "_id": "507f1f77bcf86cd799439022",
        "title": "Laptops",
        "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/laptops-image.png",
        "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/laptops-thumbnail.png",
        "slug": "laptops",
        "description": "Laptops and portable computers"
      },
      {
        "_id": "507f1f77bcf86cd799439023",
        "title": "Accessories",
        "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/accessories-image.png",
        "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/accessories-thumbnail.png",
        "slug": "accessories",
        "description": "Electronic accessories and peripherals"
      }
    ]
  }
}
```

### Get All Categories (Tree Structure)
**GET** `/vendor/categories/all`

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
      "title": "Electronics",
      "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/electronics-icon.png",
      "slug": "electronics",
      "description": "Electronic gadgets and devices",
      "subCategories": [
        {
          "_id": "507f1f77bcf86cd799439021",
          "title": "Mobile Phones",
          "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones-image.png",
          "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mobile-phones-thumbnail.png",
          "slug": "mobile-phones",
          "description": "Smartphones and mobile devices"
        },
        {
          "_id": "507f1f77bcf86cd799439022",
          "title": "Laptops",
          "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/laptops-image.png",
          "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/laptops-thumbnail.png",
          "slug": "laptops",
          "description": "Laptops and portable computers"
        }
      ]
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Fashion",
      "icon": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/categories/fashion-icon.png",
      "slug": "fashion",
      "description": "Clothing and fashion accessories",
      "subCategories": [
        {
          "_id": "507f1f77bcf86cd799439024",
          "title": "Men's Clothing",
          "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mens-clothing-image.png",
          "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/mens-clothing-thumbnail.png",
          "slug": "mens-clothing",
          "description": "Clothing for men"
        },
        {
          "_id": "507f1f77bcf86cd799439025",
          "title": "Women's Clothing",
          "image": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/womens-clothing-image.png",
          "thumbnail": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/subcategories/womens-clothing-thumbnail.png",
          "slug": "womens-clothing",
          "description": "Clothing for women"
        }
      ]
    }
  ]
}
```

---

## 👤 Profile Management

### Get Vendor Profile Details
**GET** `/vendor/profile`

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
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "vendorDetails": {
      "shopName": "John Electronics Store",
      "shopDescription": "Best electronics store in Mumbai with premium quality products and excellent customer service.",
      "shopMetaTitle": "John Electronics Store - Best Electronics Shop in Mumbai",
      "shopMetaDescription": "Discover premium electronics at John Electronics Store. Best prices, quality products, and excellent service in Mumbai.",
      "shopMetaKeywords": ["electronics", "mobile phones", "laptops", "mumbai", "gadgets"],
      "shopMetaTags": ["trusted", "quality", "authorized dealer"],
      "shopImages": [
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid1.jpg",
        "https://elboz.s3.eu-north-1.amazonaws.com/uploads/shops/john-electronics-store/uuid2.jpg"
      ],
      "isShopListed": true,
      "shopListedAt": "2024-01-15T10:30:00.000Z",
      "shopAddress": {
        "pincode": "400058",
        "addressLine1": "Shop No. 123, Electronics Plaza",
        "addressLine2": "Near Andheri Station",
        "location": "Andheri West",
        "nearbyLocation": "Andheri Station, Metro Station"
      },
      "gstNumber": "22AAAAA0000A1Z5",
      "vendorAddress": {
        "doorNumber": "123",
        "street": "Electronics Street",
        "location": "Andheri West",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400058",
        "country": "India"
      },
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Electronics",
        "icon": "https://example.com/electronics-icon.png",
        "slug": "electronics"
      },
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mobile Phones",
        "image": "https://example.com/mobile-phones-image.png",
        "thumbnail": "https://example.com/mobile-phones-thumbnail.png",
        "slug": "mobile-phones"
      },
      "kyc": {
        "panNumber": "ABCDE1234F",
        "panImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/pan/uuid.jpg",
        "aadharNumber": "123456789012",
        "aadharFrontImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid1.jpg",
        "aadharBackImage": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/kyc/john-electronics-store/aadhar/uuid2.jpg",
        "isVerified": false,
        "verificationDate": null,
        "verifiedBy": null
      },
      "subscription": {
        "currentPlan": "6months",
        "status": "active",
        "amount": 4999,
        "startDate": "2024-01-15T10:30:00.000Z",
        "endDate": "2024-07-15T10:30:00.000Z",
        "isActive": true,
        "razorpaySubscriptionId": "sub_1234567890",
        "razorpayPaymentId": "pay_1234567890",
        "features": {
          "maxProducts": 100,
          "maxImages": 500,
          "prioritySupport": true,
          "featuredListing": false
        }
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
        "balance": 2650,
        "transactions": [
          {
            "type": "credit",
            "amount": 1000,
            "description": "Product sale - Samsung Galaxy S24 Ultra",
            "date": "2024-01-15T10:30:00.000Z"
          },
          {
            "type": "credit",
            "amount": 150,
            "description": "Referral commission for Jane Mobile Store",
            "date": "2024-01-15T10:30:00.000Z"
          }
        ]
      },
      "withdrawalRequests": [
        {
          "_id": "507f1f77bcf86cd799439011",
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
          "_id": "507f1f77bcf86cd799439012",
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
          "processedBy": "507f1f77bcf86cd799439013",
          "adminNotes": "Payment processed successfully",
          "transactionId": "TXN_1705075200000_507f1f77bcf86cd799439012"
        }
      ],
      "averageRating": 4.5,
      "totalRatings": 25,
      "ratingDistribution": {
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 8,
        "5": 11
      }
    },
    "hasActiveSubscription": true,
    "profileCompletion": {
      "basicInfo": true,
      "businessInfo": true,
      "address": true,
      "shopInfo": true,
      "shopAddress": true,
      "categories": true,
      "kyc": true,
      "subscription": true,
      "shopListed": true
    }
  }
}
```

---

## 📦 Product Management

### Step 9: Create Product (Requires Active Subscription & Shop Listing)
**POST** `/vendor/products`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
name: Samsung Galaxy S24 Ultra
description: Latest Samsung flagship smartphone with S Pen, 200MP camera, and AI features. Perfect for professionals and power users.
price[amount]: 129999
price[currency]: INR
price[isNegotiable]: true
specifications[0][name]: Brand
specifications[0][value]: Samsung
specifications[1][name]: Model
specifications[1][value]: Galaxy S24 Ultra
specifications[2][name]: Storage
specifications[2][value]: 256GB
specifications[3][name]: Color
specifications[3][value]: Titanium Gray
specifications[4][name]: Warranty
specifications[4][value]: 1 Year Manufacturer
features[0]: S Pen included
features[1]: 200MP Camera
features[2]: AI Features
features[3]: 5G Support
features[4]: Wireless Charging
tags[0]: flagship
tags[1]: samsung
tags[2]: smartphone
tags[3]: 5g
stock[quantity]: 5
stock[isInStock]: true
metaTitle: Samsung Galaxy S24 Ultra - Best Price in Mumbai
metaDescription: Buy Samsung Galaxy S24 Ultra at best price in Mumbai. 200MP camera, S Pen, AI features. Authorized dealer with warranty.
availableInPincodes[0]: 400058
availableInPincodes[1]: 400059
availableInPincodes[2]: 400060
contactInfo[phone]: 9876543210
contactInfo[whatsapp]: 9876543210
contactInfo[email]: sales@johnelectronics.com
images: [file upload 1]
images: [file upload 2]
images: [file upload 3]
```

**Note:** Category fields (`category[mainCategory]` and `category[subCategory]`) are automatically set based on your shop's categories. You cannot create products in different categories than your shop's main and sub categories.

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Samsung Galaxy S24 Ultra",
    "description": "Latest Samsung flagship smartphone with S Pen, 200MP camera, and AI features. Perfect for professionals and power users.",
    "category": {
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Electronics",
        "icon": "https://example.com/icon.png"
      },
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mobile Phones",
        "image": "https://example.com/image.png"
      }
    },
    "price": {
      "amount": 129999,
      "currency": "INR",
      "isNegotiable": true
    },
    "specifications": [
      {
        "name": "Brand",
        "value": "Samsung"
      },
      {
        "name": "Model",
        "value": "Galaxy S24 Ultra"
      },
      {
        "name": "Storage",
        "value": "256GB"
      },
      {
        "name": "Color",
        "value": "Titanium Gray"
      },
      {
        "name": "Warranty",
        "value": "1 Year Manufacturer"
      }
    ],
    "features": ["S Pen included", "200MP Camera", "AI Features", "5G Support", "Wireless Charging"],
    "tags": ["flagship", "samsung", "smartphone", "5g"],
    "stock": {
      "quantity": 5,
      "isInStock": true
    },
    "images": [
      {
        "url": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/catalog/product/john-electronics-store/samsung-galaxy-s24-ultra/uuid1.jpg",
        "isPrimary": true,
        "alt": "Samsung Galaxy S24 Ultra"
      },
      {
        "url": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/catalog/product/john-electronics-store/samsung-galaxy-s24-ultra/uuid2.jpg",
        "isPrimary": false,
        "alt": "Samsung Galaxy S24 Ultra"
      },
      {
        "url": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/catalog/product/john-electronics-store/samsung-galaxy-s24-ultra/uuid3.jpg",
        "isPrimary": false,
        "alt": "Samsung Galaxy S24 Ultra"
      }
    ],
    "metaTitle": "Samsung Galaxy S24 Ultra - Best Price in Mumbai",
    "metaDescription": "Buy Samsung Galaxy S24 Ultra at best price in Mumbai. 200MP camera, S Pen, AI features. Authorized dealer with warranty.",
    "availableInPincodes": ["400058", "400059", "400060"],
    "contactInfo": {
      "phone": "9876543210",
      "whatsapp": "9876543210",
      "email": "sales@johnelectronics.com"
    },
    "vendor": "507f1f77bcf86cd799439011",
    "views": 0,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get All Vendor Products
**GET** `/vendor/products?page=1&limit=10`

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
      "name": "Samsung Galaxy S24 Ultra",
      "price": {
        "amount": 129999,
        "currency": "INR"
      },
      "views": 45,
      "isActive": true,
      "category": {
        "mainCategory": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Electronics",
          "icon": "https://example.com/icon.png"
        },
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mobile Phones",
          "image": "https://example.com/image.png"
        }
      },
      "stock": {
        "quantity": 5,
        "isInStock": true
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10
  }
}
```

### Get Single Product Details
**GET** `/vendor/products/507f1f77bcf86cd799439011`

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
    "name": "Samsung Galaxy S24 Ultra",
    "description": "Latest Samsung flagship smartphone with S Pen, 200MP camera, and AI features. Perfect for professionals and power users.",
    "category": {
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Electronics",
        "icon": "https://example.com/icon.png"
      },
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mobile Phones",
        "image": "https://example.com/image.png"
      }
    },
    "price": {
      "amount": 129999,
      "currency": "INR",
      "isNegotiable": true
    },
    "specifications": [
      {
        "name": "Brand",
        "value": "Samsung"
      },
      {
        "name": "Model",
        "value": "Galaxy S24 Ultra"
      }
    ],
    "features": ["S Pen included", "200MP Camera", "AI Features", "5G Support", "Wireless Charging"],
    "tags": ["flagship", "samsung", "smartphone", "5g"],
    "stock": {
      "quantity": 5,
      "isInStock": true
    },
    "images": [
      {
        "url": "https://elboz.s3.eu-north-1.amazonaws.com/uploads/catalog/product/john-electronics-store/samsung-galaxy-s24-ultra/uuid1.jpg",
        "isPrimary": true,
        "alt": "Samsung Galaxy S24 Ultra"
      }
    ],
    "views": 45,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Product
**PUT** `/vendor/products/507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (multipart/form-data):**
```
name: Samsung Galaxy S24 Ultra (Updated)
description: Updated description with latest features
price[amount]: 125000
price[isNegotiable]: false
stock[quantity]: 3
images: [new file upload]
```

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Samsung Galaxy S24 Ultra (Updated)",
    "description": "Updated description with latest features",
    "price": {
      "amount": 125000,
      "currency": "INR",
      "isNegotiable": false
    },
    "stock": {
      "quantity": 3,
      "isInStock": true
    }
  }
}
```

### Delete Product
**DELETE** `/vendor/products/507f1f77bcf86cd799439011`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 💰 Wallet Management

### Get Wallet Details
**GET** `/vendor/wallet`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 2500,
    "transactions": [
      {
        "type": "credit",
        "amount": 1000,
        "description": "Product sale - Samsung Galaxy S24 Ultra",
        "date": "2024-01-15T10:30:00.000Z"
      },
      {
        "type": "credit",
        "amount": 150,
        "description": "Referral commission for Jane Mobile Store (Jane Mobile Store)",
        "date": "2024-01-15T10:30:00.000Z"
      }
    ],
    "withdrawalRequests": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "amount": 500,
        "status": "pending",
        "requestDate": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Request Withdrawal
**POST** `/vendor/wallet/withdraw`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request Body (UPI Method):**
```json
{
  "amount": 500,
  "paymentMethod": "upi",
  "upiId": "john@paytm"
}
```

**Request Body (Bank Transfer Method):**
```json
{
  "amount": 500,
  "paymentMethod": "bank",
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234",
    "accountHolderName": "John Electronics Store",
    "bankName": "State Bank of India"
  }
}
```

**Validation Rules:**
- **Amount**: Minimum ₹100, must not exceed wallet balance
- **Payment Method**: Must be either "upi" or "bank"
- **UPI ID**: Required for UPI method, format: name@upi (e.g., john@paytm, john@okicici)
- **Bank Details**: All fields required for bank method
  - Account Number: 9-18 digits
  - IFSC Code: 11 characters (4 letters + 0 + 6 alphanumeric)
  - Account Holder Name: Required
  - Bank Name: Required

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "requestId": "507f1f77bcf86cd799439011",
    "amount": 500,
    "paymentMethod": "upi",
    "status": "pending",
    "requestDate": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**Insufficient Balance:**
```json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
```

**Invalid UPI ID:**
```json
{
  "success": false,
  "message": "Invalid UPI ID format. Use format: name@upi"
}
```

**Invalid Bank Details:**
```json
{
  "success": false,
  "message": "Invalid IFSC code format"
}
```

---

## 🎯 Referral Management

### Get Referral Details
**GET** `/vendor/referral`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "REF123456",
    "referredBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Referrer Name",
      "vendorDetails": {
        "shopName": "Referrer Shop"
      }
    },
    "referredVendors": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Mobile Store",
        "email": "jane@mobile.com",
        "vendorDetails": {
          "shopName": "Jane Mobile Store",
          "subscription": {
            "isActive": true,
            "plan": "6months"
          }
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totalReferrals": 1,
    "commissions": {
      "total": 1,
      "paid": 1,
      "pending": 0,
      "totalEarned": 150,
      "pendingAmount": 0
    },
    "commissionSettings": {
      "percentage": 3,
      "isActive": true,
      "minimumAmount": 100,
      "maximumAmount": 1000
    },
    "walletBalance": 2650,
    "recentCommissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "referredVendor": {
          "name": "Jane Mobile Store",
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
        "payment": {
          "paidAt": "2024-01-15T10:30:00.000Z",
          "transactionId": "TXN_1705312200000_507f1f77bcf86cd799439011"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Get Detailed Referral Commissions
**GET** `/vendor/referral/commissions?page=1&limit=10&status=paid`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (all, pending, paid, cancelled)

**Response:**
```json
{
  "success": true,
  "data": {
    "commissions": [
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
          "status": "active",
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-07-01T00:00:00.000Z"
        },
        "commission": {
          "percentage": 3,
          "amount": 150,
          "currency": "INR"
        },
        "status": "paid",
        "payment": {
          "paidAt": "2024-01-15T10:30:00.000Z",
          "transactionId": "TXN_1705312200000_507f1f77bcf86cd799439011"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totals": {
      "totalCommissions": 1,
      "totalAmount": 150,
      "paidAmount": 150,
      "pendingAmount": 0
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### Get Comprehensive Referral Analytics & Wallet Balance
**GET** `/vendor/referral/analytics`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vendorInfo": {
      "name": "John Electronics Store",
      "email": "john@electronics.com",
      "referralCode": "REF123456",
      "referredBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Referrer Name"
      }
    },
    "wallet": {
      "balance": 2650,
      "withdrawalRequests": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "amount": 500,
          "status": "pending",
          "requestDate": "2024-01-15T10:30:00.000Z",
          "processedDate": null
        },
        {
          "_id": "507f1f77bcf86cd799439012",
          "amount": 1000,
          "status": "approved",
          "requestDate": "2024-01-10T10:30:00.000Z",
          "processedDate": "2024-01-12T10:30:00.000Z"
        }
      ]
    },
    "referralStats": {
      "totalReferrals": 15,
      "activeSubscriptions": 8,
      "expiredSubscriptions": 3,
      "pendingSubscriptions": 2,
      "noSubscription": 2,
      "subscriptionConversionRate": 73.33,
      "activeConversionRate": 53.33,
      "recentReferrals": 5,
      "recentCommissions": 3
    },
    "commissionStats": {
      "totalCommissions": 12,
      "paidCommissions": 10,
      "pendingCommissions": 2,
      "totalEarned": 750,
      "pendingAmount": 150,
      "commissionByPlan": [
        {
          "_id": "6months",
          "totalAmount": 450,
          "count": 6,
          "paidAmount": 400,
          "paidCount": 5
        },
        {
          "_id": "1year",
          "totalAmount": 300,
          "count": 4,
          "paidAmount": 250,
          "paidCount": 3
        },
        {
          "_id": "3months",
          "totalAmount": 150,
          "count": 2,
          "paidAmount": 100,
          "paidCount": 2
        }
      ]
    },
    "referredVendors": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Mobile Store",
        "email": "jane@mobile.com",
        "shopName": "Jane Mobile Store",
        "subscription": {
          "plan": "6months",
          "status": "active",
          "isActive": true,
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-07-01T00:00:00.000Z"
        },
        "isShopListed": true,
        "joinedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Tech Gadgets",
        "email": "tech@gadgets.com",
        "shopName": "Tech Gadgets",
        "subscription": {
          "plan": "1year",
          "status": "active",
          "isActive": true,
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2025-01-01T00:00:00.000Z"
        },
        "isShopListed": true,
        "joinedAt": "2024-01-10T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Mobile World",
        "email": "mobile@world.com",
        "shopName": "Mobile World",
        "subscription": null,
        "isShopListed": false,
        "joinedAt": "2024-01-05T10:30:00.000Z"
      }
    ],
    "recentCommissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "referredVendor": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Jane Mobile Store",
          "shopName": "Jane Mobile Store"
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
        "createdAt": "2024-01-15T10:30:00.000Z",
        "paidAt": "2024-01-15T11:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "referredVendor": {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Tech Gadgets",
          "shopName": "Tech Gadgets"
        },
        "subscription": {
          "plan": "1year",
          "amount": 8999,
          "status": "active"
        },
        "commission": {
          "percentage": 3,
          "amount": 270
        },
        "status": "pending",
        "createdAt": "2024-01-10T10:30:00.000Z",
        "paidAt": null
      }
    ]
  }
}
```

---

## 📋 Complete Workflow Summary

### Vendor Onboarding Process:

1. **🔐 Vendor Signup** (`POST /auth/vendor-signup`)
   - Register with basic details, KYC info, and security questions
   - Upload shop images during signup
   - Account created but not fully activated

2. **🔑 Vendor Login** (`POST /auth/login`)
   - Login with email and password
   - Receive JWT token for authenticated requests

3. **💳 Choose Subscription Plan** (`GET /vendor/subscription/plans` → `POST /vendor/subscription`)
   - View available plans (3 months, 6 months, 1 year)
   - Select and pay for subscription via Razorpay
   - Subscription status becomes 'active' after payment

4. **📊 Monitor Subscription** (`GET /vendor/subscription/details`)
   - Check subscription validity and remaining days
   - View subscription history and statistics
   - Get renewal recommendations and available plans
   - Track payment status and Razorpay details

5. **🏪 List Shop** (`POST /vendor/shop/listing`)
   - Requires active subscription
   - Upload shop details, meta information, and images
   - Shop becomes visible to customers

6. **📋 Complete KYC** (`POST /vendor/kyc/pan` → `POST /vendor/kyc/aadhar`)
   - Upload PAN card details and image
   - Upload Aadhar card details and front/back images
   - KYC verification by admin (optional)

7. **📦 Create Products** (`POST /vendor/products`)
   - Requires active subscription AND shop listing
   - Upload products with multiple images
   - Products become visible to customers

### Subscription Plans Comparison:

| Plan | Duration | Price | Max Products | Max Images | Priority Support | Featured Listing |
|------|----------|-------|--------------|------------|------------------|------------------|
| 3 Months | 90 days | ₹2,999 | 50 | 200 | ❌ | ❌ |
| 6 Months | 180 days | ₹4,999 | 100 | 500 | ✅ | ❌ |
| 1 Year | 365 days | ₹8,999 | 200 | 1000 | ✅ | ✅ |

---

## ⚠️ Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Authorization Error
```json
{
  "success": false,
  "message": "Access denied. Vendor role required."
}
```

### Subscription Required Error
```json
{
  "success": false,
  "message": "Active subscription required to list your shop"
}
```

### Shop Listing Required Error
```json
{
  "success": false,
  "message": "Shop must be listed before creating products"
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

### Not Found Error
```json
{
  "success": false,
  "message": "Product not found"
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

### Image Limits by Subscription Plan
- **3 Months Plan**: 200 images total
- **6 Months Plan**: 500 images total
- **1 Year Plan**: 1000 images total

---

## 🔒 Security & Rate Limiting

### Rate Limits
- Authentication endpoints: 5 requests per minute
- Product creation: 10 requests per hour
- Image uploads: 20 requests per hour
- Shop listing: 5 requests per hour
- Other endpoints: 100 requests per minute

### Security Features
1. **JWT Authentication**: All authenticated requests require valid JWT tokens
2. **File Validation**: All uploaded files are validated for type and size
3. **Input Sanitization**: All user inputs are sanitized and validated
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
5. **CORS Protection**: Cross-origin requests are properly configured
6. **Subscription Validation**: All features require active subscription
7. **Shop Listing Validation**: Product creation requires shop to be listed

---

## 🧪 Testing Examples

### Test Environment Setup
```bash
# Base URL
http://localhost:3000/api

# Test vendor credentials
{
  "email": "test@vendor.com",
  "password": "TestPass123!"
}
```

### Sample Test Data
```json
{
  "vendor": {
    "name": "Test Electronics Store",
    "email": "test@electronics.com",
    "password": "TestPass123!",
    "phone": "9876543210",
    "gstNumber": "22AAAAA0000A1Z5"
  },
  "shop": {
    "shopName": "Test Electronics Store",
    "shopDescription": "Test shop description for testing purposes",
    "shopMetaTitle": "Test Electronics Store - Best Electronics in Mumbai",
    "shopMetaDescription": "Test shop meta description for SEO",
    "shopMetaKeywords": ["test", "electronics", "mumbai", "shop"]
  },
  "product": {
    "name": "Test Smartphone",
    "description": "Test smartphone description for testing",
    "price": 15000,
    "specifications": [
      {"name": "Brand", "value": "Test Brand"},
      {"name": "Model", "value": "Test Model"}
    ]
  }
}
```

---

## ⭐ Ratings & Reviews Management

### Get Vendor's Ratings and Reviews
**GET** `/vendor/ratings?page=1&limit=10&status=approved`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status - pending, approved, rejected, all (default: approved)

**Response:**
```json
{
  "success": true,
  "data": {
    "ratings": [
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
        "customer": {
          "_id": "60f7b3b3b3b3b3b3b3b3b14",
          "name": "John Customer",
          "profileImage": "https://bucket.s3.amazonaws.com/profiles/customer1.jpg"
        },
        "isAnonymous": false,
        "tags": ["fast delivery", "good quality"],
        "helpfulVotes": [
          {
            "user": "60f7b3b3b3b3b3b3b3b3b15",
            "isHelpful": true,
            "votedAt": "2023-12-01T12:00:00.000Z"
          }
        ],
        "vendorReply": {
          "content": "Thank you for your feedback!",
          "repliedAt": "2023-12-01T13:00:00.000Z"
        },
        "status": "approved",
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

### Get Rating Details
**GET** `/vendor/ratings/:id`

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
    "customer": {
      "_id": "60f7b3b3b3b3b3b3b3b3b14",
      "name": "John Customer",
      "profileImage": "https://bucket.s3.amazonaws.com/profiles/customer1.jpg"
    },
    "isAnonymous": false,
    "tags": ["fast delivery", "good quality"],
    "helpfulVotes": [
      {
        "user": "60f7b3b3b3b3b3b3b3b3b15",
        "isHelpful": true,
        "votedAt": "2023-12-01T12:00:00.000Z"
      }
    ],
    "vendorReply": {
      "content": "Thank you for your feedback!",
      "repliedAt": "2023-12-01T13:00:00.000Z"
    },
    "status": "approved",
    "createdAt": "2023-12-01T10:00:00.000Z"
  }
}
```

### Reply to a Review
**POST** `/vendor/ratings/:id/reply`

**Request Body:**
```json
{
  "reply": "Thank you for your feedback! We appreciate your business and look forward to serving you again."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reply added successfully",
  "data": {
    "reply": {
      "content": "Thank you for your feedback! We appreciate your business and look forward to serving you again.",
      "repliedAt": "2023-12-01T14:00:00.000Z"
    }
  }
}
```

### Get Rating Analytics
**GET** `/vendor/analytics/ratings`

**Response:**
```json
{
  "success": true,
  "data": {
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
    },
    "ratingsByMonth": [
      {
        "_id": {
          "year": 2023,
          "month": 12
        },
        "count": 5,
        "averageRating": 4.6
      }
    ],
    "categoryRatings": {
      "service": 4.5,
      "quality": 4.3,
      "communication": 4.7,
      "value": 4.4
    }
  }
}
```

---

## 📞 Support

For technical support or questions:
- Email: support@elboz.com
- Phone: +91-9876543210
- Priority support available for 6-month and 1-year subscription plans

---

*Last updated: January 2024*
*Version: 2.1* 