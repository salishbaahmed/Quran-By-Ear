# API Documentation

This document serves as the official API specification for the Quran-By-Ear backend. Base URL in local development is typically `http://DESKTOP-85K359Q.local:3000`.

---

## 1. Get Reciters
Retrieves a list of all available reciter names. The frontend uses these to dynamically populate dropdown menus and build the audio URLs.

- **Endpoint:** `/api/reciters`
- **Method:** `GET`
- **Headers:** `None`
- **Query Parameters:** `None`

### Success Response (200 OK)
Returns a JSON object containing an array of reciter strings.

```json
{
  "reciters": [
    "Abdulbasit_Abdussamad",
    "Abdurrahmaan_As_Sudais",
    "Abu_Bakr_Ash_Shaatree"
  ]
}
```

### Edge Cases & Errors
- **`500 Internal Server Error`**: Thrown if the backend is unable to read the local dataset directory (e.g., if the `B:\Quran` drive is unmounted or permissions are missing).
  ```json
  {
    "error": "Failed to read dataset directory"
  }
  ```

---

## 2. Get Audio Stream URL
Retrieves the location of a specific Ayah's MP3 file. Rather than proxying the MP3 data, this endpoint immediately issues a redirect to the public Dataset Host (CDN), allowing the client browser/app to fetch the audio directly.

- **Endpoint:** `/api/audio`
- **Method:** `GET`
- **Query Parameters:**
  - `reciter` (string, **required**): The exact name of the reciter folder (e.g. `Abdulbasit_Abdussamad`).
  - `surah` (integer, **required**): The Surah number (e.g. `1`).
  - `ayah` (integer, **required**): The Ayah number (e.g. `1`).

### Success Response (302 Found / Redirect)
The server responds with an HTTP 302 status code and a `Location` header pointing to the dataset host.

**Response Headers:**
```http
HTTP/1.1 302 Found
Location: http://DESKTOP-85K359Q.local:8080/Abdulbasit_Abdussamad/001001.mp3
```
*Note: Your browser or `fetch` request will automatically follow this redirect and retrieve the MP3 binary data.*

### Edge Cases & Errors

- **`400 Bad Request`**: Thrown if you omit one or more of the required query parameters (`reciter`, `surah`, `ayah`).
  ```json
  {
    "error": "Missing required parameters: reciter, surah, ayah"
  }
  ```
  
- **File Not Found on CDN (404 Not Found)**: Because the API redirects blindly to the Dataset Host to save processing time, the API itself will not verify if `001001.mp3` actually exists. If a user requests a Surah/Ayah combination that doesn't exist (e.g., Surah 999), the API will successfully return a 302 Redirect, but the subsequent request to the Dataset CDN will fail with a `404 Not Found`. Frontend developers must handle network failures gracefully when fetching the audio.
