import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Header from './components/layout/Header';
import NotificationBanner from './components/ui/NotificationBanner';
import EmailVerifyBanner from './components/ui/EmailVerifyBanner';
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

// Lazy load pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Log = lazy(() => import('./pages/Log'));
const History = lazy(() => import('./pages/History'));
const Trends = lazy(() => import('./pages/Trends'));
const ManageHabits = lazy(() => import('./pages/ManageHabits'));
const Profile = lazy(() => import('./pages/Profile'));
const HabitReplacementPage = lazy(() => import('./pages/HabitReplacementPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Settings = lazy(() => import('./pages/Settings'));

function InnerProviders({ children }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

function AppLayout({ children }) {
  return (
    <>
      <Header />
      <EmailVerifyBanner />
      <NotificationBanner />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </div>
    </>
  );
}

function PageLoader() {
  return <div className="page-loader">Loading…</div>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InnerProviders>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--color-success)',
                    secondary: 'var(--color-surface)',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'var(--color-danger)',
                    secondary: 'var(--color-surface)',
                  },
                },
              }}
            />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Protected */}
                <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/log" element={<ProtectedRoute><AppLayout><Log /></AppLayout></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><AppLayout><History /></AppLayout></ProtectedRoute>} />
                <Route path="/trends" element={<ProtectedRoute><AppLayout><Trends /></AppLayout></ProtectedRoute>} />
                <Route path="/habits" element={<ProtectedRoute><AppLayout><ManageHabits /></AppLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
                <Route path="/replacements" element={<ProtectedRoute><AppLayout><HabitReplacementPage /></AppLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </InnerProviders>
      </AuthProvider>
    </ThemeProvider>
  );
}