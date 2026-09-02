import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI } from '../services/api';

type Step = 'upload' | 'selectRole' | 'analyzing' | 'results' | 'startInterview';
type JobRole = 'frontend' | 'backend' | 'fullstack' | 'mern' | 'mevn' | 'mobile' | 'dse' | 'da' | 'ds' | 'devops' | 'qa';



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

  const jobRoles: { id: JobRole; label: string; description: string }[] = [
    { id: 'frontend', label: 'Frontend Developer', description: 'React, Vue, Angular' },
    { id: 'backend', label: 'Backend Developer', description: 'Node, Python, Java' },
    { id: 'fullstack', label: 'Full Stack Developer', description: 'Frontend + Backend' },
    { id: 'mern', label: 'MERN Stack', description: 'MongoDB, Express, React, Node' },
    { id: 'mevn', label: 'MEVN Stack', description: 'MongoDB, Express, Vue, Node' },
    { id: 'mobile', label: 'Mobile Developer', description: 'React Native, Flutter' },
    { id: 'dse', label: 'Data Science Engineer', description: 'Python, ML, Analytics' },
    { id: 'da', label: 'Data Analyst', description: 'SQL, Analytics, BI Tools' },
    { id: 'ds', label: 'DevOps/SRE', description: 'Docker, K8s, Cloud' },
    { id: 'devops', label: 'Cloud Engineer', description: 'AWS, Azure, GCP' },
    { id: 'qa', label: 'QA Engineer', description: 'Testing, Automation' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
      setMessage((error as any).response?.data?.message || 'Error uploading resume');
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
      const response = await resumeAPI.analyze(uploadedResumeId, selectedRole);
      setAnalysisResult(response.data.analysis);
      setStep('results');
    } catch (error) {
      setMessage((error as any).response?.data?.message || 'Error analyzing resume');
      setStep('selectRole');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWithResume = () => {
    navigate('/interview', { state: { resumeId: uploadedResumeId } });
  };

  const handleStartWithoutResume = () => {
    navigate('/interview');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold">PrepVerse - Resume Analysis</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-700 hover:text-blue-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white p-8 rounded-lg shadow">

          {step === 'upload' && (
            <>
              <h2 className="text-2xl font-bold mb-6">Upload Your Resume</h2>
              <p className="text-gray-600 mb-6">
                Upload your resume (PDF or DOCX) to analyze it for specific job roles.
              </p>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Resume File
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded p-2"
                />
                <p className="text-sm text-gray-500 mt-1">Accepted formats: PDF, DOCX (Max 5MB)</p>
              </div>

              {file && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="text-blue-700">Selected: {file.name}</p>
                </div>
              )}

              {message && (
                <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
                  {message}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </>
          )}

          {step === 'selectRole' && (
            <>
              <h2 className="text-2xl font-bold mb-6">Select Role for Analysis</h2>
              <p className="text-gray-600 mb-6">
                Choose the job role you want to analyze your resume for.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {jobRoles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 border-2 rounded cursor-pointer transition-colors ${
                      selectedRole === role.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <h3 className="font-semibold">{role.label}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!selectedRole || loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </>
          )}

          {step === 'analyzing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing your resume...</p>
            </div>
          )}

          {step === 'results' && analysisResult && (
            <>
              <h2 className="text-2xl font-bold mb-6">Resume Analysis Results</h2>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-white text-2xl font-bold ${
                    analysisResult.suitabilityScore >= 80 ? 'bg-green-500' :
                    analysisResult.suitabilityScore >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {analysisResult.suitabilityScore}%
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    Suitability for {jobRoles.find(r => r.id === selectedRole)?.label}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Matched Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.matchedSkills.map((skill, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {analysisResult.missingSkills.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Missing Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.missingSkills.map((skill, index) => (
                        <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Start Your Mock Interview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleStartWithResume}
                    className="bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700"
                  >
                    With Resume
                  </button>
                  <button
                    onClick={handleStartWithoutResume}
                    className="bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-700"
                  >
                    Without Resume
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}