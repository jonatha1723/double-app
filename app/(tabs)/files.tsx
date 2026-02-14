import { useCallback, useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useFirebaseAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { uploadFile, listUserFiles, deleteFile } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

type CloudFile = {
  name: string;
  fullPath: string;
  url: string;
};

const FILES_CACHE_KEY = "double_cloud_files";

export default function FilesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();

  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCloudFiles = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const files = await listUserFiles(user.uid);
      setCloudFiles(files);
      await AsyncStorage.setItem(FILES_CACHE_KEY, JSON.stringify(files));
    } catch (err: any) {
      console.error("Failed to load cloud files:", err);
      // Try loading from cache
      const cached = await AsyncStorage.getItem(FILES_CACHE_KEY);
      if (cached) {
        setCloudFiles(JSON.parse(cached));
      }
      setError("Não foi possível carregar os arquivos da nuvem");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCloudFiles();
    }
  }, [user, loadCloudFiles]);

  const handleDeleteCloudFile = useCallback(
    async (file: CloudFile) => {
      const doDelete = async () => {
        try {
          await deleteFile(file.fullPath);
          setCloudFiles((prev) => prev.filter((f) => f.fullPath !== file.fullPath));
        } catch (err) {
          console.error("Delete failed:", err);
          if (Platform.OS !== "web") {
            Alert.alert("Erro", "Não foi possível excluir o arquivo");
          }
        }
      };

      if (Platform.OS === "web") {
        doDelete();
      } else {
        Alert.alert("Excluir arquivo", `Deseja excluir "${file.name}" da nuvem?`, [
          { text: "Cancelar", style: "cancel" },
          { text: "Excluir", style: "destructive", onPress: doDelete },
        ]);
      }
    },
    []
  );

  if (!authLoading && !user) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <MaterialIcons name="lock" size={48} color={colors.muted} />
        <Text className="text-lg font-semibold text-foreground mt-4">
          Login necessário
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          Faça login para gerenciar seus arquivos
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
        <Text className="text-2xl font-bold text-foreground">Arquivos</Text>
        <Text className="text-sm text-muted mt-1">
          Firebase Storage · {cloudFiles.length}{" "}
          {cloudFiles.length === 1 ? "arquivo" : "arquivos"}
        </Text>
      </View>

      {error && (
        <View
          className="mx-4 mb-3 rounded-xl p-3 flex-row items-center"
          style={{ backgroundColor: colors.warning + "15" }}
        >
          <MaterialIcons name="warning" size={18} color={colors.warning} />
          <Text className="text-xs ml-2 flex-1" style={{ color: colors.warning }}>
            {error}
          </Text>
          <TouchableOpacity onPress={loadCloudFiles}>
            <MaterialIcons name="refresh" size={18} color={colors.warning} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={cloudFiles}
        keyExtractor={(item) => item.fullPath}
        onRefresh={loadCloudFiles}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <View
            className="flex-row items-center p-4 mx-4 mb-3 rounded-xl border border-border"
            style={{ backgroundColor: colors.surface }}
          >
            <View
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.primary + "15" }}
            >
              <MaterialIcons name="cloud" size={24} color={colors.primary} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
                {item.fullPath}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteCloudFile(item)}
              className="p-2 active:opacity-60"
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-sm text-muted mt-4">Carregando arquivos...</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <MaterialIcons name="cloud-queue" size={64} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                Nenhum arquivo
              </Text>
              <Text className="text-sm text-muted text-center mt-2 px-8">
                Seus arquivos do Firebase Storage aparecerão aqui
              </Text>
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({});
