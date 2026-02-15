import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import * as IntentLauncher from "expo-intent-launcher";

export function SettingsFAB() {
  const colors = useColors();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOpenUnknownSources = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Aviso", "Esta funcionalidade está disponível apenas no Android");
      return;
    }

    try {
      await IntentLauncher.startActivityAsync(
        "android.settings.action.MANAGE_UNKNOWN_APP_SOURCES"
      );
      setIsExpanded(false);
    } catch (err) {
      Alert.alert(
        "Erro",
        "Não foi possível abrir as configurações. Acesse manualmente: Configurações > Apps > Permissões > Instalar apps desconhecidos"
      );
    }
  };

  const handleOpenAppSettings = async () => {
    if (Platform.OS !== "android") {
      Alert.alert("Aviso", "Esta funcionalidade está disponível apenas no Android");
      return;
    }

    try {
      await IntentLauncher.startActivityAsync("android.settings.action.APPLICATION_SETTINGS");
      setIsExpanded(false);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível abrir as configurações");
    }
  };

  return (
    <View style={styles.container}>
      {/* Expanded menu */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setIsExpanded(false)}
            activeOpacity={0}
          />

          {/* Menu items */}
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Unknown Sources Option */}
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={handleOpenUnknownSources}
            >
              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <MaterialIcons
                    name="security"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Fontes Desconhecidas
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: colors.muted },
                    ]}
                  >
                    Permitir instalação de APKs
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* App Settings Option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleOpenAppSettings}
            >
              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <MaterialIcons
                    name="settings"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.menuItemTextContainer}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Configurações do App
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: colors.muted },
                    ]}
                  >
                    Permissões e dados
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={isExpanded ? "close" : "settings"}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  menu: {
    position: "absolute",
    bottom: 70,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    minWidth: 240,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
  },
});
