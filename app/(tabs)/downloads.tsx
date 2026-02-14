import { useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useDownloads, type DownloadedFile } from "@/lib/downloads-context";
import { useFirebaseAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "movie";
  if (mimeType.startsWith("audio/")) return "audiotrack";
  if (mimeType.includes("pdf")) return "picture-as-pdf";
  if (mimeType.includes("apk") || mimeType.includes("android")) return "android";
  return "description";
}

function getFileColor(mimeType: string, colors: any): string {
  if (mimeType.startsWith("image/")) return "#FF6B6B";
  if (mimeType.startsWith("video/")) return "#4ECDC4";
  if (mimeType.startsWith("audio/")) return "#45B7D1";
  if (mimeType.includes("pdf")) return "#D63031";
  if (mimeType.includes("apk")) return "#00B894";
  return colors.primary;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "Tamanho desconhecido";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DownloadItem({
  item,
  onDelete,
  colors,
}: {
  item: DownloadedFile;
  onDelete: (id: string) => void;
  colors: any;
}) {
  const iconName = getFileIcon(item.mimeType);
  const iconColor = getFileColor(item.mimeType, colors);

  const handleDelete = () => {
    if (Platform.OS === "web") {
      onDelete(item.id);
    } else {
      Alert.alert("Excluir arquivo", `Deseja excluir "${item.name}"?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => onDelete(item.id) },
      ]);
    }
  };

  return (
    <View
      className="flex-row items-center p-4 mx-4 mb-3 rounded-xl border border-border"
      style={{ backgroundColor: colors.surface }}
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center"
        style={{ backgroundColor: iconColor + "15" }}
      >
        <MaterialIcons name={iconName as any} size={24} color={iconColor} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-muted mt-0.5">
          {formatFileSize(item.size)} · {formatDate(item.downloadedAt)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleDelete}
        className="p-2 active:opacity-60"
      >
        <MaterialIcons name="delete-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
}

export default function DownloadsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { files, isLoading, removeDownload, refreshDownloads } = useDownloads();
  const { user, loading: authLoading } = useFirebaseAuth();

  const handleDelete = useCallback(
    (id: string) => {
      removeDownload(id);
    },
    [removeDownload]
  );

  if (!authLoading && !user) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <MaterialIcons name="lock" size={48} color={colors.muted} />
        <Text className="text-lg font-semibold text-foreground mt-4">
          Login necessário
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          Faça login para ver seus downloads
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/login" as any)}
          className="mt-4 rounded-xl px-6 py-3 active:opacity-80"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-base font-semibold" style={{ color: "#fff" }}>
            Fazer Login
          </Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-foreground">Downloads</Text>
        <Text className="text-sm text-muted mt-1">
          {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
        </Text>
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DownloadItem item={item} onDelete={handleDelete} colors={colors} />
        )}
        onRefresh={refreshDownloads}
        refreshing={isLoading}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <MaterialIcons name="cloud-download" size={64} color={colors.muted} />
            <Text className="text-lg font-semibold text-foreground mt-4">
              Nenhum download
            </Text>
            <Text className="text-sm text-muted text-center mt-2 px-8">
              Os arquivos baixados do site aparecerão aqui
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({});
