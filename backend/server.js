require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Habit = require('./models/Habit');
const PredefinedHabit = require('./models/PredefinedHabit');
const SupportTicket = require('./models/SupportTicket');
const SupportMessage = require('./models/SupportMessage');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware for performance tracking
const requestTimes = [];
const requestErrors = [];

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    requestTimes.push({ time: duration, endpoint: req.path, timestamp: new Date() });

    if (res.statusCode >= 500) {
      requestErrors.push({
        endpoint: req.path,
        status: res.statusCode,
        timestamp: new Date()
      });
    }

    // Keep only last 1000 requests
    if (requestTimes.length > 1000) requestTimes.shift();
    if (requestErrors.length > 100) requestErrors.shift();
  });

  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/habit-tracker';

let dbConnectionTime = null;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    dbConnectionTime = new Date();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Server start time for uptime calculation
const serverStartTime = new Date();

// In-memory admin settings (in production, store in DB)
const adminSettings = {
  maintenanceMode: false,
  newSignupsEnabled: true,
  rateLimitPer15Min: 100,
  cacheClearedAt: null
};

// Audit logs storage (in production, use a separate collection)
const auditLogs = [];

// ==================== MIDDLEWARE ====================

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Maintenance mode middleware
const maintenanceMiddleware = (req, res, next) => {
  if (adminSettings.maintenanceMode && req.user?.role !== 'admin') {
    return res.status(503).json({
      message: 'System is under maintenance. Please try again later.',
      maintenanceMode: true
    });
  }
  next();
};

// Helper function to add audit log
const addAuditLog = (adminId, adminEmail, action, target, ipAddress) => {
  auditLogs.unshift({
    timestamp: new Date(),
    actorId: adminId,
    actorEmail: adminEmail,
    action,
    target,
    ipAddress
  });
  // Keep only last 500 logs
  if (auditLogs.length > 500) auditLogs.pop();
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    // Check if new signups are enabled
    if (!adminSettings.newSignupsEnabled) {
      return res.status(403).json({ message: 'New registrations are currently disabled' });
    }

    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({ email, password, name });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if suspended
    if (user.isSuspended) {
      return res.status(403).json({ message: 'Account is suspended. Contact admin.' });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    user.loginHistory.push({
      date: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordResetRequired: user.passwordResetRequired
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create admin user (seed endpoint - remove in production)
app.post('/api/auth/create-admin', async (req, res) => {
  try {
    const { email, password, name, secretKey } = req.body;

    if (secretKey !== 'admin-secret-key') {
      return res.status(403).json({ message: 'Invalid secret key' });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      await user.save();
      return res.json({ message: 'User updated to admin', user: { id: user._id, email: user.email, role: user.role } });
    }

    user = new User({ email, password, name, role: 'admin' });
    await user.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
});

// ==================== USER PROFILE ROUTES ====================

// Get user profile
app.get('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        timezone: user.timezone,
        preferences: user.preferences,
        totalPoints: user.totalPoints,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, bio, timezone, avatar, preferences } = req.body;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (timezone) user.timezone = timezone;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences) {
      const currentPrefs = user.preferences ? user.preferences.toObject() : {};
      user.preferences = {
        ...currentPrefs,
        ...preferences
      };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        timezone: user.timezone,
        preferences: user.preferences,
        totalPoints: user.totalPoints,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// ==================== HABIT ROUTES ====================
// IMPORTANT: Specific routes (/analytics, /heatmap, /templates, /from-template)
// MUST be registered BEFORE the generic /:id route

// Get all habits for current user
app.get('/api/habits', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.userId, isDeleted: false })
      .sort({ createdAt: -1 });
    res.json({ habits });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching habits', error: error.message });
  }
});

// Create a new habit
app.post('/api/habits', authMiddleware, async (req, res) => {
  try {
    const { name, description, color, icon, frequency, targetPerWeek } = req.body;

    const habit = new Habit({
      user: req.userId,
      name,
      description,
      color,
      icon,
      frequency,
      targetPerWeek
    });

    await habit.save();

    res.status(201).json({
      message: 'Habit created successfully',
      habit
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating habit', error: error.message });
  }
});

// ==================== ANALYTICS ROUTES ====================
// (Must come before generic /:id routes)

// Get comprehensive analytics data
app.get('/api/habits/analytics', authMiddleware, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const habits = await Habit.find({
      user: req.userId,
      isDeleted: false
    });

    // Build completion data
    const dailyCompletions = [];
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
    const timeOfDayCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    // Initialize daily completions array
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dailyCompletions.push({
        date: d.toISOString().split('T')[0],
        count: 0
      });
    }

    // Process completions
    habits.forEach(habit => {
      habit.completedDates.forEach(date => {
        const dateObj = new Date(date);
        const dateKey = dateObj.toISOString().split('T')[0];

        const dailyIndex = dailyCompletions.findIndex(d => d.date === dateKey);
        if (dailyIndex !== -1) {
          dailyCompletions[dailyIndex].count += 1;
        }

        dayOfWeekCounts[dateObj.getDay()] += 1;

        const hour = dateObj.getHours();
        if (hour >= 5 && hour < 12) timeOfDayCounts.morning += 1;
        else if (hour >= 12 && hour < 17) timeOfDayCounts.afternoon += 1;
        else if (hour >= 17 && hour < 21) timeOfDayCounts.evening += 1;
        else timeOfDayCounts.night += 1;
      });
    });

    // Calculate weekly data
    const weeklyData = [];
    const weeks = Math.ceil(days / 7);
    for (let w = 0; w < weeks; w++) {
      const weekStart = w * 7;
      const weekEnd = Math.min((w + 1) * 7, days);
      let weekCompletions = 0;
      for (let d = weekStart; d < weekEnd; d++) {
        if (dailyCompletions[d]) {
          weekCompletions += dailyCompletions[d].count;
        }
      }
      weeklyData.push({ week: w + 1, completions: weekCompletions });
    }

    // Calculate monthly data
    const monthlyData = [];
    const months = {};
    dailyCompletions.forEach(day => {
      const month = day.date.substring(0, 7);
      if (!months[month]) months[month] = 0;
      months[month] += day.count;
    });
    Object.entries(months).forEach(([month, count]) => {
      monthlyData.push({ month, completions: count });
    });

    // Habit performance
    const habitPerformance = habits.map(habit => {
      const periodCompletions = habit.completedDates.filter(d => d >= startDate).length;
      const completionRate = days > 0 ? Math.round((periodCompletions / days) * 100) : 0;

      return {
        id: habit._id,
        name: habit.name,
        color: habit.color,
        totalCompletions: habit.totalCompletions,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak,
        completionRate
      };
    }).sort((a, b) => b.totalCompletions - a.totalCompletions);

    const bestHabits = habitPerformance.slice(0, 5);

    const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);
    const currentStreak = Math.max(...habits.map(h => h.currentStreak), 0);
    const longestStreak = Math.max(...habits.map(h => h.longestStreak), 0);

    const midPoint = Math.floor(days / 2);
    let thisPeriodCompletions = 0;
    let prevPeriodCompletions = 0;
    dailyCompletions.forEach((day, i) => {
      if (i >= midPoint) thisPeriodCompletions += day.count;
      else prevPeriodCompletions += day.count;
    });
    const trend = prevPeriodCompletions > 0
      ? Math.round(((thisPeriodCompletions - prevPeriodCompletions) / prevPeriodCompletions) * 100)
      : (thisPeriodCompletions > 0 ? 100 : 0);

    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
      day,
      count: dayOfWeekCounts[i]
    }));

    res.json({
      overview: {
        totalHabits: habits.length,
        totalCompletions,
        currentStreak,
        longestStreak,
        avgCompletionRate: habitPerformance.length > 0
          ? Math.round(habitPerformance.reduce((sum, h) => sum + h.completionRate, 0) / habitPerformance.length)
          : 0,
        trend
      },
      dailyCompletions,
      weeklyData,
      monthlyData,
      dayOfWeek,
      timeOfDay: timeOfDayCounts,
      bestHabits,
      habitPerformance
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// ==================== HEATMAP ROUTES ====================
// (Must come before generic /:id routes)

// Get heatmap data for GitHub-style contribution graph
app.get('/api/habits/heatmap', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 52 weeks
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 52 * 7 * 24 * 60 * 60 * 1000);

    const habits = await Habit.find({
      user: req.userId,
      isDeleted: false
    });

    // Build heatmap data
    const heatmapData = {};
    const habitStats = {};

    habits.forEach(habit => {
      habitStats[habit._id] = {
        name: habit.name,
        color: habit.color,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak,
        totalCompletions: habit.totalCompletions
      };

      habit.completedDates.forEach(date => {
        const dateKey = date.toISOString().split('T')[0];
        if (!heatmapData[dateKey]) {
          heatmapData[dateKey] = { count: 0, habits: [] };
        }
        heatmapData[dateKey].count += 1;
        if (!heatmapData[dateKey].habits.includes(habit._id.toString())) {
          heatmapData[dateKey].habits.push(habit._id.toString());
        }
      });
    });

    // Filter by date range and format
    const filteredData = {};
    const startTime = start.getTime();
    const endTime = end.getTime();

    Object.keys(heatmapData).forEach(dateKey => {
      const dateTime = new Date(dateKey).getTime();
      if (dateTime >= startTime && dateTime <= endTime) {
        filteredData[dateKey] = heatmapData[dateKey];
      }
    });

    // Calculate overall stats
    const totalHabits = habits.length;
    const totalCompletions = habits.reduce((sum, h) => sum + h.totalCompletions, 0);
    const longestStreak = Math.max(...habits.map(h => h.longestStreak), 0);
    const currentStreak = Math.max(...habits.map(h => h.currentStreak), 0);

    // Calculate today's completion
    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = heatmapData[today]?.count || 0;

    // Weekly stats (last 7 days)
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      weeklyStats.push({
        date: dateKey,
        count: heatmapData[dateKey]?.count || 0,
        completed: (heatmapData[dateKey]?.count || 0) > 0
      });
    }

    res.json({
      heatmap: filteredData,
      habitStats,
      stats: {
        totalHabits,
        totalCompletions,
        longestStreak,
        currentStreak,
        todayCompletions,
        weeklyStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching heatmap data', error: error.message });
  }
});

// ==================== PREDEFINED HABITS ROUTES ====================
// (Must come before generic /:id routes)

// Get all habit templates/categories
app.get('/api/habits/templates/categories', async (req, res) => {
  try {
    const categories = PredefinedHabit.getCategories();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get all habit templates
app.get('/api/habits/templates', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const templates = await PredefinedHabit.find(query).sort({ category: 1, order: 1 });
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
});

// Clone a template to user's habits
app.post('/api/habits/from-template', authMiddleware, async (req, res) => {
  try {
    const { templateId, customName, customDescription, customColor, customFrequency, customTargetPerWeek } = req.body;
    const template = await PredefinedHabit.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    const habit = new Habit({
      user: req.userId,
      name: customName || template.title,
      description: customDescription || template.description,
      color: customColor || template.defaultColor,
      icon: template.icon,
      frequency: customFrequency || template.frequency,
      targetPerWeek: customTargetPerWeek || template.targetPerWeek
    });
    await habit.save();
    res.status(201).json({ message: 'Habit created from template', habit });
  } catch (error) {
    res.status(500).json({ message: 'Error creating habit from template', error: error.message });
  }
});

// ==================== GENERIC HABIT /:id ROUTES ====================
// IMPORTANT: These MUST come AFTER all specific /api/habits/* routes above

// Update a habit
app.put('/api/habits/:id', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const { name, description, color, icon, frequency, targetPerWeek } = req.body;

    if (name) habit.name = name;
    if (description !== undefined) habit.description = description;
    if (color) habit.color = color;
    if (icon) habit.icon = icon;
    if (frequency) habit.frequency = frequency;
    if (targetPerWeek) habit.targetPerWeek = targetPerWeek;

    await habit.save();

    res.json({
      message: 'Habit updated successfully',
      habit
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating habit', error: error.message });
  }
});

// Delete a habit (soft delete)
app.delete('/api/habits/:id', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    habit.isDeleted = true;
    await habit.save();

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting habit', error: error.message });
  }
});

// Mark habit as complete
app.post('/api/habits/:id/complete', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const { date } = req.body;
    const completed = habit.markComplete(date ? new Date(date) : new Date());
    await habit.save();

    res.json({
      message: completed ? 'Habit marked as complete' : 'Already completed today',
      habit
    });
  } catch (error) {
    res.status(500).json({ message: 'Error completing habit', error: error.message });
  }
});

// Unmark habit completion
app.post('/api/habits/:id/uncomplete', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.userId });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const { date } = req.body;
    habit.unmarkComplete(date ? new Date(date) : new Date());
    await habit.save();

    res.json({
      message: 'Habit unmarked',
      habit
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uncompleting habit', error: error.message });
  }
});

// ==================== SUPPORT TICKET ROUTES ====================

// Create a new support ticket
app.post('/api/support/ticket', authMiddleware, async (req, res) => {
  try {
    const { subject, category, priority, message } = req.body;
    const ticket = new SupportTicket({
      user: req.userId,
      subject,
      category: category || 'general',
      priority: priority || 'medium'
    });
    await ticket.save();
    if (message) {
      const supportMessage = new SupportMessage({
        ticket: ticket._id,
        sender: req.userId,
        senderType: 'user',
        message
      });
      await supportMessage.save();
    }
    res.status(201).json({ message: 'Support ticket created successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error creating support ticket', error: error.message });
  }
});

// Get user's support tickets
app.get('/api/support/tickets', authMiddleware, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.userId }).sort({ lastMessageAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

// Get specific ticket with messages
app.get('/api/support/ticket/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.userId });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const messages = await SupportMessage.find({ ticket: ticket._id })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });
    res.json({ ticket, messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
});

// Send message to ticket
app.post('/api/support/ticket/:id/message', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.userId });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const supportMessage = new SupportMessage({
      ticket: ticket._id,
      sender: req.userId,
      senderType: 'user',
      message
    });
    await supportMessage.save();
    ticket.lastMessageAt = new Date();
    await ticket.save();
    res.status(201).json({ message: 'Message sent successfully', supportMessage });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Update ticket status
app.patch('/api/support/ticket/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.userId });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    ticket.status = status;
    await ticket.save();
    res.json({ message: 'Ticket status updated', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error updating ticket status', error: error.message });
  }
});

// ==================== ADMIN SUPPORT ROUTES ====================

// Get all support tickets (admin)
app.get('/api/admin/support/tickets', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    const tickets = await SupportTicket.find(query)
      .populate('user', 'name email')
      .sort({ lastMessageAt: -1 });
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

// Get admin support ticket with messages
app.get('/api/admin/support/ticket/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate('user', 'name email');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const messages = await SupportMessage.find({ ticket: ticket._id })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });
    res.json({ ticket, messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
});

// Admin reply to ticket
app.post('/api/admin/support/ticket/:id/message', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const supportMessage = new SupportMessage({
      ticket: ticket._id,
      sender: req.userId,
      senderType: 'admin',
      message
    });
    await supportMessage.save();
    ticket.lastMessageAt = new Date();
    if (ticket.status === 'open') {
      ticket.status = 'pending';
    }
    await ticket.save();
    res.status(201).json({ message: 'Reply sent successfully', supportMessage });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reply', error: error.message });
  }
});

// Assign ticket to admin
app.patch('/api/admin/support/ticket/:id/assign', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    ticket.assignedTo = req.userId;
    if (ticket.status === 'open') {
      ticket.status = 'pending';
    }
    await ticket.save();
    res.json({ message: 'Ticket assigned successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning ticket', error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Get global statistics (admin only)
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHabits = await Habit.countDocuments({ isDeleted: false });
    const totalCompletions = await Habit.aggregate([
      { $match: { isDeleted: false } },
      { $project: { totalCompletions: 1 } },
      { $group: { _id: null, total: { $sum: '$totalCompletions' } } }
    ]);

    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = totalUsers - adminUsers;

    // Get recent registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt');

    // Calculate average completion rate
    const avgCompletion = await Habit.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, avg: { $avg: '$completionRate' } } }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalHabits,
        totalCompletions: totalCompletions[0]?.total || 0,
        adminUsers,
        regularUsers,
        averageCompletionRate: avgCompletion[0]?.avg || 0
      },
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
  }
});

// Get all users (admin only) - Enhanced with search, filter, pagination
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (status === 'active') {
      query.isActive = true;
      query.isSuspended = false;
      query.lastLogin = { $gte: thirtyDaysAgo };
    } else if (status === 'inactive') {
      query.$or = [
        { lastLogin: { $lt: thirtyDaysAgo } },
        { lastLogin: null }
      ];
      query.isSuspended = false;
    } else if (status === 'suspended') {
      query.isSuspended = true;
    } else if (status === 'inactive_account') {
      query.isActive = false;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get habit stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const habitStats = await Habit.aggregate([
        { $match: { user: user._id, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalHabits: { $sum: 1 },
            totalCompletions: { $sum: '$totalCompletions' },
            avgStreak: { $avg: '$currentStreak' },
            maxStreak: { $max: '$longestStreak' }
          }
        }
      ]);

      // Determine status
      let userStatus = 'active';
      if (user.isSuspended) userStatus = 'suspended';
      else if (!user.isActive) userStatus = 'inactive';
      else if (!user.lastLogin || user.lastLogin < thirtyDaysAgo) userStatus = 'inactive';

      return {
        ...user.toObject(),
        habitStats: habitStats[0] || { totalHabits: 0, totalCompletions: 0, avgStreak: 0, maxStreak: 0 },
        status: userStatus
      };
    }));

    res.json({
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Block/Unblock user
app.patch('/api/admin/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'block', 'unblock', 'suspend', 'unsuspend', 'activate', 'deactivate'
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from modifying themselves
    if (user._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot modify your own account' });
    }

    switch (action) {
      case 'block':
        user.isActive = false;
        addAuditLog(req.userId, req.user.email, 'Blocked User', user._id.toString(), req.ip);
        break;
      case 'unblock':
        user.isActive = true;
        user.isSuspended = false;
        addAuditLog(req.userId, req.user.email, 'Unblocked User', user._id.toString(), req.ip);
        break;
      case 'suspend':
        user.isSuspended = true;
        addAuditLog(req.userId, req.user.email, 'Suspended User', user._id.toString(), req.ip);
        break;
      case 'unsuspend':
        user.isSuspended = false;
        addAuditLog(req.userId, req.user.email, 'Unsuspended User', user._id.toString(), req.ip);
        break;
      case 'activate':
        user.isActive = true;
        addAuditLog(req.userId, req.user.email, 'Activated User', user._id.toString(), req.ip);
        break;
      case 'deactivate':
        user.isActive = false;
        addAuditLog(req.userId, req.user.email, 'Deactivated User', user._id.toString(), req.ip);
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    await user.save();

    res.json({
      message: `User ${action} successful`,
      user: user.toObject()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
});

// Force password reset
app.post('/api/admin/users/:id/force-password-reset', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.passwordResetRequired = true;
    await user.save();

    addAuditLog(req.userId, req.user.email, 'Force Password Reset', user._id.toString(), req.ip);

    res.json({
      message: 'Password reset email triggered',
      user: { id: user._id, email: user.email, passwordResetRequired: true }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error forcing password reset', error: error.message });
  }
});

// Impersonate user (get token as another user)
app.post('/api/admin/users/:id/impersonate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const impersonationToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        impersonatedBy: req.userId
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    addAuditLog(req.userId, req.user.email, 'Impersonated User', user._id.toString(), req.ip);

    res.json({
      message: 'Impersonation token generated',
      token: impersonationToken,
      user: user.toObject()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating impersonation token', error: error.message });
  }
});

// Get global analytics
app.get('/api/admin/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Platform Growth
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const newUsersWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const newUsersMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // DAU and MAU
    const dau = await User.countDocuments({ lastLogin: { $gte: oneDayAgo } });
    const mau = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

    // Habit Health
    const totalHabits = await Habit.countDocuments({ isDeleted: false });

    // Global completion rate
    const habitsWithData = await Habit.find({ isDeleted: false });
    let totalScheduled = 0;
    let totalCompleted = 0;

    habitsWithData.forEach(habit => {
      const daysSinceCreation = Math.min(
        Math.floor((now - habit.createdAt) / (24 * 60 * 60 * 1000)),
        30
      );
      totalScheduled += daysSinceCreation;
      totalCompleted += habit.completedDates.filter(d => d >= thirtyDaysAgo).length;
    });

    const globalCompletionRate = totalScheduled > 0
      ? Math.round((totalCompleted / totalScheduled) * 100)
      : 0;

    // Average streak
    const avgStreakResult = await Habit.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, avgStreak: { $avg: '$currentStreak' } } }
    ]);
    const avgStreak = avgStreakResult[0]?.avgStreak || 0;

    // Category trends (most popular habit names)
    const habitTrends = await Habit.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: { $toLower: '$name' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Daily signups for last 30 days
    const dailySignups = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await User.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });

      dailySignups.push({
        date: dayStart.toISOString().split('T')[0],
        count
      });
    }

    // Daily completions for last 7 days
    const dailyCompletions = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const habits = await Habit.find({ isDeleted: false });
      let count = 0;
      habits.forEach(habit => {
        count += habit.completedDates.filter(d => d >= dayStart && d < dayEnd).length;
      });

      dailyCompletions.push({
        date: dayStart.toISOString().split('T')[0],
        count
      });
    }

    res.json({
      platformGrowth: {
        totalUsers,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        dailySignups
      },
      activeUsage: {
        dau,
        mau,
        dauPercentage: mau > 0 ? Math.round((dau / mau) * 100) : 0
      },
      habitHealth: {
        totalActiveHabits: totalHabits,
        globalCompletionRate,
        avgStreak: Math.round(avgStreak * 10) / 10
      },
      categoryTrends: habitTrends.map(t => ({ name: t._id, count: t.count })),
      dailyCompletions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get system health
app.get('/api/admin/health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Calculate uptime
    const uptimeMs = new Date() - serverStartTime;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeDays = Math.floor(uptimeHours / 24);

    // API Performance (last 100 requests)
    const recentRequests = requestTimes.slice(-100);
    const avgResponseTime = recentRequests.length > 0
      ? Math.round(recentRequests.reduce((sum, r) => sum + r.time, 0) / recentRequests.length)
      : 0;

    // Endpoint performance
    const endpointPerformance = {};
    recentRequests.forEach(r => {
      if (!endpointPerformance[r.endpoint]) {
        endpointPerformance[r.endpoint] = { total: 0, count: 0 };
      }
      endpointPerformance[r.endpoint].total += r.time;
      endpointPerformance[r.endpoint].count += 1;
    });

    const endpointStats = Object.entries(endpointPerformance).map(([endpoint, data]) => ({
      endpoint,
      avgTime: Math.round(data.total / data.count),
      requests: data.count
    }));

    // Error rates (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentErrors = requestErrors.filter(e => e.timestamp >= oneDayAgo);

    // Database status
    const dbStatus = mongoose.connection.readyState === 1 ? 'Online' : 'Offline';
    let dbSize = 'Unknown';
    try {
      const dbInfo = await mongoose.connection.db.admin().serverStatus();
      dbSize = Math.round(dbInfo.storageEngine.size / (1024 * 1024)) + ' MB';
    } catch (e) {
      // Ignore - may not have permissions
    }

    res.json({
      apiPerformance: {
        averageResponseTime: avgResponseTime,
        totalRequests: requestTimes.length,
        endpointStats
      },
      database: {
        status: dbStatus,
        size: dbSize,
        connectedAt: dbConnectionTime
      },
      errors: {
        last24Hours: recentErrors.length,
        recentErrors: recentErrors.slice(-10)
      },
      server: {
        uptime: `${uptimeDays}d ${uptimeHours % 24}h`,
        uptimeMs,
        startedAt: serverStartTime
      },
      settings: adminSettings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system health', error: error.message });
  }
});

// Get audit logs
app.get('/api/admin/audit-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, startDate, endDate } = req.query;

    let filteredLogs = [...auditLogs];

    // Filter by action
    if (action && action !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.action.includes(action));
    }

    // Filter by date range
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
});

// Get admin settings
app.get('/api/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ settings: adminSettings });
});

// Update admin settings
app.patch('/api/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { maintenanceMode, newSignupsEnabled, rateLimitPer15Min } = req.body;

    if (maintenanceMode !== undefined) {
      adminSettings.maintenanceMode = maintenanceMode;
      addAuditLog(req.userId, req.user.email,
        maintenanceMode ? 'Enabled Maintenance Mode' : 'Disabled Maintenance Mode',
        'System Settings', req.ip);
    }

    if (newSignupsEnabled !== undefined) {
      adminSettings.newSignupsEnabled = newSignupsEnabled;
      addAuditLog(req.userId, req.user.email,
        newSignupsEnabled ? 'Enabled New Signups' : 'Disabled New Signups',
        'System Settings', req.ip);
    }

    if (rateLimitPer15Min) {
      adminSettings.rateLimitPer15Min = rateLimitPer15Min;
      addAuditLog(req.userId, req.user.email,
        `Set Rate Limit to ${rateLimitPer15Min}`,
        'System Settings', req.ip);
    }

    res.json({
      message: 'Settings updated',
      settings: adminSettings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
});

// Clear cache
app.post('/api/admin/cache/clear', authMiddleware, adminMiddleware, async (req, res) => {
  adminSettings.cacheClearedAt = new Date();
  addAuditLog(req.userId, req.user.email, 'Cleared Server Cache', 'System Cache', req.ip);

  res.json({
    message: 'Cache cleared successfully',
    clearedAt: adminSettings.cacheClearedAt
  });
});

// Export data
app.get('/api/admin/export/:type', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data;
    let filename;

    if (type === 'users') {
      data = await User.find().select('-password');
      filename = 'users_export';
    } else if (type === 'habits') {
      data = await Habit.find({ isDeleted: false });
      filename = 'habits_export';
    } else {
      return res.status(400).json({ message: 'Invalid export type' });
    }

    addAuditLog(req.userId, req.user.email, `Exported ${type} Data`, `${type} Collection`, req.ip);

    if (format === 'csv') {
      // Simple CSV conversion
      if (data.length > 0) {
        const headers = Object.keys(data[0].toObject()).join(',');
        const rows = data.map(item =>
          Object.values(item.toObject()).map(v =>
            typeof v === 'object' ? JSON.stringify(v) : v
          ).join(',')
        );
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
        res.send([headers, ...rows].join('\n'));
      }
    } else {
      res.json({ data, exportedAt: new Date(), count: data.length });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error exporting data', error: error.message });
  }
});

// ==================== PUBLIC ROUTES ====================

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    maintenanceMode: adminSettings.maintenanceMode
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
});

module.exports = app;
