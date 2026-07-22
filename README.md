# Quran-By-Ear

> A comprehensive full-stack application that provides a seamless, high-quality Quran recitation listening experience across the web and native mobile platforms.

![Platform](https://img.shields.io/badge/Platform-Android_&_Web-green.svg)
![Stack](https://img.shields.io/badge/Stack-Node.js_|_React_|_Kotlin-blue.svg)

## 🏗 Architecture

The project has been carefully decoupled into two main domains to allow independent development, scalability, and clean separation of concerns:

1. **`server/` (Backend Node.js)**
   - A robust Node.js + Express backend.
   - Handles secure user authentication via JWT and SQLite.
   - Performs on-the-fly audio concatenation: When a client requests a range of Ayahs, the server uses FFmpeg to seamlessly stitch the raw audio files together, embeds ID3 metadata, and streams the compiled MP3 directly to the client.

2. **`phone/` (Client Ecosystem)**
   - **`phone/android/`**: A native Android Studio project built with Kotlin. It acts as a lightweight native shell wrapping the frontend inside a high-performance `WebView`. It bridges native phone capabilities (DownloadManager, SQLite Stats Tracking, File System Indexing) to the web environment via a `@JavascriptInterface`.
   - **`phone/frontend/`**: A modern Single Page Application built with **React 19**, **Vite**, and **Tailwind CSS v4**. It communicates with the Android native bridge to manage local files, playback, and offline listening stats.

---

## 📚 Documentation

Comprehensive documentation for developers is located in the `docs/` directory:

- [Frontend Notes & Architecture](docs/FRONTEND_NOTES.md): Details the React + Vite setup, styling tokens, and bridge mocks.
- [Server API Documentation](docs/SERVER_API.md): Instructions on authentication endpoints and the FFmpeg MP3 download routes.
- [Phone Bridge API](docs/PHONE_BRIDGE_API.md): Documentation on how the Web UI calls the Native Android bridge (`window.AndroidBridge`) to download files securely and track offline play stats.

---

## 🚀 Quick Start (Local Development)

To run the entire stack locally for development:

### 1. Start the Backend API
The backend requires `dotenv` and expects to run on port `4000`.
```bash
cd server
npm install
npm run start
```
*(Ensure your dataset is correctly linked in `.env` if required).*

### 2. Start the Frontend UI
The frontend uses Vite and binds to `0.0.0.0` so it can be accessed by devices on your local network.
```bash
cd phone/frontend
npm install
npm run dev
```

### 3. Run the Android App
1. Open the `phone/android/` directory in **Android Studio**.
2. Sync the Gradle files.
3. Verify that the WebView URL in `MainActivity.kt` points to your computer's local mDNS or IP address (e.g., `http://192.168.1.20:5173/`).
4. Click **Run** to launch the wrapper in an emulator or on a physical device.

---

> **Note:** The backend uses `ffmpeg` for audio manipulation. Ensure `ffmpeg` is available on your system or handled by the `ffmpeg-static` dependency.
