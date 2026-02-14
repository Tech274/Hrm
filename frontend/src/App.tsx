import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import CandidatesList from './pages/CandidatesList';
import CreateCandidate from './pages/CreateCandidate';
import CandidateProfile from './pages/CandidateProfile';
import FeedbackForm from './pages/FeedbackForm';
import OfferValidation from './pages/OfferValidation';
import AuditLog from './pages/AuditLog';
import AdminPanel from './pages/AdminPanel';
import Policies from './pages/Policies';
import DraftAssistant from './pages/DraftAssistant';
import Team from './pages/Team';
import People from './pages/People';
import Tasks from './pages/Tasks';
import Performance from './pages/Performance';
import Exit from './pages/Exit';
import Alerts from './pages/Alerts';
import Calendar from './pages/Calendar';
import KnowledgeBase from './pages/KnowledgeBase';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="candidates" element={<CandidatesList />} />
        <Route path="candidates/new" element={<CreateCandidate />} />
        <Route path="candidates/:id" element={<CandidateProfile />} />
        <Route path="candidates/:id/feedback/:interviewId" element={<FeedbackForm />} />
        <Route path="candidates/:id/offer" element={<OfferValidation />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="policies" element={<Policies />} />
        <Route path="drafts" element={<DraftAssistant />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="team" element={<Team />} />
        <Route path="performance" element={<Performance />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="exit" element={<Exit />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="people" element={<People />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
