import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = '/api';

export default function SupportChat() {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  });
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket._id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTickets = async () => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId) => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/support/ticket/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    const token = getToken();
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/support/ticket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTicketForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        setTickets([data.ticket, ...tickets]);
        setSelectedTicket(data.ticket);
        setMessages([]);
        setShowNewTicket(false);
        setNewTicketForm({ subject: '', category: 'general', priority: 'medium', message: '' });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    
    const token = getToken();
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/support/ticket/${selectedTicket._id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.supportMessage]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-blue-500/20 text-blue-400';
      case 'closed': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'text-slate-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-white">Support</h1>
          </div>
          <button
            onClick={() => setShowNewTicket(true)}
            className="px-4 py-2 bg-primary text-background-dark rounded-lg font-medium hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all"
          >
            New Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface-dark rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Your Tickets</h2>
              <p className="text-sm text-slate-400">{tickets.length} ticket(s)</p>
            </div>
            <div className="divide-y divide-slate-800 max-h-[calc(100vh-280px)] overflow-y-auto">
              {tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No tickets yet. Create one to get support!
                </div>
              ) : (
                tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                      selectedTicket?._id === ticket._id ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{ticket.subject}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-surface-dark rounded-xl border border-slate-800 overflow-hidden">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedTicket.subject}</h2>
                      <p className="text-sm text-slate-400">
                        Category: {selectedTicket.category} • Priority: <span className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                <div className="h-[calc(100vh-420px)] overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl p-3 ${
                          msg.senderType === 'user'
                            ? 'bg-primary text-background-dark'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderType === 'user' ? 'text-background-dark/70' : 'text-slate-400'
                        }`}>
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary focus:border-primary"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2 bg-primary text-background-dark rounded-lg font-medium hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Select a ticket to view messages
              </div>
            )}
          </div>
        </div>

        {showNewTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-dark rounded-xl border border-slate-800 w-full max-w-md">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Create New Ticket</h2>
                <button
                  onClick={() => setShowNewTicket(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateTicket} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={newTicketForm.subject}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                    <select
                      value={newTicketForm.category}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                      className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="general">General</option>
                      <option value="billing">Billing</option>
                      <option value="technical">Technical</option>
                      <option value="feature">Feature Request</option>
                      <option value="bug">Bug Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                    <select
                      value={newTicketForm.priority}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                      className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Message</label>
                  <textarea
                    value={newTicketForm.message}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 py-2 rounded-lg bg-primary text-background-dark font-medium hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all disabled:opacity-50"
                  >
                    {sending ? 'Creating...' : 'Create Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
