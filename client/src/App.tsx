import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ProgramsPage from './pages/ProgramsPage';
import CreateProgramPage from './pages/CreateProgramPage';
import ProgramDetailsPage from './pages/ProgramDetailsPage';
import ActiveWorkoutPage from './pages/ActiveWorkoutPage';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage';
import WorkoutDetailsPage from './pages/WorkoutDetailsPage';
import ExerciseProgressPage from './pages/ExerciseProgressPage';
import PersonalRecordsPage from './pages/PersonalRecordsPage';
import ProfilePage from './pages/ProfilePage';
import { MainLayout } from './components/layout';

// Check if JWT is expired (client-side, no API call)
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // Parse failure = treat as expired
  }
};

// Protected route with loading guard - prevents flash of content before auth check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token || isTokenExpired(token)) {
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Global App Layout - ensures consistent dark background across all routes
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-950">
      {children}
    </div>
  );
};

// Authenticated Layout - includes SmartNavbar
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute>
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated Routes with MainLayout */}
          <Route
            path="/dashboard"
            element={
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/exercises"
            element={
              <AuthenticatedLayout>
                <ExerciseLibrary />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/programs"
            element={
              <AuthenticatedLayout>
                <ProgramsPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/programs/new"
            element={
              <AuthenticatedLayout>
                <CreateProgramPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/programs/:id"
            element={
              <AuthenticatedLayout>
                <ProgramDetailsPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/workout/active"
            element={
              <AuthenticatedLayout>
                <ActiveWorkoutPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/workout/history"
            element={
              <AuthenticatedLayout>
                <WorkoutHistoryPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/workout/:id"
            element={
              <AuthenticatedLayout>
                <WorkoutDetailsPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/exercise/:exerciseId/progress"
            element={
              <AuthenticatedLayout>
                <ExerciseProgressPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/personal-records"
            element={
              <AuthenticatedLayout>
                <PersonalRecordsPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthenticatedLayout>
                <ProfilePage />
              </AuthenticatedLayout>
            }
          />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App

