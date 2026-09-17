import { useEffect, useState } from 'react';

import {
  Gavel,
  Github,
  Users,
  X,
  Award,
  GitCommit,
  CheckCircle,
  Clock,
} from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../api/axios';
import Navbar from '../components/Navbar';

interface TeamMember {
  _id: string;
  fullName: string;
  githubUsername: string;
}

interface Team {
  _id: string;
  teamName: string;
  githubRepo: string;
  teamMembers: TeamMember[];
}

interface Activity {
  _id: string;
  user?: {
    fullName: string;
  };
  action: string;
  target?: string;
  createdAt: string;
}

interface MentorScore {
  teamId: string;
  innovation: number;
  technicality: number;
  presentation: number;
  total: number;
  feedback?: string;
}

const JudgesDashboard = () => {
  const [teams, setTeams] =
    useState<Team[]>([]);

  const [scores, setScores] =
    useState<MentorScore[]>([]);

  const [selectedTeam, setSelectedTeam] =
    useState<Team | null>(null);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [scoreForm, setScoreForm] =
    useState({
      innovation: 0,
      technicality: 0,
      presentation: 0,
      feedback: '',
    });

  // -------------------------------
  // Load teams + mentor scores
  // -------------------------------

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          teamsResponse,
          scoresResponse,
        ] = await Promise.all([
          api.get<Team[]>(
            '/teams/all'
          ),
          api.get<MentorScore[]>(
            '/scores/mine'
          ),
        ]);

        setTeams(
          teamsResponse.data
        );

        setScores(
          scoresResponse.data
        );

      } catch (error) {
        console.error(error);

        toast.error(
          'Failed to load mentor dashboard'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // -------------------------------
  // Selected team activity
  // -------------------------------

  useEffect(() => {
    if (!selectedTeam) return;

    const loadActivities = async () => {
      try {
        const { data } =
          await api.get<Activity[]>(
            `/activities/${selectedTeam._id}`
          );

        setActivities(data);

      } catch (error) {
        console.error(error);
      }
    };

    loadActivities();
  }, [selectedTeam]);

  // -------------------------------
  // Open scoring modal
  // -------------------------------

  const openTeam = (
    team: Team
  ) => {
    setSelectedTeam(team);

    const existingScore =
      scores.find(
        (score) =>
          score.teamId === team._id
      );

    if (existingScore) {
      setScoreForm({
        innovation:
          existingScore.innovation,

        technicality:
          existingScore.technicality,

        presentation:
          existingScore.presentation,

        feedback:
          existingScore.feedback || '',
      });
    } else {
      setScoreForm({
        innovation: 0,
        technicality: 0,
        presentation: 0,
        feedback: '',
      });
    }
  };

  // -------------------------------
  // Submit/update score
  // -------------------------------

  const handleSubmitScore = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedTeam) return;

    try {
      setSaving(true);

      const {
        innovation,
        technicality,
        presentation,
        feedback,
      } = scoreForm;

      await api.post(
        '/scores/add',
        {
          teamId:
            selectedTeam._id,

          criteria: {
            innovation,
            technicality,
            presentation,
          },

          comment: feedback,
        }
      );

      toast.success(
        `Score saved for ${selectedTeam.teamName}`
      );

      const { data } =
        await api.get<MentorScore[]>(
          '/scores/mine'
        );

      setScores(data);

      setSelectedTeam(null);

    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          'Failed to submit score'
      );
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------
  // Derived values
  // -------------------------------

  const evaluatedCount =
    teams.filter(
      (team) =>
        scores.some(
          (score) =>
            score.teamId === team._id
        )
    ).length;

  const pendingCount =
    teams.length -
    evaluatedCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Header */}

        <div className="mb-10">

          <div className="flex items-center gap-3">

            <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg">
              <Gavel className="w-7 h-7" />
            </div>

            <div>

              <h1 className="text-3xl font-bold text-slate-900">
                Mentor Dashboard
              </h1>

              <p className="text-slate-500 mt-1">
                Review teams, monitor progress,
                and evaluate projects.
              </p>

            </div>

          </div>

        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

          <StatCard
            title="Total Teams"
            value={teams.length}
            icon={
              <Users className="w-5 h-5" />
            }
          />

          <StatCard
            title="Evaluated"
            value={evaluatedCount}
            icon={
              <CheckCircle className="w-5 h-5" />
            }
          />

          <StatCard
            title="Pending Review"
            value={pendingCount}
            icon={
              <Clock className="w-5 h-5" />
            }
          />

        </div>

        {/* Teams */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {teams.map((team) => {

            const score =
              scores.find(
                (item) =>
                  item.teamId ===
                  team._id
              );

            return (
              <div
                key={team._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition"
              >

                <div className="flex items-start justify-between">

                  <div>

                    <h2 className="text-xl font-bold text-slate-800">
                      {team.teamName}
                    </h2>

                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                      <Users className="w-4 h-4" />
                      {team.teamMembers.length}
                      {' '}
                      members
                    </div>

                  </div>

                  {score ? (
                    <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      {score.total}/30
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                      Pending
                    </div>
                  )}

                </div>

                <a
                  href={team.githubRepo}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mt-5 truncate"
                >
                  <Github className="w-4 h-4" />

                  {team.githubRepo}
                </a>

                <div className="mt-5">

                  <button
                    onClick={() =>
                      openTeam(team)
                    }
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex justify-center items-center gap-2"
                  >
                    <Award className="w-4 h-4" />

                    {score
                      ? 'Edit Evaluation'
                      : 'Evaluate Team'}
                  </button>

                </div>

              </div>
            );
          })}

        </div>

      </main>

      {/* Evaluation Modal */}

      {selectedTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden grid md:grid-cols-2">

            {/* LEFT */}

            <div className="bg-slate-50 p-8 overflow-y-auto">

              <div className="flex justify-between items-center mb-6">

                <div>

                  <h2 className="text-2xl font-bold text-slate-800">
                    {selectedTeam.teamName}
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Team activity
                  </p>

                </div>

                <button
                  onClick={() =>
                    setSelectedTeam(null)
                  }
                  className="p-2 rounded-full bg-white hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              <div className="space-y-3">

                {activities.length === 0 ? (
                  <p className="text-slate-400 italic">
                    No recent activity.
                  </p>
                ) : (
                  activities.map(
                    (activity) => (
                      <div
                        key={activity._id}
                        className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3"
                      >

                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <GitCommit className="w-4 h-4" />
                        </div>

                        <div>

                          <p className="text-sm text-slate-700">

                            <span className="font-semibold">
                              {activity.user?.fullName || 'Unknown'}
                            </span>

                            {' '}

                            {activity.action}

                          </p>

                          {activity.target && (
                            <p className="text-teal-600 text-sm font-medium">
                              "{activity.target}"
                            </p>
                          )}

                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(
                              activity.createdAt
                            ).toLocaleString()}
                          </p>

                        </div>

                      </div>
                    )
                  )
                )}

              </div>

            </div>

            {/* RIGHT */}

            <div className="p-8 overflow-y-auto">

              <h2 className="text-2xl font-bold text-slate-800 mb-7">
                Evaluation
              </h2>

              <form
                onSubmit={
                  handleSubmitScore
                }
                className="space-y-6"
              >

                <ScoreInput
                  label="Innovation"
                  value={
                    scoreForm.innovation
                  }
                  onChange={(value) =>
                    setScoreForm({
                      ...scoreForm,
                      innovation: value,
                    })
                  }
                />

                <ScoreInput
                  label="Technical Complexity"
                  value={
                    scoreForm.technicality
                  }
                  onChange={(value) =>
                    setScoreForm({
                      ...scoreForm,
                      technicality: value,
                    })
                  }
                />

                <ScoreInput
                  label="Presentation"
                  value={
                    scoreForm.presentation
                  }
                  onChange={(value) =>
                    setScoreForm({
                      ...scoreForm,
                      presentation: value,
                    })
                  }
                />

                <div className="bg-purple-50 rounded-2xl p-5 flex justify-between">

                  <span className="font-semibold text-purple-900">
                    Total
                  </span>

                  <span className="text-3xl font-bold text-purple-700">
                    {
                      scoreForm.innovation +
                      scoreForm.technicality +
                      scoreForm.presentation
                    }
                    /30
                  </span>

                </div>

                <div>

                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Feedback
                  </label>

                  <textarea
                    rows={5}
                    value={
                      scoreForm.feedback
                    }
                    onChange={(e) =>
                      setScoreForm({
                        ...scoreForm,
                        feedback:
                          e.target.value,
                      })
                    }
                    placeholder="What did the team do well? What could be improved?"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />

                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold"
                >
                  {saving
                    ? 'Saving...'
                    : 'Submit Evaluation'}
                </button>

              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">

      <div className="flex justify-between items-center">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            {value}
          </p>

        </div>

        <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
          {icon}
        </div>

      </div>

    </div>
  );
};

const ScoreInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => {
  return (
    <div>

      <div className="flex justify-between mb-2">

        <label className="text-sm font-semibold text-slate-700">
          {label}
        </label>

        <span className="text-sm font-bold text-purple-600">
          {value}/10
        </span>

      </div>

      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) =>
          onChange(
            Number(e.target.value)
          )
        }
        className="w-full accent-purple-600"
      />

    </div>
  );
};

export default JudgesDashboard;