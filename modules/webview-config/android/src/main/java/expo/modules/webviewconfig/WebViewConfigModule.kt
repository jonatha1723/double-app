package expo.modules.webviewconfig

import android.content.Context
import android.webkit.WebSettings
import android.webkit.WebView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WebViewConfigModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WebViewConfig")

    OnCreate {
      // Configure WebView globally when module is created
      configureWebView()
    }

    Function("configureWebView") {
      configureWebView()
    }
  }

  private fun configureWebView() {
    val context = appContext.reactContext ?: return
    
    // Get the default User-Agent from the system (Chrome)
    val defaultUA = WebSettings.getDefaultUserAgent(context)
    
    // Set it globally for all WebViews in the app
    WebView.setWebContentsDebuggingEnabled(true)
    
    // Store in shared preferences for react-native-webview to use
    val prefs = context.getSharedPreferences("WebViewConfig", Context.MODE_PRIVATE)
    prefs.edit().putString("userAgent", defaultUA).apply()
  }
}
