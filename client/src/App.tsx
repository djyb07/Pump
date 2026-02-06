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
import { MainLayout } from './components/layout';

// Simple protected route check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
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
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App

