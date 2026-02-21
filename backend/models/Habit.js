const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  color: {
    type: String,
    default: '#13ec6a', // Primary green
    enum: ['#13ec6a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  },
  icon: {
    type: String,
    default: 'check_circle'
  },
  // GitHub-style heatmap data - array of completed dates
  completedDates: {
    type: [Date],
    default: [],
    index: true
  },
  // Streak tracking
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastCompletedDate: {
    type: Date,
    default: null
  },
  // Completion statistics
  totalCompletions: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0 // Percentage
  },
  // Target/frequency settings
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  targetPerWeek: {
    type: Number,
    default: 7
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Index for efficient querying
habitSchema.index({ user: 1, createdAt: -1 });
habitSchema.index({ user: 1, 'completedDates': -1 });

// Pre-save middleware to update timestamps
habitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to mark habit as completed for a specific date
habitSchema.methods.markComplete = function(date = new Date()) {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  // Check if already completed today
  const alreadyCompleted = this.completedDates.some(d => {
    const completedDate = new Date(d);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === dateOnly.getTime();
  });
  
  if (!alreadyCompleted) {
    this.completedDates.push(dateOnly);
    this.totalCompletions += 1;
    this.lastCompletedDate = dateOnly;
    
    // Update streak logic
    this._updateStreak(dateOnly);
    
    return true;
  }
  
  return false;
};

// Method to update streak
habitSchema.methods._updateStreak = function(completedDate) {
  const yesterday = new Date(completedDate);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const lastCompleted = this.lastCompletedDate ? new Date(this.lastCompletedDate) : null;
  if (lastCompleted) {
    lastCompleted.setHours(0, 0, 0, 0);
  }
  
  if (lastCompleted && lastCompleted.getTime() === yesterday.getTime()) {
    // Consecutive day - increment streak
    this.currentStreak += 1;
  } else if (!lastCompleted || lastCompleted.getTime() !== completedDate.getTime()) {
    // Starting fresh or gap in streak
    this.currentStreak = 1;
  }
  
  // Update longest streak
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
};

// Method to unmark completion
habitSchema.methods.unmarkComplete = function(date = new Date()) {
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  const index = this.completedDates.findIndex(d => {
    const completedDate = new Date(d);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === dateOnly.getTime();
  });
  
  if (index > -1) {
    this.completedDates.splice(index, 1);
    this.totalCompletions = Math.max(0, this.totalCompletions - 1);
    
    // Recalculate streak
    if (this.completedDates.length > 0) {
      const lastDate = new Date(Math.max(...this.completedDates.map(d => new Date(d).getTime())));
      lastDate.setHours(0, 0, 0, 0);
      
      const dayBefore = new Date(lastDate);
      dayBefore.setDate(dayBefore.getDate() - 1);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastDate.getTime() === today.getTime() || lastDate.getTime() === dayBefore.getTime()) {
        this.currentStreak = 1;
        for (let i = this.completedDates.length - 2; i >= 0; i--) {
          const current = new Date(this.completedDates[i]);
          const next = new Date(this.completedDates[i + 1]);
          current.setHours(0, 0, 0, 0);
          next.setHours(0, 0, 0, 0);
          
          const diff = (next - current) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            this.currentStreak++;
          } else {
            break;
          }
        }
      } else {
        this.currentStreak = 0;
      }
    } else {
      this.currentStreak = 0;
    }
    
    this.lastCompletedDate = this.completedDates.length > 0 
      ? new Date(Math.max(...this.completedDates.map(d => new Date(d).getTime())))
      : null;
    
    return true;
  }
  
  return false;
};

// Static method to get heatmap data for a user
habitSchema.statics.getHeatmapData = async function(userId, startDate, endDate) {
  const habits = await this.find({ 
    user: userId, 
    isDeleted: false 
  });
  
  // Aggregate all completion dates
  const heatmapData = {};
  
  habits.forEach(habit => {
    habit.completedDates.forEach(date => {
      const dateKey = new Date(date).toISOString().split('T')[0];
      heatmapData[dateKey] = (heatmapData[dateKey] || 0) + 1;
    });
  });
  
  // Filter by date range
  const filteredData = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  Object.keys(heatmapData).forEach(dateKey => {
    const date = new Date(dateKey);
    if (date >= start && date <= end) {
      filteredData[dateKey] = heatmapData[dateKey];
    }
  });
  
  return filteredData;
};

module.exports = mongoose.model('Habit', habitSchema);
