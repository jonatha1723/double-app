import { Platform, View, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRef, useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(PRIMARY_URL);

  const handleWebViewError = () => {
    console.log("Primary URL failed, trying fallback...");
    setCurrentUrl(FALLBACK_URL);
  };

  const handleLoadEnd = () => {
    setLoading(false);
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
    <ScreenContainer containerClassName={`bg-${colors.background}`} edges={["top", "left", "right", "bottom"]}>
      {loading && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, zIndex: 999 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={{ flex: 1 }}
        onError={handleWebViewError}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalePageToFit={true}
      />
    </ScreenContainer>
  );
}
