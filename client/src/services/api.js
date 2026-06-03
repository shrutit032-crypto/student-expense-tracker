import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getProfile = () => api.get('/auth/profile');

// Expenses
export const getCategories = () => api.get('/expenses/categories');
export const addExpense = (data) => api.post('/expenses', data);
export const getExpenses = (params) => api.get('/expenses', { params });
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// Budgets
export const setBudget = (data) => api.post('/budgets', data);
export const getBudgets = (params) => api.get('/budgets', { params });
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

// Dashboard
export const getDashboardSummary = (params) => api.get('/dashboard/summary', { params });

// AI Insights
export const getAIInsights = () => api.get('/ai/insights');

export default api;
