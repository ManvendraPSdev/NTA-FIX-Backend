const { Connection, PublicKey, Keypair, clusterApiUrl } = require('@solana/web3.js');
const { logger } = require('../utils/logger');

class SolanaConfig {
  constructor() {
    this.connection = null;
    this.keypair = null;
    this.programId = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize connection
      const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
      this.connection = new Connection(rpcUrl, 'confirmed');
      
      // Initialize keypair from private key
      const privateKeyString = process.env.SOLANA_PRIVATE_KEY;
      if (!privateKeyString) {
        throw new Error('SOLANA_PRIVATE_KEY is not defined in environment variables');
      }
      
      const privateKeyArray = JSON.parse(privateKeyString);
      this.keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
      
      // Initialize program ID
      const programIdString = process.env.SOLANA_PROGRAM_ID;
      if (!programIdString) {
        throw new Error('SOLANA_PROGRAM_ID is not defined in environment variables');
      }
      
      this.programId = new PublicKey(programIdString);
      
      // Test connection
      const balance = await this.connection.getBalance(this.keypair.publicKey);
      logger.info(`Solana connection established. Balance: ${balance / 1e9} SOL`);
      
      this.isInitialized = true;
      logger.info('✅ Solana configuration initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Solana configuration:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.isInitialized) {
      throw new Error('Solana configuration not initialized. Call initialize() first.');
    }
    return this.connection;
  }

  getKeypair() {
    if (!this.isInitialized) {
      throw new Error('Solana configuration not initialized. Call initialize() first.');
    }
    return this.keypair;
  }

  getProgramId() {
    if (!this.isInitialized) {
      throw new Error('Solana configuration not initialized. Call initialize() first.');
    }
    return this.programId;
  }

  async getAccountInfo(publicKey) {
    try {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(publicKey));
      return accountInfo;
    } catch (error) {
      logger.error('Error getting account info:', error);
      throw error;
    }
  }

  async getRecentBlockhash() {
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();
      return blockhash;
    } catch (error) {
      logger.error('Error getting recent blockhash:', error);
      throw error;
    }
  }

  async getTransaction(signature) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      return transaction;
    } catch (error) {
      logger.error('Error getting transaction:', error);
      throw error;
    }
  }
}

// Create singleton instance
const solanaConfig = new SolanaConfig();

module.exports = solanaConfig; 