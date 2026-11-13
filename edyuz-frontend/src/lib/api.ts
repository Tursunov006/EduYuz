import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz.onrender.com/api/v1';

axios.defaults.baseURL = API_URL;

// Login talab qilmaydigan (o'quvchi/ota-ona va ochiq) sahifalar
const PUBLIC_PATH_PREFIXES = ['/login', '/portal', '/app', '/insta', '/verify', '/anketa'];

function isPublicPage(): boolean {
  if (typeof window === 'undefined') return true;
  const path = window.location.pathname;
  return PUBLIC_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Token muddati tugagan yoki yaroqsiz bo'lsa (401): sessiyani tozalab, login sahifasiga qaytarish.
 * Avval bunday holatda sahifalar jimgina bo'sh ko'rinib qolardi.
 */
export function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  const hadToken = Boolean(localStorage.getItem('token'));
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (hadToken && !isPublicPage()) {
    window.location.href = '/login';
  }
}

// Backend xatoni "error" maydonida qaytaradi; sahifalar esa "message" ni o'qiydi.
// Ikkalasini bir xil ko'rinishga keltiramiz (validatsiya xatolari massiv bo'lishi mumkin).
function normalizeErrorMessage(data: any): string | undefined {
  const raw = data?.message ?? data?.error;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string') return raw;
  return undefined;
}

declare global {
  interface Window {
    __eduyuzAxiosReady?: boolean;
  }
}

// Interceptorlar faqat bir marta ro'yxatdan o'tadi (avval ikki joyda takrorlangan edi)
if (typeof window !== 'undefined' && !window.__eduyuzAxiosReady) {
  window.__eduyuzAxiosReady = true;

  axios.interceptors.request.use((config) => {
    // Eski kodda qolgan localhost manzillarini haqiqiy API manziliga yo'naltirish
    if (config.url && config.url.includes('http://localhost:3000/api/v1')) {
      config.url = config.url.replace('http://localhost:3000/api/v1', API_URL);
    }
    // Token faqat o'z API'mizga yuboriladi (uchinchi tomon manzillariga sizib chiqmasligi uchun)
    const isOwnApi = !config.url || !/^https?:\/\//i.test(config.url) || config.url.startsWith(API_URL);
    const token = localStorage.getItem('token');
    if (token && isOwnApi && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const data = error?.response?.data;
      if (data && typeof data === 'object') {
        const message = normalizeErrorMessage(data);
        if (message) data.message = message;
      }
      if (error?.response?.status === 401) {
        handleUnauthorized();
      }
      return Promise.reject(error);
    },
  );
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
    if (res.status === 401) {
      handleUnauthorized();
    }
    throw new Error(normalizeErrorMessage(error) || 'Xatolik yuz berdi');
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
