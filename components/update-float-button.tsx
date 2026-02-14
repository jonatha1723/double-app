import { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Platform, Alert } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useUpdate } from "@/lib/update-context";
import { downloadAPK, installAPK, requestUnknownSourcesPermission } from "@/lib/apk-downloader";

export function UpdateFloatButton() {
  const colors = useColors();
  const { updateAvailable, updateInfo, downloadProgress, isDownloading, dismissUpdate } =
    useUpdate();
  const [isDownloadingAPK, setIsDownloadingAPK] = useState(false);

  const scaleValue = useSharedValue(0);

  useEffect(() => {
    if (updateAvailable) {
      scaleValue.value = withSpring(1, { damping: 10, mass: 1 });
    } else {
      scaleValue.value = withSpring(0, { damping: 10, mass: 1 });
    }
  }, [updateAvailable, scaleValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handleDownload = async () => {
    if (!updateInfo) return;

    try {
      setIsDownloadingAPK(true);

      // Request permission first
      const hasPermission = await requestUnknownSourcesPermission();
      if (!hasPermission && Platform.OS === "android") {
        Alert.alert(
          "Permissão necessária",
          "Por favor, ative a instalação de aplicativos de fontes desconhecidas nas configurações"
        );
        setIsDownloadingAPK(false);
        return;
      }

      const apk = await downloadAPK(updateInfo.updateUrl, "double-update.apk", (progress) => {
        // Progress is handled by context
      });

      setIsDownloadingAPK(false);

      if (apk && Platform.OS === "android") {
        Alert.alert(
          "Download concluído",
          `${updateInfo.latestVersion} foi baixado com sucesso. Deseja instalar agora?`,
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
        Alert.alert("Download iniciado", "A atualização foi iniciada no seu navegador");
      }
    } catch (err: any) {
      setIsDownloadingAPK(false);
      console.error("Download error:", err);
      Alert.alert("Erro no download", err.message || "Falha ao baixar a atualização");
    }
  };

  if (!updateAvailable || !updateInfo) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      entering={FadeIn}
      exiting={FadeOut}
    >
      <TouchableOpacity
        onPress={handleDownload}
        disabled={isDownloadingAPK || isDownloading}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            opacity: isDownloadingAPK || isDownloading ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.content}>
          <MaterialIcons name="system-update" size={20} color="#fff" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Atualização disponível</Text>
            <Text style={styles.version}>v{updateInfo.latestVersion}</Text>
          </View>
          {isDownloadingAPK || isDownloading ? (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
            </View>
          ) : (
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={dismissUpdate}
        disabled={isDownloadingAPK || isDownloading}
        style={[styles.closeButton, { backgroundColor: colors.surface }]}
      >
        <MaterialIcons name="close" size={18} color={colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  version: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  progressContainer: {
    minWidth: 40,
    alignItems: "center",
  },
  progressText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
