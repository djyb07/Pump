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

// Simple protected route check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercises"
          element={
            <ProtectedRoute>
              <ExerciseLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <ProgramsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs/new"
          element={
            <ProtectedRoute>
              <CreateProgramPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs/:id"
          element={
            <ProtectedRoute>
              <ProgramDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout/active"
          element={
            <ProtectedRoute>
              <ActiveWorkoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout/history"
          element={
            <ProtectedRoute>
              <WorkoutHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout/:id"
          element={
            <ProtectedRoute>
              <WorkoutDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercise/:exerciseId/progress"
          element={
            <ProtectedRoute>
              <ExerciseProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/personal-records"
          element={
            <ProtectedRoute>
              <PersonalRecordsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App
