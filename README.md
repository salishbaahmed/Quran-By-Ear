# Quran-By-Ear

> A comprehensive mobile-first application providing a seamless, high-quality Quran recitation listening experience. Built with a serverless architecture using Supabase and native Android APIs.

![Platform](https://img.shields.io/badge/Platform-Android_&_Web-green.svg)
![Stack](https://img.shields.io/badge/Stack-Supabase_|_React_|_Kotlin-blue.svg)

## 🏗 Architecture

The project is built entirely on the client-side with a serverless backend:

1. **`phone/frontend/` (React SPA)**
   - Built with **React 19**, **Vite**, and **Tailwind CSS v4**.
   - Interfaces directly with the Quran.com API for audio URLs and timing data.
   - Uses **Supabase** for user authentication and anonymous telemetry storage.
   - Bundles Uthmani Quran text locally to eliminate network dependency for rendering.

2. **`phone/android/` (Native Android Shell)**
   - A native Android Studio project built with Kotlin.
   - Wraps the frontend inside a high-performance `WebView`.
   - **Android Bridge (`AndroidBridge.kt`)**: Exposes native capabilities to the web environment via a `@JavascriptInterface`.
   - Handles on-device file downloading, audio concatenation, offline storage, and a foreground playback service.

---

## 📚 Documentation

Developer documentation is located in the `docs/` directory:

- [Frontend Notes](docs/FRONTEND_NOTES.md): Details the React + Vite setup, styling tokens, and Supabase integration.
- [Phone Bridge API](docs/PHONE_BRIDGE_API.md): Documentation on how the Web UI calls the Native Android bridge (`window.AndroidBridge`) to download files securely and track offline play stats.

---

## 🚀 Quick Start (Local Development)

To run the application locally:

### 1. Start the Frontend UI
The frontend uses Vite and binds to `0.0.0.0` so it can be accessed by devices on your local network.
```bash
cd phone/frontend
npm install
npm run dev
```

### 2. Configure Supabase (Optional for local dev)
Ensure your `phone/frontend/.env` file contains your Supabase URL and Anon Key if you are testing authentication or telemetry.
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Run the Android App
1. Open the `phone/android/` directory in **Android Studio**.
2. Sync the Gradle files.
3. Verify that the WebView URL in `MainActivity.kt` points to your computer's local network IP address where Vite is running (e.g., `http://192.168.1.20:5173/`).
4. Click **Run** to launch the wrapper in an emulator or on a physical Android device.
