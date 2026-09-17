import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';

import Dashboard from './Dashboard';

type UserRole = 'hacker' | 'mentor' | 'admin';

interface CurrentUser {
  _id: string;
  fullName: string;
  role: UserRole;
}

const RoleDashboard = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get<CurrentUser>(
          '/auth/me'
        );

        setUser(data);
      } catch (error) {
        console.error(
          'Failed to fetch current user:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (
    user.role === 'mentor' ||
    user.role === 'admin'
  ) {
    return <Navigate to="/judge" replace />;
  }

  return <Dashboard />;
};

export default RoleDashboard;