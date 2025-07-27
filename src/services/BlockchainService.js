const solanaConfig = require('../config/solana');
const BlockchainTransaction = require('../models/BlockchainTransaction');
const { logger } = require('../utils/logger');

/**
 * Blockchain Service for Solana operations
 * Following Single Responsibility Principle (SRP)
 */
class BlockchainService {
  constructor() {
    this.connection = null;
    this.keypair = null;
    this.programId = null;
  }

  /**
   * Initialize Solana connection
   */
  async initialize() {
    try {
      await solanaConfig.initialize();
      this.connection = solanaConfig.getConnection();
      this.keypair = solanaConfig.getKeypair();
      this.programId = solanaConfig.getProgramId();
      logger.info('Blockchain service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Store question hash on blockchain
   * @param {string} questionId - Question ID
   * @param {string} hash - Question hash
   * @param {string} stateCode - State code
   * @returns {Promise<Object>} Transaction result
   */
  async storeQuestionHash(questionId, hash, stateCode) {
    try {
      const data = {
        type: 'question_hash',
        questionId,
        hash,
        stateCode,
        timestamp: new Date().toISOString()
      };

      return await this.storeData(data, 'question_hash', 'Question', questionId);
    } catch (error) {
      logger.error('Error storing question hash:', error);
      throw error;
    }
  }

  /**
   * Store paper hash on blockchain
   * @param {string} paperId - Paper ID
   * @param {string} hash - Paper hash
   * @returns {Promise<Object>} Transaction result
   */
  async storePaperHash(paperId, hash) {
    try {
      const data = {
        type: 'paper_hash',
        paperId,
        hash,
        timestamp: new Date().toISOString()
      };

      return await this.storeData(data, 'paper_hash', 'ExamPaper', paperId);
    } catch (error) {
      logger.error('Error storing paper hash:', error);
      throw error;
    }
  }

  /**
   * Store answer hash on blockchain
   * @param {string} answerId - Answer ID
   * @param {string} hash - Answer hash
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Transaction result
   */
  async storeAnswerHash(answerId, hash, studentId) {
    try {
      const data = {
        type: 'answer_hash',
        answerId,
        hash,
        studentId,
        timestamp: new Date().toISOString()
      };

      return await this.storeData(data, 'answer_hash', 'Answer', answerId);
    } catch (error) {
      logger.error('Error storing answer hash:', error);
      throw error;
    }
  }

  /**
   * Store result hash on blockchain
   * @param {string} resultId - Result ID
   * @param {string} hash - Result hash
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Transaction result
   */
  async storeResultHash(resultId, hash, studentId) {
    try {
      const data = {
        type: 'result_hash',
        resultId,
        hash,
        studentId,
        timestamp: new Date().toISOString()
      };

      return await this.storeData(data, 'result_hash', 'Result', resultId);
    } catch (error) {
      logger.error('Error storing result hash:', error);
      throw error;
    }
  }

  /**
   * Store rank hash on blockchain
   * @param {string} paperId - Paper ID
   * @param {string} hash - Rank hash
   * @returns {Promise<Object>} Transaction result
   */
  async storeRankHash(paperId, hash) {
    try {
      const data = {
        type: 'rank_hash',
        paperId,
        hash,
        timestamp: new Date().toISOString()
      };

      return await this.storeData(data, 'rank_hash', 'ExamPaper', paperId);
    } catch (error) {
      logger.error('Error storing rank hash:', error);
      throw error;
    }
  }

  /**
   * Generic method to store data on blockchain
   * @param {Object} data - Data to store
   * @param {string} type - Transaction type
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Transaction result
   * @private
   */
  async storeData(data, type, entityType, entityId) {
    try {
      // Create transaction record
      const transaction = new BlockchainTransaction({
        type,
        entityType,
        entityId,
        dataHash: data.hash || JSON.stringify(data),
        dataType: 'hash',
        programId: this.programId.toString(),
        accountAddress: this.keypair.publicKey.toString()
      });

      // Simulate Solana transaction (in real implementation, this would be actual Solana transaction)
      const solanaTxId = await this.simulateSolanaTransaction(data);
      
      transaction.solanaTxId = solanaTxId;
      transaction.status = 'confirmed';
      transaction.confirmedAt = new Date();
      transaction.confirmationStatus = 'confirmed';

      // Save transaction record
      await transaction.save();

      logger.info(`Data stored on blockchain: ${type} for ${entityType} ${entityId}`);

      return {
        transactionId: transaction.transactionId,
        solanaTxId: solanaTxId,
        hash: data.hash || JSON.stringify(data),
        status: 'confirmed'
      };
    } catch (error) {
      logger.error('Error storing data on blockchain:', error);
      throw error;
    }
  }

  /**
   * Simulate Solana transaction (placeholder for actual implementation)
   * @param {Object} data - Data to store
   * @returns {Promise<string>} Transaction ID
   * @private
   */
  async simulateSolanaTransaction(data) {
    // In a real implementation, this would create and send an actual Solana transaction
    // For now, we'll simulate it
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 10);
    return `solana_tx_${timestamp}${random}`;
  }

  /**
   * Get question hash from blockchain
   * @param {string} questionId - Question ID
   * @returns {Promise<string>} Question hash
   */
  async getQuestionHash(questionId) {
    try {
      const transaction = await BlockchainTransaction.findOne({
        type: 'question_hash',
        entityId: questionId,
        status: 'confirmed'
      });

      if (!transaction) {
        throw new Error('Question hash not found on blockchain');
      }

      return transaction.dataHash;
    } catch (error) {
      logger.error('Error getting question hash from blockchain:', error);
      throw error;
    }
  }

  /**
   * Get paper hash from blockchain
   * @param {string} paperId - Paper ID
   * @returns {Promise<string>} Paper hash
   */
  async getPaperHash(paperId) {
    try {
      const transaction = await BlockchainTransaction.findOne({
        type: 'paper_hash',
        entityId: paperId,
        status: 'confirmed'
      });

      if (!transaction) {
        throw new Error('Paper hash not found on blockchain');
      }

      return transaction.dataHash;
    } catch (error) {
      logger.error('Error getting paper hash from blockchain:', error);
      throw error;
    }
  }

  /**
   * Get answer hash from blockchain
   * @param {string} answerId - Answer ID
   * @returns {Promise<string>} Answer hash
   */
  async getAnswerHash(answerId) {
    try {
      const transaction = await BlockchainTransaction.findOne({
        type: 'answer_hash',
        entityId: answerId,
        status: 'confirmed'
      });

      if (!transaction) {
        throw new Error('Answer hash not found on blockchain');
      }

      return transaction.dataHash;
    } catch (error) {
      logger.error('Error getting answer hash from blockchain:', error);
      throw error;
    }
  }

  /**
   * Get result hash from blockchain
   * @param {string} resultId - Result ID
   * @returns {Promise<string>} Result hash
   */
  async getResultHash(resultId) {
    try {
      const transaction = await BlockchainTransaction.findOne({
        type: 'result_hash',
        entityId: resultId,
        status: 'confirmed'
      });

      if (!transaction) {
        throw new Error('Result hash not found on blockchain');
      }

      return transaction.dataHash;
    } catch (error) {
      logger.error('Error getting result hash from blockchain:', error);
      throw error;
    }
  }

  /**
   * Get transaction details by ID
   * @param {string} txId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionDetails(txId) {
    try {
      const transaction = await BlockchainTransaction.findOne({
        $or: [
          { transactionId: txId },
          { solanaTxId: txId }
        ]
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      logger.error('Error getting transaction details:', error);
      throw error;
    }
  }

  /**
   * Get blockchain statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    try {
      const stats = await BlockchainTransaction.getStatistics();
      return stats[0] || {};
    } catch (error) {
      logger.error('Error getting blockchain statistics:', error);
      throw error;
    }
  }

  /**
   * Verify data integrity against blockchain
   * @param {string} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @param {string} localHash - Local hash to verify
   * @returns {Promise<boolean>} Verification result
   */
  async verifyDataIntegrity(entityId, entityType, localHash) {
    try {
      const transaction = await BlockchainTransaction.findOne({
        entityId,
        entityType,
        status: 'confirmed'
      });

      if (!transaction) {
        logger.warn(`No blockchain transaction found for ${entityType} ${entityId}`);
        return false;
      }

      return transaction.dataHash === localHash;
    } catch (error) {
      logger.error('Error verifying data integrity:', error);
      return false;
    }
  }
}

module.exports = BlockchainService; 