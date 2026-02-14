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

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login, loading, error, clearError } = useFirebaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch {
      // Error is handled by context
    }
  };

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
            <Text className="text-3xl font-bold text-foreground mt-4">Double</Text>
            <Text className="text-base text-muted mt-1">Entre na sua conta</Text>
          </View>

          {error && (
            <View
              className="bg-error/10 rounded-xl p-4 mb-4"
              style={{ backgroundColor: colors.error + "15" }}
            >
              <Text style={{ color: colors.error }} className="text-sm text-center">
                {error}
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
              <View className="relative">
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground pr-12"
                  placeholder="Sua senha"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={(text) => {
                    clearError();
                    setPassword(text);
                  }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={{ color: colors.foreground, fontSize: 16 }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  className="active:opacity-60"
                >
                  <Text style={{ color: colors.muted, fontSize: 14 }}>
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading || !email.trim() || !password.trim()}
              className="rounded-xl py-4 items-center mt-2 active:opacity-80"
              style={[
                styles.loginButton,
                {
                  backgroundColor: colors.primary,
                  opacity: loading || !email.trim() || !password.trim() ? 0.6 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold" style={{ color: "#fff" }}>
                  Entrar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-center mt-8">
            <Text className="text-muted text-sm">Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push("/register" as any)} className="active:opacity-60">
              <Text style={{ color: colors.primary }} className="text-sm font-semibold">
                Criar conta
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
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  loginButton: {
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
