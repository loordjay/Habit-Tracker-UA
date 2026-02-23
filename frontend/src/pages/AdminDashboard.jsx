import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://habittrackerbackend123.vercel.app/api';

export default function AdminDashboard() {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('users');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('weekly');
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditPagination, setAuditPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    newSignupsEnabled: true,
    rateLimitPer15Min: 100
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'health') {
      fetchSystemHealth();
    } else if (activeTab === 'logs') {
      fetchAuditLogs();
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'support') {
      fetchSupportTickets();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [usersPagination.page, userSearch, userStatus]);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketMessages(selectedTicket._id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketMessages]);

  const fetchWithAuth = async (endpoint, options = {}) => {
    const token = getToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (response.status === 401) {
      logout();
      navigate('/login');
      return null;
    }
    return response;
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: usersPagination.page,
        limit: 10,
        search: userSearch,
        status: userStatus
      });
      const res = await fetchWithAuth(`/admin/users?${params}`);
      if (res && res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUsersPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetchWithAuth('/admin/analytics');
      if (res && res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetchWithAuth('/admin/health');
      if (res && res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({
        page: auditPagination.page,
        limit: 20
      });
      const res = await fetchWithAuth(`/admin/audit-logs?${params}`);
      if (res && res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
        setAuditPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetchWithAuth('/admin/settings');
      if (res && res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Support Tickets Functions
  const fetchSupportTickets = async () => {
    setSupportLoading(true);
    try {
      const res = await fetchWithAuth('/admin/support/tickets');
      if (res && res.ok) {
        const data = await res.json();
        setSupportTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setSupportLoading(false);
    }
  };

  const fetchTicketMessages = async (ticketId) => {
    try {
      const res = await fetchWithAuth(`/admin/support/ticket/${ticketId}`);
      if (res && res.ok) {
        const data = await res.json();
        setTicketMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket) return;
    
    setSendingMessage(true);
    try {
      const res = await fetchWithAuth(`/admin/support/ticket/${selectedTicket._id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });
      
      if (res && res.ok) {
        const data = await res.json();
        setTicketMessages([...ticketMessages, data.supportMessage]);
        setNewMessage('');
        fetchSupportTickets();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAssignTicket = async (ticketId) => {
    try {
      const res = await fetchWithAuth(`/admin/support/ticket/${ticketId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({})
      });
      if (res && res.ok) {
        fetchSupportTickets();
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const res = await fetchWithAuth(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      });
      if (res && res.ok) {
        fetchUsers();
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleForcePasswordReset = async (userId) => {
    try {
      const res = await fetchWithAuth(`/admin/users/${userId}/force-password-reset`, {
        method: 'POST'
      });
      if (res && res.ok) {
        alert('Password reset email triggered');
      }
    } catch (error) {
      console.error('Error forcing password reset:', error);
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      const res = await fetchWithAuth(`/admin/users/${userId}/impersonate`, {
        method: 'POST'
      });
      if (res && res.ok) {
        const data = await res.json();
        localStorage.setItem('impersonationToken', data.token);
        window.open('/dashboard', '_blank');
      }
    } catch (error) {
      console.error('Error impersonating user:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      const res = await fetchWithAuth('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: value })
      });
      if (res && res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleClearCache = async () => {
    try {
      const res = await fetchWithAuth('/admin/cache/clear', {
        method: 'POST'
      });
      if (res && res.ok) {
        showToast('Cache cleared successfully!', 'success');
      } else {
        showToast('Failed to clear cache. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      showToast('Error clearing cache. Please try again.', 'error');
    }
  };

  const handleExport = async (type) => {
    try {
      const res = await fetchWithAuth(`/admin/export/${type}?format=json`);
      if (res && res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export.json`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'resolved': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'closed': return 'bg-slate-700/50 text-slate-400 border-slate-600/20';
      default: return 'bg-slate-700/50 text-slate-400 border-slate-600/20';
    }
  };

const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Calculate trend percentage
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    const trend = ((current - previous) / previous) * 100;
    return Math.round(trend * 10) / 10;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <span className="material-symbols-outlined text-xl">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-slate-900">
            <span className="material-symbols-outlined font-bold">query_stats</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">HabitAdmin</h1>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Management</p>
          
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'users' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-xl">group</span>
            <span className="text-sm font-medium">User Management</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'support' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-xl">support_agent</span>
            <span className="text-sm font-medium">Support Tickets</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'analytics' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-xl">bar_chart</span>
            <span className="text-sm font-medium">Global Analytics</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('health')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'health' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-xl">monitoring</span>
            <span className="text-sm font-medium">System Health</span>
          </button>
          
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-8 mb-2">Security & Config</p>
          
          <button 
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'logs' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-xl">description</span>
            <span className="text-sm font-medium">Audit Logs</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="text-sm font-medium">Admin Settings</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400">System Administrator</p>
            </div>
            <button 
              onClick={handleLogout}
              className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-primary"
            >
              logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <aside className="absolute left-0 top-0 w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-slate-900">
                  <span className="material-symbols-outlined font-bold">query_stats</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">HabitAdmin</h1>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Management</p>
              
              <button 
                onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'users' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-xl">group</span>
                <span className="text-sm font-medium">User Management</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('support'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'support' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-xl">support_agent</span>
                <span className="text-sm font-medium">Support Tickets</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'analytics' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-xl">bar_chart</span>
                <span className="text-sm font-medium">Global Analytics</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('health'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'health' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-xl">monitoring</span>
                <span className="text-sm font-medium">System Health</span>
              </button>
              
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-8 mb-2">Security & Config</p>
              
              <button 
                onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'logs' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-xl">description</span>
                <span className="text-sm font-medium">Audit Logs</span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'settings' ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-xl">settings</span>
                <span className="text-sm font-medium">Admin Settings</span>
              </button>
            </nav>

            {/* User profile section in mobile sidebar */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold truncate">{user?.name || 'Admin'}</p>
                  <p className="text-[10px] text-slate-400">System Administrator</p>
                </div>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-primary"
                >
                  logout
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-auto">
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu'}</span>
            </button>
            
            <div className="hidden md:flex items-center gap-4 w-1/3">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <input 
                className="bg-transparent border-none text-sm focus:ring-0 text-slate-200 w-full placeholder:text-slate-500" 
                placeholder="Search across admin..." 
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex gap-4 border-r border-slate-800 pr-4 md:pr-6">
              <button className="relative text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-slate-900"></span>
              </button>
            </div>
            <Link 
              to="/dashboard" 
              className="hidden md:block text-sm text-slate-400 hover:text-primary transition-colors"
            >
              Go to User Dashboard
            </Link>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1800px] mx-auto w-full">
          {/* ==================== USER MANAGEMENT TAB ==================== */}
          {activeTab === 'users' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <p className="text-slate-400 text-sm">Manage and oversee all registered users</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleExport('users')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export Users
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-xl">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (30+ days)</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Habits</th>
                        <th className="px-6 py-4">Streak</th>
                        <th className="px-6 py-4">Last Login</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {usersLoading ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        users.map((userItem) => (
                          <tr key={userItem._id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-200">{userItem.name}</p>
                                  <p className="text-xs text-slate-500">{userItem.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                userItem.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                userItem.status === 'inactive' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                userItem.status === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-slate-700/50 text-slate-400 border-slate-600/20'
                              }`}>
                                {userItem.status?.toUpperCase() || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                userItem.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-600/20'
                              }`}>
                                {userItem.role?.toUpperCase() || 'USER'}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-300">
                              {userItem.habitStats?.totalHabits || 0}
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-300">
                              {userItem.habitStats?.maxStreak || 0} days
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">
                              {userItem.lastLogin ? formatDate(userItem.lastLogin) : 'Never'}
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">
                              {formatDate(userItem.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleImpersonate(userItem._id)}
                                  className="p-2 text-slate-400 hover:text-primary transition-colors"
                                  title="View as User"
                                >
                                  <span className="material-symbols-outlined text-sm">visibility</span>
                                </button>
                                <button 
                                  onClick={() => { setSelectedUser(userItem); setShowUserModal(true); }}
                                  className="p-2 text-slate-400 hover:text-primary transition-colors"
                                  title="Manage User"
                                >
                                  <span className="material-symbols-outlined text-sm">more_vert</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Showing {users.length} of {usersPagination.total} users
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsersPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={usersPagination.page === 1}
                      className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button
                      onClick={() => setUsersPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={usersPagination.page >= usersPagination.pages}
                      className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>

              {showUserModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">Manage User</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <p className="font-semibold">{selectedUser.name}</p>
                        <p className="text-sm text-slate-400">{selectedUser.email}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <button
                          onClick={() => handleUserAction(selectedUser._id, selectedUser.isActive ? 'block' : 'unblock')}
                          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">{selectedUser.isActive ? 'block' : 'check_circle'}</span>
                          {selectedUser.isActive ? 'Block User' : 'Unblock User'}
                        </button>
                        
                        <button
                          onClick={() => handleUserAction(selectedUser._id, selectedUser.isSuspended ? 'unsuspend' : 'suspend')}
                          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">{selectedUser.isSuspended ? 'play_arrow' : 'pause'}</span>
                          {selectedUser.isSuspended ? 'Unsuspend User' : 'Suspend User'}
                        </button>
                        
                        <button
                          onClick={() => handleForcePasswordReset(selectedUser._id)}
                          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">lock_reset</span>
                          Force Password Reset
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==================== SUPPORT TICKETS TAB ==================== */}
          {activeTab === 'support' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Support Tickets</h2>
                  <p className="text-slate-400 text-sm">View and respond to user support requests</p>
                </div>
                <button
                  onClick={fetchSupportTickets}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tickets List */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="font-semibold">Tickets</h3>
                    <p className="text-xs text-slate-400">{supportTickets.length} ticket(s)</p>
                  </div>
                  <div className="divide-y divide-slate-800 max-h-[calc(100vh-320px)] overflow-y-auto">
                    {supportLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : supportTickets.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        No support tickets yet.
                      </div>
                    ) : (
                      supportTickets.map((ticket) => (
                        <button
                          key={ticket._id}
                          onClick={() => setSelectedTicket(ticket)}
                          className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                            selectedTicket?._id === ticket._id ? 'bg-primary/10 border-l-2 border-primary' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{ticket.subject}</h4>
                              <p className="text-xs text-slate-400 mt-1">
                                {ticket.user?.name || 'Unknown User'}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {formatDate(ticket.createdAt)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                              {ticket.priority && (
                                <span className={`text-[10px] ${
                                  ticket.priority === 'high' ? 'text-red-400' :
                                  ticket.priority === 'medium' ? 'text-yellow-400' : 'text-slate-400'
                                }`}>
                                  {ticket.priority}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                  {selectedTicket ? (
                    <>
                      <div className="p-4 border-b border-slate-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{selectedTicket.subject}</h3>
                            <p className="text-sm text-slate-400">
                              From: {selectedTicket.user?.name || 'Unknown'} ({selectedTicket.user?.email})
                            </p>
                            <p className="text-xs text-slate-500">
                              Category: {selectedTicket.category} • Priority: {selectedTicket.priority}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!selectedTicket.assignedTo && (
                              <button
                                onClick={() => handleAssignTicket(selectedTicket._id)}
                                className="px-3 py-1.5 bg-primary text-slate-900 rounded-lg text-sm font-medium hover:shadow-[0_0_15px_rgba(19,236,106,0.4)] transition-all"
                              >
                                Assign to Me
                              </button>
                            )}
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                              {selectedTicket.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="h-[calc(100vh-480px)] overflow-y-auto p-4 space-y-4">
                        {ticketMessages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-xl p-3 ${
                                msg.senderType === 'admin'
                                  ? 'bg-primary text-slate-900'
                                  : 'bg-slate-800 text-white'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className={`text-xs mt-1 ${
                                msg.senderType === 'admin' ? 'text-slate-900/70' : 'text-slate-400'
                              }`}>
                                {msg.senderType === 'admin' ? 'You' : msg.sender?.name} • {formatDate(msg.createdAt)}
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
                              placeholder="Type your reply..."
                              className="flex-1 bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:ring-1 focus:ring-primary focus:border-primary"
                              disabled={sendingMessage}
                            />
                            <button
                              type="submit"
                              disabled={sendingMessage || !newMessage.trim()}
                              className="px-4 py-2 bg-primary text-slate-900 rounded-lg font-medium hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            </>
          )}

{/* ==================== GLOBAL ANALYTICS TAB ==================== */}
          {activeTab === 'analytics' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Global Analytics</h2>
                  <p className="text-slate-400 text-sm">Platform-wide metrics and insights</p>
                </div>
                <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
                  {['daily', 'weekly', 'monthly'].map((period) => (
                    <button
                      key={period}
                      onClick={() => { setTimePeriod(period); fetchAnalytics(); }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        timePeriod === period 
                          ? 'bg-primary text-slate-900' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {analyticsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : analytics && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl relative group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Users</span>
                        <span className="material-symbols-outlined text-primary text-xl">group</span>
                      </div>
                      <h3 className="text-3xl font-bold">{analytics.platformGrowth?.totalUsers?.toLocaleString() || 0}</h3>
                      <div className={`flex items-center gap-1 mt-2 text-sm ${(analytics.trends?.userGrowth || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="material-symbols-outlined text-sm">{(analytics.trends?.userGrowth || 0) >= 0 ? 'trending_up' : 'trending_down'}</span>
                        <span>{(analytics.trends?.userGrowth || 0) >= 0 ? '+' : ''}{analytics.trends?.userGrowth || 0}% this {timePeriod}</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded-lg shadow-lg whitespace-nowrap z-10">
                        Total unique users in database
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl relative group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Daily Active</span>
                        <span className="material-symbols-outlined text-blue-400 text-xl">person</span>
                      </div>
                      <h3 className="text-3xl font-bold">{analytics.activeUsage?.dau?.toLocaleString() || 0}</h3>
                      <div className={`flex items-center gap-1 mt-2 text-sm ${(analytics.activeUsage?.dauPercentage || 0) > 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                        <span className="material-symbols-outlined text-sm">{(analytics.activeUsage?.dauPercentage || 0) > 30 ? 'trending_up' : 'trending_down'}</span>
                        <span>{analytics.activeUsage?.dauPercentage || 0}% of MAU</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded-lg shadow-lg whitespace-nowrap z-10">
                        Unique logins in the last 24 hours
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl relative group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Global Completion</span>
                        <span className="material-symbols-outlined text-green-400 text-xl">check_circle</span>
                      </div>
                      <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold">{analytics.habitHealth?.globalCompletionRate || 0}%</h3>
                        <div className="relative w-12 h-12 mb-1">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="4" fill="none" />
                            <circle cx="24" cy="24" r="20" stroke="#22c55e" strokeWidth="4" fill="none" strokeDasharray={`${(analytics.habitHealth?.globalCompletionRate || 0) * 1.256} 125.6`} strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 mt-2 text-sm ${(analytics.trends?.completionChange || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="material-symbols-outlined text-sm">{(analytics.trends?.completionChange || 0) >= 0 ? 'trending_up' : 'trending_down'}</span>
                        <span>+{analytics.trends?.completionChange || 0}% this {timePeriod}</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded-lg shadow-lg whitespace-nowrap z-10">
                        (Completed Tasks / Total Assigned Tasks) × 100
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-slate-900/60 to-orange-900/20 backdrop-blur-xl border border-orange-500/20 p-6 rounded-xl relative group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-orange-300 text-xs font-semibold uppercase tracking-wider">Avg Streak</span>
                        <span className="material-symbols-outlined text-orange-400 text-xl">local_fire_department</span>
                      </div>
                      <h3 className="text-3xl font-bold text-orange-100">{analytics.habitHealth?.avgStreak || 0} <span className="text-lg font-normal text-orange-300/70">days</span></h3>
                      <div className="flex items-center gap-1 mt-2 text-sm text-orange-300">
                        <span className="material-symbols-outlined text-sm">whatshot</span>
                        <span>+{analytics.trends?.streakChange || 0}% engagement</span>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded-lg shadow-lg whitespace-nowrap z-10">
                        Mean average of consecutive days logged in for all active users
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-xl">
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">New Users This {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}</p>
                      <p className="text-2xl font-bold text-primary">+{analytics.platformGrowth?.[`newUsers${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}`] || 0}</p>
                    </div>
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-xl">
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Monthly Active Users</p>
                      <p className="text-2xl font-bold text-blue-400">{analytics.activeUsage?.mau?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 rounded-xl">
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Active Habits</p>
                      <p className="text-2xl font-bold text-green-400">{analytics.habitHealth?.totalActiveHabits?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ==================== SYSTEM HEALTH TAB ==================== */}
          {activeTab === 'health' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">System Health</h2>
                  <p className="text-slate-400 text-sm">Server performance and status monitoring</p>
                </div>
                <button
                  onClick={fetchSystemHealth}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh
                </button>
              </div>

              {healthLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`bg-slate-900/60 backdrop-blur-xl border p-6 rounded-xl ${
                    systemHealth.database?.status === 'Online' ? 'border-green-500/30' : 'border-red-500/30'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Database</span>
                      <span className={`material-symbols-outlined text-xl ${
                        systemHealth.database?.status === 'Online' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {systemHealth.database?.status === 'Online' ? 'check_circle' : 'error'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{systemHealth.database?.status || 'Unknown'}</h3>
                    <p className="text-xs text-slate-500 mt-2">{systemHealth.database?.size || 'Unknown'}</p>
                  </div>
                  
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Response</span>
                      <span className="material-symbols-outlined text-primary text-xl">speed</span>
                    </div>
                    <h3 className="text-2xl font-bold">{systemHealth.apiPerformance?.averageResponseTime || 0}ms</h3>
                  </div>
                  
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Server Uptime</span>
                      <span className="material-symbols-outlined text-blue-400 text-xl">schedule</span>
                    </div>
                    <h3 className="text-2xl font-bold">{systemHealth.server?.uptime || '0d 0h'}</h3>
                  </div>
                  
                  <div className={`bg-slate-900/60 backdrop-blur-xl border p-6 rounded-xl ${
                    systemHealth.errors?.last24Hours > 10 ? 'border-red-500/30' : 'border-slate-800'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Errors (24h)</span>
                      <span className={`material-symbols-outlined text-xl ${
                          systemHealth.errors?.last24Hours > 10 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {systemHealth.errors?.last24Hours > 10 ? 'warning' : 'check_circle'}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold">{systemHealth.errors?.last24Hours || 0}</h3>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==================== AUDIT LOGS TAB ==================== */}
          {activeTab === 'logs' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Audit Logs</h2>
                  <p className="text-slate-400 text-sm">Track admin actions and system events</p>
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Admin</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm">
                      {auditLoading ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                          </td>
                        </tr>
                      ) : auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                            No audit logs available.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log, i) => (
                          <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-slate-400 text-xs">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-200">{log.actorEmail || 'System'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                              {log.target}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ==================== ADMIN SETTINGS TAB ==================== */}
          {activeTab === 'settings' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Admin Settings</h2>
                  <p className="text-slate-400 text-sm">Configure system behavior and features</p>
                </div>
              </div>

              {settingsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl space-y-6">
                    <h4 className="text-lg font-bold">System Configuration</h4>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                      <div>
                        <p className="font-medium">Maintenance Mode</p>
                        <p className="text-xs text-slate-400">Lock users out during updates</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.maintenanceMode ? 'bg-red-500' : 'bg-slate-600'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.maintenanceMode ? 'left-7' : 'left-1'
                        }`}></span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                      <div>
                        <p className="font-medium">Allow New Signups</p>
                        <p className="text-xs text-slate-400">Enable/disable user registration</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('newSignupsEnabled', !settings.newSignupsEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.newSignupsEnabled ? 'bg-primary' : 'bg-slate-600'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.newSignupsEnabled ? 'left-7' : 'left-1'
                        }`}></span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-xl space-y-6">
                    <h4 className="text-lg font-bold">Data Management</h4>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-slate-400">Export data collections</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleExport('users')}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Export Users
                        </button>
                        <button
                          onClick={() => handleExport('habits')}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          Export Habits
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Clear Server Cache</p>
                          <p className="text-xs text-slate-400">Clear cached heatmap data</p>
                        </div>
                        <button
                          onClick={handleClearCache}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                        >
                          Clear Cache
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
