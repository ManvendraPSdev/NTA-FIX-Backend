const mongoose = require('mongoose');

const blockchainTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  solanaTxId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['question_hash', 'paper_hash', 'answer_hash', 'result_hash', 'rank_hash'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['Question', 'ExamPaper', 'Answer', 'Result', 'ExamSession'],
    required: true
  },
  entityId: {
    type: String,
    required: true,
    trim: true
  },
  // Data being stored on blockchain
  dataHash: {
    type: String,
    required: true,
    trim: true
  },
  dataType: {
    type: String,
    enum: ['hash', 'encrypted_data', 'metadata'],
    required: true
  },
  // Transaction details
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'reverted'],
    default: 'pending',
    required: true
  },
  blockNumber: {
    type: Number
  },
  blockHash: {
    type: String,
    trim: true
  },
  gasUsed: {
    type: Number
  },
  gasPrice: {
    type: Number
  },
  // Solana specific fields
  slot: {
    type: Number
  },
  confirmationStatus: {
    type: String,
    enum: ['processed', 'confirmed', 'finalized'],
    default: 'processed'
  },
  // Metadata
  metadata: {
    type: Map,
    of: String
  },
  // Error handling
  errorMessage: {
    type: String,
    trim: true
  },
  retryCount: {
    type: Number,
    default: 0,
    min: [0, 'Retry count cannot be negative']
  },
  maxRetries: {
    type: Number,
    default: 3,
    min: [1, 'Max retries must be at least 1']
  },
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  // User who initiated the transaction
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Program and account information
  programId: {
    type: String,
    required: true,
    trim: true
  },
  accountAddress: {
    type: String,
    trim: true
  },
  // Fee information
  fee: {
    type: Number,
    min: [0, 'Fee cannot be negative']
  },
  feeCurrency: {
    type: String,
    default: 'SOL',
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for transaction age
blockchainTransactionSchema.virtual('age').get(function() {
  return Date.now() - this.submittedAt.getTime();
});

// Virtual for confirmation time
blockchainTransactionSchema.virtual('confirmationTime').get(function() {
  if (!this.confirmedAt) return null;
  return this.confirmedAt.getTime() - this.submittedAt.getTime();
});

// Indexes
blockchainTransactionSchema.index({ transactionId: 1 });
blockchainTransactionSchema.index({ solanaTxId: 1 });
blockchainTransactionSchema.index({ type: 1 });
blockchainTransactionSchema.index({ entityType: 1 });
blockchainTransactionSchema.index({ entityId: 1 });
blockchainTransactionSchema.index({ status: 1 });
blockchainTransactionSchema.index({ submittedAt: 1 });
blockchainTransactionSchema.index({ dataHash: 1 });

// Compound indexes
blockchainTransactionSchema.index({ entityType: 1, entityId: 1 });
blockchainTransactionSchema.index({ type: 1, status: 1 });
blockchainTransactionSchema.index({ status: 1, submittedAt: 1 });

// Pre-save middleware to generate transaction ID
blockchainTransactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.transactionId = `TX${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Instance method to mark as confirmed
blockchainTransactionSchema.methods.markConfirmed = function(blockNumber, blockHash, slot = null) {
  this.status = 'confirmed';
  this.blockNumber = blockNumber;
  this.blockHash = blockHash;
  this.slot = slot;
  this.confirmedAt = new Date();
  this.confirmationStatus = 'confirmed';
  return this.save();
};

// Instance method to mark as finalized
blockchainTransactionSchema.methods.markFinalized = function() {
  this.confirmationStatus = 'finalized';
  return this.save();
};

// Instance method to mark as failed
blockchainTransactionSchema.methods.markFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.failedAt = new Date();
  return this.save();
};

// Instance method to increment retry count
blockchainTransactionSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  if (this.retryCount >= this.maxRetries) {
    this.status = 'failed';
    this.errorMessage = 'Max retries exceeded';
    this.failedAt = new Date();
  }
  return this.save();
};

// Instance method to reset for retry
blockchainTransactionSchema.methods.resetForRetry = function() {
  this.status = 'pending';
  this.errorMessage = null;
  this.failedAt = null;
  return this.save();
};

// Static method to find pending transactions
blockchainTransactionSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ submittedAt: 1 });
};

// Static method to find failed transactions
blockchainTransactionSchema.statics.findFailed = function() {
  return this.find({ status: 'failed' }).sort({ failedAt: -1 });
};

// Static method to find transactions by entity
blockchainTransactionSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({ entityType, entityId }).sort({ submittedAt: -1 });
};

// Static method to find transactions by type
blockchainTransactionSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ submittedAt: -1 });
};

// Static method to find confirmed transactions
blockchainTransactionSchema.statics.findConfirmed = function() {
  return this.find({ status: 'confirmed' }).sort({ confirmedAt: -1 });
};

// Static method to get transaction statistics
blockchainTransactionSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        pendingTransactions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        confirmedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        failedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        avgConfirmationTime: { $avg: '$confirmationTime' },
        totalFees: { $sum: '$fee' }
      }
    }
  ]);
};

// Static method to get type-wise statistics
blockchainTransactionSchema.statics.getTypeStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        avgConfirmationTime: { $avg: '$confirmationTime' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get recent transactions
blockchainTransactionSchema.statics.getRecentTransactions = function(limit = 50) {
  return this.find()
    .sort({ submittedAt: -1 })
    .limit(limit)
    .populate('initiatedBy', 'firstName lastName username');
};

// Static method to find transactions by date range
blockchainTransactionSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    submittedAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ submittedAt: -1 });
};

module.exports = mongoose.model('BlockchainTransaction', blockchainTransactionSchema); 