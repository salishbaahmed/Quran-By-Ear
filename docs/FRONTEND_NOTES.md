# Frontend Documentation & Notes

This document outlines the architecture, setup, and key feature requirements for the React frontend application built for the **Quran-By-Ear** project.

## 1. Environment & Architecture
The frontend is a single-page React application built with Vite and Tailwind CSS v4, located in `phone/frontend`. It is designed specifically to run inside the native Android WebView of the `phone/android` app.

### Key Tools:
- **React 19**
- **Vite** (configured to bind to `0.0.0.0:5173` for testing on physical devices/emulators)
- **Tailwind CSS v4**
- **TypeScript**

## 2. Audio Player Enhancements
The frontend audio player needs the following feature additions:
- **Loop Option**: A user-facing toggle to repeat the currently playing audio.
- **Bismillah & Sadaqallah Injection**: 
  - If playing an incomplete Surah (a partial range of Ayahs), dynamically prepend Bismillah (which is the first Ayah, e.g., Ayah 001 of that Surah) to the playback queue.
  - Append Sadaqallah hul Azim (the last Ayah of that Surah) to the end of the playback queue.
- **Playback Speed Control**: Allow users to speed up or slow down recitations (e.g., 0.75x, 1x, 1.25x, 1.5x).
- **Sleep Timer**: An option to automatically stop playback after a certain amount of time or at the end of the current Surah.
- **Background Media Controls**: Integrate with the standard Android `MediaSession` API so users get a native notification player on their lock screen. Ensure compatibility across ALL Android phones.

## 3. Client-Side MP3 Concatenation
The server provides individual Ayahs. To minimize server strain, MP3 concatenation must happen on the client phone.
- Fetch each Ayah in the desired range from `/api/audio` as an `ArrayBuffer`.
- Concatenate the binary buffers into a single `Uint8Array`.
- Create a `Blob` and trigger a download of the combined `.mp3` file or pass it to the Android Bridge.

## 4. MP4 Trial Logic (Client-Side Rendering)
For the MP4 trial feature, the frontend will dynamically generate video files:
- Create a hidden (or modal) UI that plays the audio while drawing the corresponding Arabic Quran text on an HTML5 `<canvas>`.
- The Arabic text should be fetched from a public API (e.g., `api.alquran.cloud`) — no need to bundle the entire Quran locally. Note that future updates will add options for multiple text styles/fonts.
- Use the `MediaRecorder` API to capture the canvas visual stream and the Web Audio API destination stream.
- **Format Constraint**: The output must be strictly `.mp4`. Because standard `MediaRecorder` in Chrome/WebViews outputs `.webm` by default, you will need to utilize `ffmpeg.wasm` on the client to transcode the recorded blob into an MP4 file before saving.

## 5. Download Management
- **Delete Option**: Add a "Delete" button next to downloaded items in the Library view to remove files from the device.
- **Duplicate Handling**: 
  - Before starting a download, check the existing downloaded files list.
  - If a match is found, show a modal prompt asking the user to either "Keep Both" or "Select which to keep / Replace".
  - If "Keep Both" is selected, append a counter (e.g., `(1)`) to the new filename.

## 6. UI / UX & Bug Fixes
- **Auth Bypass Bug**: Currently, if a user goes to "Settings" from the "Signup" page and clicks "Back", they are routed to the main Surahs page without authentication. 
  - Fix: Track `previousView` in state or implement a global route guard that forces unauthenticated users back to the `login`/`signup` view.
- **Temp Development Settings**: Add a temporary input field in the Settings page for developers to input a custom API Base URL. This state does not need to be saved to persistent storage, as the final app deployment will have the URL hardcoded and updated via the App Store.
- **Dark Mode Theme**: The frontend is responsible for designing and implementing a dark mode theme, which is highly preferred for users at night or during early morning prayers.

## 7. Native AndroidBridge Integration (`src/lib/androidBridge.ts`)
Because the app is wrapped in an Android WebView, the frontend relies on a `JavascriptInterface` exposed by the native Android code named `window.AndroidBridge`. 
- `downloadAudio(url, filename, token)`: Initiates a fire-and-forget download using Android's native DownloadManager.
- `getDownloadedFiles()`: Retrieves the list of MP3 files currently on the device.
- `getFileUrl(filename)`: Translates a filename into an absolute `file://` URI so the web `<audio>` tag can play it locally.
- `recordPlayStart(filename)`: Fires exactly once per track play to correctly log the user's play count.
- `updateStats(filename, timeListenedSeconds)`: Fires periodically during playback (e.g., every 5 seconds) to incrementally record the total listened time, without falsely inflating the play count.
- `getAllStats()`: Retrieves all audio statistics (play counts and listened times).
