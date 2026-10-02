import api from './axiosInstance';

export const fetchProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data);
export const changePassword = (data) => api.put('/users/change-password', data);
export const deleteAccount = (data) => api.delete('/users/account', { data });
export const completeOnboarding = () => api.post('/users/onboarding/complete');

export const exportMyData = (format = 'json') =>
  api.get('/users/export', {
    params: { format },
    responseType: 'blob'
  });