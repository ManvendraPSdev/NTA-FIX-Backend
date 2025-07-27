const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  stateCode: {
    type: String,
    required: [true, 'State code is required'],
    trim: true,
    uppercase: true,
    maxlength: [10, 'State code cannot exceed 10 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: [200, 'Topic cannot exceed 200 characters']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required'],
    default: 'medium'
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [2000, 'Question text cannot exceed 2000 characters']
  },
  options: {
    A: {
      type: String,
      required: [true, 'Option A is required'],
      trim: true,
      maxlength: [500, 'Option A cannot exceed 500 characters']
    },
    B: {
      type: String,
      required: [true, 'Option B is required'],
      trim: true,
      maxlength: [500, 'Option B cannot exceed 500 characters']
    },
    C: {
      type: String,
      required: [true, 'Option C is required'],
      trim: true,
      maxlength: [500, 'Option C cannot exceed 500 characters']
    },
    D: {
      type: String,
      required: [true, 'Option D is required'],
      trim: true,
      maxlength: [500, 'Option D cannot exceed 500 characters']
    }
  },
  correctAnswer: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: [true, 'Correct answer is required']
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [1000, 'Explanation cannot exceed 1000 characters']
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [1, 'Marks must be at least 1'],
    max: [10, 'Marks cannot exceed 10'],
    default: 1
  },
  timeLimit: {
    type: Number,
    min: [30, 'Time limit must be at least 30 seconds'],
    max: [600, 'Time limit cannot exceed 600 seconds'],
    default: 120 // 2 minutes
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  blockchainHash: {
    type: String,
    trim: true
  },
  blockchainTxId: {
    type: String,
    trim: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  },
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

// Virtual for full question identifier
questionSchema.virtual('fullQuestionId').get(function() {
  return `${this.stateCode}_${this.questionId}`;
});

// Virtual for question hash
questionSchema.virtual('questionHash').get(function() {
  const crypto = require('crypto');
  const questionData = {
    questionText: this.questionText,
    options: this.options,
    correctAnswer: this.correctAnswer,
    subject: this.subject,
    topic: this.topic
  };
  return crypto.createHash('sha256').update(JSON.stringify(questionData)).digest('hex');
});

// Indexes
questionSchema.index({ questionId: 1 });
questionSchema.index({ stateCode: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ topic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ isVerified: 1 });
questionSchema.index({ blockchainHash: 1 });
questionSchema.index({ 'options.A': 'text', 'options.B': 'text', 'options.C': 'text', 'options.D': 'text', questionText: 'text' });

// Compound indexes
questionSchema.index({ stateCode: 1, subject: 1 });
questionSchema.index({ subject: 1, difficulty: 1 });
questionSchema.index({ isActive: 1, isVerified: 1 });

// Pre-save middleware to generate question ID if not provided
questionSchema.pre('save', function(next) {
  if (!this.questionId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.questionId = `Q${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Instance method to mark as verified
questionSchema.methods.markAsVerified = function(verifiedBy) {
  this.isVerified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  return this.save();
};

// Instance method to increment usage count
questionSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Instance method to get question for exam (without correct answer)
questionSchema.methods.getForExam = function() {
  const questionData = this.toObject();
  delete questionData.correctAnswer;
  delete questionData.explanation;
  delete questionData.blockchainHash;
  delete questionData.blockchainTxId;
  delete questionData.verifiedBy;
  delete questionData.verifiedAt;
  return questionData;
};

// Static method to find questions by state
questionSchema.statics.findByState = function(stateCode) {
  return this.find({ stateCode: stateCode.toUpperCase(), isActive: true });
};

// Static method to find verified questions by subject
questionSchema.statics.findVerifiedBySubject = function(subject) {
  return this.find({ 
    subject: new RegExp(subject, 'i'), 
    isVerified: true, 
    isActive: true 
  });
};

// Static method to find questions by difficulty
questionSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ 
    difficulty, 
    isVerified: true, 
    isActive: true 
  });
};

// Static method to get question statistics
questionSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        verifiedQuestions: { $sum: { $cond: ['$isVerified', 1, 0] } },
        activeQuestions: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalUsage: { $sum: '$usageCount' },
        avgMarks: { $avg: '$marks' }
      }
    }
  ]);
};

module.exports = mongoose.model('Question', questionSchema); 