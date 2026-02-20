import { Platform } from "react-native";
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

// Get APK info by ID
async function getAPKInfo(apkId: string): Promise<APKInfo | null> {
  try {
    const registry = await getAPKRegistry();
    return registry[apkId] || null;
  } catch (err) {
    console.error("Failed to get APK info:", err);
    return null;
  }
}

// Check if file exists
async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch (err) {
    return false;
  }
}

// Request download of APK
export async function requestDownload(apkId: string, url: string): Promise<void> {
  try {
    await ensureDownloadsDir();

    const registry = await getAPKRegistry();
    const filename = `${apkId}.apk`;
    const localPath = `${DOWNLOADS_DIR}${filename}`;

    // Check if already downloaded
    if (registry[apkId] && registry[apkId].status === "downloaded") {
      const exists = await fileExists(registry[apkId].localPath!);
      if (exists) {
        console.log("APK already downloaded:", apkId);
        return;
      }
    }

    // Update status to downloading
    registry[apkId] = {
      id: apkId,
      url,
      filename,
      status: "downloading",
      localPath,
      downloadedAt: new Date().toISOString(),
    };
    await saveAPKRegistry(registry);

    // Download the file
    const downloadResumable = FileSystem.createDownloadResumable(url, localPath);
    const result = await downloadResumable.downloadAsync();

    if (!result) {
      throw new Error("Download failed");
    }

    // Update status to downloaded
    registry[apkId].status = "downloaded";
    registry[apkId].localPath = result.uri;
    await saveAPKRegistry(registry);

    console.log("APK downloaded successfully:", apkId);
  } catch (err: any) {
    console.error("Download error:", err);
    const registry = await getAPKRegistry();
    if (registry[apkId]) {
      registry[apkId].status = "error";
      registry[apkId].error = err.message;
      await saveAPKRegistry(registry);
    }
    throw err;
  }
}

// Request install of APK
export async function requestInstall(apkId: string): Promise<void> {
  try {
    const info = await getAPKInfo(apkId);
    if (!info) {
      throw new Error("APK not found");
    }

    if (info.status !== "downloaded") {
      throw new Error("APK not downloaded yet");
    }

    const localPath = info.localPath!;
    const exists = await fileExists(localPath);
    if (!exists) {
      throw new Error("APK file not found");
    }

    // Update status to installing
    const registry = await getAPKRegistry();
    registry[apkId].status = "installing";
    await saveAPKRegistry(registry);

    // Show the unknown sources dialog
    const dialog = (typeof window !== "undefined" && (window as any).__unknownSourcesDialog) || null;
    if (dialog && dialog.show) {
      return new Promise((resolve, reject) => {
        dialog.show(async () => {
          try {
            // Open installer via intent with proper flags
            let fileUri = localPath;
            
            // Normalize URI - ensure file:// prefix
            if (!fileUri.startsWith("file://")) {
              fileUri = `file://${fileUri}`;
            }

            console.log("Opening installer for:", fileUri);

            await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
              data: fileUri,
              flags: 268435457, // FLAG_ACTIVITY_NEW_TASK | FLAG_GRANT_READ_URI_PERMISSION
              type: "application/vnd.android.package-archive",
            });
            resolve();
          } catch (err) {
            console.error("Installer error:", err);
            reject(err);
          }
        });
      });
    } else {
      // Fallback: open installer directly without dialog
      let fileUri = localPath;
      
      // Normalize URI - ensure file:// prefix
      if (!fileUri.startsWith("file://")) {
        fileUri = `file://${fileUri}`;
      }

      console.log("Opening installer (fallback) for:", fileUri);

      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: fileUri,
        flags: 268435457, // FLAG_ACTIVITY_NEW_TASK | FLAG_GRANT_READ_URI_PERMISSION
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
    if (typeof window !== "undefined" && window.dispatchEvent) {
      try {
        const event = new (window as any).CustomEvent("android-fullscreen-request", {
          detail: { fullscreen },
        });
        window.dispatchEvent(event);
      } catch (e) {
        // Fallback: use simple event
        console.log("Fullscreen request:", fullscreen);
      }
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
        await requestInstall(apkId);
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
