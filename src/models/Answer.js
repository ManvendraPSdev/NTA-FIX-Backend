const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  answerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    ref: 'ExamSession'
  },
  paperId: {
    type: String,
    required: true,
    ref: 'ExamPaper'
  },
  questionId: {
    type: String,
    required: true,
    ref: 'Question'
  },
  questionNumber: {
    type: Number,
    required: true,
    min: [1, 'Question number must be at least 1']
  },
  // Encrypted answer data
  encryptedAnswer: {
    type: String,
    required: true
  },
  answerHash: {
    type: String,
    required: true
  },
  // Answer metadata
  selectedOption: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  marks: {
    type: Number,
    default: 0,
    min: [0, 'Marks cannot be negative']
  },
  maxMarks: {
    type: Number,
    required: true,
    min: [1, 'Max marks must be at least 1']
  },
  // Timing information
  timeSpent: {
    type: Number, // in seconds
    required: true,
    min: [0, 'Time spent cannot be negative']
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Answer status
  status: {
    type: String,
    enum: ['submitted', 'evaluated', 'reviewed', 'disputed'],
    default: 'submitted',
    required: true
  },
  // Review and evaluation
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evaluatedAt: {
    type: Date
  },
  evaluationNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Evaluation notes cannot exceed 1000 characters']
  },
  // Dispute handling
  isDisputed: {
    type: Boolean,
    default: false
  },
  disputeReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Dispute reason cannot exceed 500 characters']
  },
  disputeResolved: {
    type: Boolean,
    default: false
  },
  disputeResolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  disputeResolvedAt: {
    type: Date
  },
  // Blockchain integration
  blockchainHash: {
    type: String,
    trim: true
  },
  blockchainTxId: {
    type: String,
    trim: true
  },
  // Answer metadata
  confidence: {
    type: Number,
    min: [0, 'Confidence cannot be negative'],
    max: [1, 'Confidence cannot exceed 1'],
    default: 0.5
  },
  isMarkedForReview: {
    type: Boolean,
    default: false
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  },
  // Performance metrics
  responseTime: {
    type: Number, // in milliseconds
    min: [0, 'Response time cannot be negative']
  },
  attempts: {
    type: Number,
    default: 1,
    min: [1, 'Attempts must be at least 1']
  },
  // Security and integrity
  integrityHash: {
    type: String,
    trim: true
  },
  signature: {
    type: String,
    trim: true
  },
  // Metadata
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for answer score percentage
answerSchema.virtual('scorePercentage').get(function() {
  return Math.round((this.marks / this.maxMarks) * 100);
});

// Virtual for time efficiency (seconds per mark)
answerSchema.virtual('timeEfficiency').get(function() {
  return this.maxMarks > 0 ? this.timeSpent / this.maxMarks : 0;
});

// Indexes
answerSchema.index({ answerId: 1 });
answerSchema.index({ studentId: 1 });
answerSchema.index({ sessionId: 1 });
answerSchema.index({ paperId: 1 });
answerSchema.index({ questionId: 1 });
answerSchema.index({ status: 1 });
answerSchema.index({ submittedAt: 1 });
answerSchema.index({ blockchainHash: 1 });

// Compound indexes
answerSchema.index({ studentId: 1, paperId: 1 });
answerSchema.index({ sessionId: 1, questionNumber: 1 });
answerSchema.index({ paperId: 1, questionId: 1 });
answerSchema.index({ studentId: 1, status: 1 });

// Pre-save middleware to generate answer ID
answerSchema.pre('save', function(next) {
  if (!this.answerId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.answerId = `A${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Instance method to evaluate answer
answerSchema.methods.evaluate = function(evaluatedBy, isCorrect, marks, notes = null) {
  this.isCorrect = isCorrect;
  this.marks = marks;
  this.status = 'evaluated';
  this.evaluatedBy = evaluatedBy;
  this.evaluatedAt = new Date();
  if (notes) {
    this.evaluationNotes = notes;
  }
  return this.save();
};

// Instance method to mark for review
answerSchema.methods.markForReview = function(notes = null) {
  this.isMarkedForReview = true;
  if (notes) {
    this.reviewNotes = notes;
  }
  return this.save();
};

// Instance method to dispute answer
answerSchema.methods.dispute = function(reason) {
  this.isDisputed = true;
  this.disputeReason = reason;
  return this.save();
};

// Instance method to resolve dispute
answerSchema.methods.resolveDispute = function(resolvedBy, resolution = null) {
  this.disputeResolved = true;
  this.disputeResolvedBy = resolvedBy;
  this.disputeResolvedAt = new Date();
  if (resolution) {
    this.evaluationNotes = resolution;
  }
  return this.save();
};

// Instance method to update confidence
answerSchema.methods.updateConfidence = function(confidence) {
  this.confidence = Math.max(0, Math.min(1, confidence));
  return this.save();
};

// Instance method to increment attempts
answerSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Static method to find answers by student
answerSchema.statics.findByStudent = function(studentId) {
  return this.find({ studentId }).sort({ submittedAt: -1 });
};

// Static method to find answers by session
answerSchema.statics.findBySession = function(sessionId) {
  return this.find({ sessionId }).sort({ questionNumber: 1 });
};

// Static method to find answers by paper
answerSchema.statics.findByPaper = function(paperId) {
  return this.find({ paperId }).sort({ submittedAt: -1 });
};

// Static method to find evaluated answers
answerSchema.statics.findEvaluated = function() {
  return this.find({ status: 'evaluated' });
};

// Static method to find disputed answers
answerSchema.statics.findDisputed = function() {
  return this.find({ isDisputed: true, disputeResolved: false });
};

// Static method to get answer statistics
answerSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalAnswers: { $sum: 1 },
        evaluatedAnswers: { $sum: { $cond: [{ $eq: ['$status', 'evaluated'] }, 1, 0] } },
        correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        disputedAnswers: { $sum: { $cond: ['$isDisputed', 1, 0] } },
        avgMarks: { $avg: '$marks' },
        avgTimeSpent: { $avg: '$timeSpent' }
      }
    }
  ]);
};

// Static method to get performance analytics
answerSchema.statics.getPerformanceAnalytics = function(paperId = null) {
  const matchStage = paperId ? { paperId } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$questionId',
        totalAttempts: { $sum: 1 },
        correctAttempts: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        avgMarks: { $avg: '$marks' },
        avgTimeSpent: { $avg: '$timeSpent' },
        difficulty: { $first: '$maxMarks' }
      }
    },
    {
      $addFields: {
        successRate: { $divide: ['$correctAttempts', '$totalAttempts'] }
      }
    },
    { $sort: { successRate: 1 } }
  ]);
};

module.exports = mongoose.model('Answer', answerSchema); 