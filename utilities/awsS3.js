const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// S3 Client Setup (no ACL) - matches the working approach
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Bucket configuration
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'elboz';
const BUCKET_REGION = process.env.AWS_REGION || 'eu-north-1';

// Generate custom path structure
const generateCustomPath = (baseFolder, subFolders = []) => {
  const pathParts = [baseFolder, ...subFolders];
  return pathParts.join('/');
};

// Multer configuration for S3 upload with custom paths
const uploadToS3 = (baseFolder = 'uploads', subFolders = []) => {
  const customPath = generateCustomPath(baseFolder, subFolders);
  
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: BUCKET_NAME,
      // ❌ REMOVE ACL to prevent AccessControlListNotSupported error
      // acl: 'public-read', // <-- removed this line
      metadata: function (req, file, cb) {
        cb(null, { 
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          customPath: customPath
        });
      },
      key: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${customPath}/${uuidv4()}${fileExtension}`;
        cb(null, fileName);
      }
    }),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
      files: 20 // Maximum 20 files
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Only ${allowedTypes.source} files are allowed!`));
      }
    }
  });
};

// Upload single image with custom path
const uploadSingleImage = (baseFolder = 'uploads', subFolders = []) => {
  return uploadToS3(baseFolder, subFolders).single('image');
};

// Upload multiple images with custom path
const uploadMultipleImages = (baseFolder = 'uploads', subFolders = [], maxCount = 20) => {
  return uploadToS3(baseFolder, subFolders).array('images', maxCount);
};

// Upload single file with custom path
const uploadSingleFile = (baseFolder = 'uploads', subFolders = [], fieldName = 'file') => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: BUCKET_NAME,
      // ❌ REMOVE ACL to prevent AccessControlListNotSupported error
      // acl: 'public-read', // <-- removed this line
      metadata: function (req, file, cb) {
        cb(null, { 
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          customPath: generateCustomPath(baseFolder, subFolders)
        });
      },
      key: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${generateCustomPath(baseFolder, subFolders)}/${uuidv4()}${fileExtension}`;
        cb(null, fileName);
      }
    }),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Only ${allowedTypes.source} files are allowed!`));
      }
    }
  }).single(fieldName);
};

// Specialized upload functions for different content types
const uploadProductImages = (vendorName, productName) => {
  return uploadMultipleImages('uploads/catalog/product', [vendorName, productName]);
};

const uploadShopImages = (vendorName) => {
  return uploadToS3('uploads/shops', [vendorName]).array('shopImages', 10);
};

const uploadProfileImage = (userId) => {
  return uploadSingleImage('uploads/profiles', [userId]);
};

const uploadKYCImage = (userId, documentType) => {
  return uploadSingleImage('uploads/kyc', [userId, documentType]);
};

const uploadVendorImages = (vendorName) => {
  return uploadMultipleImages('uploads/vendors', [vendorName]);
};

// Upload subcategory images (image and thumbnail)
const uploadSubcategoryImages = (baseFolder = 'uploads/subcategories', subFolders = []) => {
  const customPath = generateCustomPath(baseFolder, subFolders);
  
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: BUCKET_NAME,
      // ❌ REMOVE ACL to prevent AccessControlListNotSupported error
      // acl: 'public-read', // <-- removed this line
      metadata: function (req, file, cb) {
        cb(null, { 
          fieldName: file.fieldname,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          customPath: customPath
        });
      },
      key: function (req, file, cb) {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${customPath}/${uuidv4()}${fileExtension}`;
        cb(null, fileName);
      }
    }),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
      files: 2 // Maximum 2 files (image and thumbnail)
    },
    fileFilter: (req, file, cb) => {
      // Check file type
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Only ${allowedTypes.source} files are allowed!`));
      }
    }
  }).fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]);
};

// Delete image from S3
const deleteImageFromS3 = async (imageUrl) => {
  try {
    if (!imageUrl) return true;
    
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    
    // Extract key from URL
    const urlParts = imageUrl.split('/');
    const key = urlParts.slice(3).join('/'); // Remove https://bucket.s3.region.amazonaws.com/
    
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }));
    
    console.log(`✅ Image deleted successfully: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting image from S3:', error.message);
    return false;
  }
};

// Delete multiple images
const deleteMultipleImagesFromS3 = async (imageUrls) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return true;
  
  try {
    const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
    
    const keys = imageUrls.map(url => {
      const urlParts = url.split('/');
      return urlParts.slice(3).join('/');
    });
    
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false
      }
    };
    
    const result = await s3.send(new DeleteObjectsCommand(deleteParams));
    console.log(`✅ Deleted ${result.Deleted.length} images successfully`);
    return result;
  } catch (error) {
    console.error('❌ Error deleting multiple images from S3:', error.message);
    return false;
  }
};

// Get signed URL for temporary access
const getSignedUrlForS3 = async (key, expiresIn = 3600) => {
  try {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    return await getSignedUrl(s3, command, { expiresIn });
  } catch (error) {
    console.error('❌ Error generating signed URL:', error.message);
    return null;
  }
};

// Upload buffer to S3 with custom path
const uploadBufferToS3 = async (buffer, fileName, baseFolder = 'uploads', subFolders = [], contentType = 'image/jpeg') => {
  try {
    const { Upload } = require('@aws-sdk/lib-storage');
    const customPath = generateCustomPath(baseFolder, subFolders);
    const key = `${customPath}/${uuidv4()}-${fileName}`;
    
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType
        // ❌ REMOVE ACL to prevent AccessControlListNotSupported error
        // ACL: 'public-read' // <-- removed this line
      }
    });
    
    const result = await upload.done();
    return result.Location;
  } catch (error) {
    console.error('❌ Error uploading buffer to S3:', error.message);
    throw error;
  }
};

// Get bucket URL
const getBucketUrl = () => {
  return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com`;
};

// Get full URL for a file
const getFileUrl = (key) => {
  return `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${key}`;
};

// List files in a specific path
const listFilesInPath = async (baseFolder = 'uploads', subFolders = []) => {
  try {
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    const prefix = generateCustomPath(baseFolder, subFolders) + '/';
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix
    });
    
    const result = await s3.send(command);
    return result.Contents || [];
  } catch (error) {
    console.error('❌ Error listing files:', error.message);
    return [];
  }
};

console.log('🚀 AWS S3 utilities initialized');
console.log(`📍 Region: ${BUCKET_REGION}`);
console.log(`🪣 Bucket: ${BUCKET_NAME}`);

module.exports = {
  s3,
  BUCKET_NAME,
  BUCKET_REGION,
  getBucketUrl,
  getFileUrl,
  generateCustomPath,
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingleFile,
  uploadProductImages,
  uploadShopImages,
  uploadProfileImage,
  uploadKYCImage,
  uploadVendorImages,
  uploadSubcategoryImages,
  deleteImageFromS3,
  deleteMultipleImagesFromS3,
  getSignedUrl: getSignedUrlForS3,
  uploadBufferToS3,
  listFilesInPath
}; 