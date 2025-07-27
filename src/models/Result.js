const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  resultId: {
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
  // Score information
  totalMarks: {
    type: Number,
    required: true,
    min: [0, 'Total marks cannot be negative']
  },
  obtainedMarks: {
    type: Number,
    required: true,
    min: [0, 'Obtained marks cannot be negative']
  },
  percentage: {
    type: Number,
    required: true,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    required: true
  },
  isPassed: {
    type: Boolean,
    required: true
  },
  // Performance breakdown
  correctAnswers: {
    type: Number,
    required: true,
    min: [0, 'Correct answers cannot be negative']
  },
  incorrectAnswers: {
    type: Number,
    required: true,
    min: [0, 'Incorrect answers cannot be negative']
  },
  unansweredQuestions: {
    type: Number,
    required: true,
    min: [0, 'Unanswered questions cannot be negative']
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: [1, 'Total questions must be at least 1']
  },
  // Timing information
  totalTimeSpent: {
    type: Number, // in minutes
    required: true,
    min: [0, 'Total time spent cannot be negative']
  },
  averageTimePerQuestion: {
    type: Number, // in seconds
    required: true,
    min: [0, 'Average time per question cannot be negative']
  },
  // Ranking information
  rank: {
    type: Number,
    min: [1, 'Rank must be at least 1']
  },
  totalParticipants: {
    type: Number,
    min: [1, 'Total participants must be at least 1']
  },
  percentile: {
    type: Number,
    min: [0, 'Percentile cannot be negative'],
    max: [100, 'Percentile cannot exceed 100']
  },
  // Subject-wise performance
  subjectPerformance: [{
    subject: {
      type: String,
      required: true,
      trim: true
    },
    totalMarks: {
      type: Number,
      required: true,
      min: [0, 'Subject total marks cannot be negative']
    },
    obtainedMarks: {
      type: Number,
      required: true,
      min: [0, 'Subject obtained marks cannot be negative']
    },
    percentage: {
      type: Number,
      required: true,
      min: [0, 'Subject percentage cannot be negative'],
      max: [100, 'Subject percentage cannot exceed 100']
    }
  }],
  // Difficulty-wise performance
  difficultyPerformance: {
    easy: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    medium: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    hard: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }
  },
  // Result status
  status: {
    type: String,
    enum: ['calculated', 'published', 'disputed', 'revised'],
    default: 'calculated',
    required: true
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  // Security and integrity
  resultHash: {
    type: String,
    required: true,
    trim: true
  },
  signature: {
    type: String,
    trim: true
  },
  // Analytics and insights
  accuracy: {
    type: Number,
    min: [0, 'Accuracy cannot be negative'],
    max: [1, 'Accuracy cannot exceed 1']
  },
  efficiency: {
    type: Number,
    min: [0, 'Efficiency cannot be negative'],
    max: [1, 'Efficiency cannot exceed 1']
  },
  confidence: {
    type: Number,
    min: [0, 'Confidence cannot be negative'],
    max: [1, 'Confidence cannot exceed 1']
  },
  // Metadata
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for performance category
resultSchema.virtual('performanceCategory').get(function() {
  if (this.percentage >= 90) return 'Excellent';
  if (this.percentage >= 80) return 'Very Good';
  if (this.percentage >= 70) return 'Good';
  if (this.percentage >= 60) return 'Average';
  if (this.percentage >= 50) return 'Below Average';
  return 'Poor';
});

// Virtual for rank percentage
resultSchema.virtual('rankPercentage').get(function() {
  if (!this.rank || !this.totalParticipants) return null;
  return Math.round(((this.totalParticipants - this.rank + 1) / this.totalParticipants) * 100);
});

// Indexes
resultSchema.index({ resultId: 1 });
resultSchema.index({ studentId: 1 });
resultSchema.index({ sessionId: 1 });
resultSchema.index({ paperId: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ rank: 1 });
resultSchema.index({ percentage: 1 });
resultSchema.index({ blockchainHash: 1 });
resultSchema.index({ resultHash: 1 });

// Compound indexes
resultSchema.index({ paperId: 1, rank: 1 });
resultSchema.index({ studentId: 1, paperId: 1 });
resultSchema.index({ paperId: 1, percentage: -1 });
resultSchema.index({ paperId: 1, status: 1 });

// Pre-save middleware to generate result ID
resultSchema.pre('save', function(next) {
  if (!this.resultId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.resultId = `R${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Instance method to publish result
resultSchema.methods.publish = function(publishedBy) {
  this.status = 'published';
  this.publishedAt = new Date();
  this.publishedBy = publishedBy;
  return this.save();
};

// Instance method to dispute result
resultSchema.methods.dispute = function(reason) {
  this.isDisputed = true;
  this.disputeReason = reason;
  this.status = 'disputed';
  return this.save();
};

// Instance method to resolve dispute
resultSchema.methods.resolveDispute = function(resolvedBy, resolution = null) {
  this.disputeResolved = true;
  this.disputeResolvedBy = resolvedBy;
  this.disputeResolvedAt = new Date();
  this.status = 'revised';
  if (resolution) {
    this.metadata.set('disputeResolution', resolution);
  }
  return this.save();
};

// Instance method to update rank
resultSchema.methods.updateRank = function(rank, totalParticipants) {
  this.rank = rank;
  this.totalParticipants = totalParticipants;
  this.percentile = Math.round(((totalParticipants - rank + 1) / totalParticipants) * 100);
  return this.save();
};

// Instance method to calculate performance metrics
resultSchema.methods.calculateMetrics = function() {
  this.accuracy = this.totalQuestions > 0 ? this.correctAnswers / this.totalQuestions : 0;
  this.efficiency = this.totalTimeSpent > 0 ? this.obtainedMarks / this.totalTimeSpent : 0;
  this.confidence = this.accuracy * this.efficiency;
  return this.save();
};

// Static method to find results by student
resultSchema.statics.findByStudent = function(studentId) {
  return this.find({ studentId }).sort({ calculatedAt: -1 });
};

// Static method to find results by paper
resultSchema.statics.findByPaper = function(paperId) {
  return this.find({ paperId }).sort({ rank: 1 });
};

// Static method to find published results
resultSchema.statics.findPublished = function() {
  return this.find({ status: 'published' });
};

// Static method to find disputed results
resultSchema.statics.findDisputed = function() {
  return this.find({ isDisputed: true, disputeResolved: false });
};

// Static method to get rank list
resultSchema.statics.getRankList = function(paperId, limit = 100) {
  return this.find({ paperId, status: 'published' })
    .sort({ rank: 1 })
    .limit(limit)
    .populate('studentId', 'firstName lastName studentId');
};

// Static method to get result statistics
resultSchema.statics.getStatistics = function(paperId = null) {
  const matchStage = paperId ? { paperId } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalResults: { $sum: 1 },
        publishedResults: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        passedResults: { $sum: { $cond: ['$isPassed', 1, 0] } },
        avgPercentage: { $avg: '$percentage' },
        avgMarks: { $avg: '$obtainedMarks' },
        maxMarks: { $max: '$obtainedMarks' },
        minMarks: { $min: '$obtainedMarks' }
      }
    }
  ]);
};

// Static method to calculate ranks for a paper
resultSchema.statics.calculateRanks = async function(paperId) {
  const results = await this.find({ paperId }).sort({ obtainedMarks: -1, totalTimeSpent: 1 });
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    await result.updateRank(i + 1, results.length);
  }
  
  return results.length;
};

// Static method to get performance analytics
resultSchema.statics.getPerformanceAnalytics = function(paperId) {
  return this.aggregate([
    { $match: { paperId } },
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 },
        avgPercentage: { $avg: '$percentage' },
        avgMarks: { $avg: '$obtainedMarks' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

module.exports = mongoose.model('Result', resultSchema); 