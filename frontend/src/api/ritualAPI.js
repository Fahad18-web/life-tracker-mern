import api from './axiosInstance';

export const getRitual = (date) => api.get(`/rituals/${date}`);

export const saveRitual = (date, body) => api.put(`/rituals/${date}`, body);