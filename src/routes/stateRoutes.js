const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken, authorizeState, uploadRateLimiter } = require('../middleware/auth');
const StateController = require('../controllers/stateController');

const router = express.Router();
const stateController = new StateController();

// Initialize controller
stateController.initialize().catch(console.error);

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

// Question upload validation
const questionUploadValidation = [
  body('questions')
    .isArray({ min: 1, max: 30 })
    .withMessage('Questions must be an array with 1-30 items'),
  body('questions.*.subject')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subject is required and must be 1-100 characters'),
  body('questions.*.topic')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Topic is required and must be 1-200 characters'),
  body('questions.*.questionText')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Question text is required and must be 1-2000 characters'),
  body('questions.*.options.A')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Option A is required and must be 1-500 characters'),
  body('questions.*.options.B')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Option B is required and must be 1-500 characters'),
  body('questions.*.options.C')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Option C is required and must be 1-500 characters'),
  body('questions.*.options.D')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Option D is required and must be 1-500 characters'),
  body('questions.*.correctAnswer')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Correct answer must be A, B, C, or D'),
  body('questions.*.difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('questions.*.marks')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Marks must be between 1 and 10'),
  body('questions.*.timeLimit')
    .optional()
    .isInt({ min: 30, max: 600 })
    .withMessage('Time limit must be between 30 and 600 seconds'),
  body('questions.*.explanation')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Explanation must not exceed 1000 characters'),
  handleValidationErrors
];

// Query validation for get questions
const getQuestionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject filter must not exceed 100 characters'),
  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty filter must be easy, medium, or hard'),
  query('verified')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Verified filter must be true or false'),
  handleValidationErrors
];

// State ID validation
const stateIdValidation = [
  param('stateId')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('State ID must be 1-10 characters'),
  handleValidationErrors
];

// Question ID validation
const questionIdValidation = [
  param('questionId')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Question ID must be 1-50 characters'),
  handleValidationErrors
];

/**
 * @route   POST /api/state/upload-questions
 * @desc    Upload questions by a state
 * @access  Private (State Auth)
 */
router.post(
  '/upload-questions',
  authenticateToken,
  authorizeState,
  uploadRateLimiter,
  questionUploadValidation,
  stateController.uploadQuestions
);

/**
 * @route   GET /api/state/get-questions
 * @desc    Get questions by state
 * @access  Private (State Auth)
 */
router.get(
  '/get-questions',
  authenticateToken,
  authorizeState,
  getQuestionsValidation,
  stateController.getQuestionsByState
);

/**
 * @route   GET /api/state/question-hash/:stateId
 * @desc    Get question hash for verification
 * @access  Public
 */
router.get(
  '/question-hash/:stateId',
  stateIdValidation,
  stateController.getQuestionHash
);

/**
 * @route   GET /api/state/statistics
 * @desc    Get state statistics
 * @access  Private (State Auth)
 */
router.get(
  '/statistics',
  authenticateToken,
  authorizeState,
  stateController.getStateStatistics
);

/**
 * @route   POST /api/state/verify-question/:questionId
 * @desc    Verify question integrity
 * @access  Private (State Auth)
 */
router.post(
  '/verify-question/:questionId',
  authenticateToken,
  authorizeState,
  questionIdValidation,
  stateController.verifyQuestionIntegrity
);

module.exports = router; 