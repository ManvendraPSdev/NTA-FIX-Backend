const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Specific role authorization helpers
 */
const authorizeStudent = authorize('student');
const authorizeState = authorize('state');
const authorizeAdmin = authorize('admin');
const authorizeInternal = authorize('internal');

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Rate limiting for specific endpoints
 */
const createRateLimiter = (windowMs, max, message) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests from this IP'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Specific rate limiters
 */
const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts. Please try again later.'
);

const examRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 requests
  'Too many exam requests. Please slow down.'
);

const uploadRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads
  'Too many upload attempts. Please try again later.'
);

module.exports = {
  authenticateToken,
  authorize,
  authorizeStudent,
  authorizeState,
  authorizeAdmin,
  authorizeInternal,
  optionalAuth,
  authRateLimiter,
  examRateLimiter,
  uploadRateLimiter
}; 