import { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useUpdate } from "@/lib/update-context";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { downloadAPK, installAPK, requestUnknownSourcesPermission } from "@/lib/apk-downloader";
import { UnknownSourcesDialog, UnknownSourcesDialogRef } from "@/components/unknown-sources-dialog";
import { InstallNotification } from "@/components/install-notification";

import { ANDROID_BRIDGE_INJECTION } from "@/lib/android-bridge-injection";
import {
  requestDownload,
  requestInstall,
  checkStatus,
  deleteFile,
  requestUnknownSourcesPermission as requestBridgePermission,
} from "@/lib/android-bridge";

let WebView: any = null;
let defaultUserAgent: string | undefined = undefined;

if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").default;
    // Get Chrome User-Agent from system
    if (Platform.OS === "android") {
      const { WebView: NativeWebView } = require("react-native-webview");
      // Use a standard Chrome Mobile UA as fallback
      defaultUserAgent = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
    }
  } catch {}
}

const PRIMARY_URL = "https://doubleds.vercel.app/";
const FALLBACK_URL = "https://doubleiasss.vercel.app/";

const INJECTED_JS = ANDROID_BRIDGE_INJECTION + `
  (function() {
    // Interceptar pedidos de tela cheia do site
    const originalRequestFullscreen = Element.prototype.requestFullscreen || 
                                     Element.prototype.webkitRequestFullscreen || 
                                     Element.prototype.msRequestFullscreen;
    
    const originalExitFullscreen = document.exitFullscreen || 
                                   document.webkitExitFullscreen || 
                                   document.msExitFullscreen;

    Element.prototype.requestFullscreen = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullscreen', value: true }));
      if (originalRequestFullscreen) return originalRequestFullscreen.apply(this, arguments);
      return Promise.resolve();
    };

    document.exitFullscreen = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullscreen', value: false }));
      if (originalExitFullscreen) return originalExitFullscreen.apply(this, arguments);
      return Promise.resolve();
    };

    // Legacy AndroidApp bridge for backward compatibility
    window.AndroidApp = window.Android || {};
    window.AndroidApp.notifyUpdate = function(version, url, message) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'update',
        version: version,
        url: url,
        message: message
      }));
    };
    window.AndroidApp.downloadAPK = function(url, filename) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'downloadAPK',
        url: url,
        filename: filename || 'app.apk'
      }));
    };

    // Intercept download links
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (target && target.href) {
        var href = target.href.toLowerCase();
        var isAPK = href.endsWith('.apk');
        var downloadExts = ['.apk', '.pdf', '.zip', '.mp4', '.mp3', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.gif'];
        var isDownload = downloadExts.some(function(ext) { return href.endsWith(ext); });
        if (isDownload || target.hasAttribute('download')) {
          e.preventDefault();
          if (isAPK) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'downloadAPK',
              url: target.href,
              filename: target.getAttribute('download') || target.href.split('/').pop() || 'app.apk'
            }));
          }
        }
      }
    }, true);

    true;
  })();
`;

export default function HomeScreen() {
  const colors = useColors();
  const { handleJsBridgeUpdate } = useUpdate();

  const webViewRef = useRef<any>(null);
  const unknownSourcesDialogRef = useRef<UnknownSourcesDialogRef>(null);
  const [currentUrl, setCurrentUrl] = useState(PRIMARY_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [showInstallNotification, setShowInstallNotification] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [installNotificationData, setInstallNotificationData] = useState({
    title: "",
    message: "",
    progress: 0,
    isDownloading: false,
    isInstalling: false,
  });

  // Gerenciar o modo tela cheia dinamicamente
  useEffect(() => {
    if (Platform.OS === "android") {
      if (isFullscreen) {
        // Ativar modo imersivo (esconder status bar)
        StatusBar.setHidden(true);
      } else {
        // Voltar ao normal
        StatusBar.setHidden(false);
      }
    }
  }, [isFullscreen]);

  // Set the dialog ref to window for the bridge to use
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__unknownSourcesDialog = unknownSourcesDialogRef.current;
    }
  }, []);

  // Listen for fullscreen requests from the site
  useEffect(() => {
    const handleFullscreenRequest = (event: any) => {
      const fullscreenValue = event.detail?.fullscreen || false;
      setIsFullscreen(fullscreenValue);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("android-fullscreen-request", handleFullscreenRequest);
      return () => {
        window.removeEventListener("android-fullscreen-request", handleFullscreenRequest);
      };
    }
  }, []);

  const handleAndroidBridgeMessage = useCallback(async (data: any) => {
    try {
      const { method, apkId, url } = data;

      switch (method) {
        case "requestDownload":
          if (!apkId || !url) {
            console.error("Invalid requestDownload parameters");
            return;
          }
          try {
            await requestDownload(apkId, url);
            webViewRef.current?.injectJavaScript(
              `window.Android?.onDownloadComplete?.('${apkId}');`
            );
          } catch (err: any) {
            webViewRef.current?.injectJavaScript(
              `window.Android?.onDownloadError?.('${apkId}', '${err.message}');`
            );
          }
          break;

        case "requestInstall":
          if (!apkId) {
            console.error("Invalid requestInstall parameters");
            return;
          }
          try {
            await requestInstall(apkId);
          } catch (err: any) {
            Alert.alert("Erro", `Falha ao instalar: ${err.message}`);
          }
          break;

        case "checkStatus":
          if (!apkId) {
            console.error("Invalid checkStatus parameters");
            return;
          }
          try {
            const status = await checkStatus(apkId);
            webViewRef.current?.injectJavaScript(
              `window.Android?.onStatusCheck?.('${apkId}', '${status}');`
            );
          } catch (err: any) {
            webViewRef.current?.injectJavaScript(
              `window.Android?.onStatusError?.('${apkId}', '${err.message}');`
            );
          }
          break;

        case "deleteFile":
          if (!apkId) {
            console.error("Invalid deleteFile parameters");
            return;
          }
          try {
            await deleteFile(apkId);
            webViewRef.current?.injectJavaScript(
              `window.Android?.onFileDeleted?.('${apkId}');`
            );
          } catch (err: any) {
            webViewRef.current?.injectJavaScript(
              `window.Android?.onDeleteError?.('${apkId}', '${err.message}');`
            );
          }
          break;

        case "openInstaller":
          if (!apkId) {
            console.error("Invalid openInstaller parameters");
            return;
          }
          try {
            await requestInstall(apkId);
          } catch (err: any) {
            Alert.alert("Erro", `Falha ao abrir instalador: ${err.message}`);
          }
          break;

        case "requestPermission":
          try {
            await requestBridgePermission();
            webViewRef.current?.injectJavaScript(
              `window.Android?.onPermissionRequested?.();`
            );
          } catch (err: any) {
            console.error("Permission request error:", err);
          }
          break;

        default:
          console.warn(`Unknown Android Bridge method: ${method}`);
      }
    } catch (err) {
      console.error("Android Bridge message error:", err);
    }
  }, []);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === "update") {
          handleJsBridgeUpdate(data.version, data.url, data.message);
        } else if (data.type === "downloadAPK") {
          handleAPKDownload(data.url, data.filename);
        } else if (data.type === "androidBridge") {
          handleAndroidBridgeMessage(data);
        } else if (data.type === "fullscreen") {
          setIsFullscreen(!!data.value);
        }
      } catch (err) {
        console.log("WebView message parse error:", err);
      }
    },
    [handleJsBridgeUpdate, handleAndroidBridgeMessage]
  );

  const handleAPKDownload = useCallback(async (url: string, filename: string) => {
    try {
      // Request permission first
      const hasPermission = await requestUnknownSourcesPermission();
      if (!hasPermission && Platform.OS === "android") {
        Alert.alert(
          "Permissão necessária",
          "Por favor, ative a instalação de aplicativos de fontes desconhecidas nas configurações"
        );
        return;
      }

      const apk = await downloadAPK(url, filename);

      if (apk && Platform.OS === "android") {
        Alert.alert(
          "Download concluído",
          `${filename} foi baixado com sucesso. Deseja instalar agora?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Instalar",
              onPress: async () => {
                try {
                  await installAPK(apk.localPath);
                } catch (err: any) {
                  Alert.alert("Erro", `Falha ao instalar: ${err.message}`);
                }
              },
            },
          ]
        );
      } else if (Platform.OS === "web") {
        Alert.alert("Download iniciado", "O arquivo foi baixado no seu navegador");
      }
    } catch (err: any) {
      console.error("APK download error:", err);
      Alert.alert("Erro no download", err.message || "Falha ao baixar o arquivo");
    }
  }, []);

  const handleLoadError = useCallback(() => {
    if (!usedFallback) {
      setUsedFallback(true);
      setCurrentUrl(FALLBACK_URL);
      setHasError(false);
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  }, [usedFallback]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setUsedFallback(false);
    setCurrentUrl(PRIMARY_URL);
    setIsLoading(true);
  }, []);

  // Web platform fallback - show iframe
  if (Platform.OS === "web") {
    return (
      <View style={styles.fullScreen}>
        <View style={styles.webContainer}>
          <iframe
            src={currentUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title="Double WebView"
          />
        </View>
      </View>
    );
  }

  // Native WebView - full screen without any UI
  return (
    <View style={styles.fullScreen}>
      {hasError ? (
        <View className="flex-1 items-center justify-center p-6">
          <MaterialIcons name="wifi-off" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground mt-4">
            Sem conexão
          </Text>
          <Text className="text-sm text-muted text-center mt-2">
            Não foi possível carregar o conteúdo. Verifique sua conexão com a internet.
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            className="mt-6 rounded-xl px-6 py-3 active:opacity-80"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold" style={{ color: "#fff" }}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-sm text-muted mt-3">Carregando...</Text>
            </View>
          )}
          {WebView && (
            <WebView
              ref={webViewRef}
              source={{ uri: currentUrl }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              injectedJavaScript={INJECTED_JS}
              injectedJavaScriptBeforeContentLoaded={ANDROID_BRIDGE_INJECTION}
              onMessage={handleWebViewMessage}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={handleLoadError}
              onHttpError={(syntheticEvent: any) => {
                const { nativeEvent } = syntheticEvent;
                if (nativeEvent.statusCode >= 500) {
                  handleLoadError();
                }
              }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
              scalesPageToFit={true}
              originWhitelist={["*"]}
              userAgent={defaultUserAgent}
            />
          )}
        </>
      )}

      {/* Fallback indicator */}
      {usedFallback && !hasError && (
        <View
          className="absolute bottom-20 left-4 right-4 rounded-lg px-3 py-2 flex-row items-center"
          style={{ backgroundColor: colors.warning + "20" }}
        >
          <MaterialIcons name="info-outline" size={16} color={colors.warning} />
          <Text className="text-xs ml-2" style={{ color: colors.warning }}>
            Usando site alternativo
          </Text>
        </View>
      )}





      {/* Install Notification */}
      <InstallNotification
        visible={showInstallNotification}
        title={installNotificationData.title}
        message={installNotificationData.message}
        progress={installNotificationData.progress}
        isDownloading={installNotificationData.isDownloading}
        isInstalling={installNotificationData.isInstalling}
        onInstall={() => {
          setInstallNotificationData(prev => ({
            ...prev,
            isInstalling: true,
          }));
          setTimeout(() => setShowInstallNotification(false), 2000);
        }}
        onCancel={() => setShowInstallNotification(false)}
      />

      {/* Unknown Sources Dialog */}
      <UnknownSourcesDialog ref={unknownSourcesDialogRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    overflow: "hidden" as any,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
  },
});
