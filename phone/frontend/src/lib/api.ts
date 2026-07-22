const STORAGE_KEY_BASE_URL = 'qbe_api_base_url';
const STORAGE_KEY_TOKEN = 'qbe_token';
export const DEFAULT_API_BASE_URL = 'http://DESKTOP-85K359Q.local:4000';

export function getApiBaseUrl(): string {
  const stored = localStorage.getItem(STORAGE_KEY_BASE_URL);
  return stored && stored.trim() ? stored.trim() : DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_BASE_URL, url.trim());
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
}

export interface Reciter {
  id: string;
  name: string;
}

export async function signup(username: string, password: unknown): Promise<{ message?: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Signup failed (${res.status})`;
    throw new Error(errorMsg);
  }

  return data;
}

export async function login(username: string, password: unknown): Promise<{ accessToken: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Login failed (${res.status})`;
    throw new Error(errorMsg);
  }

  if (data?.accessToken) {
    setToken(data.accessToken);
  }

  return data;
}

export async function getReciters(onSessionExpired?: () => void): Promise<string[] | Reciter[]> {
  const baseUrl = getApiBaseUrl();
  const token = getToken();

  const res = await fetch(`${baseUrl}/api/reciters`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token || ''}`,
    },
  });

  // IMPORTANT: On 401 or 403 the server returns a bare status code with NO JSON body.
  // Do NOT call res.json() on 401 or 403.
  if (res.status === 401 || res.status === 403) {
    clearToken();
    if (onSessionExpired) {
      onSessionExpired();
    }
    throw new Error('Session expired, please log in again.');
  }

  if (!res.ok) {
    let errorText = `Failed to fetch reciters (${res.status})`;
    try {
      const errorData = await res.json();
      errorText = errorData?.error || errorData?.message || errorText;
    } catch {
      // Body not JSON or empty
    }
    throw new Error(errorText);
  }

  const rawText = await res.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error('Unexpected response shape from /api/reciters');
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object' && Array.isArray(data.reciters)) {
    return data.reciters;
  }

  throw new Error('Unexpected response shape from /api/reciters');
}

export function buildDownloadUrl(
  reciter: string,
  surah: number,
  startAyah: number,
  endAyah: number
): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/download?reciter=${encodeURIComponent(reciter)}&surah=${surah}&startAyah=${startAyah}&endAyah=${endAyah}`;
}
