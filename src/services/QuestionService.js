const IQuestionService = require('./interfaces/IQuestionService');
const Question = require('../models/Question');
const BlockchainService = require('./BlockchainService');
const EncryptionService = require('../utils/encryption');
const { logger } = require('../utils/logger');

/**
 * Concrete implementation of Question Service
 * Following Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP)
 */
class QuestionService extends IQuestionService {
  constructor(blockchainService) {
    super();
    this.blockchainService = blockchainService;
    this.encryptionService = EncryptionService;
  }

  /**
   * Upload questions by a state
   * @param {Object} questionData - Question data
   * @param {string} stateCode - State code
   * @returns {Promise<Object>} Created question
   */
  async uploadQuestion(questionData, stateCode) {
    try {
      // Validate question data
      this.validateQuestionData(questionData);

      // Create question object
      const question = new Question({
        ...questionData,
        stateCode: stateCode.toUpperCase()
      });

      // Generate question hash
      const questionHash = question.questionHash;
      question.answerHash = questionHash;

      // Save question
      const savedQuestion = await question.save();

      // Store hash on blockchain
      try {
        const blockchainData = await this.blockchainService.storeQuestionHash(
          savedQuestion.questionId,
          questionHash,
          stateCode
        );
        
        savedQuestion.blockchainHash = blockchainData.hash;
        savedQuestion.blockchainTxId = blockchainData.transactionId;
        await savedQuestion.save();
      } catch (blockchainError) {
        logger.error('Failed to store question hash on blockchain:', blockchainError);
        // Continue without blockchain storage
      }

      logger.info(`Question uploaded successfully: ${savedQuestion.questionId}`);
      return savedQuestion;
    } catch (error) {
      logger.error('Error uploading question:', error);
      throw error;
    }
  }

  /**
   * Get questions by state
   * @param {string} stateCode - State code
   * @returns {Promise<Array>} Questions array
   */
  async getQuestionsByState(stateCode) {
    try {
      const questions = await Question.findByState(stateCode);
      logger.info(`Retrieved ${questions.length} questions for state: ${stateCode}`);
      return questions;
    } catch (error) {
      logger.error('Error getting questions by state:', error);
      throw error;
    }
  }

  /**
   * Get question hash for verification
   * @param {string} stateId - State ID
   * @returns {Promise<string>} Question hash
   */
  async getQuestionHash(stateId) {
    try {
      const questions = await Question.findByState(stateId);
      if (questions.length === 0) {
        throw new Error('No questions found for state');
      }

      // Create combined hash of all questions
      const combinedData = questions.map(q => ({
        questionId: q.questionId,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer
      }));

      const hash = this.encryptionService.generateHash(JSON.stringify(combinedData));
      logger.info(`Generated question hash for state ${stateId}: ${hash}`);
      return hash;
    } catch (error) {
      logger.error('Error getting question hash:', error);
      throw error;
    }
  }

  /**
   * Verify question integrity
   * @param {string} questionId - Question ID
   * @returns {Promise<boolean>} Verification result
   */
  async verifyQuestionIntegrity(questionId) {
    try {
      const question = await Question.findOne({ questionId });
      if (!question) {
        throw new Error('Question not found');
      }

      // Generate current hash
      const currentHash = question.questionHash;
      
      // Verify against blockchain hash if available
      if (question.blockchainHash) {
        const blockchainHash = await this.blockchainService.getQuestionHash(questionId);
        return currentHash === blockchainHash;
      }

      // If no blockchain hash, just return true (local verification)
      return true;
    } catch (error) {
      logger.error('Error verifying question integrity:', error);
      return false;
    }
  }

  /**
   * Get questions for paper generation
   * @param {Object} criteria - Selection criteria
   * @returns {Promise<Array>} Questions array
   */
  async getQuestionsForPaper(criteria) {
    try {
      const {
        subject,
        difficulty,
        count,
        excludeIds = []
      } = criteria;

      let query = {
        isVerified: true,
        isActive: true,
        questionId: { $nin: excludeIds }
      };

      if (subject) {
        query.subject = new RegExp(subject, 'i');
      }

      if (difficulty) {
        query.difficulty = difficulty;
      }

      // Get random questions
      const questions = await Question.aggregate([
        { $match: query },
        { $sample: { size: count } },
        { $sort: { usageCount: 1 } } // Prefer less used questions
      ]);

      logger.info(`Retrieved ${questions.length} questions for paper generation`);
      return questions;
    } catch (error) {
      logger.error('Error getting questions for paper:', error);
      throw error;
    }
  }

  /**
   * Mark question as verified
   * @param {string} questionId - Question ID
   * @param {string} verifiedBy - User ID who verified
   * @returns {Promise<Object>} Updated question
   */
  async markAsVerified(questionId, verifiedBy) {
    try {
      const question = await Question.findOne({ questionId });
      if (!question) {
        throw new Error('Question not found');
      }

      const updatedQuestion = await question.markAsVerified(verifiedBy);
      logger.info(`Question marked as verified: ${questionId}`);
      return updatedQuestion;
    } catch (error) {
      logger.error('Error marking question as verified:', error);
      throw error;
    }
  }

  /**
   * Get question statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      const stats = await Question.getStatistics();
      logger.info('Retrieved question statistics');
      return stats[0] || {};
    } catch (error) {
      logger.error('Error getting question statistics:', error);
      throw error;
    }
  }

  /**
   * Validate question data
   * @param {Object} questionData - Question data to validate
   * @private
   */
  validateQuestionData(questionData) {
    const requiredFields = ['subject', 'topic', 'questionText', 'options', 'correctAnswer'];
    
    for (const field of requiredFields) {
      if (!questionData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate options
    const options = questionData.options;
    const requiredOptions = ['A', 'B', 'C', 'D'];
    
    for (const option of requiredOptions) {
      if (!options[option] || options[option].trim() === '') {
        throw new Error(`Missing or empty option: ${option}`);
      }
    }

    // Validate correct answer
    if (!requiredOptions.includes(questionData.correctAnswer)) {
      throw new Error('Correct answer must be A, B, C, or D');
    }

    // Validate question text length
    if (questionData.questionText.length > 2000) {
      throw new Error('Question text cannot exceed 2000 characters');
    }

    // Validate option lengths
    for (const option of requiredOptions) {
      if (options[option].length > 500) {
        throw new Error(`Option ${option} cannot exceed 500 characters`);
      }
    }
  }
}

module.exports = QuestionService; 