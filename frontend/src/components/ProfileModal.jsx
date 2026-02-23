import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://habittrackerbackend123.vercel.app/api';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, getToken, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    timezone: 'UTC',
    avatar: '',
    preferences: {
      dailyReminder: false,
      reminderTime: '09:00',
      theme: 'dark',
      notifications: true
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setFormData({
          name: data.profile.name || '',
          bio: data.profile.bio || '',
          timezone: data.profile.timezone || 'UTC',
          avatar: data.profile.avatar || '',
          preferences: data.profile.preferences || {
            dailyReminder: false,
            reminderTime: '09:00',
            theme: 'dark',
            notifications: true
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        // Update user in AuthContext
        setUser({ ...user, name: data.profile.name });
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-morphism rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Profile Settings</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex items-center gap-4 mb-6">
          {formData.avatar ? (
            <img 
              src={formData.avatar} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-background-dark">
              {getInitials(formData.name || user?.name)}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Avatar URL
            </label>
            <input
              type="text"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="bg-surface-dark border-slate-700/50 rounded-lg py-2 px-3 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full bg-surface-dark/50 border-slate-700/50 rounded-lg py-3 px-4 text-slate-400 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary resize-none"
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={500}
            />
            <p className="text-[10px] text-slate-500 mt-1">{formData.bio.length}/500 characters</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-3 px-4 text-white focus:ring-1 focus:ring-primary"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Asia/Kolkata">India (IST)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h4 className="text-sm font-bold mb-4">Preferences</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Daily Reminder</label>
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    preferences: { ...formData.preferences, dailyReminder: !formData.preferences.dailyReminder }
                  })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.preferences.dailyReminder ? 'bg-primary' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    formData.preferences.dailyReminder ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              {formData.preferences.dailyReminder && (
                <div>
                  <label className="block text-xs text-slate-500 mb-2">Reminder Time</label>
                  <input
                    type="time"
                    value={formData.preferences.reminderTime}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      preferences: { ...formData.preferences, reminderTime: e.target.value }
                    })}
                    className="bg-surface-dark border-slate-700/50 rounded-lg py-2 px-3 text-white focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Notifications</label>
                <button
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    preferences: { ...formData.preferences, notifications: !formData.preferences.notifications }
                  })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.preferences.notifications ? 'bg-primary' : 'bg-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    formData.preferences.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 font-bold hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-primary text-background-dark font-bold hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Profile Stats */}
        {profile && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-sm font-bold mb-4">Account Info</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Member since</p>
                <p className="text-white font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Total Points</p>
                <p className="text-white font-medium">{profile.totalPoints || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
