import api from './axiosInstance';

export const fetchEntries    = (page = 1) => api.get(`/entries?page=${page}`);
export const fetchEntryDate  = (date)     => api.get(`/entries/${date}`);
export const saveEntry       = (data)     => api.post('/entries', data);
export const deleteEntry     = (id)       => api.delete(`/entries/${id}`);

export const fetchWeekly     = ()  => api.get('/analytics/weekly');
export const fetchMonthly    = ()  => api.get('/analytics/monthly');
export const fetchStreaks     = ()  => api.get('/analytics/streaks');

export const fetchHabits     = ()  => api.get('/habits');
export const addHabit        = (data) => api.post('/habits', data);
export const deleteHabit     = (key) => api.delete(`/habits/${key}`);
