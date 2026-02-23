import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ user, logout, showProfileModal, setShowProfileModal }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', active: false },
    { to: '/habits', label: 'Habits', active: false },
    { to: '/analytics', label: 'Analytics', active: false },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ to: '/admin', label: 'Admin', active: false });
  }

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-background-dark font-bold">bolt</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                HABIT<span className="text-primary">CORE</span>
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-4">
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

          {/* Mobile Hamburger Button */}
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-background-dark/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user?.name || 'User'}</p>
                    <p className="text-xs text-primary">PRO PLAN</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    to="/support"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2 bg-white/5 rounded-lg text-sm text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">support_agent</span>
                    Support
                  </Link>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowProfileModal(true);
                    }}
                    className="flex items-center justify-center gap-2 py-2 bg-white/5 rounded-lg text-sm text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">person</span>
                    Profile
                  </button>
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="col-span-2 flex items-center justify-center gap-2 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
