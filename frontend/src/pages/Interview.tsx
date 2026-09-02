import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI, demoAPI } from '../services/api';
import { Interview as InterviewData, AnswerEvaluation } from '../types';
import { useBodyLanguageAnalysis } from '../hooks/useBodyLanguageAnalysis';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Mic,
  MicOff,
  ArrowRight,
  Award,
  Bot,
  Video,
  VideoOff,
  Send,
  Clock,
  MessageCircle,
  CheckCircle,
  Lightbulb,
  Target,
  User,
  Volume2,
  XCircle
} from "lucide-react"

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isRecording, setIsRecording] = useState(false);
  const [closingMessage, setClosingMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [conversation, setConversation] = useState<Array<{type: 'ai' | 'user', text: string}>>([]);
  const [listening, setListening] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recordingSaveError, setRecordingSaveError] = useState(false);
  const [recordingSaveErrorMessage, setRecordingSaveErrorMessage] = useState('');
  const [endingInterview, setEndingInterview] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fullRecordingChunksRef = useRef<Blob[]>([]);
  const fullMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeRef = useRef(0);
  const endingInterviewRef = useRef(false);

  // Body language analysis (MediaPipe)
  const { initialize: initBodyAnalysis, startAnalysis: startBodyAnalysis, stopAnalysis: stopBodyAnalysis } = useBodyLanguageAnalysis();

  useEffect(() => {
    loadInterview();
    startCamera();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
      void stopFullRecording();
      stopCamera();
      speechSynthesis.cancel();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [loading, currentQuestion]);

  // Ref to track whether the user intentionally stopped voice input
  const manualStopRef = useRef(false);
  // Ref to hold the confirmed (final) transcript so far
  const confirmedTranscriptRef = useRef('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Append any newly finalised text to the confirmed buffer
        if (finalTranscript) {
          confirmedTranscriptRef.current += finalTranscript;
        }

        // Show confirmed text + whatever is being spoken right now
        setAnswer(confirmedTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        // Ignore 'no-speech' & 'aborted' — these happen naturally during pauses
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        console.error('Speech recognition error:', event.error);
        setListening(false);
        manualStopRef.current = true;
      };

      // Auto-restart when recognition ends (e.g. browser auto-stops after silence)
      recognition.onend = () => {
        if (!manualStopRef.current) {
          // User didn't stop — keep listening
          try {
            recognition.start();
          } catch (_e) {
            // Already running — ignore
          }
        } else {
          setListening(false);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const loadInterview = async () => {
    try {
      const res = await interviewAPI.getInterview(id!);
      setInterview(res.data);
      if (res.data.questions[res.data.currentQuestionIndex]) {
        setCurrentQuestion(res.data.questions[res.data.currentQuestionIndex]);
        const q = res.data.questions[res.data.currentQuestionIndex];
        setConversation([{type: 'ai', text: q.question}]);
        speak(q.question);
      }
      setTimeLeft((res.data.duration || 45) * 60);
    } catch (error) {
      console.error('Error loading interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      // Check if media devices are supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera and microphone access is not supported in this browser. Please use a modern browser like Chrome or Firefox.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize body language analysis and start tracking
      await initBodyAnalysis();
      if (videoRef.current) {
        startBodyAnalysis(videoRef.current);
      }

      // Start full interview recording automatically
      startFullRecording(stream);
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera and microphone. ';

      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera and microphone access is not supported.';
      } else {
        errorMessage += 'Please check your device settings and try again.';
      }

      alert(errorMessage);
    }
  };

  const stopCamera = () => {
    const stream = streamRef.current || (videoRef.current?.srcObject as MediaStream | null);

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    const nextEnabled = !cameraEnabled;
    streamRef.current?.getVideoTracks().forEach(track => {
      track.enabled = nextEnabled;
    });
    setCameraEnabled(nextEnabled);
  };

  const toggleMic = () => {
    const nextEnabled = !micEnabled;
    streamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = nextEnabled;
    });
    setMicEnabled(nextEnabled);
  };

  // Full interview recording (runs entire session, uploaded to Cloudinary at end)
  const startFullRecording = (stream: MediaStream) => {
    try {
      if (!('MediaRecorder' in window)) {
        alert('Video recording is not supported in this browser. Please use Chrome or Firefox.');
        return;
      }

      if (fullMediaRecorderRef.current && fullMediaRecorderRef.current.state !== 'inactive') {
        return;
      }

      const mimeType = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ].find((type) => MediaRecorder.isTypeSupported(type));

      fullRecordingChunksRef.current = [];
      const recorderOptions: MediaRecorderOptions = {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 450_000,
        audioBitsPerSecond: 64_000,
      };
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          fullRecordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('Full interview recorder error:', event);
        setIsRecording(false);
      };

      fullMediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every 1 second
      setIsRecording(true);

      // Start recording timer
      recordingTimeRef.current = 0;
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);

      console.log('Full interview recording started');
    } catch (e) {
      console.error('Failed to start full recording:', e);
    }
  };

  const stopFullRecording = (): Promise<Blob | null> => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recorder = fullMediaRecorderRef.current;

    return new Promise((resolve) => {
      const finish = () => {
        fullMediaRecorderRef.current = null;
        setIsRecording(false);
        const blob = fullRecordingChunksRef.current.length > 0
          ? new Blob(fullRecordingChunksRef.current, { type: fullRecordingChunksRef.current[0]?.type || 'video/webm' })
          : null;
        resolve(blob);
      };

      if (!recorder || recorder.state === 'inactive') {
        finish();
        return;
      }

      recorder.addEventListener('stop', finish, { once: true });
      try {
        recorder.requestData();
      } catch (error) {
        console.error('Unable to request final recording data:', error);
      }
      recorder.stop();
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVoiceInput = () => {
    if (listening) {
      // User pressed stop — mark manual stop so onend doesn't restart
      manualStopRef.current = true;
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      // User pressed start — seed confirmed buffer with existing text
      manualStopRef.current = false;
      confirmedTranscriptRef.current = answer ? answer.trimEnd() + ' ' : '';
      try {
        recognitionRef.current?.start();
      } catch (_e) {
        // Already running — ignore
      }
      setListening(true);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);

    setConversation(prev => [...prev, {type: 'user', text: answer}]);

    try {
      const res = await interviewAPI.submitAnswer(id!, answer);
      setEvaluation(res.data.evaluation);
      setIsLastQuestion(res.data.isLastQuestion || false);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    setQuestionLoading(true);

    try {
      const res = await interviewAPI.getNextQuestion(id!);
      setAnswer('');
      setEvaluation(null);
      setShowFeedback(false);
      setCurrentQuestion(res.data.question);
      setInterview(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentQuestionIndex: res.data.currentIndex,
          questions: [...prev.questions, res.data.question],
        };
      });
      setConversation(prev => [...prev, {type: 'ai', text: res.data.question.question}]);
      speak(res.data.question.question);
    } catch (error) {
      console.error('Error getting next question:', error);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleEndInterview = async () => {
    if (endingInterviewRef.current) {
      return;
    }

    endingInterviewRef.current = true;
    setEndingInterview(true);
    setRecordingSaveError(false);
    setRecordingSaveErrorMessage('');

    const finalRecordingTime = recordingTimeRef.current;
    const recordingBlob = await stopFullRecording();

    // Stop body language analysis and get results
    const bodyLanguageData = stopBodyAnalysis();
    console.log('[BodyLanguage] Final results:', bodyLanguageData);

    stopCamera();
    speechSynthesis.cancel();

    try {
      const res = await interviewAPI.endInterview(id!, undefined, bodyLanguageData);
      setClosingMessage(res.data.closingMessage);

      // Auto-upload recording to Cloudinary
      if (recordingBlob && recordingBlob.size > 0) {
        setUploadingRecording(true);
        try {
          console.log(`Uploading recording (${(recordingBlob.size / 1024 / 1024).toFixed(2)} MB)...`);
          await demoAPI.uploadRecording(id!, recordingBlob, finalRecordingTime);
          console.log('Recording uploaded successfully!');
        } catch (uploadErr) {
          console.error('Recording upload failed:', uploadErr);
          const errorMessage = (uploadErr as any)?.response?.data?.message
            || (uploadErr as any)?.response?.data?.error
            || (uploadErr as any)?.message
            || 'Recording upload failed';
          setRecordingSaveErrorMessage(errorMessage);
          setRecordingSaveError(true);
        } finally {
          setUploadingRecording(false);
        }
      } else {
        setRecordingSaveErrorMessage('No recording data was captured by the browser.');
        setRecordingSaveError(true);
      }

      // Redirect only AFTER upload completes (success or failure)
      setTimeout(() => navigate(`/interview-result/${id}`), 2000);
    } catch (error) {
      console.error('Error ending interview:', error);
      setTimeout(() => navigate(`/interview-result/${id}`), 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (closingMessage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4"
      >
        <Card className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl max-w-lg w-full">
          <CardContent className="p-12 text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-8xl mb-6"
            >
              <Award className="mx-auto h-20 w-20 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-6 text-white">Interview Complete!</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-6">{closingMessage}</p>
            {uploadingRecording ? (
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/70 font-medium">Saving your recording...</p>
              </div>
            ) : recordingSaveError ? (
              <div className="text-center">
                <p className="text-amber-200 font-medium mb-2">Interview completed, but recording could not be saved.</p>
                {recordingSaveErrorMessage && (
                  <p className="mb-2 text-sm text-white/70">{recordingSaveErrorMessage}</p>
                )}
                <p className="text-white/70 font-medium">Redirecting to results...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-emerald-300 font-medium mb-2">Recording saved to your profile.</p>
                <p className="text-white/70 font-medium">Redirecting to results...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="relative mb-8"
          >
            <div className="w-24 h-24 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-purple-400 border-b-transparent rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2"
          >
            Setting up your interview...
          </motion.h2>
          <p className="text-white/70 text-lg">Preparing your AI interviewer</p>
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
        className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                PrepVerse
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/80">
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                Question {(interview?.currentQuestionIndex ?? 0) + 1} of 10
              </Badge>
              {/* Recording Timer */}
              {(isRecording || recordingTime > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2 bg-red-500/20 border border-red-400/30 text-red-300 px-3 py-1.5 rounded-full"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2.5 h-2.5 bg-red-500 rounded-full"
                  />
                  <span className="font-mono text-sm font-semibold">REC {formatRecordingTime(recordingTime)}</span>
                </motion.div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              disabled
              variant={isRecording ? "destructive" : "default"}
              className={`transition-all duration-300 ${isRecording ? 'bg-red-500 shadow-lg shadow-red-500/25' : 'bg-slate-500 shadow-lg shadow-slate-500/25'}`}
            >
              <Video className="mr-2 h-4 w-4" />
              {isRecording ? 'Auto Recording' : 'Recording Off'}
            </Button>
            <Button
              onClick={handleEndInterview}
              disabled={endingInterview}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {endingInterview ? 'Ending...' : 'End Interview'}
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[calc(100vh-120px)] lg:items-start">
          {/* Left Panel - AI Interaction */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 min-w-0"
          >
            {/* AI Avatar & Question */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <CardContent className="p-5 sm:p-6 lg:p-8 h-full max-h-none lg:max-h-[calc(100vh-150px)] overflow-y-auto flex flex-col">
                {/* AI Avatar */}
                <div className="flex items-center justify-center mb-8">
                  <motion.div
                    animate={isSpeaking ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-5xl shadow-2xl border-4 border-white/20">
                      <Bot className="h-16 w-16 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-emerald-400 w-6 h-6 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center">
                      <Mic className="h-3 w-3 text-white" />
                    </div>
                    {isSpeaking && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex space-x-1"
                      >
                        <div className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce" />
                        <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                        <div className="w-1 h-5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Question Display */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion?._id || currentQuestion?.question}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col"
                  >
                    <div className="bg-white/10 rounded-2xl p-5 sm:p-6 border border-white/20 mb-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <MessageCircle className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="max-h-[200px] overflow-y-auto pr-2">
                            <p className="text-white text-lg leading-relaxed mb-4 whitespace-pre-wrap">
                              {currentQuestion?.question}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                              {currentQuestion?.category}
                            </Badge>
                            <Badge
                              variant={currentQuestion?.difficulty === 'easy' ? 'success' : currentQuestion?.difficulty === 'medium' ? 'warning' : 'destructive'}
                              className="capitalize"
                            >
                              {currentQuestion?.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Answer Input */}
                <AnimatePresence>
                  {!showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here, or use voice input..."
                        className="w-full h-32 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-white/60 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 resize-none"
                      />

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={toggleVoiceInput}
                          variant={listening ? "destructive" : "secondary"}
                          className={`flex items-center gap-2 ${listening ? 'animate-pulse ring-2 ring-red-400/50' : ''}`}
                        >
                          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          {listening ? '🔴 Listening... (Stop)' : '🎤 Voice Input'}
                        </Button>

                        <Button
                          onClick={() => speak(currentQuestion?.question)}
                          variant="outline"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Volume2 className="mr-2 h-4 w-4" />
                          Read Question
                        </Button>

                        <Button
                          onClick={handleSubmitAnswer}
                          disabled={submitting || !answer.trim()}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-h-11"
                        >
                          {submitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Submitting...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Send className="h-4 w-4" />
                              Submit Answer
                            </div>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Feedback Display */}
                <AnimatePresence>
                  {showFeedback && evaluation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-5 pb-2"
                    >
                      {/* Score Card */}
                      <Card className="bg-gradient-to-r from-emerald-500 to-green-600 border-0 shadow-2xl">
                        <CardContent className="p-5 sm:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Your Score</h3>
                            <div className="text-4xl font-black text-white">{evaluation.score}/5</div>
                          </div>
                          <p className="text-white/95 text-lg">{evaluation.feedback}</p>
                        </CardContent>
                      </Card>

                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-1 gap-4">
                        <Card className="bg-white/10 backdrop-blur-sm border border-emerald-400/20">
                          <CardContent className="p-5">
                            <h4 className="text-emerald-300 font-bold mb-4 flex items-center gap-2">
                              <CheckCircle className="h-5 w-5" />
                              Strengths
                            </h4>
                            <ul className="space-y-2 text-white/90">
                              {evaluation.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-3">
                                  <span className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
                                  <span className="text-sm leading-relaxed">{s}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-sm border border-amber-400/20">
                          <CardContent className="p-5">
                            <h4 className="text-amber-300 font-bold mb-4 flex items-center gap-2">
                              <XCircle className="h-5 w-5" />
                              Areas to Improve
                            </h4>
                            <ul className="space-y-2 text-white/90">
                              {evaluation.improvements.map((imp, i) => (
                                <li key={i} className="flex items-start gap-3">
                                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                                  <span className="text-sm leading-relaxed">{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Follow-up Question */}
                      {evaluation.followUpQuestion && (
                        <Card className="bg-gradient-to-r from-blue-600/30 to-indigo-600/30 backdrop-blur-sm border border-blue-400/30">
                          <CardContent className="p-5">
                            <p className="text-blue-100 font-semibold flex items-start gap-2 leading-relaxed">
                              <Target className="h-5 w-5 shrink-0 mt-0.5" />
                              <span>Follow-up: {evaluation.followUpQuestion}</span>
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Next Action */}
                      <Button
                        onClick={isLastQuestion ? handleEndInterview : handleNextQuestion}
                        disabled={questionLoading || endingInterview}
                        className="sticky bottom-0 w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 py-4 text-base sm:text-lg font-bold shadow-2xl shadow-purple-950/30 min-h-14"
                      >
                        {questionLoading ? 'Loading next question...' : isLastQuestion ? 'Finish Interview' : 'Next Question'}
                        {!isLastQuestion && !questionLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Panel - User Video & Controls */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* User Video */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Your Camera
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleCamera}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleMic}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full shadow-lg"
                    />
                  )}
                  {!cameraEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <VideoOff className="h-12 w-12 text-white/50" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress & Status */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Interview Progress</span>
                    <span className="text-white font-semibold">
                      {(interview?.currentQuestionIndex ?? 0) + 1} / 10
                    </span>
                  </div>
                    <Progress
                      value={(((interview?.currentQuestionIndex ?? 0) + 1) / 10) * 100}
                      className="h-2"
                    />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">Interview Progress</span>
                    <span className="text-white font-semibold">
                      {(interview?.currentQuestionIndex ?? 0) + 1} / 10
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversation History */}
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex-1">
              <CardContent className="p-4 h-64">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversation
                </h3>
                <div className="space-y-3 overflow-y-auto h-full">
                  {conversation.slice(-5).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.type === 'ai' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg text-sm ${
                        msg.type === 'ai'
                          ? 'bg-blue-600/30 border border-blue-400/30 text-blue-200'
                          : 'bg-emerald-600/30 border border-emerald-400/30 text-emerald-200 ml-auto max-w-xs'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1">
                        <span className="inline-flex items-center gap-1">
                          {msg.type === 'ai' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {msg.type === 'ai' ? 'Interview AI' : 'You'}
                        </span>
                      </div>
                      {msg.text}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
