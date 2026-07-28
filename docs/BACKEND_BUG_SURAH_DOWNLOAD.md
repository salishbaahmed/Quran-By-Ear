# 🐛 Bug Report: Wrong Surah Downloaded

**Reported by:** Frontend Team  
**Date:** 2026-07-28  
**Severity:** High  
**Component:** Backend — `/api/download` route (`server/server.js`)

---

## Summary

When a user selects **Surah An-Nisa (Surah 4)** and initiates a download, the file that gets downloaded is **Surah Al-Fatiha (Surah 1)** instead.

---

## Root Cause

> [!IMPORTANT]
> The frontend has been confirmed to be sending the **correct Surah number** in the request URL. This is purely a **backend issue**.

The frontend constructs the download URL in [`phone/frontend/src/lib/api.ts`](../phone/frontend/src/lib/api.ts) like this:

```ts
export function buildDownloadUrl(
  reciter: string,
  surah: number,
  startAyah: number,
  endAyah: number
): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/download?reciter=${encodeURIComponent(reciter)}&surah=${surah}&startAyah=${startAyah}&endAyah=${endAyah}`;
}
```

For example, when downloading Surah An-Nisa, Ayahs 1–10 by reciter `Mishari_Alafasy`, the exact URL sent is:

```
GET /api/download?reciter=Mishari_Alafasy&surah=4&startAyah=1&endAyah=10
```

The `surah=4` parameter is **correct and present** in the request.

---

## What Needs to Be Fixed in `server/server.js`

In the `/api/download` route handler, the `surah` query parameter is likely being **ignored or hardcoded to `1`**.

### What to check:

```js
// ❌ WRONG — hardcoded or missing surah param
const surahNumber = 1;

// ✅ CORRECT — read from query
const surahNumber = parseInt(req.query.surah, 10);
```

Make sure:

1. **`req.query.surah` is read** and parsed as an integer.
2. **`req.query.startAyah` and `req.query.endAyah`** are also read correctly.
3. The FFmpeg concatenation is using the **correct surah folder/files** based on these values.
4. Add validation — return a `400` error if `surah` is missing, not a number, or out of range (1–114).

### Suggested fix skeleton:

```js
app.get('/api/download', authenticateToken, async (req, res) => {
  const reciter   = req.query.reciter;
  const surah     = parseInt(req.query.surah, 10);      // ← must use this
  const startAyah = parseInt(req.query.startAyah, 10);  // ← must use this
  const endAyah   = parseInt(req.query.endAyah, 10);    // ← must use this

  if (!reciter || isNaN(surah) || isNaN(startAyah) || isNaN(endAyah)) {
    return res.status(400).json({ error: 'Missing or invalid query parameters.' });
  }

  // Use surah, startAyah, endAyah to build audio file paths and concatenate with FFmpeg
  // e.g. /audio/{reciter}/{surah}/{ayah}.mp3
});
```

---

## How to Reproduce

1. Open the app and log in.
2. Select **Surah An-Nisa** (Surah 4) from the Surah list.
3. Choose any reciter.
4. Select any Ayah range (e.g. 1–5).
5. Press **Start Download**.
6. Play the downloaded file from the Library screen.

**Expected:** Surah An-Nisa recitation plays.  
**Actual:** Surah Al-Fatiha recitation plays instead.

---

> [!NOTE]
> The frontend Library screen correctly displays the filename as `Surah_4_Ayahs_1-5_ReciterName.mp3`, which confirms the frontend is passing `surah=4` correctly. The audio content inside the file is what is wrong — meaning the server is stitching the wrong audio files.
