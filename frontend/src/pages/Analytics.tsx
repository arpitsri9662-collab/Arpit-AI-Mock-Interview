import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { analyticsAPI } from '../services/api';
import { Analytics as AnalyticsData } from '../types';
import { BarChart3, PlayCircle } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Analytics() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await analyticsAPI.getUserAnalytics(user?.id || '');
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <div className="text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 dark:text-slate-100">
      <nav className="border-b border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">PrepVerse - Analytics</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Your Performance Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-lg border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/80">
            <h3 className="text-slate-600 text-sm dark:text-slate-300">Total Interviews</h3>
            <div className="text-4xl font-bold text-blue-600">{analytics?.totalInterviews || 0}</div>
          </div>
          <div className="rounded-lg border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/80">
            <h3 className="text-slate-600 text-sm dark:text-slate-300">Average Score</h3>
            <div className="text-4xl font-bold text-green-600">{analytics?.averageScore || 0}</div>
          </div>
          <div className="rounded-lg border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/80">
            <h3 className="text-slate-600 text-sm dark:text-slate-300">Recent Interviews</h3>
            <div className="text-4xl font-bold text-purple-600">{analytics?.recentInterviews?.length || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-lg border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/80">
            <h3 className="text-xl font-bold mb-4">Strong Areas</h3>
            {analytics?.strongAreas && analytics.strongAreas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analytics.strongAreas.map((area, i) => (
                  <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full dark:bg-green-900/40 dark:text-green-300">
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">Complete more interviews to see strong areas</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/80">
            <h3 className="text-xl font-bold mb-4">Areas for Improvement</h3>
            {analytics?.weakAreas && analytics.weakAreas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analytics.weakAreas.map((area, i) => (
                  <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full dark:bg-red-900/40 dark:text-red-300">
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">Complete more interviews to identify weak areas</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/80">
          <h3 className="text-xl font-bold mb-4">Past Mock Interviews</h3>
          {analytics?.recentInterviews && analytics.recentInterviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/80">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Score</th>
                    <th className="px-4 py-2 text-left">Answered</th>
                    <th className="px-4 py-2 text-left">Recording</th>
                    <th className="px-4 py-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentInterviews.map((interview, i) => (
                    <tr
                      key={interview.id || i}
                      onClick={() => navigate(`/interview-result/${interview.id}`)}
                      className="border-t border-slate-200 cursor-pointer transition-colors hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-slate-800/80"
                    >
                      <td className="px-4 py-2">
                        {interview.date ? new Date(interview.date).toLocaleDateString() : 'No date'}
                      </td>
                      <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded ${
                          interview.finalScore >= 4 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                          interview.finalScore >= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {Number(interview.finalScore || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2">{interview.answeredCount ?? interview.questionCount} / {interview.questionCount}</td>
                      <td className="px-4 py-2">
                        {interview.hasRecording ? (
                          <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                            <PlayCircle className="h-4 w-4" /> Saved
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">Not saved</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/interview-result/${interview.id}`);
                          }}
                          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          <BarChart3 className="h-4 w-4" />
                          View analysis
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No interviews completed yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
