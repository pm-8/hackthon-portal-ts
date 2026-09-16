import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Github,
  UserPlus,
  ArrowLeft,
  ExternalLink,
  Search,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Navbar from '../components/Navbar';
import api from '../api/axios';

interface TeamMember {
  _id: string;
  fullName: string;
  email: string;
  githubUsername?: string;
  avatarUrl?: string;
}

interface Team {
  _id: string;
  teamName: string;
  githubRepo: string;
  teamMembers: TeamMember[];
}

const JoinTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data } = await api.get<Team[]>('/teams');
        setTeams(data);
      } catch (error: any) {
        console.error('Failed to fetch teams:', error);
        toast.error(
          error.response?.data?.error || 'Failed to load teams'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleJoinTeam = async (teamId: string) => {
    try {
      setJoiningTeamId(teamId);

      const { data } = await api.post<Team>(
        `/teams/${teamId}/join`
      );

      toast.success(`You joined ${data.teamName}! 🎉`);

      // Remove joined team from the available list.
      setTeams((prev) => prev.filter((team) => team._id !== teamId));

      // Send user to dashboard.
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Failed to join team:', error);

      toast.error(
        error.response?.data?.error ||
          'Failed to join team'
      );
    } finally {
      setJoiningTeamId(null);
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.teamName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-lg">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>

                <h1 className="text-4xl font-serif font-bold text-slate-800">
                  Join a Team
                </h1>
              </div>

              <p className="text-slate-600">
                Find a team and start hacking together.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                type="text"
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-sm p-16 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />

            <p className="text-slate-600">
              Loading available teams...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredTeams.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-400" />
            </div>

            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              No teams found
            </h2>

            <p className="text-slate-500">
              {search
                ? 'Try searching for a different team name.'
                : 'There are currently no teams available to join.'}
            </p>
          </div>
        )}

        {/* Team Grid */}
        {!loading && filteredTeams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <div
                key={team._id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Team Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-md">
                      <Users className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <h2 className="font-bold text-lg text-slate-800">
                        {team.teamName}
                      </h2>

                      <p className="text-sm text-slate-500">
                        {team.teamMembers.length}{' '}
                        {team.teamMembers.length === 1
                          ? 'member'
                          : 'members'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                    Team Members
                  </p>

                  <div className="flex items-center">
                    {team.teamMembers.slice(0, 5).map((member, index) => (
                      <div
                        key={member._id}
                        className="relative"
                        style={{
                          marginLeft: index === 0 ? 0 : '-10px',
                          zIndex: team.teamMembers.length - index,
                        }}
                      >
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.fullName}
                            className="w-9 h-9 rounded-full border-2 border-white object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                            {member.fullName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    ))}

                    {team.teamMembers.length > 5 && (
                      <div className="ml-2 text-xs text-slate-500 font-medium">
                        +{team.teamMembers.length - 5} more
                      </div>
                    )}
                  </div>
                </div>

                {/* GitHub */}
                {team.githubRepo && (
                  <a
                    href={team.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-6 break-all"
                  >
                    <Github className="w-4 h-4 shrink-0" />

                    <span className="truncate">
                      {team.githubRepo}
                    </span>

                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}

                {/* Join */}
                <button
                  onClick={() => handleJoinTeam(team._id)}
                  disabled={joiningTeamId === team._id}
                  className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {joiningTeamId === team._id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Join Team
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinTeams;