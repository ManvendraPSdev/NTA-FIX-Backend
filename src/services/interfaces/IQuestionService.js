/**
 * Interface for Question Service operations
 * Following Interface Segregation Principle (ISP)
 */
class IQuestionService {
  /**
   * Upload questions by a state
   * @param {Object} questionData - Question data
   * @param {string} stateCode - State code
   * @returns {Promise<Object>} Created question
   */
  async uploadQuestion(questionData, stateCode) {
    throw new Error('Method uploadQuestion must be implemented');
  }

  /**
   * Get questions by state
   * @param {string} stateCode - State code
   * @returns {Promise<Array>} Questions array
   */
  async getQuestionsByState(stateCode) {
    throw new Error('Method getQuestionsByState must be implemented');
  }

  /**
   * Get question hash for verification
   * @param {string} stateId - State ID
   * @returns {Promise<string>} Question hash
   */
  async getQuestionHash(stateId) {
    throw new Error('Method getQuestionHash must be implemented');
  }

  /**
   * Verify question integrity
   * @param {string} questionId - Question ID
   * @returns {Promise<boolean>} Verification result
   */
  async verifyQuestionIntegrity(questionId) {
    throw new Error('Method verifyQuestionIntegrity must be implemented');
  }

  /**
   * Get questions for paper generation
   * @param {Object} criteria - Selection criteria
   * @returns {Promise<Array>} Questions array
   */
  async getQuestionsForPaper(criteria) {
    throw new Error('Method getQuestionsForPaper must be implemented');
  }

  /**
   * Mark question as verified
   * @param {string} questionId - Question ID
   * @param {string} verifiedBy - User ID who verified
   * @returns {Promise<Object>} Updated question
   */
  async markAsVerified(questionId, verifiedBy) {
    throw new Error('Method markAsVerified must be implemented');
  }

  /**
   * Get question statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    throw new Error('Method getStatistics must be implemented');
  }
}

module.exports = IQuestionService; 