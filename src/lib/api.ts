// Dynamically resolve the backend base URL (Production fallback included)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://adventconnect-7jfq.onrender.com';

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = localStorage.getItem('token');
  const customHeaders = options.headers || {};

  // Smart Header Assignment: If body is FormData, do NOT set application/json
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...customHeaders,
    ...(token ? {
      'x-auth-token': token,
      'Authorization': `Bearer ${token}`
    } : {}),
  };

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    // 🚀 Now pointing to either Render URL or the explicit production fallback
    const response = await fetch(`${BASE_URL}/api${formattedEndpoint}`, {
      ...options,
      headers,
    });

    // 🛡️ REVISED AUTH GUARD: If backend returns 401, session is invalid!
    if (response.status === 401) {
      console.warn(`[API 401] Session invalid or expired on: /api${formattedEndpoint}`);
      
      // If we aren't already navigating to the login page, wipe stale data and redirect
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Unauthorized Session - Redirecting');
      }
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const parsedData = await response.json();

      // Normalize response so it matches component structures perfectly
      if (endpoint.includes('posts') && Array.isArray(parsedData) && !parsedData.posts) {
        return { posts: parsedData };
      }
      return parsedData;
    }

    return response;
  } catch (err) {
    // Graceful degradations for structural loops
    if (endpoint.includes('suggestions')) return [];
    if (endpoint.includes('posts')) return { posts: [] };
    throw err;
  }
};