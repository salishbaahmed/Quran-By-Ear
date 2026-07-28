# Future Ideas & Improvements

This document tracks ideas for enhancing the Quran-By-Ear application's user experience, performance, and architecture.

## 📱 Frontend / UX Improvements

1. **Auto System Theme Sync:**
   Currently, the Dark/Light mode is a manual toggle. We could read `window.matchMedia('(prefers-color-scheme: dark)')` to automatically follow the Android system theme on launch.

2. **Offline-First Metadata Caching:**
   Cache the `api.alquran.cloud` metadata and Arabic text in local `IndexedDB`. If the user has downloaded a Surah and opens the app offline, they shouldn't just be able to play the audio—they should still be able to generate the MP4 video because the Arabic text was cached locally.

3. **Advanced Audio Features:**
   - **Ayah Bookmarking:** Let users drop a "bookmark" timestamp on a downloaded Surah so they can resume exactly where they left off.
   - **Continuous Play:** An option in Settings to "Auto-play next Surah" when the current one finishes.

4. **MP4 Generator Customization:**
   - Allow users to select different Arabic fonts (e.g., Uthmani, Indo-Pak).
   - Let users adjust the font size before generating the video.
   - Add English translation subtitles below the Arabic text in the video.

5. **Micro-Animations:**
   Add Android-style "ripple" click effects to the Surah list items and player buttons to make the app feel more native and responsive.

## ⚙️ Native Android / Backend Improvements

1. **Native MediaSession API:**
   When the user locks their phone, the audio currently plays, but there are no lock-screen media controls (Play/Pause/Skip). The Kotlin code needs to implement `MediaSessionCompat` to integrate with the Android OS lock screen.

2. **Progressive Audio Streaming (Backend):**
   Instead of forcing the user to download an entire Surah to listen, the backend could support `HTTP 206 Partial Content` (Range requests) so users can tap a Surah and immediately start streaming it while connected to WiFi, saving storage space.
