package com.example.quran_by_ear

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.example.quran_by_ear.theme.QuranByEarTheme

class MainActivity : ComponentActivity() {
  private var mainWebView: WebView? = null
  
  private val mediaActionReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      val action = intent?.getStringExtra("action")
      if (action == "PLAY") {
        mainWebView?.evaluateJavascript("window.dispatchEvent(new Event('native-play'))", null)
      } else if (action == "PAUSE") {
        mainWebView?.evaluateJavascript("window.dispatchEvent(new Event('native-pause'))", null)
      }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    LocalBroadcastManager.getInstance(this).registerReceiver(
      mediaActionReceiver, IntentFilter("MEDIA_ACTION")
    )
    
    onBackPressedDispatcher.addCallback(this, object : androidx.activity.OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
            if (mainWebView?.canGoBack() == true) {
                mainWebView?.goBack()
            } else {
                finish()
            }
        }
    })

    enableEdgeToEdge()
    setContent {
      QuranByEarTheme { 
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { 
          AndroidView(
            factory = { context ->
              WebView(context).apply {
                mainWebView = this
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                settings.allowFileAccessFromFileURLs = true
                settings.allowUniversalAccessFromFileURLs = true
                
                // Add JavaScript Interface Bridge
                addJavascriptInterface(AndroidBridge(context), "AndroidBridge")
                
                webViewClient = WebViewClient()
                // Load bundled frontend from internal assets
                loadUrl("file:///android_asset/index.html")
              }
            }
          )
        } 
      }
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    LocalBroadcastManager.getInstance(this).unregisterReceiver(mediaActionReceiver)
  }
}
