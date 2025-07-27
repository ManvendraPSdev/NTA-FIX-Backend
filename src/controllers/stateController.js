const QuestionService = require('../services/QuestionService');
const BlockchainService = require('../services/BlockchainService');
const { logger } = require('../utils/logger');

/**
 * State Controller for question contribution operations
 * Following Single Responsibility Principle (SRP)
 */
class StateController {
  constructor() {
    this.questionService = null;
    this.blockchainService = null;
  }

  /**
   * Initialize services
   */
  async initialize() {
    try {
      this.blockchainService = new BlockchainService();
      await this.blockchainService.initialize();
      
      this.questionService = new QuestionService(this.blockchainService);
      logger.info('State controller initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize state controller:', error);
      throw error;
    }
  }

  /**
   * Upload questions by a state
   * POST /api/state/upload-questions
   */
  uploadQuestions = async (req, res) => {
    try {
      const { questions } = req.body;
      const stateCode = req.user.stateCode;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Questions array is required and must not be empty'
        });
      }

      if (questions.length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 30 questions can be uploaded at once'
        });
      }

      const uploadedQuestions = [];
      const errors = [];

      // Upload questions one by one
      for (let i = 0; i < questions.length; i++) {
        try {
          const questionData = questions[i];
          const uploadedQuestion = await this.questionService.uploadQuestion(questionData, stateCode);
          uploadedQuestions.push(uploadedQuestion);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
          logger.error(`Error uploading question ${i + 1}:`, error);
        }
      }

      const response = {
        success: true,
        message: `Successfully uploaded ${uploadedQuestions.length} questions`,
        data: {
          uploaded: uploadedQuestions.length,
          total: questions.length,
          questions: uploadedQuestions.map(q => ({
            questionId: q.questionId,
            subject: q.subject,
            topic: q.topic,
            difficulty: q.difficulty,
            blockchainHash: q.blockchainHash
          }))
        }
      };

      if (errors.length > 0) {
        response.data.errors = errors;
        response.message += ` with ${errors.length} errors`;
      }

      logger.info(`State ${stateCode} uploaded ${uploadedQuestions.length}/${questions.length} questions`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in uploadQuestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload questions',
        error: error.message
      });
    }
  };

  /**
   * Get questions by state
   * GET /api/state/get-questions
   */
  getQuestionsByState = async (req, res) => {
    try {
      const stateCode = req.user.stateCode;
      const { page = 1, limit = 20, subject, difficulty, verified } = req.query;

      const questions = await this.questionService.getQuestionsByState(stateCode);

      // Apply filters
      let filteredQuestions = questions;

      if (subject) {
        filteredQuestions = filteredQuestions.filter(q => 
          q.subject.toLowerCase().includes(subject.toLowerCase())
        );
      }

      if (difficulty) {
        filteredQuestions = filteredQuestions.filter(q => 
          q.difficulty === difficulty
        );
      }

      if (verified !== undefined) {
        const isVerified = verified === 'true';
        filteredQuestions = filteredQuestions.filter(q => 
          q.isVerified === isVerified
        );
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

      const response = {
        success: true,
        message: `Retrieved ${paginatedQuestions.length} questions for state ${stateCode}`,
        data: {
          questions: paginatedQuestions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredQuestions.length / limit),
            totalQuestions: filteredQuestions.length,
            hasNextPage: endIndex < filteredQuestions.length,
            hasPrevPage: page > 1
          },
          filters: {
            subject: subject || null,
            difficulty: difficulty || null,
            verified: verified || null
          }
        }
      };

      logger.info(`State ${stateCode} retrieved ${paginatedQuestions.length} questions`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getQuestionsByState:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve questions',
        error: error.message
      });
    }
  };

  /**
   * Get question hash for verification
   * GET /api/state/question-hash/:stateId
   */
  getQuestionHash = async (req, res) => {
    try {
      const { stateId } = req.params;

      if (!stateId) {
        return res.status(400).json({
          success: false,
          message: 'State ID is required'
        });
      }

      const hash = await this.questionService.getQuestionHash(stateId);

      const response = {
        success: true,
        message: `Question hash generated for state ${stateId}`,
        data: {
          stateId,
          hash,
          timestamp: new Date().toISOString(),
          verificationUrl: `${req.protocol}://${req.get('host')}/api/blockchain/verify/${hash}`
        }
      };

      logger.info(`Generated question hash for state ${stateId}: ${hash}`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getQuestionHash:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate question hash',
        error: error.message
      });
    }
  };

  /**
   * Get state statistics
   * GET /api/state/statistics
   */
  getStateStatistics = async (req, res) => {
    try {
      const stateCode = req.user.stateCode;
      const questions = await this.questionService.getQuestionsByState(stateCode);

      const statistics = {
        totalQuestions: questions.length,
        verifiedQuestions: questions.filter(q => q.isVerified).length,
        activeQuestions: questions.filter(q => q.isActive).length,
        subjects: [...new Set(questions.map(q => q.subject))],
        difficultyDistribution: {
          easy: questions.filter(q => q.difficulty === 'easy').length,
          medium: questions.filter(q => q.difficulty === 'medium').length,
          hard: questions.filter(q => q.difficulty === 'hard').length
        },
        usageStats: {
          totalUsage: questions.reduce((sum, q) => sum + q.usageCount, 0),
          averageUsage: questions.length > 0 ? 
            Math.round(questions.reduce((sum, q) => sum + q.usageCount, 0) / questions.length) : 0
        },
        blockchainStats: {
          onBlockchain: questions.filter(q => q.blockchainHash).length,
          pending: questions.filter(q => !q.blockchainHash).length
        }
      };

      const response = {
        success: true,
        message: `Statistics for state ${stateCode}`,
        data: {
          stateCode,
          statistics,
          lastUpdated: new Date().toISOString()
        }
      };

      logger.info(`Retrieved statistics for state ${stateCode}`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in getStateStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error.message
      });
    }
  };

  /**
   * Verify question integrity
   * POST /api/state/verify-question/:questionId
   */
  verifyQuestionIntegrity = async (req, res) => {
    try {
      const { questionId } = req.params;

      if (!questionId) {
        return res.status(400).json({
          success: false,
          message: 'Question ID is required'
        });
      }

      const isIntegrityValid = await this.questionService.verifyQuestionIntegrity(questionId);

      const response = {
        success: true,
        message: `Question integrity verification completed`,
        data: {
          questionId,
          integrityValid: isIntegrityValid,
          verifiedAt: new Date().toISOString(),
          blockchainVerified: isIntegrityValid // In real implementation, this would be separate
        }
      };

      logger.info(`Question integrity verified for ${questionId}: ${isIntegrityValid}`);
      res.status(200).json(response);

    } catch (error) {
      logger.error('Error in verifyQuestionIntegrity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify question integrity',
        error: error.message
      });
    }
  };
}

module.exports = StateController; 