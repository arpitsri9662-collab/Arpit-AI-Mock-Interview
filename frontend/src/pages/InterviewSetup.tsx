import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resumeAPI, interviewAPI } from '../services/api';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Cloud,
  Code2,
  Database,
  Layers3,
  LineChart,
  Monitor,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Target,
  Upload,
  UserRound,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';

type Step = 'resume' | 'jobRole' | 'interviewType' | 'difficulty' | 'confirm';
type InterviewType = 'technical' | 'hr' | 'combine';
type Difficulty = 'easy' | 'medium' | 'hard';
type JobRole = 'frontend' | 'backend' | 'fullstack' | 'mern' | 'mevn' | 'dse' | 'da' | 'ds' | 'mobile' | 'devops' | 'qa';

export default function InterviewSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialStep = location.state?.resumeId ? 'interviewType' : 'resume';
  
  const [step, setStep] = useState<Step>(initialStep as Step);
  const [resumeId, setResumeId] = useState<string | null>(location.state?.resumeId || null);
  const [selectedJobRole, setSelectedJobRole] = useState<JobRole>(location.state?.jobRole || 'fullstack');
  const [selectedInterviewType, setSelectedInterviewType] = useState<InterviewType>('technical');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobRoles: { id: JobRole; label: string; icon: ReactNode; description: string }[] = [
    { id: 'frontend', label: 'Frontend Developer', icon: <Monitor className="h-6 w-6" />, description: 'React, Vue, Angular' },
    { id: 'backend', label: 'Backend Developer', icon: <ServerCog className="h-6 w-6" />, description: 'Node, Python, Java' },
    { id: 'fullstack', label: 'Full Stack Developer', icon: <Layers3 className="h-6 w-6" />, description: 'Frontend + Backend' },
    { id: 'mern', label: 'MERN Stack', icon: <Code2 className="h-6 w-6" />, description: 'MongoDB, Express, React, Node' },
    { id: 'mevn', label: 'MEVN Stack', icon: <Database className="h-6 w-6" />, description: 'MongoDB, Express, Vue, Node' },
    { id: 'mobile', label: 'Mobile Developer', icon: <Smartphone className="h-6 w-6" />, description: 'React Native, Flutter' },
    { id: 'dse', label: 'Data Science Engineer', icon: <BarChart3 className="h-6 w-6" />, description: 'Python, ML, Analytics' },
    { id: 'da', label: 'Data Analyst', icon: <LineChart className="h-6 w-6" />, description: 'SQL, Analytics, BI Tools' },
    { id: 'ds', label: 'DevOps/SRE', icon: <ShieldCheck className="h-6 w-6" />, description: 'Docker, K8s, Cloud' },
    { id: 'devops', label: 'Cloud Engineer', icon: <Cloud className="h-6 w-6" />, description: 'AWS, Azure, GCP' },
    { id: 'qa', label: 'QA Engineer', icon: <Target className="h-6 w-6" />, description: 'Testing, Automation' },
  ];

  const interviewTypes: { id: InterviewType; label: string; icon: ReactNode; description: string }[] = [
    { id: 'technical', label: 'Technical Interview', icon: <Code2 className="h-7 w-7" />, description: 'DSA, System Design, Database' },
    { id: 'hr', label: 'HR Interview', icon: <UserRound className="h-7 w-7" />, description: 'Soft skills & behavioral' },
    { id: 'combine', label: 'Combined', icon: <Users className="h-7 w-7" />, description: 'Both technical and HR' },
  ];
  const difficulties: { id: Difficulty; label: string; description: string }[] = [
    { id: 'easy', label: 'Easy', description: 'Beginner level' },
    { id: 'medium', label: 'Medium', description: 'Intermediate level' },
    { id: 'hard', label: 'Hard', description: 'Expert level' },
  ];

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await resumeAPI.upload(formData);
      setResumeId(res.data.resume._id);
      setStep('jobRole');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleContinueWithoutResume = () => {
    setResumeId(null);
    setStep('jobRole');
  };

  const handleStartInterview = async () => {
    setStarting(true);
    setError(null);

    try {
      const response = await interviewAPI.start(resumeId || undefined, 45, {
        jobRole: selectedJobRole,
        interviewType: selectedInterviewType,
        difficulty: selectedDifficulty,
      });
      const interviewId = response.data.interview._id || response.data.interview.id;
      navigate(`/interview/${interviewId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to start interview');
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-3">
            Interview Setup
          </h1>
          <p className="text-white/70 text-lg">Customize your interview experience</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Step 1: Resume */}
        {step === 'resume' && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Step 1: Resume (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!resumeId ? (
                <>
                  <div className="border-2 border-dashed border-white/30 rounded-xl p-12 text-center hover:border-white/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={uploading}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="cursor-pointer flex flex-col items-center gap-4"
                    >
                      <Upload className="w-12 h-12 text-cyan-400" />
                      <div>
                        <p className="text-white font-semibold mb-1">Upload Resume</p>
                        <p className="text-white/60 text-sm">PDF or DOCX format</p>
                      </div>
                      {uploading && <p className="text-blue-400 text-sm">Uploading and parsing...</p>}
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-slate-900 text-white/60">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleContinueWithoutResume}
                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30 h-12"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Continue Without Resume
                  </Button>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-emerald-500/20 border border-emerald-500/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-300 font-semibold mb-2">Resume Uploaded</p>
                        <p className="text-white/70 text-sm">Questions will be customized based on your resume</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-emerald-300" />
                    </div>
                  </motion.div>

                  <Button
                    onClick={() => setStep('jobRole')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-semibold"
                  >
                    Continue with Resume
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Role Selection */}
        {/* Step 2: Job Role Selection */}
        {step === 'jobRole' && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Step 2: Job Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {jobRoles.map((role) => (
                  <motion.div
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedJobRole(role.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedJobRole === role.id
                        ? 'bg-blue-500/20 border-blue-400/80 shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-cyan-300">{role.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm">{role.label}</h3>
                        <p className="text-white/60 text-xs">{role.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => setStep('interviewType')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-12"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Interview Type Selection */}
        {step === 'interviewType' && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Step 3: Interview Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {interviewTypes.map((type) => (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedInterviewType(type.id)}
                    className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedInterviewType === type.id
                        ? 'bg-cyan-500/20 border-cyan-400/80 shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="text-cyan-300">{type.icon}</div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{type.label}</h3>
                          <p className="text-white/60 text-sm">{type.description}</p>
                        </div>
                      </div>
                      {selectedInterviewType === type.id && (
                        <Badge className="bg-cyan-400 text-slate-900">Selected</Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => setStep('difficulty')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-12"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Difficulty Selection */}
        {step === 'difficulty' && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Step 4: Difficulty Level</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {difficulties.map((diff) => (
                  <motion.div
                    key={diff.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedDifficulty(diff.id as Difficulty)}
                    className={`p-6 rounded-xl border-2 transition-all cursor-pointer text-center ${
                      selectedDifficulty === diff.id
                        ? 'bg-purple-500/20 border-purple-400/80'
                        : 'bg-white/5 border-white/20 hover:border-white/40'
                    }`}
                  >
                    <Zap className={`w-8 h-8 mx-auto mb-3 ${
                      diff.id === 'easy' ? 'text-yellow-400' :
                      diff.id === 'medium' ? 'text-orange-400' :
                      'text-red-400'
                    }`} />
                    <h3 className="text-white font-semibold mb-1">{diff.label}</h3>
                    <p className="text-white/60 text-sm">{diff.description}</p>
                  </motion.div>
                ))}
              </div>

              <Button
                onClick={() => setStep('confirm')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-12"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Confirmation */}
        {step === 'confirm' && (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Ready to Start?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/20">
                  <p className="text-white/60 text-sm mb-1">Job Role</p>
                  <p className="text-white font-semibold capitalize">{selectedJobRole}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-white/20">
                  <p className="text-white/60 text-sm mb-1">Interview Type</p>
                  <p className="text-white font-semibold capitalize">{selectedInterviewType}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border border-white/20">
                  <p className="text-white/60 text-sm mb-1">Difficulty Level</p>
                  <p className="text-white font-semibold capitalize">{selectedDifficulty}</p>
                </div>

                {resumeId && (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/20">
                    <p className="text-white/60 text-sm mb-1">Resume</p>
                    <p className="text-white font-semibold">Uploaded</p>
                  </div>
                )}

                <div className="p-4 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Volume2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">Recording Ready</p>
                      <p className="text-white/70 text-sm">Video, voice, and screen recording will start automatically</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setStep('difficulty')}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={handleStartInterview}
                  disabled={starting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-12"
                >
                  {starting ? 'Starting...' : 'Start Interview'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center gap-2">
          {(['resume', 'jobRole', 'interviewType', 'difficulty', 'confirm'] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                step === s ? 'bg-cyan-400 w-8' :
                (['resume', 'jobRole', 'interviewType', 'difficulty', 'confirm'].indexOf(s) < 
                 ['resume', 'jobRole', 'interviewType', 'difficulty', 'confirm'].indexOf(step)
                  ? 'bg-cyan-400/50 w-4'
                  : 'bg-white/20 w-4')
              }`}
            ></div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

