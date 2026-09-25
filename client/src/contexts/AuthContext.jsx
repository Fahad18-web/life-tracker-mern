import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getProfile } from '../api/authAPI';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('lt_user')) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lt_token');
    if (token) {
      getProfile()
        .then(res => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    localStorage.setItem('lt_token', res.data.token);
    localStorage.setItem('lt_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    toast.success(`Welcome back, ${res.data.user.name}! 🌿`);
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    localStorage.setItem('lt_token', res.data.token);
    localStorage.setItem('lt_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    toast.success(`Account created! Welcome, ${res.data.user.name} 🎉`);
  };

  const logout = () => {
    localStorage.removeItem('lt_token');
    localStorage.removeItem('lt_user');
    setUser(null);
    toast('Logged out successfully', { icon: '👋' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
