const TOKEN_KEY = 'easter-token';

export const apiBase = '/api';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const guestId = () => {
  const key = 'easter-guest-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
};
export const setToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const request = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(!(options.body instanceof FormData) && options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined)
  };
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    body: options.body instanceof FormData ? options.body : options.body,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error || 'Request failed', res.status);
  return data as T;
};

export const pingApi = async () => {
  const res = await fetch(`${apiBase}/health`);
  if (!res.ok) throw new Error('offline');
  return res.json();
};
