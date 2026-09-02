import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { Interview } from '../types';
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Eye,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Video,
} from 'lucide-react';

export default function InterviewResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [recordingLoading, setRecordingLoading] = useState(false);

  const loadInterview = useCallback(async () => {
    try {
      const res = await interviewAPI.getInterview(id!);
      setInterview(res.data);
      return res.data;
    } catch (error) {
      console.error('Error loading interview:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  useEffect(() => {
    if (loading || interview?.recordingUrl || interview?.status !== 'completed') return;

    setRecordingLoading(true);
    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 60 seconds
    const interval = window.setInterval(async () => {
      attempts += 1;
      try {
        const res = await interviewAPI.getInterview(id!);
        setInterview(res.data);
        if (res.data.recordingUrl || attempts >= maxAttempts) {
          window.clearInterval(interval);
          setRecordingLoading(false);
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          window.clearInterval(interval);
          setRecordingLoading(false);
        }
      }
    }, 2000);

    return () => {
      window.clearInterval(interval);
      setRecordingLoading(false);
    };
  }, [loading, interview?.recordingUrl, interview?.status, id]);

  // Video URL comes directly from Cloudinary (recordingUrl field)
  const videoUrl = interview?.recordingUrl || null;
  const finalScore = interview?.finalScore;
  const finalScoreLabel = typeof finalScore === 'number' ? finalScore.toFixed(1) : '-';

  const downloadVideo = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.setAttribute('download', `interview-${id}.webm`);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-400 border-b-transparent rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.2s'}}></div>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Loading results...</div>
          <div className="text-slate-600 mt-2">Analyzing your interview performance</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PrepVerse - Results</h1>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 inline h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Interview Results</h2>
            {videoUrl && (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                >
                  <Video className="mr-2 inline h-5 w-5" />
                  Saved in Profile
                </button>
                <button
                  onClick={downloadVideo}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300"
                >
                  <Download className="mr-2 inline h-5 w-5" />
                  Download Video
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl text-center shadow-lg border border-blue-200/50 transform hover:scale-105 transition-all duration-300">
              <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                {finalScoreLabel}
              </div>
              <div className="text-blue-700 font-semibold text-lg">Final Score</div>
              <div className="text-blue-500 text-sm mt-1">Out of 5.0</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 rounded-2xl text-center shadow-lg border border-emerald-200/50 transform hover:scale-105 transition-all duration-300">
              <div className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent mb-2">
                {interview?.questions.length || 0}
              </div>
              <div className="text-emerald-700 font-semibold text-lg">Questions Answered</div>
              <div className="text-emerald-500 text-sm mt-1">Total Questions</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl text-center shadow-lg border border-purple-200/50 transform hover:scale-105 transition-all duration-300">
              <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
                {interview?.duration || 0}
              </div>
              <div className="text-purple-700 font-semibold text-lg">Minutes</div>
              <div className="text-purple-500 text-sm mt-1">Interview Duration</div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
              <Video className="h-7 w-7 text-blue-600" /> Review Your Interview
            </h3>
            {videoUrl ? (
              <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
                <video controls className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl border border-white/30">
                  <source src={videoUrl} type="video/webm" />
                  <source src={videoUrl.replace(/\.webm$/, '.mp4')} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <p className="text-slate-600 mt-4 text-center font-medium">Watch your responses to identify areas for improvement</p>
              </div>
            ) : recordingLoading ? (
              <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-blue-700 font-semibold text-lg">Saving your recording...</span>
                </div>
                <p className="text-blue-600">This may take a minute for longer interviews. Please wait.</p>
              </div>
            ) : (
              <div className="bg-slate-100 p-8 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-600 mb-4">Recording is not available for this interview. The full answer analysis is shown below.</p>
                <button
                  onClick={async () => {
                    setRecordingLoading(true);
                    const data = await loadInterview();
                    if (!data?.recordingUrl) {
                      setTimeout(() => setRecordingLoading(false), 1000);
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Retry Loading Recording
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded text-center">
              <div className="text-3xl font-bold text-blue-600">
                {finalScoreLabel}
              </div>
              <div className="text-gray-600">Final Score</div>
            </div>
            <div className="bg-green-50 p-4 rounded text-center">
              <div className="text-3xl font-bold text-green-600">
                {interview?.questions.length || 0}
              </div>
              <div className="text-gray-600">Questions Answered</div>
            </div>
            <div className="bg-purple-50 p-4 rounded text-center">
              <div className="text-3xl font-bold text-purple-600">
                {interview?.duration || 0} min
              </div>
              <div className="text-gray-600">Duration</div>
            </div>
          </div>

          {interview?.bodyLanguageData && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-2xl mb-8 border border-amber-200/50 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-amber-800 flex items-center gap-3">
                <Eye className="h-7 w-7 text-amber-700" /> Body Language Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white/60 p-6 rounded-xl text-center shadow-md border border-amber-200/30">
                  <div className="text-4xl font-black text-amber-600 mb-2">{interview.bodyLanguageData.eyeContact}%</div>
                  <div className="text-amber-700 font-semibold">Eye Contact</div>
                  <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
                    <div className="bg-amber-500 h-2 rounded-full transition-all duration-1000" style={{width: `${interview.bodyLanguageData.eyeContact}%`}}></div>
                  </div>
                </div>
                <div className="bg-white/60 p-6 rounded-xl text-center shadow-md border border-amber-200/30">
                  <div className="text-4xl font-black text-amber-600 mb-2">{interview.bodyLanguageData.faceOrientation}%</div>
                  <div className="text-amber-700 font-semibold">Face Orientation</div>
                  <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
                    <div className="bg-amber-500 h-2 rounded-full transition-all duration-1000" style={{width: `${interview.bodyLanguageData.faceOrientation}%`}}></div>
                  </div>
                </div>
                <div className="bg-white/60 p-6 rounded-xl text-center shadow-md border border-amber-200/30">
                  <div className="text-4xl font-black text-amber-600 mb-2">{interview.bodyLanguageData.confidenceScore}%</div>
                  <div className="text-amber-700 font-semibold">Confidence</div>
                  <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
                    <div className="bg-amber-500 h-2 rounded-full transition-all duration-1000" style={{width: `${interview.bodyLanguageData.confidenceScore}%`}}></div>
                  </div>
                </div>
              </div>
              {interview.bodyLanguageData.suggestions.length > 0 && (
                <div className="bg-white/40 p-6 rounded-xl border border-amber-200/30">
                  <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" /> Suggestions for Improvement:
                  </h4>
                  <ul className="space-y-2">
                    {interview.bodyLanguageData.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-amber-700">
                        <span className="mt-2 h-2 w-2 rounded-full bg-amber-500" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20">
          <h3 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-slate-700" /> Question-wise Breakdown
          </h3>
          <div className="space-y-6">
            {interview?.questions.map((q, i) => (
              <div key={i} className="bg-gradient-to-r from-white to-slate-50 p-6 rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-600">Q{i + 1}</span>
                    <span className={`px-4 py-2 text-sm font-semibold rounded-full shadow-md ${
                      q.difficulty === 'easy' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' :
                      q.difficulty === 'medium' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' :
                      'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                      {q.category}
                    </span>
                  </div>
                  <div className="text-2xl font-black bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                    {q.score !== undefined ? `${q.score}/5` : 'Pending'}
                  </div>
                </div>
                <p className="text-slate-800 mb-4 text-lg leading-relaxed font-medium">{q.question}</p>
                {q.answer && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/30 mb-4">
                    <strong className="text-blue-800 font-semibold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Your Answer:
                    </strong>
                    <p className="text-blue-700 mt-2 leading-relaxed">{q.answer.substring(0, 300)}{q.answer.length > 300 ? '...' : ''}</p>
                  </div>
                )}
                {q.feedback && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200/30">
                    <strong className="text-emerald-800 font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Feedback:
                    </strong>
                    <p className="text-emerald-700 mt-2 leading-relaxed">{q.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
