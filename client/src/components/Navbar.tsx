import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LogOut,
  Zap,
  LayoutDashboard,
  Trophy,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
type UserRole =
  | 'hacker'
  | 'mentor'
  | 'admin';

const Navbar = () => {
  const navigate = useNavigate();

  const [role, setRole] =
    useState<UserRole | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data } =
          await api.get('/auth/me');

        setRole(data.role);

      } catch {
        setRole(null);
      }
    };

    fetchRole();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-slate-800">
              HackPortal
            </h2>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link
              to="/leaderboard"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </Link>

            {(role === 'mentor' ||
              role === 'admin') ? (
              <Link
                to="/judge"
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold text-sm"
              >
                {/* <Award className="w-4 h-4" /> */}
                <span>Mentor Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/join-team"
                  className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join Team</span>
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="..."
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;