import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loader">Checking authentication…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.emailVerified) {
    const q = user.email ? `?email=${encodeURIComponent(user.email)}` : '';
    return <Navigate to={`/check-email${q}`} replace />;
  }

  const onOnboarding = location.pathname === '/onboarding';

  if (!user.onboardingCompleted && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.onboardingCompleted && onOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}