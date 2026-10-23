import api from './axiosInstance';

export const getFocus = (date) => api.get(`/focus/${date}`);

export const setFocus = (date, items) =>
  api.put(`/focus/${date}`, { items });

export const toggleFocusItem = (date, itemId, completed) =>
  api.patch(`/focus/${date}/items/${itemId}`, { completed });