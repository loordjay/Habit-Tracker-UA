const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  // Attachments (future use)
  attachments: [{
    filename: String,
    url: String,
    mimeType: String,
    size: Number
  }],
  // Read tracking
  readAt: {
    type: Date,
    default: null
  },
  // For soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
supportMessageSchema.index({ ticket: 1, createdAt: 1 });
supportMessageSchema.index({ sender: 1, createdAt: 1 });

// Static method to get messages for a ticket
supportMessageSchema.statics.getTicketMessages = async function(ticketId, options = {}) {
  const query = { ticket: ticketId, isDeleted: false };
  
  return this.find(query)
    .populate('sender', 'name email role')
    .sort(options.sort || { createdAt: 1 });
};

// Static method to mark messages as read
supportMessageSchema.statics.markAsRead = async function(ticketId, userId) {
  return this.updateMany(
    { ticket: ticketId, sender: { $ne: userId }, readAt: null },
    { readAt: new Date() }
  );
};

// Static method to get unread count for a ticket
supportMessageSchema.statics.getUnreadCount = async function(ticketId, userId) {
  return this.countDocuments({
    ticket: ticketId,
    sender: { $ne: userId },
    readAt: null
  });
};

// Pre-save middleware to update ticket's lastMessageAt
supportMessageSchema.pre('save', async function(next) {
  const Ticket = mongoose.model('SupportTicket');
  await Ticket.findByIdAndUpdate(this.ticket, {
    lastMessageAt: this.createdAt,
    [`unreadCount.${this.senderType === 'user' ? 'admin' : 'user'}`]: 1
  });
  next();
});

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
