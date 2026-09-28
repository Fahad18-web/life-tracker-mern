import api from './axiosInstance';

export const fetchCustomHabits  = ()     => api.get('/custom-habits');
export const createCustomHabit  = (data) => api.post('/custom-habits', data);
export const deleteCustomHabit  = (id)   => api.delete(`/custom-habits/${id}`);