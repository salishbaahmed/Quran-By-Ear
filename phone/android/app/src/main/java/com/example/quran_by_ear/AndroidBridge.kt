package com.example.quran_by_ear

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.webkit.JavascriptInterface
import android.widget.Toast
import java.io.File

class AndroidBridge(private val context: Context) {
    private val dbHelper = StatsDatabaseHelper(context)

    /**
     * Root download directory: Android/Downloads/QuranByEar/
     * Subdirectory structure: {recitationId}/{surahNum}/{ayahNum}.mp3
     * Example: QuranByEar/7/1/003.mp3
     */
    private val downloadDir = File(
        Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
        "QuranByEar"
    )

    init {
        if (!downloadDir.exists()) {
            downloadDir.mkdirs()
        }
    }

    // ── Download ──────────────────────────────────────────────────────────────

    /**
     * Download multiple MP3 files and concatenate them into a single file sequentially.
     * This avoids gapless playback issues on Android WebViews.
     */
    @JavascriptInterface
    fun downloadAndConcatenateAudio(urlsJson: String, filename: String) {
        Thread {
            try {
                val urls = org.json.JSONArray(urlsJson)
                val destFile = File(downloadDir, filename)
                destFile.parentFile?.mkdirs()

                val tempFile = File(downloadDir, "$filename.tmp")
                val durations = org.json.JSONArray()
                
                java.io.FileOutputStream(tempFile).use { outStream ->
                    for (i in 0 until urls.length()) {
                        val urlStr = urls.getString(i)
                        val url = java.net.URL(urlStr)
                        val conn = url.openConnection() as java.net.HttpURLConnection
                        conn.requestMethod = "GET"
                        conn.connect()

                        val chunkFile = File(downloadDir, "$filename.chunk$i")
                        conn.inputStream.use { inStream ->
                            java.io.FileOutputStream(chunkFile).use { chunkOut ->
                                val buffer = ByteArray(8192)
                                var bytesRead: Int
                                while (inStream.read(buffer).also { bytesRead = it } != -1) {
                                    chunkOut.write(buffer, 0, bytesRead)
                                }
                            }
                        }

                        val retriever = android.media.MediaMetadataRetriever()
                        try {
                            retriever.setDataSource(chunkFile.absolutePath)
                            val durationStr = retriever.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION)
                            durations.put(durationStr?.toLongOrNull() ?: 0L)
                        } catch (e: Exception) {
                            durations.put(0L)
                            e.printStackTrace()
                        } finally {
                            retriever.release()
                        }

                        java.io.FileInputStream(chunkFile).use { chunkIn ->
                            val buffer = ByteArray(8192)
                            var bytesRead: Int
                            while (chunkIn.read(buffer).also { bytesRead = it } != -1) {
                                outStream.write(buffer, 0, bytesRead)
                            }
                        }
                        chunkFile.delete()
                    }
                }
                
                val indexFile = File(downloadDir, filename.replace(".mp3", ".json"))
                indexFile.writeText(durations.toString())

                // Rename temp to final destination
                if (destFile.exists()) destFile.delete()
                tempFile.renameTo(destFile)

                // Notify UI (optional)
                val handler = android.os.Handler(android.os.Looper.getMainLooper())
                handler.post {
                    Toast.makeText(context, "Download complete: ${destFile.nameWithoutExtension}", Toast.LENGTH_SHORT).show()
                }

            } catch (e: Exception) {
                e.printStackTrace()
                val handler = android.os.Handler(android.os.Looper.getMainLooper())
                handler.post {
                    Toast.makeText(context, "Download failed: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    /**
     * Enqueue a standard download via Android DownloadManager.
     * @param url      Full CDN URL of the MP3 file
     * @param filename Relative path e.g. "7/1/003.mp3" — subdirectory is created automatically
     */
    @JavascriptInterface
    fun downloadAudio(url: String, filename: String) {
        // Ensure the subdirectory exists
        val destFile = File(downloadDir, filename)
        destFile.parentFile?.mkdirs()

        val request = DownloadManager.Request(Uri.parse(url))
        request.setTitle("Quran-By-Ear: Downloading ${File(filename).nameWithoutExtension}")
        request.setDescription("Saving to Downloads/QuranByEar/$filename")
        request.setDestinationInExternalPublicDir(
            Environment.DIRECTORY_DOWNLOADS,
            "QuranByEar/$filename"
        )
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)

        val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        manager.enqueue(request)
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    /**
     * Recursively scan QuranByEar/ directory and return all .mp3 relative paths.
     * Also cleans up stats DB for any entries whose files no longer exist.
     */
    @JavascriptInterface
    fun getDownloadedFiles(): String {
        val relativePaths = mutableListOf<String>()
        collectMp3Files(downloadDir, downloadDir, relativePaths)

        // Cleanup stats for missing files
        val allStats = dbHelper.getAllStats()
        for (i in 0 until allStats.length()) {
            val stat = allStats.getJSONObject(i)
            val fn = stat.getString("filename")
            val file = File(downloadDir, fn)
            if (!file.exists()) {
                dbHelper.deleteStats(fn)
            }
        }

        return org.json.JSONArray(relativePaths).toString()
    }

    private fun collectMp3Files(root: File, current: File, result: MutableList<String>) {
        current.listFiles()?.forEach { f ->
            if (f.isDirectory) {
                collectMp3Files(root, f, result)
            } else if (f.extension == "mp3") {
                // Store as relative path from downloadDir root
                result.add(f.relativeTo(root).path.replace('\\', '/'))
            }
        }
    }

    /**
     * Returns the file:// absolute URI for a relative path.
     * e.g. "7/1/003.mp3" → "file:///storage/emulated/0/Download/QuranByEar/7/1/003.mp3"
     */
    @JavascriptInterface
    fun getFileUrl(relativePath: String): String {
        val file = File(downloadDir, relativePath)
        return "file://" + file.absolutePath
    }

    /**
     * Returns true if the file at relativePath exists on disk.
     */
    @JavascriptInterface
    fun isFileDownloaded(relativePath: String): Boolean {
        return File(downloadDir, relativePath).exists()
    }

    /**
     * Reads a text file given an absolute file:// URL and returns its contents.
     */
    @JavascriptInterface
    fun readTextFile(fileUrl: String): String {
        try {
            if (fileUrl.startsWith("file://")) {
                val path = fileUrl.substring(7)
                val file = File(path)
                if (file.exists()) {
                    return file.readText()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return ""
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @JavascriptInterface
    fun deleteFile(relativePath: String) {
        val file = File(downloadDir, relativePath)
        if (file.exists()) {
            file.delete()
        }
        
        // Also delete the associated JSON index file if it exists
        val jsonFile = File(downloadDir, relativePath.replace(".mp3", ".json"))
        if (jsonFile.exists()) {
            jsonFile.delete()
        }

        dbHelper.deleteStats(relativePath)
        // Also try to remove empty parent directories
        file.parentFile?.let { parent ->
            if (parent.list()?.isEmpty() == true) {
                parent.delete()
                parent.parentFile?.let { grandParent ->
                    if (grandParent.list()?.isEmpty() == true && grandParent != downloadDir) {
                        grandParent.delete()
                    }
                }
            }
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @JavascriptInterface
    fun updateStats(filename: String, timeListenedSeconds: Int) {
        dbHelper.updateStats(filename, timeListenedSeconds)
    }

    @JavascriptInterface
    fun recordPlayStart(filename: String) {
        dbHelper.recordPlayStart(filename)
    }

    @JavascriptInterface
    fun getAllStats(): String {
        return dbHelper.getAllStats().toString()
    }

    // ── Foreground Playback Service ───────────────────────────────────────────

    @JavascriptInterface
    fun startForegroundService(title: String, artist: String) {
        val intent = android.content.Intent(context, PlaybackService::class.java).apply {
            action = PlaybackService.ACTION_START_FOREGROUND
            putExtra(PlaybackService.EXTRA_TITLE, title)
            putExtra(PlaybackService.EXTRA_ARTIST, artist)
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
    }

    @JavascriptInterface
    fun stopForegroundService() {
        val intent = android.content.Intent(context, PlaybackService::class.java).apply {
            action = PlaybackService.ACTION_STOP_FOREGROUND
        }
        context.startService(intent)
    }
}
