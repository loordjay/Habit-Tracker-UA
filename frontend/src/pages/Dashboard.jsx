import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileModal from '../components/ProfileModal';

const API_URL = '/api';

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const getHeatmapDates = () => {
  const dates = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(d));
  }
  return dates;
};

const getHeatmapLevel = (count, maxCount) => {
  if (count === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

const heatmapColors = ['bg-white/5', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary'];

export default function Dashboard() {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [habits, setHabits] = useState([]);
  const [heatmapData, setHeatmapData] = useState({});
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    todayCompletions: 0,
    totalCompletions: 0,
    weeklyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    color: '#13ec6a'
  });

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
        setStats(heatmapResult.stats);
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
        setNewHabit({ name: '', description: '', color: '#13ec6a' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding habit:', error);
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

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayStr = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  const heatmapDates = getHeatmapDates();
  const maxCount = Math.max(...Object.values(heatmapData), 1);

  const heatmapWeeks = [];
  let currentWeek = [];
  
  const firstDate = new Date(heatmapDates[0]);
  const startDayOfWeek = firstDate.getDay();
  
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }
  
  heatmapDates.forEach((date) => {
    const count = heatmapData[date] || 0;
    currentWeek.push({ date, count, level: getHeatmapLevel(count, maxCount) });
    
    if (currentWeek.length === 7) {
      heatmapWeeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    heatmapWeeks.push(currentWeek);
  }

  const completedToday = habits.filter(h => isHabitCompletedToday(h)).length;
  const totalHabits = habits.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <div className="fixed top-0 left-0 w-full h-1 bg-primary/10 z-50">
        <div 
          className="h-full bg-primary shadow-[0_0_8px_#13ec6a] transition-all duration-500" 
          style={{ width: `${totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0}%` }}
        ></div>
      </div>

      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-background-dark font-bold">bolt</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                HABIT<span className="text-primary">CORE</span>
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm font-medium text-primary">Dashboard</Link>
              <Link to="/habits" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Habits</Link>
              <Link to="/analytics" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Analytics</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/support" className="p-2 text-slate-400 hover:text-white transition-colors" title="Support">
              <span className="material-symbols-outlined">support_agent</span>
            </Link>
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full ring-2 ring-background-dark"></span>
            </button>
            <button 
              onClick={() => setShowProfileModal(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Profile"
            >
              <span className="material-symbols-outlined">person</span>
            </button>
            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-none">{user?.name || 'User'}</p>
                <p className="text-[10px] text-primary leading-none mt-1">PRO PLAN</p>
              </div>
              <button 
                onClick={() => { logout(); navigate('/login'); }}
                className="size-10 rounded-full border-2 border-primary/20 p-0.5 hover:border-primary/50 transition-colors"
              >
                <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">logout</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary font-medium mb-1">{todayStr}</p>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || 'User'}.</h2>
            <p className="text-slate-400 mt-1">
              You've completed <span className="text-white font-medium">{completedToday} out of {totalHabits}</span> habits for today.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-background-dark font-bold rounded-lg hover:shadow-[0_0_20px_rgba(19,236,106,0.3)] transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Quick Add
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 glass-card text-white font-medium rounded-lg hover:bg-white/5 transition-all border-white/10">
              <span className="material-symbols-outlined text-sm">share</span>
              Share Streak
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">local_fire_department</span>
              </div>
              <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">Active</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Current Streak</h3>
            <p className="text-3xl font-bold mt-1">
              {stats.currentStreak} <span className="text-lg font-normal text-slate-500 tracking-tight">Days</span>
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <span className="material-symbols-outlined text-blue-500">bolt</span>
              </div>
              <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 bg-blue-500/10 rounded-full">
                {completedToday > 0 ? '+' + completedToday : '0'} Today
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Daily Score</h3>
            <p className="text-3xl font-bold mt-1">
              {stats.todayCompletions * 10} <span className="text-lg font-normal text-slate-500 tracking-tight">Points</span>
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <span className="material-symbols-outlined text-purple-500">auto_graph</span>
              </div>
              <span className="text-[10px] font-bold text-purple-500 px-2 py-0.5 bg-purple-500/10 rounded-full">
                {totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0}%
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Daily Accuracy</h3>
            <p className="text-3xl font-bold mt-1">
              {totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0} <span className="text-lg font-normal text-slate-500 tracking-tight">%</span>
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <span className="material-symbols-outlined text-orange-500">trophy</span>
              </div>
              <span className="text-[10px] font-bold text-orange-500 px-2 py-0.5 bg-orange-500/10 rounded-full">Best</span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Longest Streak</h3>
            <p className="text-3xl font-bold mt-1">
              {stats.longestStreak} <span className="text-lg font-normal text-slate-500 tracking-tight">Days</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                Today's Focus
                <span className="text-xs font-normal bg-white/5 px-2 py-0.5 rounded text-slate-400">{habits.length} total</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(true)}
                className="text-sm text-primary font-medium hover:underline"
              >
                Add New
              </button>
            </div>

            <div className="space-y-3">
              {habits.length === 0 ? (
                <div className="glass-card p-8 rounded-xl text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">add_circle</span>
                  <p className="text-slate-400">No habits yet. Add your first habit to get started!</p>
                </div>
              ) : (
                habits.map((habit) => (
                  <div 
                    key={habit._id}
                    className={`glass-card p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/[0.05] border-white/5 ${
                      isHabitCompletedToday(habit) ? 'border-primary/20 bg-primary/[0.02]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="size-10 rounded-lg flex items-center justify-center text-background-dark"
                        style={{ backgroundColor: habit.color }}
                      >
                        <span className="material-symbols-outlined font-bold">
                          {isHabitCompletedToday(habit) ? 'check' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold">{habit.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all" 
                              style={{ 
                                width: `${isHabitCompletedToday(habit) ? '100%' : '0%'}`,
                                backgroundColor: habit.color 
                              }}
                            ></div>
                          </div>
                          <span 
                            className="text-[10px] font-bold"
                            style={{ 
                              color: isHabitCompletedToday(habit) ? habit.color : '#64748b'
                            }}
                          >
                            {isHabitCompletedToday(habit) ? 'COMPLETED' : 'NOT COMPLETED'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleHabit(habit._id)}
                        className="size-6 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          borderColor: isHabitCompletedToday(habit) ? habit.color : undefined,
                          backgroundColor: isHabitCompletedToday(habit) ? habit.color : undefined
                        }}
                      >
                        {isHabitCompletedToday(habit) && (
                          <span className="material-symbols-outlined text-background-dark text-sm font-black">check</span>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDeleteHabit(habit._id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold">Growth Insights</h3>

            <div className="glass-card p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-3">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
                <span className="text-xs font-bold tracking-wider uppercase">Habit Guru AI</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-200">
                {stats.currentStreak > 0 
                  ? `Great job! You've maintained a ${stats.currentStreak}-day streak. Keep going to build lasting habits!`
                  : "Start your streak today! Consistency is the key to building lasting habits."
                }
              </p>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] text-slate-500">Motivational Tip</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border-white/5">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h4 className="text-sm font-bold">Weekly Trend</h4>
                  <p className="text-[10px] text-slate-500 uppercase">Completion Rate</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    {stats.weeklyStats.filter(d => d.completed).length}/7
                  </p>
                  <p className="text-[10px] text-slate-500">DAYS THIS WEEK</p>
                </div>
              </div>
              <div className="flex items-end justify-between gap-1 h-24">
                {stats.weeklyStats.map((day, i) => (
                  <div 
                    key={i}
                    className={`w-full rounded-t transition-all ${day.completed ? 'bg-primary' : 'bg-white/5'}`}
                    style={{ height: day.completed ? '100%' : '20%' }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl border-white/5">
              <h4 className="text-sm font-bold mb-4">Habit Streaks</h4>
              <div className="space-y-4">
                {habits.slice(0, 3).map((habit) => (
                  <div key={habit._id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="size-2 rounded-full" 
                          style={{ backgroundColor: habit.color }}
                        ></div>
                        <span className="text-xs font-medium truncate max-w-[120px]">{habit.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{habit.currentStreak} days</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${Math.min(habit.currentStreak / 30 * 100, 100)}%`,
                          backgroundColor: habit.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/5 blur-[100px] pointer-events-none -z-10"></div>

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

      {showProfileModal && (
        <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}
