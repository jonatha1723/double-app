import { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFirebaseAuth } from "@/lib/auth-context";
import { useUpdate } from "@/lib/update-context";
import { useDownloads } from "@/lib/downloads-context";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

let WebView: any = null;
if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").default;
  } catch {}
}

const PRIMARY_URL = "https://doubleds.vercel.app/";
const FALLBACK_URL = "https://filme-indol-one.vercel.app/";

const INJECTED_JS = `
  (function() {
    // Create AndroidApp bridge for the site to communicate with the app
    window.AndroidApp = {
      notifyUpdate: function(version, url, message) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'update',
          version: version,
          url: url,
          message: message
        }));
      }
    };

    // Intercept download links
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (target && target.href) {
        var href = target.href.toLowerCase();
        var downloadExts = ['.apk', '.pdf', '.zip', '.mp4', '.mp3', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.gif'];
        var isDownload = downloadExts.some(function(ext) { return href.endsWith(ext); });
        if (isDownload || target.hasAttribute('download')) {
          e.preventDefault();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'download',
            url: target.href,
            filename: target.getAttribute('download') || target.href.split('/').pop()
          }));
        }
      }
    }, true);

    true;
  })();
`;

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading } = useFirebaseAuth();
  const { handleJsBridgeUpdate, updateAvailable } = useUpdate();
  const { addDownload } = useDownloads();

  const webViewRef = useRef<any>(null);
  const [currentUrl, setCurrentUrl] = useState(PRIMARY_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login" as any);
    }
  }, [authLoading, user, router]);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "update") {
          handleJsBridgeUpdate(data.version, data.url, data.message);
        } else if (data.type === "download") {
          addDownload({
            name: data.filename || "arquivo",
            uri: data.url,
            size: 0,
            mimeType: "application/octet-stream",
          });
        }
      } catch (err) {
        console.log("WebView message parse error:", err);
      }
    },
    [handleJsBridgeUpdate, addDownload]
  );

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

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!user) {
    return null;
  }

  // Web platform fallback - show iframe or link
  if (Platform.OS === "web") {
    return (
      <ScreenContainer className="p-0" edges={["top", "left", "right"]}>
        {/* Update banner */}
        {updateAvailable && (
          <TouchableOpacity
            onPress={() => router.push("/update" as any)}
            className="flex-row items-center justify-center py-2 px-4"
            style={{ backgroundColor: colors.primary }}
          >
            <MaterialIcons name="system-update" size={18} color="#fff" />
            <Text className="text-sm font-medium ml-2" style={{ color: "#fff" }}>
              Nova atualização disponível!
            </Text>
          </TouchableOpacity>
        )}
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
      </ScreenContainer>
    );
  }

  // Native WebView
  return (
    <ScreenContainer className="p-0" edges={["top", "left", "right"]}>
      {/* Update banner */}
      {updateAvailable && (
        <TouchableOpacity
          onPress={() => router.push("/update" as any)}
          className="flex-row items-center justify-center py-2 px-4"
          style={{ backgroundColor: colors.primary }}
        >
          <MaterialIcons name="system-update" size={18} color="#fff" />
          <Text className="text-sm font-medium ml-2" style={{ color: "#fff" }}>
            Nova atualização disponível!
          </Text>
        </TouchableOpacity>
      )}

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
            />
          )}
        </>
      )}

      {/* Fallback indicator */}
      {usedFallback && !hasError && (
        <View
          className="absolute bottom-2 left-4 right-4 rounded-lg px-3 py-2 flex-row items-center"
          style={{ backgroundColor: colors.warning + "20" }}
        >
          <MaterialIcons name="info-outline" size={16} color={colors.warning} />
          <Text className="text-xs ml-2" style={{ color: colors.warning }}>
            Usando site alternativo
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
