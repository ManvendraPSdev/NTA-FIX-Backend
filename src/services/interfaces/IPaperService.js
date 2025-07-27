/**
 * Interface for Paper Service operations
 * Following Interface Segregation Principle (ISP)
 */
class IPaperService {
  /**
   * Generate a unique paper from random questions
   * @param {Object} paperConfig - Paper configuration
   * @param {string} generatedBy - User ID who generated
   * @returns {Promise<Object>} Generated paper
   */
  async generatePaper(paperConfig, generatedBy) {
    throw new Error('Method generatePaper must be implemented');
  }

  /**
   * Distribute Shamir key parts
   * @param {string} paperId - Paper ID
   * @returns {Promise<Array>} Distributed shares
   */
  async distributeShamirKey(paperId) {
    throw new Error('Method distributeShamirKey must be implemented');
  }

  /**
   * Submit all Shamir parts and decrypt
   * @param {string} paperId - Paper ID
   * @param {Array} shares - Shamir shares
   * @returns {Promise<Object>} Decrypted paper
   */
  async decryptPaper(paperId, shares) {
    throw new Error('Method decryptPaper must be implemented');
  }

  /**
   * Get blockchain hash of generated paper
   * @param {string} paperId - Paper ID
   * @returns {Promise<string>} Paper hash
   */
  async getPaperHash(paperId) {
    throw new Error('Method getPaperHash must be implemented');
  }

  /**
   * Activate paper for exam
   * @param {string} paperId - Paper ID
   * @returns {Promise<Object>} Activated paper
   */
  async activatePaper(paperId) {
    throw new Error('Method activatePaper must be implemented');
  }

  /**
   * Complete paper
   * @param {string} paperId - Paper ID
   * @returns {Promise<Object>} Completed paper
   */
  async completePaper(paperId) {
    throw new Error('Method completePaper must be implemented');
  }

  /**
   * Get paper by ID
   * @param {string} paperId - Paper ID
   * @returns {Promise<Object>} Paper object
   */
  async getPaperById(paperId) {
    throw new Error('Method getPaperById must be implemented');
  }

  /**
   * Get active papers
   * @returns {Promise<Array>} Active papers array
   */
  async getActivePapers() {
    throw new Error('Method getActivePapers must be implemented');
  }

  /**
   * Get paper statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    throw new Error('Method getStatistics must be implemented');
  }

  /**
   * Verify paper integrity
   * @param {string} paperId - Paper ID
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPaperIntegrity(paperId) {
    throw new Error('Method verifyPaperIntegrity must be implemented');
  }
}

module.exports = IPaperService; 