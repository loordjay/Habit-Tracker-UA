import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://habittrackerbackend123.vercel.app/api';

export default function Analytics() {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
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

      const res = await fetch(`${API_URL}/habits/analytics?period=${period}`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Today's date for display
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayStr = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  // Get max value for chart scaling
  const getMaxValue = (arr, key = 'count') => Math.max(...arr.map(item => item[key]), 1);

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
        <div className="h-full bg-primary shadow-[0_0_8px_#13ec6a] transition-all duration-500" style={{ width: '100%' }}></div>
      </div>

      {/* Navigation */}
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
              <Link to="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Dashboard</Link>
              <Link to="/habits" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Habits</Link>
              <Link to="/analytics" className="text-sm font-medium text-primary">Analytics</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Admin</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full ring-2 ring-background-dark"></span>
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
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary font-medium mb-1">{todayStr}</p>
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <p className="text-slate-400 mt-1">Track your habit performance and trends.</p>
          </div>
          <div className="flex gap-3">
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-surface-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-xl group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">check_circle</span>
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Total Completions</h3>
            <p className="text-3xl font-bold mt-1">{analytics?.overview?.totalCompletions || 0}</p>
          </div>

          <div className="glass-card p-5 rounded-xl group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <span className="material-symbols-outlined text-blue-500">local_fire_department</span>
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Current Streak</h3>
            <p className="text-3xl font-bold mt-1">
              {analytics?.overview?.currentStreak || 0} <span className="text-lg font-normal text-slate-500">days</span>
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <span className="material-symbols-outlined text-purple-500">auto_graph</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                (analytics?.overview?.trend || 0) >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {(analytics?.overview?.trend || 0) >= 0 ? '+' : ''}{analytics?.overview?.trend || 0}%
              </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Avg Completion Rate</h3>
            <p className="text-3xl font-bold mt-1">
              {analytics?.overview?.avgCompletionRate || 0} <span className="text-lg font-normal text-slate-500">%</span>
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl group hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <span className="material-symbols-outlined text-orange-500">trophy</span>
              </div>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">Longest Streak</h3>
            <p className="text-3xl font-bold mt-1">
              {analytics?.overview?.longestStreak || 0} <span className="text-lg font-normal text-slate-500">days</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10">
          {['overview', 'habits', 'trends'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'text-primary border-primary' 
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Completions Chart */}
            <div className="glass-card p-6 rounded-2xl border-white/5">
              <h3 className="text-lg font-bold mb-6">Daily Completions</h3>
              <div className="flex items-end justify-between gap-2 h-48">
                {(analytics?.dailyCompletions || []).slice(-14).map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary rounded-t transition-all hover:shadow-[0_0_10px_#13ec6a]"
                      style={{ 
                        height: `${Math.max((day.count / getMaxValue(analytics?.dailyCompletions || [])) * 100, 4)}%`,
                        minHeight: '4px'
                      }}
                      title={`${day.date}: ${day.count} completions`}
                    ></div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="glass-card p-6 rounded-2xl border-white/5">
              <h3 className="text-lg font-bold mb-6">Weekly Progress</h3>
              <div className="space-y-4">
                {(analytics?.weeklyData || []).map((week, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 w-16">Week {week.week}</span>
                    <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                        style={{ width: `${Math.min((week.completions / getMaxValue(analytics?.weeklyData || [], 'completions')) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-primary w-12 text-right">{week.completions}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="glass-card p-6 rounded-2xl border-white/5">
              <h3 className="text-lg font-bold mb-6">Monthly Trend</h3>
              <div className="flex items-end justify-between gap-2 h-48">
                {(analytics?.monthlyData || []).map((month, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-purple-500 rounded-t transition-all"
                      style={{ 
                        height: `${Math.max((month.completions / getMaxValue(analytics?.monthlyData || [], 'completions')) * 100, 4)}%`,
                        minHeight: '4px'
                      }}
                    ></div>
                    <span className="text-[10px] text-slate-500">{month.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time of Day */}
            <div className="glass-card p-6 rounded-2xl border-white/5">
              <h3 className="text-lg font-bold mb-6">Time of Day</h3>
              <div className="space-y-4">
                {[
                  { key: 'morning', label: 'Morning (5AM-12PM)', icon: 'wb_sunny', color: 'bg-yellow-500' },
                  { key: 'afternoon', label: 'Afternoon (12PM-5PM)', icon: 'wb_twilight', color: 'bg-orange-500' },
                  { key: 'evening', label: 'Evening (5PM-9PM)', icon: 'nights_stay', color: 'bg-blue-500' },
                  { key: 'night', label: 'Night (9PM-5AM)', icon: 'bedtime', color: 'bg-purple-500' }
                ].map((time) => {
                  const count = analytics?.timeOfDay?.[time.key] || 0;
                  const total = Object.values(analytics?.timeOfDay || {}).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return (
                    <div key={time.key} className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-slate-400">{time.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300">{time.label}</span>
                          <span className="text-sm text-slate-400">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${time.color} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day of Week */}
            <div className="glass-card p-6 rounded-2xl border-white/5">
              <h3 className="text-lg font-bold mb-6">Day of Week</h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {(analytics?.dayOfWeek || []).map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary/60 rounded-t transition-all"
                      style={{ 
                        height: `${Math.max((day.count / getMaxValue(analytics?.dayOfWeek || [], 'count')) * 100, 4)}%`,
                        minHeight: '4px'
                      }}
                    ></div>
                    <span className="text-[10px] text-slate-500">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Habits Tab */}
        {activeTab === 'habits' && (
          <div className="space-y-6">
            {/* Best Habits */}
            <div className="glass-card p-6 rounded-2xl border-white/5">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500">trophy</span>
                Top Performing Habits
              </h3>
              <div className="space-y-4">
                {(analytics?.bestHabits || []).map((habit, i) => (
                  <div key={habit.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-xl font-bold text-slate-500 w-6">#{i + 1}</span>
                    <div 
                      className="size-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: habit.color }}
                    >
                      <span className="material-symbols-outlined text-background-dark font-bold">check</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{habit.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-slate-400">{habit.totalCompletions} completions</span>
                        <span className="text-xs text-slate-400">{habit.currentStreak} day streak</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">{habit.completionRate}%</span>
                    </div>
                  </div>
                ))}
                {(!analytics?.bestHabits || analytics.bestHabits.length === 0) && (
                  <p className="text-center text-slate-400 py-8">No habit data yet. Start tracking habits to see analytics!</p>
                )}
              </div>
            </div>

            {/* All Habits Performance */}
            <div className="glass-card p-6 rounded-2xl border-white/5">
              <h3 className="text-lg font-bold mb-6">All Habits Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Habit</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase">Completions</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase">Current Streak</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase">Best Streak</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.habitPerformance || []).map((habit) => (
                      <tr key={habit.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="size-3 rounded-full"
                              style={{ backgroundColor: habit.color }}
                            ></div>
                            <span className="font-medium">{habit.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-slate-300">{habit.totalCompletions}</td>
                        <td className="text-right py-3 px-4 text-slate-300">{habit.currentStreak} days</td>
                        <td className="text-right py-3 px-4 text-slate-300">{habit.longestStreak} days</td>
                        <td className="text-right py-3 px-4">
                          <span className={`font-bold ${
                            habit.completionRate >= 80 ? 'text-green-500' :
                            habit.completionRate >= 50 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {habit.completionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Progress Over Time */}
            <div className="glass-card p-6 rounded-2xl border-white/5">
              <h3 className="text-lg font-bold mb-6">Completion Rate Over Time</h3>
              <div className="h-64">
                <div className="flex items-end justify-between gap-1 h-full">
                  {(analytics?.dailyCompletions || []).map((day, i) => {
                    const rate = analytics?.overview?.totalHabits > 0 
                      ? Math.round((day.count / analytics.overview.totalHabits) * 100) 
                      : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full rounded-t transition-all hover:shadow-[0_0_10px_#13ec6a]"
                          style={{ 
                            height: `${Math.max(rate, 2)}%`,
                            minHeight: '2px',
                            backgroundColor: rate >= 80 ? '#13ec6a' : rate >= 50 ? '#3b82f6' : rate > 0 ? '#f59e0b' : '#1e293b'
                          }}
                          title={`${day.date}: ${rate}%`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{analytics?.dailyCompletions?.[0]?.date}</span>
                <span>{analytics?.dailyCompletions?.[analytics?.dailyCompletions?.length - 1]?.date}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-5 rounded-xl">
                <h4 className="text-slate-400 text-sm font-medium mb-2">Most Productive Day</h4>
                <p className="text-2xl font-bold">
                  {analytics?.dayOfWeek?.reduce((max, day, i) => day.count > max.count ? { day: day.day, count: day.count } : max, { day: 'N/A', count: 0 }).day || 'N/A'}
                </p>
              </div>
              <div className="glass-card p-5 rounded-xl">
                <h4 className="text-slate-400 text-sm font-medium mb-2">Best Time of Day</h4>
                <p className="text-2xl font-bold">
                  {Object.entries(analytics?.timeOfDay || {}).reduce((max, [key, val]) => val > max[1] ? [key, val] : max, ['', 0])[0] || 'N/A'}
                </p>
              </div>
              <div className="glass-card p-5 rounded-xl">
                <h4 className="text-slate-400 text-sm font-medium mb-2">Active Habits</h4>
                <p className="text-2xl font-bold">{analytics?.overview?.totalHabits || 0}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Background Decoration */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/5 blur-[100px] pointer-events-none -z-10"></div>
    </div>
  );
}
