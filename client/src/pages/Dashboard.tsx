

//I have Forgot to post user details for creation of team add it later


import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Github, Users, Plus, Zap, CheckCircle, ExternalLink, Mail, Send } from 'lucide-react';

interface Team {
  _id: string;
  teamName: string;
  githubRepo: string;
  teamMembers: string[];
}

interface Invite {
  _id: string;
  teamId: {
    _id: string;
    teamName: string;
  };
  status: string;
}

const Dashboard = () => {
  const [team, setTeam] = useState<Team | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]); // State for invites
  const [loading, setLoading] = useState(true);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  // 1. Fetch Data on Load
  // 1. Fetch Data on Load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // A. Check if I have a team
        const { data: teamData } = await api.get('/teams/my-team');
        if (teamData) {
          setTeam(teamData);
        }

        // B. If I don't have a team, check for invites
        if (!teamData) {
          const { data: invitesData } = await api.get('/invites/my-invites');
          setInvites(invitesData);
        }
        
      } catch (error) {
        console.error("Failed to fetch data", error);
        // Optional: toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);
  // 2. Handle Team Creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !githubRepo) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const loadingToast = toast.loading('Creating team & setting up webhook...');
      const response = await api.post('/teams/create', { teamName, githubRepo });
      setTeam(response.data);
      toast.dismiss(loadingToast);
      toast.success('Team created & Webhook added! 🚀');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.error || 'Failed to create team');
    }
  };

  // 3. Handle Accepting Invite
  const handleAccept = async (inviteId: string) => {
    try {
      await api.post('/invites/respond', { inviteId, status: 'accepted' });
      toast.success("Joined team successfully! 🎉");
      // Reload to fetch the new team data (assuming /my-team endpoint exists or user logs in again)
      // In a real app, you'd fetch the team data here immediately
      window.location.reload(); 
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept invite');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-serif font-bold text-slate-800 mb-4 leading-tight">
            Welcome, <span className="text-teal-600">Hacker!</span>
          </h1>
          <p className="text-slate-600 text-lg font-light">
            Build something amazing today
          </p>
        </div>

        {loading ? (
          // LOADING STATE
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm">
            <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Loading your workspace...</p>
          </div>
        ) : team ? (
          // VIEW: USER HAS A TEAM
          <div className="bg-white rounded-3xl p-10 shadow-lg max-w-3xl mx-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-4xl font-serif font-bold text-slate-800">{team.teamName}</h2>
                </div>
                <div className="flex items-center space-x-2 text-emerald-600 text-sm font-medium ml-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Active & Connected</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100">
              <div className="flex items-center space-x-2 mb-3">
                <Github className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700 font-semibold text-sm">Repository</span>
              </div>
              <a 
                href={team.githubRepo} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-700 transition-colors duration-200 break-all flex items-center space-x-1 group"
              >
                <span>{team.githubRepo}</span>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8">
              <p className="text-blue-700 text-sm flex items-center space-x-2 font-medium">
                <Zap className="w-4 h-4" />
                <span>Webhook is active and listening for pushes</span>
              </p>
            </div>

            {/* NEW: Invite Members Section */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">Invite Team Members</h3>
              </div>
              
              <p className="text-sm text-slate-600 mb-4">
                Need help? Invite other hackers to join <strong>{team.teamName}</strong> by their email.
              </p>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const email = (e.target as any).email.value;
                  try {
                    await api.post('/invites/send', { teamId: team._id, email });
                    toast.success(`Invite sent to ${email}! 📨`);
                    (e.target as any).reset();
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Failed to send invite');
                  }
                }}
                className="flex gap-3"
              >
                <input 
                  name="email"
                  type="email" 
                  placeholder="friend@example.com" 
                  required
                  className="flex-1 px-4 py-3 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Invite</span>
                </button>
              </form>
            </div>

            <div className="mt-8">
              <Link 
                to={`/kanban/${team._id}`} 
                className="inline-block w-full text-center bg-slate-800 hover:bg-slate-900 text-white font-semibold py-4 rounded-full transition-all duration-300 hover:shadow-xl text-base"
              >
                Go to Kanban Board →
              </Link>
            </div>

          </div>
        ) : (
          // VIEW: NO TEAM (CREATE OR JOIN)
          <div className="bg-white rounded-3xl p-12 shadow-lg max-w-2xl mx-auto">
            
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <span className="text-5xl">⚠️</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-slate-800 mb-3">
                You're not in a team yet
              </h2>
              <p className="text-slate-600 text-lg font-light">
                Create a team to start tracking your hackathon project
              </p>
            </div>

            {/* NEW: Incoming Invites Section */}
            {invites.length > 0 && (
              <div className="mb-10 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-yellow-600" />
                  <span>💌 You have pending invites!</span>
                </h3>
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div key={invite._id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-yellow-100">
                      <div>
                        <span className="text-slate-600">Join team </span>
                        <span className="font-bold text-slate-800">{invite.teamId.teamName}</span>?
                      </div>
                      <button 
                        onClick={() => handleAccept(invite._id)}
                        className="px-5 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition shadow-sm"
                      >
                        Accept & Join
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Team Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., Code Ninjas" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value)} 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  GitHub Repository URL
                </label>
                <div className="relative">
                  <Github className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="url" 
                    placeholder="https://github.com/username/repo" 
                    value={githubRepo} 
                    onChange={(e) => setGithubRepo(e.target.value)} 
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <button 
                onClick={handleCreateTeam} 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-full transition-all duration-300 hover:shadow-xl flex items-center justify-center space-x-2 text-base mt-8"
              >
                <Plus className="w-5 h-5" />
                <span>Create Team & Link GitHub</span>
              </button>
            </div>

            <div className="mt-8 bg-teal-50 border border-teal-100 rounded-2xl p-5">
              <p className="text-teal-800 text-sm font-medium">
                <strong>Note:</strong> Ensure your admin has access to this repo to add webhooks automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;