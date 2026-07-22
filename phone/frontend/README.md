# Phone Frontend

This directory is reserved for the frontend team to build the web UI that runs inside the native Android WebView wrapper.

## Architecture
The application runs entirely on the phone, communicating with the Native Android backend through the `JavascriptInterface` exposed as `AndroidBridge`.
The frontend will handle user interaction, UI routing, and passing requests to the Native App (e.g. "download this file", "play this local file", "fetch my listen stats").
