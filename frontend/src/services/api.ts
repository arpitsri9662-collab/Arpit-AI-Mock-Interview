import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Auto-logout on 401 (expired / invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const store = useAuthStore.getState();
      if (store.token) {
        // Token was set but server rejected it — force logout
        store.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, role?: string) =>
    api.post('/auth/register', { email, password, name, role }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profile: Partial<Pick<User, 'name' | 'role'>>) =>
    api.patch('/auth/profile', profile),
  updateSettings: (settings: Partial<Pick<User, 'role'>>) =>
    api.patch('/auth/settings', settings),
};

export const resumeAPI = {
  upload: (formData: FormData) =>
    api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  analyze: (id: string, role: string) => api.post(`/resume/analyze/${id}`, { role }),
  getResume: (id: string) => api.get(`/resume/${id}`),
  getUserResumes: (userId: string) => api.get(`/resume/user/${userId}`),
  deleteResume: (id: string) => api.delete(`/resume/${id}`),
};

export const interviewAPI = {
  start: (
    resumeId?: string,
    duration?: number,
    options?: { jobRole?: string; interviewType?: string; difficulty?: string }
  ) =>
    api.post('/interview/start', { resumeId, duration, ...options }),
  getNextQuestion: (interviewId: string) =>
    api.get(`/interview/next-question/${interviewId}`),
  submitAnswer: (interviewId: string, answer: string) =>
    api.post(`/interview/submit-answer/${interviewId}`, { answer }),
  askFollowUp: (interviewId: string, answer: string) =>
    api.post(`/interview/follow-up/${interviewId}`, { answer }),
  endInterview: (interviewId: string, videoPath?: string, bodyLanguageData?: any) =>
    api.post(`/interview/end/${interviewId}`, { videoPath, bodyLanguageData }),
  getInterview: (id: string) => api.get(`/interview/${id}`),
  getUserInterviews: (userId: string) => api.get(`/interview/user/${userId}`),
  getTranscript: (id: string) => api.get(`/interview/transcript/${id}`),
};

export const videoAPI = {
  uploadChunk: (formData: FormData) =>
    api.post('/video/upload-chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  finalize: (interviewId: string, totalChunks: number) =>
    api.post('/video/finalize', { interviewId, totalChunks }),
  getVideoInfo: (id: string) => api.get(`/video/${id}`),
  downloadVideo: (id: string) => api.get(`/video/${id}/download`, { responseType: 'blob' }),
  analyzeBodyLanguage: (frameData: string) =>
    api.post('/video/analyze-body-language', { frameData }),
};

export const analyticsAPI = {
  getUserAnalytics: (userId: string) => api.get(`/analytics/${userId}`),
  getInterviewAnalytics: (id: string) => api.get(`/analytics/interview/${id}`),
};

export const demoAPI = {
  uploadRecording: (interviewId: string, video: Blob | string, duration: number) => {
    if (typeof video === 'string') {
      return api.post(`/demo/upload-recording/${interviewId}`, { videoBase64: video, duration }, {
        timeout: 600000,
      });
    }

    const formData = new FormData();
    // Re-wrap the blob with a clean video/webm MIME type
    // (MediaRecorder may produce types like "video/webm;codecs=vp9,opus" which confuse multer)
    const cleanBlob = new Blob([video], { type: 'video/webm' });
    formData.append('recording', cleanBlob, `interview-${interviewId}.webm`);
    formData.append('duration', String(duration));

    return api.post(`/demo/upload-recording/${interviewId}`, formData, {
      timeout: 600000,
    });
  },
  publish: (interviewId: string) => api.post(`/demo/publish/${interviewId}`),
  unpublish: (interviewId: string) => api.post(`/demo/unpublish/${interviewId}`),
  deleteRecording: (interviewId: string) => api.delete(`/demo/recording/${interviewId}`),
  getMyRecordings: () => api.get('/demo/my-recordings'),
  getPublicDemos: () => api.get('/demo/public'),
};

export default api;
