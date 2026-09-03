import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  XCircle,
  BriefcaseBusiness,
} from 'lucide-react';
import { resumeAPI } from '../services/api';

type Step = 'upload' | 'selectRole' | 'analyzing' | 'results' | 'startInterview';

type JobRole =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mern'
  | 'mevn'
  | 'mobile'
  | 'dse'
  | 'da'
  | 'ds'
  | 'devops'
  | 'qa';

interface AnalysisResult {
  suitabilityScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
}

export default function ResumeUpload() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const jobRoles: {
    id: JobRole;
    label: string;
    description: string;
    icon: string;
  }[] = [
    {
      id: 'frontend',
      label: 'Frontend Developer',
      description: 'React, Vue, Angular',
      icon: '🎨',
    },
    {
      id: 'backend',
      label: 'Backend Developer',
      description: 'Node, Python, Java',
      icon: '⚙️',
    },
    {
      id: 'fullstack',
      label: 'Full Stack Developer',
      description: 'Frontend + Backend',
      icon: '🚀',
    },
    {
      id: 'mern',
      label: 'MERN Stack',
      description: 'MongoDB, Express, React, Node',
      icon: '⚛️',
    },
    {
      id: 'mevn',
      label: 'MEVN Stack',
      description: 'MongoDB, Express, Vue, Node',
      icon: '💚',
    },
    {
      id: 'mobile',
      label: 'Mobile Developer',
      description: 'React Native, Flutter',
      icon: '📱',
    },
    {
      id: 'dse',
      label: 'Data Science Engineer',
      description: 'Python, ML, Analytics',
      icon: '📊',
    },
    {
      id: 'da',
      label: 'Data Analyst',
      description: 'SQL, Analytics, BI Tools',
      icon: '📈',
    },
    {
      id: 'ds',
      label: 'DevOps / SRE',
      description: 'Docker, Kubernetes, Cloud',
      icon: '☁️',
    },
    {
      id: 'devops',
      label: 'Cloud Engineer',
      description: 'AWS, Azure, GCP',
      icon: '🌐',
    },
    {
      id: 'qa',
      label: 'QA Engineer',
      description: 'Testing, Automation',
      icon: '🧪',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.size > 5 * 1024 * 1024) {
        setMessage('Resume must be smaller than 5MB.');
        setFile(null);
        return;
      }

      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!validTypes.includes(selectedFile.type)) {
        setMessage('Please upload a PDF or DOCX file.');
        setFile(null);
        return;
      }

      setMessage('');
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await resumeAPI.upload(formData);

      setUploadedResumeId(response.data.resume.id);
      setStep('selectRole');
      setFile(null);
    } catch (error) {
      setMessage(
        (error as any).response?.data?.message || 'Error uploading resume'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedRole || !uploadedResumeId) return;

    setLoading(true);
    setMessage('');
    setStep('analyzing');

    try {
      const response = await resumeAPI.analyze(
        uploadedResumeId,
        selectedRole
      );

      setAnalysisResult(response.data.analysis);
      setStep('results');
    } catch (error) {
      setMessage(
        (error as any).response?.data?.message ||
          'Error analyzing resume'
      );
      setStep('selectRole');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWithResume = () => {
    navigate('/interview', {
      state: { resumeId: uploadedResumeId },
    });
  };

  const handleStartWithoutResume = () => {
    navigate('/interview');
  };

  const selectedRoleLabel =
    jobRoles.find((role) => role.id === selectedRole)?.label ||
    'Selected Role';

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Needs Improvement';
    return 'Needs Attention';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-5 h-5" />;
    if (score >= 60) return <Target className="w-5 h-5" />;
    return <Lightbulb className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">
              Prep<span className="text-blue-400">Verse</span>
            </span>
          </div>

          <div className="w-20 sm:w-24" />
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/20 bg-blue-500/10 text-blue-300 text-sm mb-5">
            <Sparkles className="w-4 h-4" />
            AI-Powered Resume Analysis
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Turn Your Resume Into
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Interview Advantage
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg">
            Upload your resume, select your target role, and let PrepVerse
            analyze your strengths and identify areas for improvement.
          </p>
        </div>

        {/* Progress */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload' },
              { key: 'selectRole', label: 'Target Role' },
              { key: 'results', label: 'Analysis' },
            ].map((item, index) => {
              const isActive =
                step === item.key ||
                (step === 'analyzing' && item.key === 'selectRole') ||
                (step === 'startInterview' && item.key === 'results');

              return (
                <div key={item.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                        isActive
                          ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/30'
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <span
                      className={`mt-2 text-xs sm:text-sm ${
                        isActive ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {index < 2 && (
                    <div className="h-px flex-1 mx-3 bg-white/10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {message && (
          <div className="max-w-4xl mx-auto mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{message}</p>
          </div>
        )}

        {/* Upload */}
        {step === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-6 sm:p-10">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center mb-5">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>

                  <h2 className="text-2xl font-bold mb-2">
                    Upload Your Resume
                  </h2>

                  <p className="text-slate-400">
                    PDF or DOCX • Maximum 5MB
                  </p>
                </div>

                <label
                  htmlFor="resume-upload"
                  className="group block cursor-pointer"
                >
                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                      file
                        ? 'border-blue-400/50 bg-blue-500/10'
                        : 'border-white/15 bg-black/10 hover:border-blue-400/40 hover:bg-blue-500/5'
                    }`}
                  >
                    {file ? (
                      <>
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-blue-400" />
                        </div>

                        <h3 className="font-semibold text-lg mb-1 break-all">
                          {file.name}
                        </h3>

                        <p className="text-sm text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        <p className="text-blue-400 text-sm mt-4">
                          Click to choose another file
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/10 transition-colors">
                          <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
                        </div>

                        <h3 className="font-semibold text-lg mb-2">
                          Drop your resume here
                        </h3>

                        <p className="text-slate-400 text-sm mb-4">
                          or click to browse from your computer
                        </p>

                        <span className="inline-flex px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300">
                          Choose File
                        </span>
                      </>
                    )}
                  </div>

                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading Resume...
                    </>
                  ) : (
                    <>
                      Upload & Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-white/10 px-6 sm:px-10 py-5 bg-black/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Secure processing
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    AI-powered analysis
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Personalized insights
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role selection */}
        {step === 'selectRole' && (
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-2xl p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <BriefcaseBusiness className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Step 2 of 3
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold">
                    What's your target role?
                  </h2>

                  <p className="text-slate-400 mt-2">
                    Choose the role you are preparing to apply for.
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400">
                  {jobRoles.length} roles available
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobRoles.map((role) => {
                  const selected = selectedRole === role.id;

                  return (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`text-left p-5 rounded-2xl border transition-all group ${
                        selected
                          ? 'border-blue-400/60 bg-blue-500/15 shadow-lg shadow-blue-500/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-3xl">{role.icon}</div>

                        {selected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-400" />
                        )}
                      </div>

                      <h3 className="font-semibold mt-4 mb-1">
                        {role.label}
                      </h3>

                      <p className="text-sm text-slate-400">
                        {role.description}
                      </p>

                      <div
                        className={`mt-4 flex items-center gap-1 text-xs ${
                          selected
                            ? 'text-blue-400'
                            : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {selected ? 'Selected' : 'Select role'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!selectedRole || loading}
                className="mt-8 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Preparing Analysis...
                  </>
                ) : (
                  <>
                    Analyze My Resume
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {step === 'analyzing' && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-2xl p-8 sm:p-14 text-center">
              <div className="relative mx-auto w-28 h-28 mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 border-r-purple-400 animate-spin" />
                <div className="absolute inset-7 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Processing
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Analyzing Your Resume
              </h2>

              <p className="text-slate-400 max-w-lg mx-auto">
                Our AI is comparing your resume against the requirements
                for{' '}
                <span className="text-white font-medium">
                  {selectedRoleLabel}
                </span>
                .
              </p>

              <div className="mt-8 max-w-md mx-auto space-y-3 text-left">
                {[
                  'Extracting relevant skills',
                  'Matching role requirements',
                  'Identifying skill gaps',
                  'Generating recommendations',
                ].map((text, index) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      {index < 2 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      )}
                    </div>
                    <span className="text-sm text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && analysisResult && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Score card */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-2xl p-6 sm:p-10">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="relative w-44 h-44 shrink-0">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/10"
                    />

                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={
                        analysisResult.suitabilityScore >= 80
                          ? 'text-emerald-400'
                          : analysisResult.suitabilityScore >= 60
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                      strokeDasharray={`${analysisResult.suitabilityScore * 3.14} 314`}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">
                      {analysisResult.suitabilityScore}
                    </span>
                    <span className="text-xs text-slate-400">out of 100</span>
                  </div>
                </div>

                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 text-blue-400 mb-3">
                    <Target className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Resume Compatibility
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                    {getScoreLabel(analysisResult.suitabilityScore)}
                  </h2>

                  <p className="text-slate-400 mb-5">
                    Your resume suitability for{' '}
                    <span className="text-white font-medium">
                      {selectedRoleLabel}
                    </span>
                    .
                  </p>

                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
                    {getScoreIcon(analysisResult.suitabilityScore)}
                    AI-generated assessment
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-emerald-400/10 bg-emerald-500/[0.04] backdrop-blur-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Matched Skills</h3>
                    <p className="text-xs text-slate-500">
                      Skills that align with this role
                    </p>
                  </div>

                  <span className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    {analysisResult.matchedSkills.length}
                  </span>
                </div>

                {analysisResult.matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.matchedSkills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/10 text-emerald-300 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No matching skills detected.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-red-400/10 bg-red-500/[0.04] backdrop-blur-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>

                  <div>
                    <h3 className="font-semibold">Skill Gaps</h3>
                    <p className="text-xs text-slate-500">
                      Areas worth improving
                    </p>
                  </div>

                  <span className="ml-auto px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium">
                    {analysisResult.missingSkills.length}
                  </span>
                </div>

                {analysisResult.missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.missingSkills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-400/10 text-red-300 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-emerald-400">
                    Great! No major skill gaps detected.
                  </p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div className="rounded-3xl border border-yellow-400/10 bg-yellow-500/[0.04] backdrop-blur-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      AI Recommendations
                    </h3>
                    <p className="text-xs text-slate-500">
                      Suggestions to improve your resume
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5"
                    >
                      <span className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </span>

                      <p className="text-sm text-slate-300 leading-relaxed">
                        {recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interview CTA */}
            <div className="rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-transparent backdrop-blur-xl p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Ready for the next step?
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2">
                    Put your resume to the test
                  </h3>

                  <p className="text-slate-400 text-sm max-w-xl">
                    Start an AI-powered mock interview tailored to your
                    resume and target role.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <button
                    onClick={handleStartWithResume}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Start With Resume
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleStartWithoutResume}
                    className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-medium text-slate-300 transition-all"
                  >
                    Without Resume
                  </button>
                </div>
              </div>
            </div>

            {/* Analyze again */}
            <button
              onClick={() => {
                setStep('selectRole');
                setAnalysisResult(null);
              }}
              className="w-full py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 transition-all text-sm"
            >
              Analyze for a Different Role
            </button>
          </div>
        )}
      </main>
    </div>
  );
}