import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}apk_downloads/`;
const APK_REGISTRY_KEY = "android_bridge_apk_registry";

export type APKStatus = "pending" | "downloading" | "downloaded" | "installing" | "installed" | "error";

export type APKInfo = {
  id: string;
  url: string;
  filename: string;
  status: APKStatus;
  localPath?: string;
  downloadedAt?: string;
  error?: string;
};

// Ensure downloads directory exists
async function ensureDownloadsDir() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
    }
  } catch (err) {
    console.error("Failed to create downloads directory:", err);
  }
}

// Get APK registry
async function getAPKRegistry(): Promise<Record<string, APKInfo>> {
  try {
    const registry = await AsyncStorage.getItem(APK_REGISTRY_KEY);
    return registry ? JSON.parse(registry) : {};
  } catch (err) {
    console.error("Failed to get APK registry:", err);
    return {};
  }
}

// Save APK registry
async function saveAPKRegistry(registry: Record<string, APKInfo>) {
  try {
    await AsyncStorage.setItem(APK_REGISTRY_KEY, JSON.stringify(registry));
  } catch (err) {
    console.error("Failed to save APK registry:", err);
  }
}

// Get APK info
export async function getAPKInfo(apkId: string): Promise<APKInfo | null> {
  const registry = await getAPKRegistry();
  return registry[apkId] || null;
}

// Check if file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

// Request download - checks if file exists, downloads if not
export async function requestDownload(
  apkId: string,
  url: string,
  onProgress?: (progress: number) => void
): Promise<APKInfo> {
  try {
    await ensureDownloadsDir();

    const registry = await getAPKRegistry();
    const filename = url.split("/").pop() || `${apkId}.apk`;
    const localPath = `${DOWNLOADS_DIR}${filename}`;

    // Check if file already exists
    const exists = await fileExists(localPath);
    if (exists) {
      const info: APKInfo = {
        id: apkId,
        url,
        filename,
        status: "downloaded",
        localPath,
        downloadedAt: new Date().toISOString(),
      };
      registry[apkId] = info;
      await saveAPKRegistry(registry);
      return info;
    }

    // File doesn't exist, start download
    const info: APKInfo = {
      id: apkId,
      url,
      filename,
      status: "downloading",
    };
    registry[apkId] = info;
    await saveAPKRegistry(registry);

    // Download file
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error("Download failed");
    }

    // Update registry with downloaded info
    info.status = "downloaded";
    info.localPath = result.uri;
    info.downloadedAt = new Date().toISOString();
    registry[apkId] = info;
    await saveAPKRegistry(registry);

    return info;
  } catch (err: any) {
    const registry = await getAPKRegistry();
    const info: APKInfo = {
      id: apkId,
      url,
      filename: url.split("/").pop() || `${apkId}.apk`,
      status: "error",
      error: err.message,
    };
    registry[apkId] = info;
    await saveAPKRegistry(registry);
    throw err;
  }
}

// Request install - opens installer for downloaded APK
export async function requestInstall(apkId: string): Promise<void> {
  if (Platform.OS !== "android") {
    throw new Error("Installation is only available on Android");
  }

  try {
    const info = await getAPKInfo(apkId);
    if (!info || !info.localPath) {
      throw new Error("APK not found or not downloaded");
    }

    // Check if file exists
    const exists = await fileExists(info.localPath);
    if (!exists) {
      throw new Error("APK file not found");
    }

    // Open installer
    await openInstaller(apkId);
  } catch (err: any) {
    console.error("Install request error:", err);
    throw err;
  }
}

// Open installer directly
export async function openInstaller(apkId: string): Promise<void> {
  if (Platform.OS !== "android") {
    throw new Error("Installation is only available on Android");
  }

  try {
    const info = await getAPKInfo(apkId);
    if (!info || !info.localPath) {
      throw new Error("APK not found");
    }

    // Update status
    const registry = await getAPKRegistry();
    if (registry[apkId]) {
      registry[apkId].status = "installing";
      await saveAPKRegistry(registry);
    }

    // Show permission dialog first
    const dialog = (typeof window !== "undefined" && (window as any).__unknownSourcesDialog) || null;
    if (dialog && dialog.show) {
      return new Promise((resolve, reject) => {
        dialog.show(async () => {
          try {
            // Open installer via intent
            const localPath = info.localPath!;
            const fileUri = localPath.startsWith("file://")
              ? localPath
              : `file://${localPath}`;

            await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
              data: fileUri,
              flags: 1, // FLAG_ACTIVITY_NEW_TASK
              type: "application/vnd.android.package-archive",
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    } else {
      // Fallback: open installer directly without dialog
      const localPath = info.localPath!;
      const fileUri = localPath.startsWith("file://")
        ? localPath
        : `file://${localPath}`;

      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: fileUri,
        flags: 1, // FLAG_ACTIVITY_NEW_TASK
        type: "application/vnd.android.package-archive",
      });
    }
  } catch (err: any) {
    console.error("Open installer error:", err);
    throw err;
  }
}

// Check status of APK
export async function checkStatus(apkId: string): Promise<APKStatus> {
  try {
    const info = await getAPKInfo(apkId);
    if (!info) {
      return "pending";
    }

    // If status is downloaded, verify file still exists
    if (info.status === "downloaded" && info.localPath) {
      const exists = await fileExists(info.localPath);
      if (!exists) {
        // File was deleted, update status
        const registry = await getAPKRegistry();
        registry[apkId].status = "pending";
        await saveAPKRegistry(registry);
        return "pending";
      }
    }

    return info.status;
  } catch (err) {
    console.error("Check status error:", err);
    return "error";
  }
}

// Delete APK file
export async function deleteFile(apkId: string): Promise<void> {
  try {
    const info = await getAPKInfo(apkId);
    if (!info) {
      return;
    }

    if (info.localPath) {
      await FileSystem.deleteAsync(info.localPath, { idempotent: true });
    }

    // Update registry
    const registry = await getAPKRegistry();
    registry[apkId].status = "pending";
    registry[apkId].localPath = undefined;
    registry[apkId].downloadedAt = undefined;
    await saveAPKRegistry(registry);
  } catch (err) {
    console.error("Delete file error:", err);
    throw err;
  }
}

// Request unknown sources permission with dialog
export async function requestUnknownSourcesPermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  try {
    // Show the unknown sources dialog
    const dialog = (typeof window !== "undefined" && (window as any).__unknownSourcesDialog) || null;
    if (dialog && dialog.show) {
      return new Promise((resolve) => {
        dialog.show(() => {
          resolve(true);
        });
      });
    } else {
      // Fallback: try to open the unknown sources settings directly
      await IntentLauncher.startActivityAsync("android.settings.action.MANAGE_UNKNOWN_APP_SOURCES");
      return true;
    }
  } catch (err) {
    console.error("Permission request error:", err);
    return false;
  }
}

// Request fullscreen mode (hides navigation bar)
export async function requestFullscreen(fullscreen: boolean): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    // Emit event to React component to handle fullscreen
    const event = new CustomEvent("android-fullscreen-request", {
      detail: { fullscreen },
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(event);
    }
  } catch (err) {
    console.error("Fullscreen request error:", err);
  }
}

// Create JavaScript interface for WebView
export function createAndroidBridge() {
  return {
    requestDownload: async (apkId: string, url: string) => {
      try {
        await requestDownload(apkId, url);
        return JSON.stringify({ success: true, apkId });
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },

    requestInstall: async (apkId: string) => {
      try {
        await requestInstall(apkId);
        return JSON.stringify({ success: true, apkId });
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },

    checkStatus: async (apkId: string) => {
      try {
        const status = await checkStatus(apkId);
        return JSON.stringify({ success: true, status });
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },

    deleteFile: async (apkId: string) => {
      try {
        await deleteFile(apkId);
        return JSON.stringify({ success: true, apkId });
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },

    openInstaller: async (apkId: string) => {
      try {
        await openInstaller(apkId);
        return JSON.stringify({ success: true, apkId });
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },

    requestPermission: async () => {
      try {
        // Show the unknown sources dialog
        const dialog = (typeof window !== "undefined" && (window as any).__unknownSourcesDialog) || null;
        if (dialog && dialog.show) {
          return new Promise((resolve) => {
            dialog.show(() => {
              resolve(JSON.stringify({ success: true, granted: true }));
            });
          }) as any;
        } else {
          const granted = await requestUnknownSourcesPermission();
          return JSON.stringify({ success: true, granted });
        }
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },

    requestFullscreen: async (fullscreen: boolean) => {
      try {
        await requestFullscreen(fullscreen);
        return JSON.stringify({ success: true, fullscreen });
      } catch (err: any) {
        return JSON.stringify({ success: false, error: err.message });
      }
    },
  };
}
