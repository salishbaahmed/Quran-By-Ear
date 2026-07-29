/**
 * api.ts — Simplified auth helpers only.
 * All Quran data fetching has moved to lib/quranApi.ts.
 * Authentication is now handled by Supabase (lib/supabase.ts).
 */

const STORAGE_KEY_TOKEN = 'qbe_token';

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
}
