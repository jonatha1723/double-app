package space.manus.doubleapp.t20260214032438

import android.os.Build
import android.webkit.CookieManager
import android.webkit.WebSettings
import android.webkit.WebView
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.reactnativecommunity.webview.RNCWebViewManager

/**
 * Custom React Package para configurar WebView com settings robustos
 * Compatível com Java 17 e Android API mínima 21 (Lollipop)
 */
class WebViewConfigPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return emptyList()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return listOf(RobustWebViewManager())
    }
}

/**
 * WebView Manager robusto que aplica configurações avançadas de WebSettings
 * Substitui o RNCWebViewManager padrão com configurações otimizadas para produção
 */
class RobustWebViewManager : RNCWebViewManager() {
    
    override fun getName(): String {
        return "RNCWebView"
    }

    override fun createViewInstance(reactContext: ReactApplicationContext): WebView {
        val webView = super.createViewInstance(reactContext)
        applyRobustWebSettings(webView)
        return webView
    }

    /**
     * Aplica configurações robustas de WebSettings e CookieManager
     * Bloco pronto para produção com todas as otimizações necessárias
     */
    private fun applyRobustWebSettings(webView: WebView) {
        val settings: WebSettings = webView.settings

        // ===== CONFIGURAÇÕES BÁSICAS OBRIGATÓRIAS =====
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true

        // User-Agent igual ao Chrome Android 11
        settings.userAgentString = "Mozilla/5.0 (Linux; Android 11; Pixel 4) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/110.0.5481.65 Mobile Safari/537.36"

        // ===== DESABILITAR CONTROLES DE ZOOM =====
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false

        // ===== CONFIGURAÇÕES DE CACHE E ARMAZENAMENTO =====
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.setAppCacheEnabled(true)
        settings.databaseEnabled = true

        // ===== CONFIGURAÇÕES DE MÍDIA =====
        settings.mediaPlaybackRequiresUserGesture = false
        settings.allowFileAccess = false
        settings.allowContentAccess = true

        // ===== CONFIGURAÇÕES DE SEGURANÇA =====
        settings.allowFileAccessFromFileURLs = false
        settings.allowUniversalAccessFromFileURLs = false

        // ===== CONFIGURAÇÕES DE RENDERIZAÇÃO =====
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.layoutAlgorithm = WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING
        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.loadsImagesAutomatically = true
        settings.blockNetworkImage = false
        settings.blockNetworkLoads = false

        // ===== CONFIGURAÇÕES DE GEOLOCALIZAÇÃO =====
        settings.setGeolocationEnabled(true)

        // ===== CONFIGURAÇÕES DE ENCODING =====
        settings.defaultTextEncodingName = "utf-8"

        // ===== CONFIGURAÇÕES CONDICIONAIS (API 21+ / Lollipop) =====
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        // ===== CONFIGURAÇÕES CONDICIONAIS (API 23+ / Marshmallow) =====
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            settings.offscreenPreRaster = true
        }

        // ===== CONFIGURAÇÕES CONDICIONAIS (API 26+ / Oreo) =====
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.safeBrowsingEnabled = true
        }

        // ===== COOKIE MANAGER CONFIGURATION =====
        configureCookieManager(webView)
    }

    /**
     * Configura CookieManager de forma robusta
     * Habilita cookies de primeira e terceira parte
     */
    private fun configureCookieManager(webView: WebView) {
        val cookieManager = CookieManager.getInstance()
        
        // Aceitar cookies
        cookieManager.setAcceptCookie(true)

        // Configurações específicas para API 21+ (Lollipop)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            // Aceitar cookies de terceiros
            cookieManager.setAcceptThirdPartyCookies(webView, true)
            
            // Forçar flush para garantir persistência
            cookieManager.flush()
        }
    }
}
