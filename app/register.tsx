import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useFirebaseAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { Image } from "expo-image";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { register, loading, error, clearError } = useFirebaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLocalError(null);
    if (!email.trim() || !password.trim()) return;
    if (password !== confirmPassword) {
      setLocalError("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      setLocalError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    try {
      await register(email.trim(), password);
      router.replace("/(tabs)");
    } catch {
      // Error is handled by context
    }
  };

  const displayError = localError || error;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-10">
            <View
              style={[styles.logoContainer, { backgroundColor: colors.primary + "15" }]}
            >
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Text className="text-3xl font-bold text-foreground mt-4">Criar Conta</Text>
            <Text className="text-base text-muted mt-1">Registre-se no Double</Text>
          </View>

          {displayError && (
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: colors.error + "15" }}
            >
              <Text style={{ color: colors.error }} className="text-sm text-center">
                {displayError}
              </Text>
            </View>
          )}

          <View className="gap-4 w-full">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
                placeholder="seu@email.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={(text) => {
                  clearError();
                  setLocalError(null);
                  setEmail(text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={{ color: colors.foreground, fontSize: 16 }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Senha</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={(text) => {
                  clearError();
                  setLocalError(null);
                  setPassword(text);
                }}
                secureTextEntry
                returnKeyType="next"
                style={{ color: colors.foreground, fontSize: 16 }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Confirmar Senha
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
                placeholder="Repita a senha"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={(text) => {
                  setLocalError(null);
                  setConfirmPassword(text);
                }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                style={{ color: colors.foreground, fontSize: 16 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
              className="rounded-xl py-4 items-center mt-2 active:opacity-80"
              style={[
                styles.registerButton,
                {
                  backgroundColor: colors.primary,
                  opacity:
                    loading || !email.trim() || !password.trim() || !confirmPassword.trim()
                      ? 0.6
                      : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold" style={{ color: "#fff" }}>
                  Criar Conta
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-muted text-sm">Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.back()} className="active:opacity-60">
              <Text style={{ color: colors.primary }} className="text-sm font-semibold">
                Fazer login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: 80,
    height: 80,
  },
  registerButton: {
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
