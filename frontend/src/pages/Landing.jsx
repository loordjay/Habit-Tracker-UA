import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-display">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50" style={{ background: 'rgba(2, 6, 23, 0.7)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(19,236,106,0.3)]">
              <span className="material-symbols-outlined text-background-dark font-bold">donut_large</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase italic">Habit<span className="text-primary">Track</span></h1>
          </div>
          
          {/* Desktop Navigation */}
          {/* <div className="hidden md:flex items-center gap-10">
            <a className="text-sm font-semibold hover:text-[#22c55e] transition-colors" href="#">Framework</a>
            <a className="text-sm font-semibold hover:text-[#22c55e] transition-colors" href="#">Methodology</a>
            <a className="text-sm font-semibold hover:text-[#22c55e] transition-colors" href="#">Analytics</a>
            <a className="text-sm font-semibold hover:text-[#22c55e] transition-colors" href="#">Enterprise</a>
          </div> */}
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Login</Link>
            <Link to="/signup" className="px-6 py-2.5 rounded-full text-xs font-extrabold text-[#020617] bg-[#22c55e] hover:bg-[#4ade80] transition-all" style={{ fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}>
              Initialize Routine
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-3xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10" style={{ background: 'rgba(2, 6, 23, 0.95)' }}>
            <div className="px-6 py-4 space-y-4">
              <a className="block text-sm font-semibold hover:text-[#22c55e] transition-colors py-2" href="#" onClick={() => setMobileMenuOpen(false)}>Framework</a>
              <a className="block text-sm font-semibold hover:text-[#22c55e] transition-colors py-2" href="#" onClick={() => setMobileMenuOpen(false)}>Methodology</a>
              <a className="block text-sm font-semibold hover:text-[#22c55e] transition-colors py-2" href="#" onClick={() => setMobileMenuOpen(false)}>Analytics</a>
              <a className="block text-sm font-semibold hover:text-[#22c55e] transition-colors py-2" href="#" onClick={() => setMobileMenuOpen(false)}>Enterprise</a>
              <div className="pt-4 border-t border-white/10 space-y-3">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full px-5 py-3 text-center text-sm font-bold text-slate-400 hover:text-white transition-colors border border-white/10 rounded-lg">Login</Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block w-full px-6 py-3 text-center rounded-full text-xs font-extrabold text-[#020617] bg-[#22c55e] hover:bg-[#4ade80] transition-all" style={{ fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}>Initialize Routine</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 50%, #064e3b 0%, #020617 70%)' }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              SYSTEMS OPERATIONAL V4.2
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tight">
              Optimize Your <br/>
              <span className="text-[#22c55e]" style={{ textShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}>Daily Engine</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-lg mb-10 leading-relaxed">
              The enterprise-grade habit architecture for high-performers. Build unbreakable routines through data-driven tracking and psychological engineering.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="px-10 py-5 rounded-xl text-sm font-extrabold text-[#020617] bg-[#22c55e] hover:bg-[#4ade80] transition-all text-center" style={{ fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}>
                Initialize Routine
              </Link>
              <Link to="/login" className="px-10 py-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800/50 transition-all" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span className="material-symbols-outlined">play_circle</span>
                View Interface
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 text-slate-500">
              <div className="flex flex-col">
                <span className="text-white font-bold text-2xl">420k+</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Active Nodes</span>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-2xl">98.4%</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Success Rate</span>
              </div>
            </div>
          </div>
          
          <div className="relative lg:block hidden">
            <div className="absolute -inset-4 bg-[#22c55e] opacity-10 blur-[100px] rounded-full"></div>
            <div className="rounded-2xl p-4 overflow-hidden animate-float" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(0px)', border: '1px solid rgba(255, 255, 255, 0.5)', transform: 'perspective(1000px) rotateY(-15deg) rotateX(10deg)', boxShadow: '-20px 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.1)' }}>
              <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
<img alt="HabitTracker Interface" className="w-full opacity-80 brightness-125 contrast-125 mix-blend-screen" src="/habit_tracker.png" />
                <div className="absolute inset-0 p-8 flex flex-col pointer-events-none">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-emerald-500/20 rounded"></div>
                      <div className="w-48 h-8 bg-emerald-500/40 rounded"></div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-400">person</span>
                    </div>
                  </div>
                 </div>
                  </div>
                </div>
              </div>
            </div>
      
      
      </section>

      {/* Core Architecture Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-extrabold mb-4 tracking-tight">Core Architecture</h2>
            <div className="w-24 h-1 bg-[#22c55e] mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl group" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="w-14 h-14 bg-emerald-950/50 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#22c55e] group-hover:text-slate-900 transition-all duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">query_stats</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Recursive Analytics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Deep-level habit analysis using machine learning to identify bottlenecks in your daily performance cycles.
              </p>
            </div>
            <div className="p-8 rounded-2xl group border-[#22c55e]" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 0 30px rgba(34,197,94,0.1)' }}>
              <div className="w-14 h-14 bg-emerald-950/50 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#22c55e] group-hover:text-slate-900 transition-all duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">hub</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Neural Stacking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Leverage behavioral triggers to stack high-value habits. Automate the friction points out of your workflow.
              </p>
            </div>
            <div className="p-8 rounded-2xl group" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="w-14 h-14 bg-emerald-950/50 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#22c55e] group-hover:text-slate-900 transition-all duration-300">
                <span className="material-symbols-outlined text-2xl font-bold">encrypted</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Identity Fortification</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Move beyond goals to identity-based change. Our protocol ensures permanent behavioral shifts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System Performance Section */}
      <section className="py-24 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">System Performance</h2>
                <p className="text-slate-400 text-sm">Real-time cohort aggregate data</p>
              </div>
              <button className="px-6 py-2 rounded-lg text-xs font-extrabold text-[#020617] bg-[#22c55e] hover:bg-[#4ade80] transition-all" style={{ fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}>
                Download Report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-emerald-950/20 text-[10px] uppercase font-bold tracking-widest text-emerald-500">
                  <tr>
                    <th className="px-8 py-5">User ID Hash</th>
                    <th className="px-8 py-5">Routine Intensity</th>
                    <th className="px-8 py-5">Uptime</th>
                    <th className="px-8 py-5">Variance</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 font-mono text-emerald-300">HT-8829-XL</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#22c55e] w-3/4"></div>
                        </div>
                        <span className="text-xs font-bold text-slate-300">High</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">156 Days</td>
                    <td className="px-8 py-6 text-slate-400">-0.2%</td>
                    <td className="px-8 py-6 text-right">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">STABLE</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 font-mono text-emerald-300">HT-4412-KM</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#22c55e] w-[90%]"></div>
                        </div>
                        <span className="text-xs font-bold text-slate-300">Extreme</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">42 Days</td>
                    <td className="px-8 py-6 text-slate-400">+1.4%</td>
                    <td className="px-8 py-6 text-right">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">OPTIMIZING</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 font-mono text-emerald-300">HT-1099-ZP</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500/50 w-1/4"></div>
                        </div>
                        <span className="text-xs font-bold text-slate-300">Low</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">12 Days</td>
                    <td className="px-8 py-6 text-slate-400">-8.5%</td>
                    <td className="px-8 py-6 text-right">
                      <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-bold border border-yellow-500/20">WARNING</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-900/10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-8 tracking-tighter">Ready to Deploy Your <br/><span className="text-[#22c55e]">New Standard?</span></h2>
          <p className="text-slate-400 mb-12 text-lg">Join 12,000+ elite professionals optimizing their human stack daily.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/signup" className="px-12 py-5 rounded-xl text-sm font-extrabold text-[#020617] bg-[#22c55e] hover:bg-[#4ade80] transition-all w-full sm:w-auto" style={{ fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}>
              Initialize Routine
            </Link>
            <a className="text-sm font-bold text-slate-400 hover:text-white transition-colors" href="#">View Pricing Structures →</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(19,236,106,0.3)]">
              <span className="material-symbols-outlined text-background-dark font-bold">donut_large</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase italic">Habit<span className="text-primary">Track</span></h1>
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-500 tracking-widest uppercase">
            <a className="hover:text-[#22c55e] transition-colors" href="#">Documentation</a>
            <a className="hover:text-[#22c55e] transition-colors" href="#">Security</a>
            <a className="hover:text-[#22c55e] transition-colors" href="#">Privacy</a>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">© 2026 Made by Lord-Jayesh.</p>
        </div>
      </footer>
    </div>
  );
}
