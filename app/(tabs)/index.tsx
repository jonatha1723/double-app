import { Platform, View, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRef, useEffect, useState } from "react";
import { InstallNotification } from "@/components/install-notification";
import { UnknownSourcesDialog, type UnknownSourcesDialogRef } from "@/components/unknown-sources-dialog";
import * as IntentLauncher from "expo-intent-launcher";
import { AndroidBridge } from "@/utils/android-bridge";

let WebView: any = null;

if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").default;
  } catch (err) {
    console.error("Failed to load WebView:", err);
  }
}

const PRIMARY_URL = "https://doubleds.vercel.app/";
const FALLBACK_URL = "https://doubleiasss.vercel.app/";

export default function HomeScreen() {
  const colors = useColors();
  const webViewRef = useRef<any>(null);
  const dialogRef = useRef<UnknownSourcesDialogRef>(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(PRIMARY_URL);
  const [installNotification, setInstallNotification] = useState({
    visible: false,
    title: "",
    message: "",
    progress: 0,
    isDownloading: false,
    isInstalling: false,
  });

  // Initialize Android Bridge
  const androidBridgeRef = useRef<AndroidBridge | null>(null);

  useEffect(() => {
    androidBridgeRef.current = new AndroidBridge({
      onDownloadProgress: (apkId, progress) => {
        setInstallNotification((prev) => ({
          ...prev,
          progress,
          isDownloading: true,
        }));
      },
      onDownloadComplete: (apkId, success) => {
        setInstallNotification((prev) => ({
          ...prev,
          isDownloading: false,
          message: success ? "Pronto para instalar" : "Erro ao baixar",
        }));
      },
      onInstallStart: (apkId) => {
        setInstallNotification((prev) => ({
          ...prev,
          isInstalling: true,
          message: "Abrindo instalador...",
        }));
      },
      onStatusChange: (apkId, status) => {
        console.log(`APK ${apkId} status: ${status}`);
        if (status === "requested") {
          // Permission requested
          dialogRef.current?.show();
        }
      },
    });
  }, []);

  const handleWebViewError = () => {
    console.log("Primary URL failed, trying fallback...");
    setCurrentUrl(FALLBACK_URL);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = event.nativeEvent.data;
      console.log("WebView message received:", message);
      
      if (androidBridgeRef.current) {
        androidBridgeRef.current.handleWebViewMessage(message);
      }

      // Parse and handle specific message types
      try {
        const data = JSON.parse(message);
        
        if (data.type === "requestDownload" || data.type === "requestInstall") {
          setInstallNotification({
            visible: true,
            title: data.apkId || "APK",
            message: "Pronto para baixar e instalar",
            progress: 0,
            isDownloading: false,
            isInstalling: false,
          });
        }
      } catch (e) {
        // Not JSON, ignore
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  };

  const handleInstallPress = () => {
    // Show permission dialog
    dialogRef.current?.show(() => {
      setInstallNotification((prev) => ({
        ...prev,
        isInstalling: true,
        message: "Instalando...",
      }));
    });
  };

  const handleCancelPress = () => {
    setInstallNotification((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === "android") {
        await IntentLauncher.startActivityAsync(
          "android.settings.action.MANAGE_UNKNOWN_APP_SOURCES"
        );
      }
    } catch (error) {
      console.error("Failed to open settings:", error);
    }
  };

  if (Platform.OS === "web" || !WebView) {
    return (
      <ScreenContainer className="items-center justify-center">
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      containerClassName={`bg-${colors.background}`}
      edges={["top", "left", "right", "bottom"]}
    >
      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
            zIndex: 999,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={{ flex: 1 }}
        onError={handleWebViewError}
        onLoadEnd={handleLoadEnd}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalePageToFit={true}
        injectedJavaScript={
          androidBridgeRef.current?.getInjectedJavaScript() || ""
        }
      />

      <InstallNotification
        visible={installNotification.visible}
        title={installNotification.title}
        message={installNotification.message}
        progress={installNotification.progress}
        onInstall={handleInstallPress}
        onCancel={handleCancelPress}
        isDownloading={installNotification.isDownloading}
        isInstalling={installNotification.isInstalling}
      />

      <UnknownSourcesDialog
        ref={dialogRef}
        onPermissionGranted={() => {
          console.log("Permission granted");
        }}
        onPermissionDenied={() => {
          console.log("Permission denied");
          setInstallNotification((prev) => ({
            ...prev,
            visible: false,
          }));
        }}
      />
    </ScreenContainer>
  );
}
