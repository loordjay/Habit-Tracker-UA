import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'https://habittrackerbackend123.vercel.app/api';

// Helper to format date
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Get last 30 days for analytics
const getLast30Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
};

// Get last 12 weeks for analytics
const getLast12Weeks = () => {
  const weeks = [];
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - (i * 7));
    weeks.push({
      start: formatDate(d),
      label: `Week ${12 - i}`
    });
  }
  return weeks;
};

export default function Habits() {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [habits, setHabits] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [loading, setLoading] = useState(true);
const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    color: '#13ec6a',
    frequency: 'daily',
    targetPerWeek: 7
  });
const [analyticsTimeframe, setAnalyticsTimeframe] = useState('30days');
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [habitsRes, heatmapRes] = await Promise.all([
        fetch(`${API_URL}/habits`, { headers }),
        fetch(`${API_URL}/habits/heatmap`, { headers })
      ]);

      if (habitsRes.ok) {
        const habitsData = await habitsRes.json();
        setHabits(habitsData.habits);
      }

      if (heatmapRes.ok) {
        const heatmapResult = await heatmapRes.json();
        setHeatmapData(heatmapResult.heatmap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habitId) => {
    const token = getToken();
    const today = new Date().toISOString();
    
    try {
      const res = await fetch(`${API_URL}/habits/${habitId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: today })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newHabit)
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewHabit({
          name: '',
          description: '',
          color: '#13ec6a',
          frequency: 'daily',
          targetPerWeek: 7
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const handleUpdateHabit = async (e) => {
    e.preventDefault();
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/habits/${editingHabit._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingHabit)
      });

      if (res.ok) {
        setEditingHabit(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/habits/${habitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const isHabitCompletedToday = (habit) => {
    const today = formatDate(new Date());
    return (habit.completedDates || []).some(d => formatDate(d) === today);
  };

  const getHabitCompletionRate = (habit, days = 30) => {
    if (!habit.completedDates || habit.completedDates.length === 0) return 0;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    const completionsInPeriod = habit.completedDates.filter(d => {
      const date = new Date(d);
      return date >= startDate && date <= today;
    }).length;
    
    return Math.round((completionsInPeriod / days) * 100);
  };

  const getHabitWeeklyData = (habit) => {
    const last7Days = getLast30Days().slice(-7);
    return last7Days.map(date => {
      const completed = habit.completedDates?.some(d => formatDate(d) === date);
      return { date, completed };
    });
  };

  const getHabitMonthlyData = (habit) => {
    const last30Days = getLast30Days();
    return last30Days.map(date => {
      const completed = habit.completedDates?.some(d => formatDate(d) === date);
      return { date, completed };
    });
  };

  // Calculate overall analytics
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => isHabitCompletedToday(h)).length;
  const avgCompletionRate = totalHabits > 0 
    ? Math.round(habits.reduce((sum, h) => sum + getHabitCompletionRate(h), 0) / totalHabits)
    : 0;
  const bestStreak = Math.max(...habits.map(h => h.longestStreak || 0), 0);
  const currentBestStreak = Math.max(...habits.map(h => h.currentStreak || 0), 0);

  // Today's date for display
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayStr = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Global Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-primary/10 z-50">
        <div 
          className="h-full bg-primary shadow-[0_0_8px_#13ec6a] transition-all duration-500" 
          style={{ width: `${totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0}%` }}
        ></div>
      </div>

      <Navbar 
        user={user} 
        logout={logout} 
        showProfileModal={false}
        setShowProfileModal={() => {}}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary font-medium mb-1">{todayStr}</p>
            <h2 className="text-3xl font-bold tracking-tight">Your Habits</h2>
            <p className="text-slate-400 mt-1">
              Manage and track all your habits in one place
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark font-bold rounded-lg hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Habit
          </button>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">list</span>
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total Habits</h3>
            <p className="text-3xl font-bold mt-1">{totalHabits}</p>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <span className="material-symbols-outlined text-blue-500">check_circle</span>
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Completed Today</h3>
            <p className="text-3xl font-bold mt-1">{completedToday}/{totalHabits}</p>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <span className="material-symbols-outlined text-purple-500">percent</span>
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Avg. Completion</h3>
            <p className="text-3xl font-bold mt-1">{avgCompletionRate}%</p>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Best Streak</h3>
            <p className="text-3xl font-bold mt-1">{bestStreak} <span className="text-lg font-normal text-slate-500">days</span></p>
          </div>
        </div>

        {/* Habits List with Analytics */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">All Habits ({habits.length})</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setAnalyticsTimeframe('30days')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  analyticsTimeframe === '30days' 
                    ? 'bg-primary text-background-dark' 
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
              <button 
                onClick={() => setAnalyticsTimeframe('7days')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  analyticsTimeframe === '7days' 
                    ? 'bg-primary text-background-dark' 
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
            </div>
          </div>

          {habits.length === 0 ? (
            <div className="glass-card p-12 rounded-xl text-center">
              <span className="material-symbols-outlined text-5xl text-slate-500 mb-4">add_task</span>
              <p className="text-slate-400 text-lg mb-4">No habits yet. Create your first habit to get started!</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-primary text-background-dark font-bold rounded-lg hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all"
              >
                Create Habit
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {habits.map((habit) => {
                const completionRate = analyticsTimeframe === '30days' 
                  ? getHabitCompletionRate(habit, 30) 
                  : getHabitCompletionRate(habit, 7);
                const weeklyData = getHabitWeeklyData(habit);
                const monthlyData = getHabitMonthlyData(habit);
                const dataToShow = analyticsTimeframe === '30days' ? monthlyData : weeklyData;
                
                return (
                  <div 
                    key={habit._id}
                    className="glass-card p-6 rounded-xl border-white/5"
                  >
                    {/* Habit Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div 
                          className="size-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: habit.color }}
                        >
                          <span className="material-symbols-outlined text-background-dark font-bold">
                            {isHabitCompletedToday(habit) ? 'check' : 'radio_button_unchecked'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold">{habit.name}</h4>
                          <p className="text-sm text-slate-400">{habit.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleHabit(habit._id)}
                          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
                          style={{ 
                            backgroundColor: isHabitCompletedToday(habit) ? habit.color : 'rgba(255,255,255,0.1)',
                            color: isHabitCompletedToday(habit) ? '#000' : '#fff'
                          }}
                        >
                          {isHabitCompletedToday(habit) ? 'Completed' : 'Mark Complete'}
                        </button>
                        <button 
                          onClick={() => setEditingHabit(habit)}
                          className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteHabit(habit._id)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="grid md:grid-cols-4 gap-6">
                      {/* Stats */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Completion Rate</p>
                          <p className="text-2xl font-bold" style={{ color: habit.color }}>
                            {completionRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Current Streak</p>
                          <p className="text-2xl font-bold">
                            {habit.currentStreak || 0} <span className="text-sm text-slate-500">days</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Longest Streak</p>
                          <p className="text-2xl font-bold">
                            {habit.longestStreak || 0} <span className="text-sm text-slate-500">days</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Completions</p>
                          <p className="text-2xl font-bold">{habit.totalCompletions || 0}</p>
                        </div>
                      </div>

                      {/* Chart */}
                      <div className="md:col-span-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                          {analyticsTimeframe === '30days' ? 'Last 30 Days' : 'Last 7 Days'}
                        </p>
                        <div className="flex items-end gap-1 h-24">
                          {dataToShow.map((day, i) => (
                            <div 
                              key={i}
                              className="flex-1 rounded-t transition-all relative group"
                              style={{ 
                                height: day.completed ? '100%' : '10%',
                                backgroundColor: day.completed ? habit.color : 'rgba(255,255,255,0.1)'
                              }}
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {day.date}: {day.completed ? '✓' : '✗'}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                          <span>{dataToShow[0]?.date}</span>
                          <span>{dataToShow[dataToShow.length - 1]?.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 pt-4 border-t border-white/5">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Today's Progress</span>
                        <span className="font-bold" style={{ color: habit.color }}>
                          {isHabitCompletedToday(habit) ? '100%' : '0%'}
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: isHabitCompletedToday(habit) ? '100%' : '0%',
                            backgroundColor: habit.color
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Background Decoration */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/5 blur-[100px] pointer-events-none -z-10"></div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-morphism rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Habit</h3>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="e.g., Drink 2L Water"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="e.g., Stay hydrated throughout the day"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Color
                </label>
                <div className="flex gap-3">
                  {['#13ec6a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, color })}
                      className={`w-8 h-8 rounded-lg transition-all ${newHabit.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background-dark' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg bg-primary text-background-dark font-bold hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all"
                >
                  Add Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-morphism rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Habit</h3>
            <form onSubmit={handleUpdateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                  className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editingHabit.description || ''}
                  onChange={(e) => setEditingHabit({ ...editingHabit, description: e.target.value })}
                  className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                  Color
                </label>
                <div className="flex gap-3">
                  {['#13ec6a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingHabit({ ...editingHabit, color })}
                      className={`w-8 h-8 rounded-lg transition-all ${editingHabit.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background-dark' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-lg bg-primary text-background-dark font-bold hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
