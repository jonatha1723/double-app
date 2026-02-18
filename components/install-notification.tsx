import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";

export interface InstallNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  progress?: number; // 0-100
  onInstall?: () => void;
  onCancel?: () => void;
  isDownloading?: boolean;
  isInstalling?: boolean;
}

export function InstallNotification({
  visible,
  title,
  message,
  progress = 0,
  onInstall,
  onCancel,
  isDownloading = false,
  isInstalling = false,
}: InstallNotificationProps) {
  const colors = useColors();
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [isShowing, setIsShowing] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsShowing(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsShowing(false);
      });
    }
  }, [visible, slideAnim]);

  if (!isShowing) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 0],
  });

  const progressPercent = Math.min(Math.max(progress, 0), 100);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View
            style={[
              styles.icon,
              {
                backgroundColor: colors.primary + "20",
              },
            ]}
          >
            <MaterialIcons
              name={isInstalling ? "install-mobile" : "download"}
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.titleText}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.muted }]}
              numberOfLines={2}
            >
              {message}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      {(isDownloading || isInstalling) && (
        <View
          style={[
            styles.progressContainer,
            { backgroundColor: colors.border + "40" },
          ]}
        >
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercent}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      )}

      {/* Progress Text */}
      {(isDownloading || isInstalling) && (
        <Text
          style={[
            styles.progressText,
            { color: colors.muted },
          ]}
        >
          {isInstalling ? "Instalando..." : `Baixando... ${Math.round(progressPercent)}%`}
        </Text>
      )}

      {/* Actions */}
      {!isDownloading && !isInstalling && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              { borderColor: colors.border },
            ]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={20} color={colors.muted} />
            <Text style={[styles.buttonText, { color: colors.muted }]}>
              Cancelar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.installButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={onInstall}
            activeOpacity={0.8}
          >
            <MaterialIcons name="download" size={20} color="#fff" />
            <Text style={[styles.buttonText, { color: "#fff" }]}>
              Baixar & Instalar
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Installing State */}
      {isInstalling && (
        <View style={styles.installingContainer}>
          <MaterialIcons
            name="check-circle"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.installingText, { color: colors.foreground }]}>
            Abrindo instalador...
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1000,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    borderWidth: 1,
  },
  installButton: {
    minWidth: 140,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  installingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  installingText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
