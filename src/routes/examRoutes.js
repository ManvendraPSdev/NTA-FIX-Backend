const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, authorizeStudent, examRateLimiter } = require('../middleware/auth');

const router = express.Router();

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

// Start exam validation
const startExamValidation = [
  body('paperId')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Paper ID must be 1-50 characters'),
  handleValidationErrors
];

// Submit answer validation
const submitAnswerValidation = [
  body('questionId')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Question ID must be 1-50 characters'),
  body('selectedOption')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Selected option must be A, B, C, or D'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  handleValidationErrors
];

// Log activity validation
const logActivityValidation = [
  body('activityType')
    .isIn(['question_view', 'answer_submit', 'question_navigate', 'tab_switch', 'copy_paste', 'fullscreen_exit', 'time_warning', 'session_pause', 'session_resume'])
    .withMessage('Invalid activity type'),
  body('questionNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Question number must be a positive integer'),
  body('details')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Activity details must not exceed 500 characters'),
  handleValidationErrors
];

// Student ID validation
const studentIdValidation = [
  param('studentId')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Student ID must be 1-50 characters'),
  handleValidationErrors
];

/**
 * @route   POST /api/exam/start
 * @desc    Start the exam session
 * @access  Private (Student)
 */
router.post(
  '/start',
  authenticateToken,
  authorizeStudent,
  examRateLimiter,
  startExamValidation,
  async (req, res) => {
    try {
      const { paperId } = req.body;
      const studentId = req.user._id;

      // TODO: Implement exam start logic
      res.status(200).json({
        success: true,
        message: 'Exam started successfully',
        data: {
          sessionId: 'S' + Date.now(),
          paperId,
          startTime: new Date().toISOString(),
          status: 'started',
          timeRemaining: 180 * 60 // 3 hours in seconds
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to start exam',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/exam/submit
 * @desc    Submit an answer
 * @access  Private (Student)
 */
router.post(
  '/submit',
  authenticateToken,
  authorizeStudent,
  examRateLimiter,
  submitAnswerValidation,
  async (req, res) => {
    try {
      const { questionId, selectedOption, timeSpent } = req.body;
      const studentId = req.user._id;

      // TODO: Implement answer submission logic
      res.status(200).json({
        success: true,
        message: 'Answer submitted successfully',
        data: {
          answerId: 'A' + Date.now(),
          questionId,
          selectedOption,
          timeSpent: timeSpent || 0,
          submittedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit answer',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/exam/logs
 * @desc    Log user action
 * @access  Private (Student)
 */
router.post(
  '/logs',
  authenticateToken,
  authorizeStudent,
  logActivityValidation,
  async (req, res) => {
    try {
      const { activityType, questionNumber, details } = req.body;
      const studentId = req.user._id;

      // TODO: Implement activity logging logic
      res.status(200).json({
        success: true,
        message: 'Activity logged successfully',
        data: {
          activityId: 'ACT' + Date.now(),
          activityType,
          questionNumber,
          details,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to log activity',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/exam/session/:studentId
 * @desc    Get session info
 * @access  Private (Student/Admin)
 */
router.get(
  '/session/:studentId',
  authenticateToken,
  studentIdValidation,
  async (req, res) => {
    try {
      const { studentId } = req.params;

      // TODO: Implement session info retrieval logic
      res.status(200).json({
        success: true,
        message: 'Session info retrieved successfully',
        data: {
          sessionId: 'S' + Date.now(),
          studentId,
          paperId: 'P123456',
          startTime: new Date().toISOString(),
          status: 'in_progress',
          timeRemaining: 120 * 60, // 2 hours remaining
          currentQuestion: 15,
          totalQuestions: 50,
          answeredQuestions: 12
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get session info',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/exam/pause
 * @desc    Pause exam session
 * @access  Private (Student)
 */
router.post(
  '/pause',
  authenticateToken,
  authorizeStudent,
  async (req, res) => {
    try {
      // TODO: Implement exam pause logic
      res.status(200).json({
        success: true,
        message: 'Exam paused successfully',
        data: {
          status: 'paused',
          pausedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to pause exam',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/exam/resume
 * @desc    Resume exam session
 * @access  Private (Student)
 */
router.post(
  '/resume',
  authenticateToken,
  authorizeStudent,
  async (req, res) => {
    try {
      // TODO: Implement exam resume logic
      res.status(200).json({
        success: true,
        message: 'Exam resumed successfully',
        data: {
          status: 'in_progress',
          resumedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to resume exam',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/exam/complete
 * @desc    Complete exam session
 * @access  Private (Student)
 */
router.post(
  '/complete',
  authenticateToken,
  authorizeStudent,
  async (req, res) => {
    try {
      // TODO: Implement exam completion logic
      res.status(200).json({
        success: true,
        message: 'Exam completed successfully',
        data: {
          status: 'completed',
          completedAt: new Date().toISOString(),
          totalTimeSpent: 150 * 60, // 2.5 hours
          totalQuestions: 50,
          answeredQuestions: 45
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to complete exam',
        error: error.message
      });
    }
  }
);

module.exports = router; 