import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { interviewAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Play, Calendar, TrendingUp, Video, ArrowLeft, Loader } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';

interface InterviewWithVideo {
  _id: string;
  id?: string;
  jobRole: string;
  difficulty: 'easy' | 'medium' | 'hard';
  role: 'technical' | 'hr' | 'combine';
  finalScore?: number;
  completedAt?: string;
  videoPath?: string;
  recordingUrl?: string;
  questions?: any[];
}

export default function VideoLibrary() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [interviews, setInterviews] = useState<InterviewWithVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<InterviewWithVideo | null>(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await interviewAPI.getUserInterviews(user?.id || '');
      // Filter only completed interviews with videos
      const completedWithVideos = res.data.filter((interview: any) =>
        interview.status === 'completed' && (interview.recordingUrl || interview.videoPath)
      );
      setInterviews(completedWithVideos);
    } catch (err: any) {
      console.error('Error loading interviews:', err);
      setError(err?.response?.data?.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      frontend: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      backend: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      fullstack: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      mern: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      dse: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      da: 'bg-green-500/20 text-green-300 border-green-500/30',
      ds: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      mobile: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      devops: 'bg-red-500/20 text-red-300 border-red-500/30',
      qa: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    return roleColors[role] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  if (selectedVideo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <motion.button
          onClick={() => setSelectedVideo(null)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Library
        </motion.button>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <VideoPlayer
              videoUrl={selectedVideo.recordingUrl || selectedVideo.videoPath || ''}
              title={`${selectedVideo.jobRole || selectedVideo.questions?.[0]?.category || 'Interview'} Session`}
            />
          </motion.div>

          {/* Interview Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-4">
                <p className="text-white/60 text-sm mb-1">Job Role</p>
                <p className="text-white font-semibold capitalize">{selectedVideo.jobRole || selectedVideo.questions?.[0]?.category || 'Interview'}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-4">
                <p className="text-white/60 text-sm mb-1">Difficulty</p>
                <Badge className={getDifficultyColor(selectedVideo.difficulty)}>
                  {selectedVideo.difficulty}
                </Badge>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-4">
                <p className="text-white/60 text-sm mb-1">Final Score</p>
                <p className="text-white font-semibold text-lg">
                  {typeof selectedVideo.finalScore === 'number' ? selectedVideo.finalScore.toFixed(1) : 'N/A'} / 5
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-4">
                <p className="text-white/60 text-sm mb-1">Completed</p>
                <p className="text-white/80 text-sm">{formatDate(selectedVideo.completedAt)}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Video Library
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-white/70">Loading your videos...</p>
            </div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-red-400 mb-6">{error}</p>
            <Button
              onClick={loadInterviews}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              Try Again
            </Button>
          </motion.div>
        ) : interviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Video className="w-20 h-20 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No Videos Yet</h2>
            <p className="text-white/60 mb-8">Your recorded interviews will appear here after completion</p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Go to Dashboard
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.map((interview, index) => (
              <motion.div
                key={interview._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/10 backdrop-blur-xl border-white/20 hover:border-cyan-400/50 transition-all cursor-pointer group overflow-hidden">
                  <CardHeader className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity" />
                    <div className="relative space-y-2">
                      <CardTitle className="text-white capitalize flex items-center justify-between">
                        <span>{interview.jobRole || interview.questions?.[0]?.category || 'Interview'}</span>
                        <Play className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 transition" />
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getRoleColor(interview.jobRole || interview.role || '')}>
                          {interview.role || interview.questions?.[0]?.category || 'Interview'}
                        </Badge>
                        <Badge className={getDifficultyColor(interview.difficulty)}>
                          {interview.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Score</span>
                        <span className="text-white font-semibold text-lg">
                          {typeof interview.finalScore === 'number' ? interview.finalScore.toFixed(1) : 'N/A'} / 5
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs">{formatDate(interview.completedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">{interview.questions?.length || 0} Questions</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setSelectedVideo(interview)}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch Video
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
