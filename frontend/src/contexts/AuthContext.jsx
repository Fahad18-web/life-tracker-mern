import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getProfile } from '../api/authAPI';
import toast from 'react-hot-toast';
import { useTheme } from './ThemeContext';
import {
  getToken,
  getStoredUser,
  persistSession,
  clearSession,
  updateStoredUser
} from '../utils/sessionStorage';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const { applyFromPreferences } = useTheme();

  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getProfile()
      .then((res) => {
        const next = res.data.user;
        setUser(next);
        updateStoredUser(next);
        if (next?.preferences) applyFromPreferences(next.preferences);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [applyFromPreferences]);

  const login = async (email, password, rememberMe = true) => {
    const res = await loginUser({ email, password, rememberMe });
    const { token, user: next, rememberMe: persist } = res.data;
    const shouldRemember = persist !== undefined ? persist : Boolean(rememberMe);

    persistSession(token, next, shouldRemember);
    setUser(next);
    if (next?.preferences) applyFromPreferences(next.preferences);
    toast.success(`Welcome back, ${next.name}!`);
    return next;
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    const data = res.data;

    if (data.requiresVerification) {
      toast.success(data.message || 'Check your email to verify your account.');
      return data;
    }

    if (data.token && data.user) {
      persistSession(data.token, data.user, true);
      setUser(data.user);
      if (data.user?.preferences) applyFromPreferences(data.user.preferences);
      toast.success(`Welcome, ${data.user.name}!`);
    }
    return data;
  };

  const completeVerification = useCallback(
    (token, nextUser, rememberMe = false) => {
      persistSession(token, nextUser, rememberMe);
      setUser(nextUser);
      if (nextUser?.preferences) applyFromPreferences(nextUser.preferences);
    },
    [applyFromPreferences]
  );

  const logout = () => {
    clearSession();
    setUser(null);
    toast('Logged out successfully', { icon: '👋' });
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    updateStoredUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        completeVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};