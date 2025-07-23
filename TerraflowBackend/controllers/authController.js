const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');

// Ensure dotenv is loaded
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Generate JWT token
const generateToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// User registration
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      role,
      fullName,
      email,
      password,
      mobile,
      address,
      businessName = null,
      businessAddress = null,
      businessDocument = null,
      contactNo = null
    } = req.body;

    // Check if user already exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);    // Insert new user
    const [result] = await pool.execute(`
      INSERT INTO users (
        role, full_name, email, password, mobile, address,
        business_name, business_address, business_document, contact_no,
        is_active, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      role, fullName, email, hashedPassword, mobile || null, address || null,
      businessName || null, businessAddress || null, businessDocument || null, 
      contactNo || mobile || null,
      true, role === 'admin' // Auto-verify admin users
    ]);

    // If supplier, create performance record
    if (role === 'supplier') {
      await pool.execute(
        'INSERT INTO supplier_performance (supplier_id) VALUES (?)',
        [result.insertId]
      );
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: result.insertId,
        role,
        fullName,
        email,
        isVerified: role === 'admin'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Get user from database
    const [users] = await pool.execute(
      `SELECT id, role, full_name, email, password, is_active, is_verified, 
              login_attempts, locked_until FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Check if account is locked
    if (user.locked_until && new Date() < user.locked_until) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment login attempts
      const newAttempts = user.login_attempts + 1;
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
      const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 900000; // 15 minutes

      let updateQuery = 'UPDATE users SET login_attempts = ?';
      let updateParams = [newAttempts];

      if (newAttempts >= maxAttempts) {
        const lockUntil = new Date(Date.now() + lockoutTime);
        updateQuery += ', locked_until = ?';
        updateParams.push(lockUntil);
      }

      updateQuery += ' WHERE id = ?';
      updateParams.push(user.id);

      await pool.execute(updateQuery, updateParams);

      return res.status(401).json({
        success: false,
        message: newAttempts >= maxAttempts 
          ? 'Account locked due to multiple failed attempts'
          : 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    await pool.execute(
      'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        is_verified: user.is_verified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, role, full_name, email, mobile, address, 
              business_name, business_address, contact_no, profile_image,
              is_active, is_verified, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      full_name,
      mobile,
      address,
      business_name,
      business_address,
      contact_no
    } = req.body;

    // Convert undefined values to null to prevent SQL binding errors
    const safeParams = [
      full_name || null,
      mobile || null,
      address || null,
      business_name || null,
      business_address || null,
      contact_no || null,
      req.user.id
    ];

    await pool.execute(`
      UPDATE users SET 
        full_name = ?, mobile = ?, address = ?, 
        business_name = ?, business_address = ?, contact_no = ?
      WHERE id = ?
    `, safeParams);

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const filename = req.file.filename;
    const imageUrl = `/uploads/profiles/${filename}`;

    // Update user's profile image in database
    await pool.execute(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [imageUrl, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        filename: filename,
        url: imageUrl
      }
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image'
    });
  }
};

// Delete profile image
const deleteProfileImage = async (req, res) => {
  try {
    // Get current profile image to delete the file
    const [users] = await pool.execute(
      'SELECT profile_image FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update database to remove profile image
    await pool.execute(
      'UPDATE users SET profile_image = NULL WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile image'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  deleteProfileImage
};
