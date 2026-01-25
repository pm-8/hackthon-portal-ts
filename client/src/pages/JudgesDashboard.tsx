import { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { 
  Gavel, Github, Users, X, CheckCircle, 
  Activity as ActivityIcon, GitCommit, Award 
} from 'lucide-react';

interface Team {
  _id: string;
  teamName: string;
  githubRepo: string;
  teamMembers: { fullName: string; githubUsername: string }[];
}

interface Activity {
  _id: string;
  user: { fullName: string };
  action: string;
  target?: string;
  createdAt: string;
}

const JudgeDashboard = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Scoring State
  const [scores, setScores] = useState({ innovation: 0, technical: 0, presentation: 0 });
  const [comment, setComment] = useState('');

  // 1. Fetch All Teams on Load
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data } = await api.get('/teams/all');
        setTeams(data);
      } catch (error) {
        toast.error('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // 2. Fetch Activities when a Team is selected
  useEffect(() => {
    if (selectedTeam) {
      const fetchActivities = async () => {
        try {
          const { data } = await api.get(`/activities/${selectedTeam._id}`);
          setActivities(data);
        } catch (e) { console.error(e); }
      };
      fetchActivities();
    }
  }, [selectedTeam]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      const total = scores.innovation + scores.technical + scores.presentation;
      await api.post('/scores/add', {
        teamId: selectedTeam._id,
        criteria: scores,
        score: total,
        comment
      });
      toast.success(`Score submitted for ${selectedTeam.teamName}!`);
      setSelectedTeam(null); // Close modal
      setScores({ innovation: 0, technical: 0, presentation: 0 }); // Reset form
      setComment('');
    } catch (error) {
      toast.error('Failed to submit score');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg">
            <Gavel className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Judge Dashboard</h1>
            <p className="text-slate-500">Review teams, track progress, and assign scores.</p>
          </div>
        </div>

        {loading ? (
          <p>Loading teams...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-800">{team.teamName}</h3>
                  <a href={team.githubRepo} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-black">
                    <Github className="w-5 h-5" />
                  </a>
                </div>
                
                <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>{team.teamMembers.length} Members</span>
                </div>

                <button 
                  onClick={() => setSelectedTeam(team)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  Evaluate & Score
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INSPECTION MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            
            {/* LEFT SIDE: Activity Feed */}
            <div className="w-full md:w-1/2 bg-slate-50 p-8 border-r border-slate-200 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{selectedTeam.teamName}</h2>
                <span className="text-xs font-bold px-2 py-1 bg-teal-100 text-teal-700 rounded-md">Live Activity</span>
              </div>

              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-slate-400 italic">No activity recorded yet.</p>
                ) : (
                  activities.map((act) => (
                    <div key={act._id} className="flex gap-3 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                       {act.action === 'pushed code' ? (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white flex-shrink-0">
                          <GitCommit className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                          <ActivityIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-slate-800">
                          <span className="font-semibold">{act.user?.fullName}</span> {act.action}
                        </p>
                        {act.target && <p className="text-teal-600 font-medium">"{act.target}"</p>}
                        <p className="text-xs text-slate-400 mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT SIDE: Scoring Form */}
            <div className="w-full md:w-1/2 p-8 overflow-y-auto relative">
              <button 
                onClick={() => setSelectedTeam(null)} 
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Scorecard
              </h2>

              <form onSubmit={handleSubmitScore} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Innovation (0-10)</label>
                  <input 
                    type="number" min="0" max="10" required
                    value={scores.innovation}
                    onChange={(e) => setScores({...scores, innovation: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Technical Complexity (0-10)</label>
                  <input 
                    type="number" min="0" max="10" required
                    value={scores.technical}
                    onChange={(e) => setScores({...scores, technical: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Presentation (0-10)</label>
                  <input 
                    type="number" min="0" max="10" required
                    value={scores.presentation}
                    onChange={(e) => setScores({...scores, presentation: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                
                <div className="p-4 bg-purple-50 rounded-xl flex justify-between items-center">
                  <span className="font-semibold text-purple-900">Total Score</span>
                  <span className="text-2xl font-bold text-purple-700">
                    {scores.innovation + scores.technical + scores.presentation} / 30
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Judge's Comments</label>
                  <textarea 
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Feedback for the team..."
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  ></textarea>
                </div>

                <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-lg shadow-purple-200">
                  Submit Score
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeDashboard;