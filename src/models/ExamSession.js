const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  sessionId: {
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
  paperId: {
    type: String,
    required: true,
    ref: 'ExamPaper'
  },
  status: {
    type: String,
    enum: ['started', 'in_progress', 'paused', 'completed', 'terminated'],
    default: 'started',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  timeRemaining: {
    type: Number, // in seconds
    required: true
  },
  currentQuestion: {
    type: Number,
    default: 1,
    min: [1, 'Current question must be at least 1']
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: [1, 'Total questions must be at least 1']
  },
  answeredQuestions: {
    type: Number,
    default: 0,
    min: [0, 'Answered questions cannot be negative']
  },
  // Activity logging
  activities: [{
    type: {
      type: String,
      enum: ['question_view', 'answer_submit', 'question_navigate', 'tab_switch', 'copy_paste', 'fullscreen_exit', 'time_warning', 'session_pause', 'session_resume'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    questionNumber: {
      type: Number
    },
    details: {
      type: String,
      trim: true,
      maxlength: [500, 'Activity details cannot exceed 500 characters']
    },
    metadata: {
      type: Map,
      of: String
    }
  }],
  // Browser and device information
  userAgent: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  deviceInfo: {
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    device: String,
    screenResolution: String
  },
  // Security flags
  suspiciousActivities: [{
    type: {
      type: String,
      enum: ['multiple_tabs', 'copy_paste_detected', 'fullscreen_exit', 'time_manipulation', 'network_anomaly'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    details: {
      type: String,
      trim: true
    }
  }],
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    trim: true
  },
  // Progress tracking
  questionProgress: [{
    questionNumber: {
      type: Number,
      required: true
    },
    questionId: {
      type: String,
      required: true
    },
    isAnswered: {
      type: Boolean,
      default: false
    },
    isMarkedForReview: {
      type: Boolean,
      default: false
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    lastAccessed: {
      type: Date
    }
  }],
  // Session metadata
  sessionHash: {
    type: String,
    trim: true
  },
  blockchainTxId: {
    type: String,
    trim: true
  },
  // Network and connectivity
  connectionQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  disconnectionCount: {
    type: Number,
    default: 0
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session duration in minutes
examSessionSchema.virtual('elapsedTime').get(function() {
  if (!this.endTime) {
    return Math.floor((Date.now() - this.startTime.getTime()) / 60000);
  }
  return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 60000);
});

// Virtual for completion percentage
examSessionSchema.virtual('completionPercentage').get(function() {
  return Math.round((this.answeredQuestions / this.totalQuestions) * 100);
});

// Virtual for time remaining in minutes
examSessionSchema.virtual('timeRemainingMinutes').get(function() {
  return Math.floor(this.timeRemaining / 60);
});

// Indexes
examSessionSchema.index({ sessionId: 1 });
examSessionSchema.index({ studentId: 1 });
examSessionSchema.index({ paperId: 1 });
examSessionSchema.index({ status: 1 });
examSessionSchema.index({ startTime: 1 });
examSessionSchema.index({ sessionHash: 1 });

// Compound indexes
examSessionSchema.index({ studentId: 1, status: 1 });
examSessionSchema.index({ paperId: 1, status: 1 });
examSessionSchema.index({ studentId: 1, paperId: 1 });

// Pre-save middleware to generate session ID
examSessionSchema.pre('save', function(next) {
  if (!this.sessionId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.sessionId = `S${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Instance method to add activity
examSessionSchema.methods.addActivity = function(type, questionNumber = null, details = null, metadata = {}) {
  this.activities.push({
    type,
    timestamp: new Date(),
    questionNumber,
    details,
    metadata
  });
  return this.save();
};

// Instance method to add suspicious activity
examSessionSchema.methods.addSuspiciousActivity = function(type, severity = 'low', details = null) {
  this.suspiciousActivities.push({
    type,
    timestamp: new Date(),
    severity,
    details
  });
  
  if (severity === 'high' || severity === 'critical') {
    this.isFlagged = true;
    this.flagReason = details || `Suspicious activity detected: ${type}`;
  }
  
  return this.save();
};

// Instance method to update question progress
examSessionSchema.methods.updateQuestionProgress = function(questionNumber, questionId, isAnswered = false, isMarkedForReview = false) {
  const progress = this.questionProgress.find(p => p.questionNumber === questionNumber);
  
  if (progress) {
    progress.isAnswered = isAnswered;
    progress.isMarkedForReview = isMarkedForReview;
    progress.lastAccessed = new Date();
  } else {
    this.questionProgress.push({
      questionNumber,
      questionId,
      isAnswered,
      isMarkedForReview,
      lastAccessed: new Date()
    });
  }
  
  return this.save();
};

// Instance method to complete session
examSessionSchema.methods.complete = function() {
  this.status = 'completed';
  this.endTime = new Date();
  return this.save();
};

// Instance method to pause session
examSessionSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

// Instance method to resume session
examSessionSchema.methods.resume = function() {
  this.status = 'in_progress';
  return this.save();
};

// Instance method to terminate session
examSessionSchema.methods.terminate = function(reason = null) {
  this.status = 'terminated';
  this.endTime = new Date();
  if (reason) {
    this.flagReason = reason;
    this.isFlagged = true;
  }
  return this.save();
};

// Instance method to update heartbeat
examSessionSchema.methods.updateHeartbeat = function() {
  this.lastHeartbeat = new Date();
  return this.save();
};

// Static method to find active sessions
examSessionSchema.statics.findActive = function() {
  return this.find({ status: { $in: ['started', 'in_progress'] } });
};

// Static method to find sessions by student
examSessionSchema.statics.findByStudent = function(studentId) {
  return this.find({ studentId }).sort({ startTime: -1 });
};

// Static method to find sessions by paper
examSessionSchema.statics.findByPaper = function(paperId) {
  return this.find({ paperId }).sort({ startTime: -1 });
};

// Static method to get session statistics
examSessionSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        terminatedSessions: { $sum: { $cond: [{ $eq: ['$status', 'terminated'] }, 1, 0] } },
        flaggedSessions: { $sum: { $cond: ['$isFlagged', 1, 0] } },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);
};

module.exports = mongoose.model('ExamSession', examSessionSchema); 