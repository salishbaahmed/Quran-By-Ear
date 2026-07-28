# 🚀 Backend Requirement: Per-Ayah Audio Endpoint

> [!NOTE]
> ✅ **IMPLEMENTED** — Confirmed working on 2026-07-29. `GET /api/audio?reciter=X&surah=Y&ayah=Z` returns `audio/mpeg` correctly. This document is retained for reference.

**Reported by:** Frontend Team  
**Date:** 2026-07-28  
**Component:** Backend API (`server/server.js`)

---

## The Request

The frontend team needs a new API endpoint to fetch the audio file for a **single, specific Ayah**. 

This is required to unblock two major frontend features:
1. **Client-Side MP3 Concatenation**: To reduce server load, the frontend will download individual Ayahs and stitch them together locally.
2. **Bismillah/Sadaqallah Injection**: The frontend needs to fetch Ayah 1 (Bismillah) and the last Ayah of a Surah on demand to inject them into the playback queue when a user plays a partial Surah.

---

## Required Endpoint

### `GET /api/audio`

**Query Parameters:**
- `reciter` (string, required): The name of the reciter (e.g., `Mishari_Alafasy`).
- `surah` (number, required): The Surah number (1-114).
- `ayah` (number, required): The Ayah number within that Surah.

**Expected Response:**
- **Success (200 OK)**: The raw MP3 file stream for that specific Ayah. `Content-Type: audio/mpeg`.
- **Error (400/404/500)**: Standard JSON error message.

---

## Example Usage

```http
GET /api/audio?reciter=Mishari_Alafasy&surah=2&ayah=255
```
*(This should return the MP3 for Ayatul Kursi by Mishari Alafasy).*

---

## Notes for Backend Developer
- Please implement this in `server.js`.
- It should just locate the specific `{surah}/{ayah}.mp3` file for the given `reciter` and serve it back directly using `res.sendFile()` or `res.download()`.
- Let the frontend team know once this is deployed!
