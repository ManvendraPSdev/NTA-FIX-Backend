const crypto = require('crypto');
const shamir = require('shamir-secret-sharing');
const aesjs = require('aes-js');
const { logger } = require('./logger');

class EncryptionService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY;
    this.threshold = parseInt(process.env.SHAMIR_THRESHOLD) || 3;
    this.totalParts = parseInt(process.env.SHAMIR_TOTAL_PARTS) || 5;
    
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
  }

  /**
   * Generate a random encryption key
   */
  generateRandomKey(length = 32) {
    return crypto.randomBytes(length);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data) {
    try {
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-gcm', key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData) {
    try {
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipher('aes-256-gcm', key);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Split a secret using Shamir's Secret Sharing
   */
  splitSecret(secret) {
    try {
      const secretBuffer = Buffer.from(secret, 'utf8');
      const shares = shamir.share(secretBuffer, this.totalParts, this.threshold);
      
      return shares.map((share, index) => ({
        id: index + 1,
        share: share.toString('hex'),
        threshold: this.threshold,
        totalParts: this.totalParts
      }));
    } catch (error) {
      logger.error('Secret splitting error:', error);
      throw new Error('Failed to split secret');
    }
  }

  /**
   * Reconstruct a secret from Shamir shares
   */
  reconstructSecret(shares) {
    try {
      if (shares.length < this.threshold) {
        throw new Error(`Need at least ${this.threshold} shares to reconstruct secret`);
      }
      
      const shareBuffers = shares.map(share => Buffer.from(share.share, 'hex'));
      const reconstructed = shamir.combine(shareBuffers);
      
      return reconstructed.toString('utf8');
    } catch (error) {
      logger.error('Secret reconstruction error:', error);
      throw new Error('Failed to reconstruct secret');
    }
  }

  /**
   * Generate a hash of data
   */
  generateHash(data) {
    try {
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      logger.error('Hash generation error:', error);
      throw new Error('Failed to generate hash');
    }
  }

  /**
   * Generate HMAC for data integrity
   */
  generateHMAC(data, key = this.encryptionKey) {
    try {
      return crypto.createHmac('sha256', key).update(data).digest('hex');
    } catch (error) {
      logger.error('HMAC generation error:', error);
      throw new Error('Failed to generate HMAC');
    }
  }

  /**
   * Verify HMAC for data integrity
   */
  verifyHMAC(data, hmac, key = this.encryptionKey) {
    try {
      const expectedHMAC = this.generateHMAC(data, key);
      return crypto.timingSafeEqual(
        Buffer.from(hmac, 'hex'),
        Buffer.from(expectedHMAC, 'hex')
      );
    } catch (error) {
      logger.error('HMAC verification error:', error);
      return false;
    }
  }

  /**
   * Encrypt and hash data for blockchain storage
   */
  prepareForBlockchain(data) {
    try {
      const encrypted = this.encrypt(JSON.stringify(data));
      const hash = this.generateHash(JSON.stringify(encrypted));
      const hmac = this.generateHMAC(JSON.stringify(encrypted));
      
      return {
        encrypted,
        hash,
        hmac,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Blockchain preparation error:', error);
      throw new Error('Failed to prepare data for blockchain');
    }
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService; 