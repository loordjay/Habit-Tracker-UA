const mongoose = require('mongoose');

const predefinedHabitSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['health', 'productivity', 'mindfulness', 'learning', 'fitness', 'social', 'creative'],
    index: true
  },
  title: {
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
  icon: {
    type: String,
    default: 'check_circle'
  },
  defaultColor: {
    type: String,
    default: '#13ec6a',
    enum: ['#13ec6a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  targetPerWeek: {
    type: Number,
    default: 7
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  estimatedMinutes: {
    type: Number,
    default: 15
  },
  // Order within category for display
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
predefinedHabitSchema.index({ category: 1, order: 1 });

// Static method to get all categories
predefinedHabitSchema.statics.getCategories = function() {
  return [
    { id: 'health', name: 'Health', icon: 'favorite', color: '#ef4444' },
    { id: 'productivity', name: 'Productivity', icon: 'bolt', color: '#f59e0b' },
    { id: 'mindfulness', name: 'Mindfulness', icon: 'self_improvement', color: '#8b5cf6' },
    { id: 'learning', name: 'Learning', icon: 'school', color: '#3b82f6' },
    { id: 'fitness', name: 'Fitness', icon: 'fitness_center', color: '#14b8a6' },
    { id: 'social', name: 'Social', icon: 'groups', color: '#ec4899' },
    { id: 'creative', name: 'Creative', icon: 'palette', color: '#f97316' }
  ];
};

// Static method to seed default habits
predefinedHabitSchema.statics.seedDefaults = async function() {
  const habits = [
    // Health Category
    { category: 'health', title: 'Drink 2L Water', description: 'Stay hydrated throughout the day', icon: 'water_drop', defaultColor: '#3b82f6', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 2, order: 1 },
    { category: 'health', title: 'Sleep 8 Hours', description: 'Get adequate rest for recovery', icon: 'bedtime', defaultColor: '#8b5cf6', frequency: 'daily', targetPerWeek: 7, difficulty: 'medium', estimatedMinutes: 0, order: 2 },
    { category: 'health', title: 'Take Vitamins', description: 'Daily vitamin supplements', icon: 'medication', defaultColor: '#14b8a6', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 1, order: 3 },
    { category: 'health', title: 'No Sugary Drinks', description: 'Avoid soda and sugary beverages', icon: 'no_drinks', defaultColor: '#ef4444', frequency: 'daily', targetPerWeek: 7, difficulty: 'medium', estimatedMinutes: 0, order: 4 },
    { category: 'health', title: 'Eat Breakfast', description: 'Start your day with a healthy meal', icon: 'restaurant', defaultColor: '#f59e0b', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 15, order: 5 },
    
    // Productivity Category
    { category: 'productivity', title: 'Read 10 Pages', description: 'Read a book or educational content', icon: 'menu_book', defaultColor: '#f59e0b', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 15, order: 1 },
    { category: 'productivity', title: 'Deep Work 2 Hours', description: 'Uninterrupted focused work session', icon: 'psychology', defaultColor: '#3b82f6', frequency: 'daily', targetPerWeek: 5, difficulty: 'hard', estimatedMinutes: 120, order: 2 },
    { category: 'productivity', title: 'Clear Inbox', description: 'Process all emails to zero', icon: 'inbox', defaultColor: '#8b5cf6', frequency: 'daily', targetPerWeek: 7, difficulty: 'medium', estimatedMinutes: 20, order: 3 },
    { category: 'productivity', title: 'Weekly Review', description: 'Review goals and plan next week', icon: 'calendar_month', defaultColor: '#14b8a6', frequency: 'weekly', targetPerWeek: 1, difficulty: 'medium', estimatedMinutes: 30, order: 4 },
    { category: 'productivity', title: 'Time Blocking', description: 'Schedule your tasks for tomorrow', icon: 'schedule', defaultColor: '#ec4899', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 10, order: 5 },
    
    // Mindfulness Category
    { category: 'mindfulness', title: 'Meditate 10 Minutes', description: 'Practice mindfulness meditation', icon: 'self_improvement', defaultColor: '#8b5cf6', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 10, order: 1 },
    { category: 'mindfulness', title: 'Journal', description: 'Write in your daily journal', icon: 'edit_note', defaultColor: '#f59e0b', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 10, order: 2 },
    { category: 'mindfulness', title: 'Practice Gratitude', description: 'List 3 things you are grateful for', icon: 'favorite', defaultColor: '#ec4899', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 5, order: 3 },
    { category: 'mindfulness', title: 'Digital Detox 1 Hour', description: 'No screens for one hour before bed', icon: 'phone_disabled', defaultColor: '#14b8a6', frequency: 'daily', targetPerWeek: 7, difficulty: 'medium', estimatedMinutes: 60, order: 4 },
    { category: 'mindfulness', title: 'Breathing Exercises', description: '5 minutes of deep breathing', icon: 'air', defaultColor: '#3b82f6', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 5, order: 5 },
    
    // Learning Category
    { category: 'learning', title: 'Code 1 Hour', description: 'Practice programming skills', icon: 'code', defaultColor: '#3b82f6', frequency: 'daily', targetPerWeek: 5, difficulty: 'medium', estimatedMinutes: 60, order: 1 },
    { category: 'learning', title: 'Learn New Language', description: 'Practice vocabulary or conversation', icon: 'translate', defaultColor: '#8b5cf6', frequency: 'daily', targetPerWeek: 7, difficulty: 'medium', estimatedMinutes: 20, order: 2 },
    { category: 'learning', title: 'Take Online Course', description: 'Complete one lesson from a course', icon: 'school', defaultColor: '#f59e0b', frequency: 'daily', targetPerWeek: 5, difficulty: 'easy', estimatedMinutes: 30, order: 3 },
    { category: 'learning', title: 'Listen to Podcast', description: 'Educational podcast episode', icon: 'headphones', defaultColor: '#ec4899', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 30, order: 4 },
    { category: 'learning', title: 'Flashcard Review', description: 'Review spaced repetition cards', icon: 'style', defaultColor: '#14b8a6', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 10, order: 5 },
    
    // Fitness Category
    { category: 'fitness', title: 'Workout', description: 'Exercise for at least 30 minutes', icon: 'fitness_center', defaultColor: '#14b8a6', frequency: 'daily', targetPerWeek: 5, difficulty: 'medium', estimatedMinutes: 45, order: 1 },
    { category: 'fitness', title: 'Stretch', description: 'Daily stretching routine', icon: 'accessibility_new', defaultColor: '#f59e0b', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 10, order: 2 },
    { category: 'fitness', title: 'Walk 10k Steps', description: 'Hit your daily step goal', icon: 'directions_walk', defaultColor: '#3b82f6', frequency: 'daily', targetPerWeek: 7, difficulty: 'medium', estimatedMinutes: 60, order: 3 },
    { category: 'fitness', title: 'Morning Workout', description: 'Exercise first thing in the morning', icon: 'wb_sunny', defaultColor: '#f97316', frequency: 'daily', targetPerWeek: 5, difficulty: 'hard', estimatedMinutes: 30, order: 4 },
    { category: 'fitness', title: 'Posture Check', description: 'Correct your posture throughout the day', icon: 'airline_seat_recline_normal', defaultColor: '#8b5cf6', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 0, order: 5 },
    
    // Social Category
    { category: 'social', title: 'Call a Friend', description: 'Connect with someone you care about', icon: 'call', defaultColor: '#ec4899', frequency: 'weekly', targetPerWeek: 1, difficulty: 'easy', estimatedMinutes: 20, order: 1 },
    { category: 'social', title: 'Spend Time with Family', description: 'Quality time with family members', icon: 'family_restroom', defaultColor: '#f59e0b', frequency: 'weekly', targetPerWeek: 2, difficulty: 'easy', estimatedMinutes: 60, order: 2 },
    { category: 'social', title: 'Networking', description: 'Connect with professional contacts', icon: 'business', defaultColor: '#3b82f6', frequency: 'weekly', targetPerWeek: 1, difficulty: 'medium', estimatedMinutes: 30, order: 3 },
    { category: 'social', title: 'Give a Compliment', description: 'Make someone\'s day brighter', icon: 'thumb_up', defaultColor: '#14b8a6', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 1, order: 4 },
    
    // Creative Category
    { category: 'creative', title: 'Draw/Sketch', description: 'Practice visual art', icon: 'brush', defaultColor: '#f97316', frequency: 'daily', targetPerWeek: 5, difficulty: 'easy', estimatedMinutes: 20, order: 1 },
    { category: 'creative', title: 'Write', description: 'Creative writing practice', icon: 'edit', defaultColor: '#8b5cf6', frequency: 'daily', targetPerWeek: 5, difficulty: 'medium', estimatedMinutes: 20, order: 2 },
    { category: 'creative', title: 'Play Music', description: 'Practice an instrument', icon: 'music_note', defaultColor: '#ec4899', frequency: 'daily', targetPerWeek: 5, difficulty: 'medium', estimatedMinutes: 30, order: 3 },
    { category: 'creative', title: 'Photography', description: 'Take photos of your day', icon: 'photo_camera', defaultColor: '#f59e0b', frequency: 'daily', targetPerWeek: 7, difficulty: 'easy', estimatedMinutes: 15, order: 4 },
    { category: 'creative', title: 'Learn New Recipe', description: 'Try cooking a new dish', icon: 'restaurant_menu', defaultColor: '#14b8a6', frequency: 'weekly', targetPerWeek: 1, difficulty: 'medium', estimatedMinutes: 60, order: 5 }
  ];

  try {
    // Check if habits already exist
    const count = await this.countDocuments();
    if (count === 0) {
      await this.insertMany(habits);
      console.log('✅ Predefined habits seeded successfully');
    }
  } catch (error) {
    console.error('❌ Error seeding predefined habits:', error.message);
  }
};

module.exports = mongoose.model('PredefinedHabit', predefinedHabitSchema);
