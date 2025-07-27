const mongoose = require('mongoose');

const examPaperSchema = new mongoose.Schema({
  paperId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  title: {
    type: String,
    required: [true, 'Paper title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions count is required'],
    min: [1, 'Total questions must be at least 1'],
    max: [200, 'Total questions cannot exceed 200']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required'],
    min: [1, 'Total marks must be at least 1'],
    max: [1000, 'Total marks cannot exceed 1000']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [30, 'Duration must be at least 30 minutes'],
    max: [480, 'Duration cannot exceed 480 minutes (8 hours)']
  },
  questions: [{
    questionId: {
      type: String,
      required: true,
      ref: 'Question'
    },
    order: {
      type: Number,
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: [1, 'Marks must be at least 1']
    },
    timeLimit: {
      type: Number,
      required: true,
      min: [30, 'Time limit must be at least 30 seconds']
    }
  }],
  difficultyDistribution: {
    easy: {
      type: Number,
      default: 0,
      min: [0, 'Easy questions count cannot be negative']
    },
    medium: {
      type: Number,
      default: 0,
      min: [0, 'Medium questions count cannot be negative']
    },
    hard: {
      type: Number,
      default: 0,
      min: [0, 'Hard questions count cannot be negative']
    }
  },
  // Shamir Secret Sharing for paper decryption
  shamirShares: [{
    shareId: {
      type: Number,
      required: true
    },
    share: {
      type: String,
      required: true
    },
    holder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    distributedAt: {
      type: Date,
      default: Date.now
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  }],
  threshold: {
    type: Number,
    required: [true, 'Shamir threshold is required'],
    min: [2, 'Threshold must be at least 2'],
    max: [10, 'Threshold cannot exceed 10']
  },
  totalShares: {
    type: Number,
    required: [true, 'Total shares count is required'],
    min: [2, 'Total shares must be at least 2'],
    max: [20, 'Total shares cannot exceed 20']
  },
  // Paper status
  status: {
    type: String,
    enum: ['generated', 'distributed', 'decrypted', 'active', 'completed', 'archived'],
    default: 'generated',
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  decryptedAt: {
    type: Date
  },
  activatedAt: {
    type: Date
  },
  completedAt: {
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
  // Paper metadata
  instructions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks are required'],
    min: [1, 'Passing marks must be at least 1'],
    max: function() { return this.totalMarks; }
  },
  negativeMarking: {
    type: Boolean,
    default: false
  },
  negativeMarkingRatio: {
    type: Number,
    default: 0,
    min: [0, 'Negative marking ratio cannot be negative'],
    max: [1, 'Negative marking ratio cannot exceed 1']
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  allowBacktracking: {
    type: Boolean,
    default: true
  },
  // Statistics
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  passRate: {
    type: Number,
    default: 0
  },
  // Tags and metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for paper hash
examPaperSchema.virtual('paperHash').get(function() {
  const crypto = require('crypto');
  const paperData = {
    paperId: this.paperId,
    title: this.title,
    subject: this.subject,
    totalQuestions: this.totalQuestions,
    totalMarks: this.totalMarks,
    questions: this.questions.map(q => ({ questionId: q.questionId, order: q.order, marks: q.marks })),
    difficultyDistribution: this.difficultyDistribution,
    generatedAt: this.generatedAt
  };
  return crypto.createHash('sha256').update(JSON.stringify(paperData)).digest('hex');
});

// Virtual for paper status check
examPaperSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

examPaperSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Indexes
examPaperSchema.index({ paperId: 1 });
examPaperSchema.index({ subject: 1 });
examPaperSchema.index({ status: 1 });
examPaperSchema.index({ generatedBy: 1 });
examPaperSchema.index({ blockchainHash: 1 });
examPaperSchema.index({ 'questions.questionId': 1 });

// Compound indexes
examPaperSchema.index({ subject: 1, status: 1 });
examPaperSchema.index({ generatedBy: 1, status: 1 });

// Pre-save middleware to generate paper ID if not provided
examPaperSchema.pre('save', function(next) {
  if (!this.paperId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.paperId = `P${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Instance method to activate paper
examPaperSchema.methods.activate = function() {
  this.status = 'active';
  this.activatedAt = new Date();
  return this.save();
};

// Instance method to complete paper
examPaperSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Instance method to add Shamir share
examPaperSchema.methods.addShamirShare = function(shareId, share, holder) {
  this.shamirShares.push({
    shareId,
    share,
    holder,
    distributedAt: new Date()
  });
  return this.save();
};

// Instance method to mark share as used
examPaperSchema.methods.markShareAsUsed = function(shareId) {
  const share = this.shamirShares.find(s => s.shareId === shareId);
  if (share) {
    share.isUsed = true;
    return this.save();
  }
  throw new Error('Share not found');
};

// Instance method to get available shares
examPaperSchema.methods.getAvailableShares = function() {
  return this.shamirShares.filter(share => !share.isUsed);
};

// Instance method to check if enough shares are available
examPaperSchema.methods.hasEnoughShares = function() {
  const availableShares = this.getAvailableShares();
  return availableShares.length >= this.threshold;
};

// Static method to find active papers
examPaperSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find papers by subject
examPaperSchema.statics.findBySubject = function(subject) {
  return this.find({ subject: new RegExp(subject, 'i') });
};

// Static method to get paper statistics
examPaperSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalPapers: { $sum: 1 },
        activePapers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        completedPapers: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalAttempts: { $sum: '$totalAttempts' },
        avgScore: { $avg: '$averageScore' },
        avgPassRate: { $avg: '$passRate' }
      }
    }
  ]);
};

module.exports = mongoose.model('ExamPaper', examPaperSchema); 