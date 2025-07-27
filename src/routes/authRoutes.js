const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authRateLimiter } = require('../middleware/auth');
const AuthController = require('../controllers/authController');

const router = express.Router();
const authController = new AuthController();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Registration validation
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters'),
  body('role')
    .isIn(['student', 'state', 'admin', 'internal'])
    .withMessage('Role must be student, state, admin, or internal'),
  body('stateCode')
    .if(body('role').equals('state'))
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('State code is required for state role and must be 1-10 characters'),
  body('studentId')
    .if(body('role').equals('student'))
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Student ID is required for student role and must be 1-20 characters'),
  handleValidationErrors
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Change password validation
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors
];

// Refresh token validation
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  handleValidationErrors
];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  registerValidation,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  loginValidation,
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticateToken,
  authController.getUserProfile
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post(
  '/refresh',
  refreshTokenValidation,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticateToken,
  authController.logout
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticateToken,
  changePasswordValidation,
  authController.changePassword
);

module.exports = router; 