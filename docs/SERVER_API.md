# Server API Documentation

The backend server has been rewritten to support user authentication and on-the-fly MP3 concatenation. 

**Base URL:** `http://DESKTOP-85K359Q.local:3000`

---

## 1. Authentication

### Signup
Creates a new user in the SQLite database.
- **Endpoint:** `POST /api/auth/signup`
- **Body:** `{ "username": "user1", "password": "password123" }`
- **Returns:** `{ "message": "User created successfully", "id": 1 }`
- **Errors:** `400 Username already exists`

### Login
Authenticates a user and returns a JSON Web Token (JWT).
- **Endpoint:** `POST /api/auth/login`
- **Body:** `{ "username": "user1", "password": "password123" }`
- **Returns:** `{ "accessToken": "eyJhbG..." }`
- **Errors:** `400 Invalid password`, `400 User not found`

---

## 2. Audio Processing

### List Reciters
Returns all available reciters from the remote dataset.
- **Endpoint:** `GET /api/reciters`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Returns:** `{ "reciters": ["Abdulbasit_Abdussamad", ...] }`

### Download & Concatenate Range
Requests the server to concatenate a specific range of Ayahs into a single MP3 file, embed proper metadata, and stream it as an attachment.
- **Endpoint:** `GET /api/download`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Query Parameters:**
  - `reciter` (String): e.g. "Abdulbasit_Abdussamad"
  - `surah` (Int): Surah number
  - `startAyah` (Int): Starting Ayah number
  - `endAyah` (Int): Ending Ayah number
- **Returns:** An `audio/mpeg` binary file download (`Surah_X_Ayahs_Y-Z_Reciter.mp3`).
- **Notes:** 
  - This endpoint takes some time depending on the length of the range as it uses FFmpeg on the server.
  - Temporary files are automatically cleaned up on the server once the download finishes.
