import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`;
const APK_CACHE_KEY = "double_apk_downloads";

export type APKDownload = {
  id: string;
  url: string;
  filename: string;
  downloadedAt: string;
  localPath: string;
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

// Get cached APK downloads
export async function getCachedAPKs(): Promise<APKDownload[]> {
  try {
    const cached = await AsyncStorage.getItem(APK_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (err) {
    console.error("Failed to get cached APKs:", err);
    return [];
  }
}

// Save APK to cache
async function saveAPKToCache(apk: APKDownload) {
  try {
    const cached = await getCachedAPKs();
    const updated = [apk, ...cached.filter((a) => a.id !== apk.id)];
    await AsyncStorage.setItem(APK_CACHE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save APK to cache:", err);
  }
}

// Download APK file
export async function downloadAPK(
  url: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<APKDownload | null> {
  if (Platform.OS === "web") {
    // On web, just open the link
    window.open(url, "_blank");
    return null;
  }

  try {
    await ensureDownloadsDir();

    const localPath = `${DOWNLOADS_DIR}${filename}`;
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

    const apkDownload: APKDownload = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      url,
      filename,
      downloadedAt: new Date().toISOString(),
      localPath: result.uri,
    };

    await saveAPKToCache(apkDownload);
    return apkDownload;
  } catch (err) {
    console.error("APK download error:", err);
    throw err;
  }
}

// Install APK (Android only)
export async function installAPK(apkPath: string): Promise<void> {
  if (Platform.OS !== "android") {
    throw new Error("APK installation is only available on Android");
  }

  try {
    // Get file URI
    const fileUri = apkPath.startsWith("file://") ? apkPath : `file://${apkPath}`;

    // Launch intent to install APK
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: fileUri,
      flags: 1, // FLAG_ACTIVITY_NEW_TASK
      type: "application/vnd.android.package-archive",
    });
  } catch (err) {
    console.error("APK installation error:", err);
    throw err;
  }
}

// Request install from unknown sources permission (Android)
export async function requestUnknownSourcesPermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }

  try {
    // On Android 8+, we need to check if the app has permission to install from unknown sources
    // This is handled by the system - we just need to trigger the install intent
    // The system will prompt the user if needed
    return true;
  } catch (err) {
    console.error("Permission request error:", err);
    return false;
  }
}

// Delete cached APK
export async function deleteAPK(apkId: string): Promise<void> {
  try {
    const cached = await getCachedAPKs();
    const apk = cached.find((a) => a.id === apkId);

    if (apk) {
      await FileSystem.deleteAsync(apk.localPath, { idempotent: true });
      const updated = cached.filter((a) => a.id !== apkId);
      await AsyncStorage.setItem(APK_CACHE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Failed to delete APK:", err);
  }
}
