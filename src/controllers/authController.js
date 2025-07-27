const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

/**
 * Authentication Controller
 * Following Single Responsibility Principle (SRP)
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (req, res) => {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        stateCode,
        studentId
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmailOrUsername(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Validate role-specific requirements
      if (role === 'state' && !stateCode) {
        return res.status(400).json({
          success: false,
          message: 'State code is required for state role'
        });
      }

      if (role === 'student' && !studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required for student role'
        });
      }

      // Create user
      const userData = {
        username,
        email,
        password,
        firstName,
        lastName,
        role
      };

      if (stateCode) userData.stateCode = stateCode;
      if (studentId) userData.studentId = studentId;

      const user = new User(userData);
      await user.save();

      // Generate JWT token
      const token = this.generateToken(user._id);

      const response = {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            stateCode: user.stateCode,
            studentId: user.studentId
          },
          token
        }
      };

      logger.info(`User registered successfully: ${user.email}`);
      res.status(201).json(response);

    } catch (error) {
      logger.error('Error in register:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: error.message
      });
    }
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email or username
      const user = await User.findByEmailOrUsername(email).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        return res.status(423).json({
          success: false,
          message: 'Account is locked due to too many failed attempts. Please try again later.'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        await user.incLoginAttempts();
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = this.generateToken(user._id);

      const response = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            stateCode: user.stateCode,
            studentId: user.studentId,
            lastLogin: user.lastLogin
          },
          token
        }
      };

      logger.info(`User logged in successfully: ${user.email}`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in login:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: error.message
      });
    }
  };

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getUserProfile = async (req, res) => {
    try {
      const user = req.user;

      const response = {
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            stateCode: user.stateCode,
            studentId: user.studentId,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
          }
        }
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getUserProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile',
        error: error.message
      });
    }
  };

  /**
   * Refresh JWT token
   * POST /api/auth/refresh
   */
  refreshToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const newToken = this.generateToken(user._id);

      const response = {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken
        }
      };

      logger.info(`Token refreshed for user: ${user.email}`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in refreshToken:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token has expired'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
        error: error.message
      });
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = async (req, res) => {
    try {
      // In a stateless JWT system, logout is handled client-side
      // But we can log the logout event
      const user = req.user;

      logger.info(`User logged out: ${user.email}`);

      const response = {
        success: true,
        message: 'Logout successful'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout',
        error: error.message
      });
    }
  };

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // Verify current password
      const userWithPassword = await User.findById(user._id).select('+password');
      const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      userWithPassword.password = newPassword;
      await userWithPassword.save();

      logger.info(`Password changed for user: ${user.email}`);

      const response = {
        success: true,
        message: 'Password changed successfully'
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  };

  /**
   * Generate JWT token
   * @param {string} userId - User ID
   * @returns {string} JWT token
   * @private
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  /**
   * Generate refresh token
   * @param {string} userId - User ID
   * @returns {string} Refresh token
   * @private
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }
}

module.exports = AuthController; 