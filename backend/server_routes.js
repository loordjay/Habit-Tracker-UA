// ==================== PREDEFINED HABITS ROUTES ====================

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
