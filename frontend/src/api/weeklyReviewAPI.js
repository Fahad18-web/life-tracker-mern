import api from './axiosInstance';

export const fetchWeeklyReview = (weekStart) =>
  api.get('/weekly-reviews', {
    params: weekStart ? { weekStart } : undefined
  });

export const fetchWeeklyReviewHistory = (limit = 12) =>
  api.get('/weekly-reviews/history', { params: { limit } });

export const saveWeeklyReview = (weekStart, body) =>
  api.put(`/weekly-reviews/${weekStart}`, body);