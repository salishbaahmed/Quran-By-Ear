/**
 * Supabase client for Quran-By-Ear
 *
 * SETUP (one-time):
 * 1. Go to https://supabase.com → New Project (free)
 * 2. Go to Settings → API
 * 3. Copy "Project URL" and "anon/public" key below
 * 4. In the SQL Editor, run:
 *
 *    create table profiles (
 *      id uuid references auth.users primary key,
 *      username text unique not null,
 *      created_at timestamptz default now()
 *    );
 *    alter table profiles enable row level security;
 *    create policy "Users read own profile" on profiles for select using (auth.uid() = id);
 *    create policy "Users insert own profile" on profiles for insert with check (auth.uid() = id);
 *
 *    create table play_events (
 *      id bigserial primary key,
 *      user_id uuid references auth.users not null,
 *      surah_num int not null,
 *      reciter_id int not null,
 *      start_ayah int not null,
 *      end_ayah int not null,
 *      duration_seconds int default 0,
 *      played_at timestamptz default now()
 *    );
 *    alter table play_events enable row level security;
 *    create policy "Users insert own events" on play_events for insert with check (auth.uid() = user_id);
 *    create policy "Users read own events" on play_events for select using (auth.uid() = user_id);
 */

import { createClient } from '@supabase/supabase-js';

// ── REPLACE THESE with your Supabase project values ──────────────────────────
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
// ─────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'qbe_supabase_session',
  },
});

/** Returns the current user's UUID synchronously from the cached session, or null */
export function getCurrentUserId(): string | null {
  // Supabase caches the session; access it synchronously via the internal store
  // For async usage, call: const { data } = await supabase.auth.getUser()
  return null; // placeholder — replace with supabase.auth.getUser() where needed
}

/** Log a play event (fire-and-forget, non-blocking) */
export async function logPlayEvent(
  userId: string,
  surahNum: number,
  reciterId: number,
  startAyah: number,
  endAyah: number,
  durationSeconds: number,
): Promise<void> {
  try {
    await supabase.from('play_events').insert({
      user_id: userId,
      surah_num: surahNum,
      reciter_id: reciterId,
      start_ayah: startAyah,
      end_ayah: endAyah,
      duration_seconds: durationSeconds,
    });
  } catch {
    // Non-critical — silently fail if offline
  }
}
