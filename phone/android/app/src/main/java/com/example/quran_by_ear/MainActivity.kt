package com.example.quran_by_ear

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
import com.example.quran_by_ear.theme.QuranByEarTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    enableEdgeToEdge()
    setContent {
      QuranByEarTheme { 
        Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { 
          AndroidView(
            factory = { context ->
              WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                settings.allowFileAccess = true
                settings.allowContentAccess = true
                
                // Add JavaScript Interface Bridge
                addJavascriptInterface(AndroidBridge(context), "AndroidBridge")
                
                webViewClient = WebViewClient()
                // Load frontend via mDNS for local testing across devices
                loadUrl("http://DESKTOP-85K359Q.local:5173")
              }
            }
          )
        } 
      }
    }
  }
}
