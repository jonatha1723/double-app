import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const DOWNLOADS_KEY = "double_downloads";

export type DownloadedFile = {
  id: string;
  name: string;
  uri: string;
  size: number;
  mimeType: string;
  downloadedAt: string;
  firebaseUrl?: string;
};

type DownloadsContextType = {
  files: DownloadedFile[];
  isLoading: boolean;
  addDownload: (file: Omit<DownloadedFile, "id" | "downloadedAt">) => Promise<void>;
  removeDownload: (id: string) => Promise<void>;
  refreshDownloads: () => Promise<void>;
};

const DownloadsContext = createContext<DownloadsContextType | null>(null);

export function DownloadsProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDownloads = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (stored) {
        setFiles(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load downloads:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDownloads = useCallback(async (downloads: DownloadedFile[]) => {
    try {
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
    } catch (err) {
      console.error("Failed to save downloads:", err);
    }
  }, []);

  const addDownload = useCallback(
    async (file: Omit<DownloadedFile, "id" | "downloadedAt">) => {
      const newFile: DownloadedFile = {
        ...file,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        downloadedAt: new Date().toISOString(),
      };
      const updated = [newFile, ...files];
      setFiles(updated);
      await saveDownloads(updated);
    },
    [files, saveDownloads]
  );

  const removeDownload = useCallback(
    async (id: string) => {
      const updated = files.filter((f) => f.id !== id);
      setFiles(updated);
      await saveDownloads(updated);
    },
    [files, saveDownloads]
  );

  const refreshDownloads = useCallback(async () => {
    setIsLoading(true);
    await loadDownloads();
  }, [loadDownloads]);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  return (
    <DownloadsContext.Provider
      value={{
        files,
        isLoading,
        addDownload,
        removeDownload,
        refreshDownloads,
      }}
    >
      {children}
    </DownloadsContext.Provider>
  );
}

export function useDownloads() {
  const ctx = useContext(DownloadsContext);
  if (!ctx) {
    throw new Error("useDownloads must be used within DownloadsProvider");
  }
  return ctx;
}
