# Frontend Documentation & Notes

This document outlines the architecture, setup, and key integration points for the React frontend application built for the **Quran-By-Ear** project.

## 1. Environment & Architecture
The frontend is a single-page React application built with Vite and Tailwind CSS v4, located in `phone/frontend`. It is designed specifically to run inside the native Android WebView of the `phone/android` app.

### Key Tools:
- **React 19**
- **Vite** (configured to bind to `0.0.0.0:5173` for testing on physical devices/emulators)
- **Tailwind CSS v4**
- **TypeScript**

## 2. API Endpoints (`src/lib/api.ts`)

The frontend communicates with a local backend server. The base URL can be configured dynamically in the Settings screen and is saved to `localStorage`.
- **Default API Base URL:** `http://DESKTOP-85K359Q.local:3000`

### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login` (Returns an `accessToken` which is stored in `localStorage` under the key `qbe_token`).

### Fetch Reciters
- `GET /api/reciters`
  - Requires `Authorization: Bearer <token>`
  - Used to dynamically populate the Reciter selection screen.
  - **Important Note on Session Expiry:** If the backend returns a bare `401` or `403` status without a JSON body, the frontend correctly interprets this as an expired session, clears the token, and redirects the user to the login screen.

## 3. Native AndroidBridge Integration (`src/lib/androidBridge.ts`)

Because the app is wrapped in an Android WebView, the frontend relies on a `JavascriptInterface` exposed by the native Android code named `window.AndroidBridge`. 

### Bridge Functions Exposed:
- `downloadAudio(url, filename, token)`: Initiates a fire-and-forget download using Android's native DownloadManager.
- `getDownloadedFiles()`: Retrieves the list of MP3 files currently on the device.
- `getFileUrl(filename)`: Translates a filename into an absolute `file://` URI so the web `<audio>` tag can play it locally.
- `recordPlayStart(filename)`: Fires exactly once per track play to correctly log the user's play count.
- `updateStats(filename, timeListenedSeconds)`: Fires periodically during playback (e.g., every 5 seconds) to incrementally record the total listened time, without falsely inflating the play count.
- `getAllStats()`: Retrieves all audio statistics (play counts and listened times).

### Development Mock
When developing the app in a normal desktop browser (e.g. running `npm run dev`), `window.AndroidBridge` is not available. The frontend detects this and gracefully falls back to a `localStorage`-based mock implementation. 
- You will see a `console.warn("AndroidBridge not found — using dev mock")` in the dev tools.
- This mock simulates downloads, maintains state, and provides a sample public MP3 URL so the audio player functions smoothly during browser testing.

## 4. UI / UX Standards
- **Routing:** In-memory simple string-based state routing (`'splash' | 'login' | 'surah-list' | 'library'` etc.) to mimic a seamless mobile app flow without browser history clutter.
- **Design System:** Custom CSS tokens (`--bg`, `--surface`, `--accent`, etc.) defined in `index.css` working alongside Tailwind utility classes for a dark-mode optimized aesthetic.
- **Micro-interactions:** Buttons use active-scale transforms for a responsive, native-like tap feel.

## 5. Explicit Constraints Addressed
- **No Client-Side MP3 Concatenation:** Previously considered but ultimately discarded. The backend now natively zips and concatenates the audio into a single MP3, so the frontend only needs to call `downloadAudio` once per Surah range.
- **No MP4 Generation:** Completely removed from the frontend scope as per recent product updates.
