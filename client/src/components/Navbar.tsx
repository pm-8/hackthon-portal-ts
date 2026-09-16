import { Link, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Zap,
  LayoutDashboard,
  Trophy,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
const Navbar = () => {
  const navigate = useNavigate();

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
            
            {/* NEW: Leaderboard Link */}
            <Link 
              to="/leaderboard" 
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 font-medium text-sm"
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </Link>

            {/* Dashboard Link */}
            <Link 
              to="/dashboard"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 font-medium text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/join-team"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 font-medium text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Join Team</span>
            </Link>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout} 
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-lg text-sm font-medium"
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