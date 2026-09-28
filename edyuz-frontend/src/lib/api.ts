import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz.onrender.com/api/v1';

axios.defaults.baseURL = API_URL;

if (typeof window !== 'undefined') {
  axios.interceptors.request.use((config) => {
    if (config.url && config.url.includes('http://localhost:3000/api/v1')) {
      config.url = config.url.replace('http://localhost:3000/api/v1', API_URL);
    }
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Xatolik yuz berdi');
  }

  return res.json();
}

export const api = {
  get: async (endpoint: string) => {
    const data = await apiFetch(endpoint, { method: 'GET' });
    return { data };
  },
  post: async (endpoint: string, body?: any) => {
    const data = await apiFetch(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  patch: async (endpoint: string, body?: any) => {
    const data = await apiFetch(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  delete: async (endpoint: string) => {
    const data = await apiFetch(endpoint, { method: 'DELETE' });
    return { data };
  },
};

