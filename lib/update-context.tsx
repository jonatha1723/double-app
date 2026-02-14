import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_VERSION = "1.0.0";
const UPDATE_CHECK_URL = "https://doubleds.vercel.app/api/version";
const UPDATE_CHECK_KEY = "double_last_update_check";
const UPDATE_INFO_KEY = "double_update_info";
const UPDATE_DISMISSED_KEY = "double_update_dismissed";

export type UpdateInfo = {
  latestVersion: string;
  updateUrl: string;
  message: string;
};

type UpdateContextType = {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  downloadProgress: number;
  isDownloading: boolean;
  checkForUpdate: () => Promise<void>;
  dismissUpdate: () => Promise<void>;
  startDownload: () => void;
  handleJsBridgeUpdate: (version: string, url: string, message: string) => void;
};

const UpdateContext = createContext<UpdateContextType | null>(null);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load persisted update info on mount
  useEffect(() => {
    const loadPersistedUpdate = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(UPDATE_DISMISSED_KEY);
        if (dismissed === "true") {
          return; // User dismissed the update
        }

        const stored = await AsyncStorage.getItem(UPDATE_INFO_KEY);
        if (stored) {
          const info = JSON.parse(stored);
          setUpdateInfo(info);
          setUpdateAvailable(true);
        }
      } catch (err) {
        console.error("Failed to load persisted update:", err);
      }
    };

    loadPersistedUpdate();
  }, []);

  const checkForUpdate = useCallback(async () => {
    try {
      const response = await fetch(UPDATE_CHECK_URL);
      if (response.ok) {
        const data = await response.json();
        if (data.latest_version && data.latest_version !== APP_VERSION) {
          const info: UpdateInfo = {
            latestVersion: data.latest_version,
            updateUrl: data.update_url || "https://doubleds.vercel.app/downloads/double.apk",
            message: data.message || "Nova versão disponível!",
          };
          setUpdateInfo(info);
          setUpdateAvailable(true);
          // Persist the update info
          await AsyncStorage.setItem(UPDATE_INFO_KEY, JSON.stringify(info));
          await AsyncStorage.removeItem(UPDATE_DISMISSED_KEY);
        }
      }
    } catch (err) {
      // Silently fail - update check is not critical
      console.log("Update check failed:", err);
    }
    await AsyncStorage.setItem(UPDATE_CHECK_KEY, new Date().toISOString());
  }, []);

  const handleJsBridgeUpdate = useCallback(
    async (version: string, url: string, message: string) => {
      if (version !== APP_VERSION) {
        const info: UpdateInfo = {
          latestVersion: version,
          updateUrl: url,
          message,
        };
        setUpdateInfo(info);
        setUpdateAvailable(true);
        // Persist the update info
        await AsyncStorage.setItem(UPDATE_INFO_KEY, JSON.stringify(info));
        await AsyncStorage.removeItem(UPDATE_DISMISSED_KEY);
      }
    },
    []
  );

  const dismissUpdate = useCallback(async () => {
    setUpdateAvailable(false);
    setUpdateInfo(null);
    setDownloadProgress(0);
    setIsDownloading(false);
    // Persist dismissal
    await AsyncStorage.setItem(UPDATE_DISMISSED_KEY, "true");
  }, []);

  const startDownload = useCallback(() => {
    if (!updateInfo) return;
    setIsDownloading(true);

    // Simulate download progress for demo (on real device, use DownloadManager)
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsDownloading(false);
      }
      setDownloadProgress(Math.min(progress, 100));
    }, 500);
  }, [updateInfo]);

  // Check for updates on mount
  useEffect(() => {
    const checkOnStart = async () => {
      const lastCheck = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
      if (lastCheck) {
        const lastCheckDate = new Date(lastCheck);
        const now = new Date();
        const diffHours = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60);
        if (diffHours < 1) return; // Don't check more than once per hour
      }
      await checkForUpdate();
    };
    checkOnStart();
  }, [checkForUpdate]);

  return (
    <UpdateContext.Provider
      value={{
        updateAvailable,
        updateInfo,
        downloadProgress,
        isDownloading,
        checkForUpdate,
        dismissUpdate,
        startDownload,
        handleJsBridgeUpdate,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const ctx = useContext(UpdateContext);
  if (!ctx) {
    throw new Error("useUpdate must be used within UpdateProvider");
  }
  return ctx;
}
