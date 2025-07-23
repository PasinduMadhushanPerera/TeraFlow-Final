const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deleteProfileImage
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const { uploadProfileImage: uploadProfileImageMiddleware } = require('../middleware/upload');

// Validation rules
const registerValidation = [
  body('role').isIn(['customer', 'supplier']).withMessage('Role must be customer or supplier'),
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobile').optional().isLength({ min: 10, max: 15 }).withMessage('Mobile number must be 10-15 digits'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('businessName').optional().trim().isLength({ max: 200 }).withMessage('Business name must not exceed 200 characters'),
  body('businessAddress').optional().trim().isLength({ max: 500 }).withMessage('Business address must not exceed 500 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('full_name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('mobile').optional().isMobilePhone().withMessage('Please provide a valid mobile number'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('business_name').optional().trim().isLength({ max: 200 }).withMessage('Business name must not exceed 200 characters'),
  body('business_address').optional().trim().isLength({ max: 500 }).withMessage('Business address must not exceed 500 characters')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, updateProfile);
router.put('/change-password', authenticateToken, changePasswordValidation, changePassword);
router.post('/upload-profile-image', authenticateToken, uploadProfileImageMiddleware, uploadProfileImage);
router.delete('/delete-profile-image', authenticateToken, deleteProfileImage);

module.exports = router;
