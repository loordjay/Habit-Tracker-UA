const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ['general', 'billing', 'technical', 'feature_request', 'bug_report', 'account'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    user: { type: Number, default: 0 },
    admin: { type: Number, default: 0 }
  },
  // For tracking
  openedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, lastMessageAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

// Static method to get tickets for a user
supportTicketSchema.statics.getUserTickets = async function(userId) {
  return this.find({ user: userId })
    .sort({ lastMessageAt: -1 })
    .populate('assignedTo', 'name email');
};

// Static method to get all tickets for admin
supportTicketSchema.statics.getAdminTickets = async function(filters = {}) {
  const query = {};
  
  if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  }
  
  if (filters.assignedTo === 'unassigned') {
    query.assignedTo = null;
  } else if (filters.assignedTo) {
    query.assignedTo = filters.assignedTo;
  }
  
  return this.find(query)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ lastMessageAt: -1 });
};

// Method to update last message timestamp
supportTicketSchema.methods.updateLastMessage = function() {
  this.lastMessageAt = new Date();
  return this.save();
};

// Method to increment unread count
supportTicketSchema.methods.incrementUnread = function(senderType) {
  if (senderType === 'user') {
    this.unreadCount.user += 1;
  } else {
    this.unreadCount.admin += 1;
  }
  return this.save();
};

// Method to mark as read
supportTicketSchema.methods.markAsRead = function(userId, isAdmin) {
  if (isAdmin) {
    this.unreadCount.admin = 0;
  } else {
    this.unreadCount.user = 0;
  }
  return this.save();
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
