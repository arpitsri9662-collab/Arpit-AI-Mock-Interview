import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { ThemeProvider } from './components/theme-provider';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import ResumeUpload from './pages/ResumeUpload';
import Analytics from './pages/Analytics';
import InterviewResult from './pages/InterviewResult';
import InterviewSetup from './pages/InterviewSetup';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import DemoPage from './pages/DemoPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, checkToken, logout } = useAuthStore();

  useEffect(() => {
    // On mount, validate the token — if expired, logout immediately
    checkToken().then((valid) => {
      if (!valid && token) logout();
    });
  }, []);

  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  const { checkToken, startAutoLogout, token } = useAuthStore();

  useEffect(() => {
    checkToken();
    if (token) {
      startAutoLogout();
    }
  }, [checkToken, startAutoLogout, token]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="interview-ai-theme">
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/:id"
            element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumeUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview-result/:id"
            element={
              <ProtectedRoute>
                <InterviewResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
