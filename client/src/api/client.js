const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getGuestSessionId = () => {
  let sessionId = localStorage.getItem('blanc_guest_session');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('blanc_guest_session', sessionId);
  }
  return sessionId;
};

export const getAuthToken = () => {
  return localStorage.getItem('blanc_auth_token') || '';
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('blanc_auth_token', token);
  } else {
    localStorage.removeItem('blanc_auth_token');
  }
};

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();
  const sessionId = getGuestSessionId();

  const headers = {
    'x-guest-session': sessionId,
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type for FormData (file uploads)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const formatPrice = (paise) => {
  if (typeof paise !== 'number') return '₹0.00';
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
