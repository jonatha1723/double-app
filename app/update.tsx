import { useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useUpdate } from "@/lib/update-context";
import { useColors } from "@/hooks/use-colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function UpdateScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    updateInfo,
    messages,
    downloadProgress,
    isDownloading,
    startDownload,
    dismissUpdate,
  } = useUpdate();

  const flatListRef = useRef<FlatList>(null);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(downloadProgress, { duration: 300 });
  }, [downloadProgress, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleDismiss = () => {
    dismissUpdate();
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-0">
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 border-b border-border"
        style={{ backgroundColor: colors.surface }}
      >
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.backButton}
          className="active:opacity-60"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-lg font-semibold text-foreground">
            Atualização Disponível
          </Text>
          {updateInfo && (
            <Text className="text-xs text-muted">
              v{updateInfo.latestVersion}
            </Text>
          )}
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: colors.success + "20" }}
        >
          <Text style={{ color: colors.success }} className="text-xs font-medium">
            Nova versão
          </Text>
        </View>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        renderItem={({ item }) => (
          <View
            className={`mb-3 max-w-[85%] ${
              item.type === "system" ? "self-start" : "self-end"
            }`}
          >
            <View
              className="rounded-2xl px-4 py-3"
              style={[
                item.type === "system"
                  ? {
                      backgroundColor: colors.surface,
                      borderBottomLeftRadius: 4,
                    }
                  : {
                      backgroundColor: colors.primary,
                      borderBottomRightRadius: 4,
                    },
              ]}
            >
              <Text
                className="text-sm leading-5"
                style={{
                  color: item.type === "system" ? colors.foreground : "#fff",
                }}
              >
                {item.text}
              </Text>
            </View>
            <Text
              className="text-[10px] mt-1 px-1"
              style={{ color: colors.muted }}
            >
              {item.timestamp.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <MaterialIcons name="system-update" size={48} color={colors.muted} />
            <Text className="text-muted mt-4 text-center">
              Verificando atualizações...
            </Text>
          </View>
        }
      />

      {/* Download Progress */}
      {isDownloading && (
        <View className="px-4 py-2">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-muted">Baixando...</Text>
            <Text className="text-xs text-muted">
              {Math.round(downloadProgress)}%
            </Text>
          </View>
          <View
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.border }}
          >
            <Animated.View
              className="h-full rounded-full"
              style={[{ backgroundColor: colors.primary }, progressStyle]}
            />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="px-4 py-4 border-t border-border" style={{ backgroundColor: colors.surface }}>
        {downloadProgress >= 100 ? (
          <TouchableOpacity
            className="rounded-xl py-4 items-center active:opacity-80"
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => {
              // On real device: trigger APK install intent
              // For demo: show success message
            }}
          >
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="install-mobile" size={20} color="#fff" />
              <Text className="text-base font-semibold" style={{ color: "#fff" }}>
                Instalar Atualização
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 rounded-xl py-4 items-center active:opacity-80 border border-border"
              onPress={handleDismiss}
            >
              <Text className="text-base font-medium text-muted">Depois</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-[2] rounded-xl py-4 items-center active:opacity-80"
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={startDownload}
              disabled={isDownloading}
            >
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="file-download" size={20} color="#fff" />
                <Text className="text-base font-semibold" style={{ color: "#fff" }}>
                  {isDownloading ? "Baixando..." : "Baixar Atualização"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chatContainer: {
    padding: 16,
    flexGrow: 1,
  },
  actionButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
