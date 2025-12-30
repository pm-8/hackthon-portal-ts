import { useEffect, useState } from 'react';
import { Trophy, Medal, Star, Github } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';

interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  repo: string;
  averageScore: number;
  judgesCount: number;
}

const Leaderboard = () => {
  const [teams, setTeams] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await api.get('/scores/leaderboard');
        setTeams(data);
      } catch (error) {
        console.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Helper to get rank icon
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-md" />;
      case 1: return <Medal className="w-8 h-8 text-gray-300 drop-shadow-md" />;
      case 2: return <Medal className="w-8 h-8 text-amber-600 drop-shadow-md" />;
      default: return <span className="text-2xl font-bold text-slate-400">#{index + 1}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
            Hackathon Leaderboard
          </h1>
          <p className="text-slate-400 text-lg">
            See who is leading the race! 🚀
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.length === 0 ? (
              <div className="text-center text-slate-500 py-10">No scores submitted yet. Be the first judge! ⚖️</div>
            ) : (
              teams.map((team, index) => (
                <div 
                  key={team.teamId}
                  className={`relative flex items-center p-6 rounded-2xl border transition-all duration-300 ${
                    index === 0 
                      ? 'bg-slate-800/80 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] transform scale-105 z-10' 
                      : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {/* Rank Icon */}
                  <div className="w-16 flex-shrink-0 flex justify-center">
                    {getRankIcon(index)}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 px-6">
                    <h3 className={`text-2xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                      {team.teamName}
                    </h3>
                    <a 
                      href={team.repo} 
                      target="_blank" 
                      className="inline-flex items-center space-x-2 text-slate-400 text-sm hover:text-white mt-1 transition"
                    >
                      <Github size={14} />
                      <span>View Code</span>
                    </a>
                  </div>

                  {/* Score Badge */}
                  <div className="text-right">
                    <div className="flex items-center space-x-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-700">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-2xl font-bold text-white">{team.averageScore}</span>
                      <span className="text-xs text-slate-500 font-medium">/ 30</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 pr-2">
                      Based on {team.judgesCount} {team.judgesCount === 1 ? 'judge' : 'judges'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;