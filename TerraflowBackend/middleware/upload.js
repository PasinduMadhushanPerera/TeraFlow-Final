const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const productImagesDir = path.join(uploadsDir, 'products');
const profileImagesDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

// Configure multer storage for products
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImagesDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${extension}`);
  }
});

// Configure multer storage for profile images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileImagesDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// Configure profile upload (single image)
const profileUpload = multer({
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for profile images
    files: 1 // Single file only
  }
});

// Middleware for single image upload
const uploadSingle = upload.single('image');

// Middleware for multiple image upload
const uploadMultiple = upload.array('images', 10);

// Middleware for mixed upload (single main image + multiple gallery images)
const uploadMixed = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'gallery_images', maxCount: 9 }
]);

const uploadProfileImage = profileUpload.single('profile_image');

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Utility function to delete uploaded files (for cleanup on error)
const deleteUploadedFiles = (files) => {
  if (!files) return;
  
  const filesToDelete = [];
  
  if (Array.isArray(files)) {
    filesToDelete.push(...files);
  } else if (typeof files === 'object') {
    Object.values(files).forEach(fileArray => {
      if (Array.isArray(fileArray)) {
        filesToDelete.push(...fileArray);
      } else {
        filesToDelete.push(fileArray);
      }
    });
  }
  
  filesToDelete.forEach(file => {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// Utility function to get file URL
const getFileUrl = (filename) => {
  return `/uploads/products/${filename}`;
};

// Helper function to get profile image URL
const getProfileImageUrl = (filename) => {
  return `/uploads/profiles/${filename}`;
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadMixed,
  handleUploadError,
  deleteUploadedFiles,
  getFileUrl,
  uploadProfileImage,
  getProfileImageUrl
};
