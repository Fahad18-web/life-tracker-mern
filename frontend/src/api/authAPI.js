import api from './axiosInstance';

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getProfile = () => api.get('/auth/me');
export const updatePrefs = (data) => api.put('/auth/preferences', data);

export const verifyEmail = (token) =>
  api.post('/auth/verify-email', { token });

export const resendVerification = (email) =>
  api.post('/auth/resend-verification', { email });

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token, password) =>
  api.post('/auth/reset-password', { token, password });