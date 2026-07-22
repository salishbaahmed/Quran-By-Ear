# Phone Bridge API Documentation

The phone application exposes Native Android functionality (File System, SQLite Database, and Downloader) directly to the WebView frontend via a `JavascriptInterface` object called `window.AndroidBridge`. 

The frontend team must use these methods to build the offline / local listen capabilities.

---

## 1. File Download

Requests the Native Android app to download the concatenated MP3 from the remote server and save it securely in `Downloads/QuranByEar/`.

**Usage:**
```javascript
// URL should be the full /api/download endpoint with query parameters
window.AndroidBridge.downloadAudio(
    "http://DESKTOP-85K359Q.local:3000/api/download?reciter=...&surah=1&startAyah=1&endAyah=10",
    "Surah_1_Ayahs_1-10_Abdulbasit.mp3",
    "eyJhbGciOiJIUzI1NiIsInR..." // The user's JWT access token
);
```
*Note: This triggers an Android System notification for the download progress.*

---

## 2. Local File Management

### Get Downloaded Files & Index
Scans the local `Downloads/QuranByEar/` directory. It cleans up the SQLite stats database (removing stats for files the user deleted manually via their File Manager), and returns a JSON string array of MP3 filenames.

**Usage:**
```javascript
const filesJson = window.AndroidBridge.getDownloadedFiles();
const filesArray = JSON.parse(filesJson);
// Example output: ["Surah_1_Ayahs_1-10_Abdulbasit.mp3"]
```

### Get Local File URL
Returns the `file://` absolute URI required to play a downloaded file using a standard HTML `<audio src="...">` tag.

**Usage:**
```javascript
const absoluteUrl = window.AndroidBridge.getFileUrl("Surah_1_Ayahs_1-10_Abdulbasit.mp3");
// Output: "file:///storage/emulated/0/Download/QuranByEar/Surah_1_Ayahs_1-10_Abdulbasit.mp3"

// Assign to audio element
document.getElementById('my-audio').src = absoluteUrl;
```

---

## 3. Local Statistics (SQLite)

These functions interact with a fast, local SQLite database on the phone to track play counts and listen time for offline files.

### Update Stats
Call this function repeatedly as the user listens (e.g. on `timeupdate` or `ended` audio events), or at the end of a session, to increment the total listening time. 
*Note: The native bridge automatically calculates if it should create a new record or update an existing one, and increments `playCount` automatically.*

**Usage:**
```javascript
// Add 30 seconds to the total listen time for this file
window.AndroidBridge.updateStats("Surah_1_Ayahs_1-10_Abdulbasit.mp3", 30);
```

### Get All Stats
Returns a JSON string array of objects containing stats for all files currently on the device.

**Usage:**
```javascript
const statsJson = window.AndroidBridge.getAllStats();
const statsArray = JSON.parse(statsJson);

/* Example Output:
[
  {
    "filename": "Surah_1_Ayahs_1-10_Abdulbasit.mp3",
    "playCount": 5,
    "totalTime": 1500 // In seconds
  }
]
*/
```
