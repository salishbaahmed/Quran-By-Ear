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
    private val downloadDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "QuranByEar")

    init {
        if (!downloadDir.exists()) {
            downloadDir.mkdirs()
        }
    }

    @JavascriptInterface
    fun downloadAudio(url: String, filename: String, token: String) {
        val request = DownloadManager.Request(Uri.parse(url))
        request.setTitle("Downloading $filename")
        request.setDescription("Quran-By-Ear downloading audio...")
        // Add Authorization header
        request.addRequestHeader("Authorization", "Bearer $token")
        
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "QuranByEar/$filename")
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        
        val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        manager.enqueue(request)
        
        Toast.makeText(context, "Download started...", Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun getDownloadedFiles(): String {
        // Cleanup missing files from stats database before returning list
        val files = downloadDir.listFiles()?.filter { it.extension == "mp3" }?.map { it.name } ?: emptyList()
        val allStats = dbHelper.getAllStats()
        
        for (i in 0 until allStats.length()) {
            val stat = allStats.getJSONObject(i)
            val filename = stat.getString("filename")
            if (!files.contains(filename)) {
                dbHelper.deleteStats(filename)
            }
        }

        val jsonArray = org.json.JSONArray(files)
        return jsonArray.toString()
    }

    @JavascriptInterface
    fun getFileUrl(filename: String): String {
        val file = File(downloadDir, filename)
        return "file://" + file.absolutePath
    }

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

    @JavascriptInterface
    fun deleteFile(filename: String) {
        val file = File(downloadDir, filename)
        if (file.exists()) {
            file.delete()
        }
        dbHelper.deleteStats(filename)
    }

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

    @JavascriptInterface
    fun updateMediaSessionMetadata(title: String, artist: String, isPlaying: Boolean) {
        val intent = android.content.Intent(context, PlaybackService::class.java).apply {
            action = PlaybackService.ACTION_UPDATE_METADATA
            putExtra(PlaybackService.EXTRA_TITLE, title)
            putExtra(PlaybackService.EXTRA_ARTIST, artist)
            putExtra(PlaybackService.EXTRA_IS_PLAYING, isPlaying)
        }
        context.startService(intent)
    }
}
