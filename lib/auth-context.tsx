import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type User as FirebaseUser } from "firebase/auth";
import {
  loginWithEmail,
  registerWithEmail,
  logoutFirebase,
  onAuthChange,
  getCurrentUser,
} from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthState = {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_PERSISTENCE_KEY = "double_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        await AsyncStorage.setItem(
          AUTH_PERSISTENCE_KEY,
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          })
        );
      } else {
        await AsyncStorage.removeItem(AUTH_PERSISTENCE_KEY);
      }
      setState((prev) => ({ ...prev, user, loading: false }));
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      let message = "Erro ao fazer login";
      if (err.code === "auth/user-not-found") message = "Usuário não encontrado";
      else if (err.code === "auth/wrong-password") message = "Senha incorreta";
      else if (err.code === "auth/invalid-email") message = "Email inválido";
      else if (err.code === "auth/invalid-credential") message = "Credenciais inválidas";
      else if (err.code === "auth/too-many-requests")
        message = "Muitas tentativas. Tente novamente mais tarde.";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await registerWithEmail(email, password);
    } catch (err: any) {
      let message = "Erro ao criar conta";
      if (err.code === "auth/email-already-in-use") message = "Este email já está em uso";
      else if (err.code === "auth/weak-password") message = "Senha muito fraca (mínimo 6 caracteres)";
      else if (err.code === "auth/invalid-email") message = "Email inválido";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      await logoutFirebase();
      await AsyncStorage.removeItem(AUTH_PERSISTENCE_KEY);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useFirebaseAuth must be used within AuthProvider");
  }
  return ctx;
}
