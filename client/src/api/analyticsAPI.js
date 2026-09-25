import api from './axiosInstance';

export const getWeekly  = () => api.get('/analytics/weekly');
export const getMonthly = () => api.get('/analytics/monthly');
export const getStreaks = () => api.get('/analytics/streaks');