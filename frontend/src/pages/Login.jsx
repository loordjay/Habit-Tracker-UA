import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful! Redirecting...');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-mesh overflow-hidden">
      {/* Background decorative orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]"></div>

      {/* Navigation */}
      <header className="relative z-10 w-full px-6 lg:px-20 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(19,236,106,0.3)]">
            <span className="material-symbols-outlined text-background-dark font-bold">donut_large</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase italic">
            Habit<span className="text-primary">Track</span>
          </h1>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/signup" className="text-sm font-medium hover:text-primary transition-colors">
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          {/* Glass Card */}
          <div className="glass-morphism rounded-xl p-8 lg:p-10 shadow-2xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-slate-400 text-sm">Synchronize your routine across the chain.</p>
            </div>

            {/* Toggle Switch */}
            <div className="flex p-1 bg-black/30 rounded-lg mb-8">
              <button className="flex-1 py-2 text-sm font-bold rounded-md bg-primary text-background-dark neon-glow">
                Sign In
              </button>
              <Link 
                to="/signup" 
                className="flex-1 py-2 text-sm font-bold rounded-md text-slate-400 hover:text-white transition-colors text-center"
              >
                Create Account
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                  Identity
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    alternate_email
                  </span>
                  <input
                    className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    placeholder="agent@network.io"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Access Key
                  </label>
                  <a className="text-[10px] font-bold uppercase text-primary hover:underline" href="#">
                    Recovery?
                  </a>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    vpn_key
                  </span>
                  <input
                    className="w-full bg-surface-dark border-slate-700/50 rounded-lg py-4 pl-12 pr-12 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-2 px-1">
                <input
                  className="w-4 h-4 rounded border-slate-700 bg-surface-dark text-primary focus:ring-primary focus:ring-offset-background-dark"
                  id="remember"
                  type="checkbox"
                />
                <label className="text-xs text-slate-400 cursor-pointer select-none" htmlFor="remember">
                  Maintain persistent session
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-lg transition-all transform active:scale-[0.98] neon-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-background-dark border-t-transparent"></div>
                ) : (
                  <>
                    <span>Initialize Routine</span>
                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-tighter">
                <span className="px-4 bg-transparent text-slate-500 backdrop-blur-xl">Or bridge with</span>
              </div>
            </div>

            {/* Social Grid */}
            <div className="grid grid-cols-3 gap-4">
              <button className="flex items-center justify-center p-3 rounded-lg bg-surface-dark border border-slate-700/50 hover:bg-white/5 transition-all group">
                <img
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPOKx2lTaDnknPR4H9x05iFyWa2YvoyJMM-XcqsthTohDiGh2KBFQnF5pHFMP3ZcbQn7oBII1vTjboPuEpDJ4c05UC_3f-zoPrrYJ4oSUlDC-Jvetoa8PVw0dbM2ZsV8t_GgB9sxaRLSt0MkbRddcgZZQp6-pp1Dqf1ysog7SFhyfkvmCRpGbZqTEvkA2yRbpiiiQC6_LbsbFR51wlseP3q4hInsfIxLRfU5MwYzZGwMKuUewWKIqFso-AcaYwG17iniPRQoj1BVs"
                  alt="Google"
                />
              </button>
              <button className="flex items-center justify-center p-3 rounded-lg bg-surface-dark border border-slate-700/50 hover:bg-white/5 transition-all group">
                <img
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6RW952_mi_Qj-8fEkiKe1F0NhVF8yHtv-NB7sGEyRNTD1H0yxzJlkinRmT_UFuDL4u_lcySI1QVFOR6Um5tH0q5xBIxgjeW0fdqQvCzfmZs84FvmBtNZsvvroBoPM-CSdPk7PfYRebELLn9kN7r9bqfp8JUV86Lo99OL01FWvJLBv_1h_Vx_iglQtmEn7Qfozv26yi5JL4MRigWjlaYGghXvuKQatMm4FXKDYyXv1EOrOXB5jW3oOrOjLJxssa2nzwdwseOIGiy4"
                  alt="Apple"
                />
              </button>
              <button className="flex items-center justify-center p-3 rounded-lg bg-surface-dark border border-slate-700/50 hover:bg-white/5 transition-all group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">
                  account_balance_wallet
                </span>
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <footer className="mt-8 flex justify-center gap-6 text-[10px] uppercase font-bold tracking-widest text-slate-600">
            <a className="hover:text-primary transition-colors" href="#">Privacy Protocol</a>
            <a className="hover:text-primary transition-colors" href="#">Service Terms</a>
            <a className="hover:text-primary transition-colors" href="#">Node Status</a>
          </footer>
        </div>
      </main>

      {/* Right Side Decor (Desktop Only) */}
      <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-1/4 h-3/4 opacity-20 pointer-events-none">
        <div className="w-full h-full border-r-2 border-primary/20 flex flex-col justify-between py-10">
          <div className="rotate-90 text-[10px] uppercase tracking-[0.5em] text-primary whitespace-nowrap">
            Tracking System v4.02
          </div>
          <div className="rotate-90 text-[10px] uppercase tracking-[0.5em] text-primary whitespace-nowrap">
            Secure Auth Layer Enabled
          </div>
        </div>
      </div>
    </div>
  );
}
