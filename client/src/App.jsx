import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster }               from 'react-hot-toast';
import { AuthProvider }          from './contexts/AuthContext';
import { ThemeProvider }         from './contexts/ThemeContext';
import { NotificationProvider }  from './contexts/NotificationContext';
import ProtectedRoute            from './components/ui/ProtectedRoute';
import Header                    from './components/layout/Header';
import NotificationBanner        from './components/ui/NotificationBanner';
import Login                     from './pages/auth/Login';
import Register                  from './pages/auth/Register';
import Dashboard                 from './pages/Dashboard';
import Log                       from './pages/Log';
import History                   from './pages/History';
import Trends                    from './pages/Trends';
import ManageHabits              from './pages/ManageHabits';
import Profile                   from './pages/Profile';
import HabitReplacementPage      from './pages/HabitReplacementPage';
import LandingPage               from './pages/LandingPage';

// NotificationProvider needs to be inside AuthProvider (uses useAuth internally)
function InnerProviders({ children }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
}

function AppLayout({ children }) {
  return (
    <>
      <Header />
      <NotificationBanner />
      <div className="content-wrapper">{children}</div>
    </>
  );
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
                  background: 'var(--bg-card)',
                  color:      'var(--text-primary)',
                  border:     '1px solid var(--border)',
                  fontFamily: 'var(--font)',
                  fontSize:   '14px',
                },
              }}
            />
            <Routes>
              {/* Public */}
              <Route path="/"         element={<LandingPage />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/log"       element={<ProtectedRoute><AppLayout><Log /></AppLayout></ProtectedRoute>} />
              <Route path="/history"   element={<ProtectedRoute><AppLayout><History /></AppLayout></ProtectedRoute>} />
              <Route path="/trends"    element={<ProtectedRoute><AppLayout><Trends /></AppLayout></ProtectedRoute>} />
              <Route path="/habits"    element={<ProtectedRoute><AppLayout><ManageHabits /></AppLayout></ProtectedRoute>} />
              <Route path="/profile"      element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
              <Route path="/replacements" element={<ProtectedRoute><AppLayout><HabitReplacementPage /></AppLayout></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </InnerProviders>
      </AuthProvider>
    </ThemeProvider>
  );
}