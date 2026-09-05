import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, User as UserIcon, LogOut, Shield } from 'lucide-react';
import { api } from '../../api/client';
import { User } from '../../types/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('clintrace_token');
    if (token) {
      api.getMe().then(setCurrentUser).catch(() => setCurrentUser(null));
    } else {
      setCurrentUser(null);
    }
  }, [location]);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-clinical-border sticky top-0 z-40 shadow-clinical">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Subtitle */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-clinical-primary flex items-center justify-center text-white shadow-xs group-hover:bg-[#0D625C] transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-clinical-text">CLINTRACE</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-clinical-primary-light text-clinical-primary rounded">
                v0.1.0
              </span>
            </div>
            <p className="text-[11px] font-medium text-clinical-muted leading-none">
              Patient Intake & Clinical Routing
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            to="/"
            className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${
              location.pathname === '/' || location.pathname.startsWith('/result')
                ? 'bg-clinical-primary-light text-clinical-primary'
                : 'text-clinical-muted hover:text-clinical-text hover:bg-clinical-bg'
            }`}
          >
            Patient Intake
          </Link>

          <Link
            to="/nurse"
            className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              location.pathname.startsWith('/nurse')
                ? 'bg-clinical-primary-light text-clinical-primary'
                : 'text-clinical-muted hover:text-clinical-text hover:bg-clinical-bg'
            }`}
          >
            <Shield className="w-4 h-4" />
            Nurse Dashboard
          </Link>

          {/* Auth Action */}
          {currentUser ? (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-clinical-border">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-clinical-text leading-tight">{currentUser.username}</p>
                <p className="text-[10px] text-clinical-muted uppercase font-semibold leading-tight">{currentUser.role}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-clinical-muted hover:text-urgency-emergency hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-3.5 py-1.5 border border-clinical-border rounded-lg text-xs font-bold text-clinical-text hover:bg-clinical-bg transition-colors flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Nurse Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
