import api from './axiosInstance';

export const fetchPairs  = ()     => api.get('/habit-replacements');
export const createPair  = (data) => api.post('/habit-replacements', data);
export const deletePair  = (id)   => api.delete(`/habit-replacements/${id}`);