import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import * as IntentLauncher from "expo-intent-launcher";

export interface UnknownSourcesDialogRef {
  show: (onConfirm?: () => void) => void;
  hide: () => void;
}

interface UnknownSourcesDialogProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export const UnknownSourcesDialog = forwardRef<UnknownSourcesDialogRef, UnknownSourcesDialogProps>(({
  onPermissionGranted,
  onPermissionDenied,
}, ref) => {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const show = useCallback((callback?: () => void) => {
    setOnConfirm(() => callback || null);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    setOnConfirm(null);
  }, []);

  useImperativeHandle(ref, () => ({
    show,
    hide,
  }));

  const handleOpenSettings = useCallback(async () => {
    if (Platform.OS !== "android") {
      return;
    }

    try {
      setIsLoading(true);
      // Open Android settings for unknown app sources
      await IntentLauncher.startActivityAsync("android.settings.action.MANAGE_UNKNOWN_APP_SOURCES");
      
      // Give user time to enable the permission
      setTimeout(() => {
        setIsLoading(false);
        setVisible(false);
        onPermissionGranted?.();
        onConfirm?.();
      }, 1000);
    } catch (err) {
      setIsLoading(false);
      console.error("Failed to open settings:", err);
      Alert.alert(
        "Erro",
        "Não foi possível abrir as configurações. Por favor, ative manualmente em Configurações > Apps > Permissões > Instalar apps desconhecidos"
      );
      onPermissionDenied?.();
    }
  }, [onPermissionGranted, onPermissionDenied, onConfirm]);

  const handleCancel = useCallback(() => {
    setVisible(false);
    setOnConfirm(null);
    onPermissionDenied?.();
  }, [onPermissionDenied]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <MaterialIcons
              name="security"
              size={48}
              color={colors.primary}
            />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: colors.foreground },
            ]}
          >
            Permitir instalação de apps desconhecidos?
          </Text>

          {/* Description */}
          <Text
            style={[
              styles.description,
              { color: colors.muted },
            ]}
          >
            Para instalar este aplicativo, você precisa permitir a instalação de apps de fontes desconhecidas. Isso será feito apenas uma vez.
          </Text>

          {/* Warning */}
          <View
            style={[
              styles.warningBox,
              { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" },
            ]}
          >
            <MaterialIcons
              name="info"
              size={16}
              color={colors.warning}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.warningText,
                { color: colors.warning },
              ]}
            >
              Apenas instale apps de fontes confiáveis
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isLoading}
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: colors.border },
                isLoading && { opacity: 0.5 },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: colors.muted },
                ]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenSettings}
              disabled={isLoading}
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: colors.primary },
                isLoading && { opacity: 0.7 },
              ]}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.buttonText, { color: "#fff" }]}>
                    Abrindo...
                  </Text>
                </View>
              ) : (
                <>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.buttonText, { color: "#fff" }]}>
                    Abrir Configurações
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            <Text
              style={[
                styles.stepsTitle,
                { color: colors.foreground },
              ]}
            >
              Como fazer:
            </Text>
            <View style={styles.step}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text
                style={[
                  styles.stepText,
                  { color: colors.muted },
                ]}
              >
                Toque em "Abrir Configurações"
              </Text>
            </View>
            <View style={styles.step}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text
                style={[
                  styles.stepText,
                  { color: colors.muted },
                ]}
              >
                Ative a opção "Permitir desta fonte"
              </Text>
            </View>
            <View style={styles.step}>
              <View
                style={[
                  styles.stepNumber,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text
                style={[
                  styles.stepText,
                  { color: colors.muted },
                ]}
              >
                Volte e tente instalar novamente
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialog: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    maxWidth: 400,
    width: "100%",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    flexDirection: "row",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepsContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  stepText: {
    fontSize: 13,
    flex: 1,
  },
});
