import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export interface AndroidBridgeCallbacks {
  onDownloadProgress?: (apkId: string, progress: number) => void;
  onDownloadComplete?: (apkId: string, success: boolean) => void;
  onInstallStart?: (apkId: string) => void;
  onInstallComplete?: (apkId: string, success: boolean) => void;
  onStatusChange?: (apkId: string, status: string) => void;
}

export class AndroidBridge {
  private callbacks: AndroidBridgeCallbacks = {};
  private downloadTasks: Map<string, any> = new Map();

  constructor(callbacks?: AndroidBridgeCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  /**
   * Injetar o Android Bridge no WebView
   */
  getInjectedJavaScript(): string {
    return `
      (function() {
        window.Android = {
          requestDownload: (apkId, url) => {
            console.log('Android.requestDownload called:', apkId, url);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'requestDownload',
              apkId,
              url
            }));
          },
          requestInstall: (apkId) => {
            console.log('Android.requestInstall called:', apkId);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'requestInstall',
              apkId
            }));
          },
          checkStatus: (apkId) => {
            console.log('Android.checkStatus called:', apkId);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'checkStatus',
              apkId
            }));
          },
          deleteFile: (apkId) => {
            console.log('Android.deleteFile called:', apkId);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'deleteFile',
              apkId
            }));
          },
          requestPermission: () => {
            console.log('Android.requestPermission called');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'requestPermission'
            }));
          },
          requestFullscreen: (enable) => {
            console.log('Android.requestFullscreen called:', enable);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'requestFullscreen',
              enable
            }));
          }
        };
        console.log('Android Bridge injected');
      })();
    `;
  }

  /**
   * Processar mensagens do WebView
   */
  async handleWebViewMessage(message: string): Promise<void> {
    try {
      const data = JSON.parse(message);
      console.log("Android Bridge received:", data);

      switch (data.type) {
        case "requestDownload":
          await this.downloadAPK(data.apkId, data.url);
          break;
        case "requestInstall":
          await this.installAPK(data.apkId);
          break;
        case "checkStatus":
          await this.checkStatus(data.apkId);
          break;
        case "deleteFile":
          await this.deleteFile(data.apkId);
          break;
        case "requestPermission":
          this.callbacks.onStatusChange?.("permission", "requested");
          break;
        case "requestFullscreen":
          this.callbacks.onStatusChange?.("fullscreen", data.enable ? "enabled" : "disabled");
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  }

  /**
   * Download APK
   */
  private async downloadAPK(apkId: string, url: string): Promise<void> {
    try {
      const fileName = `${apkId}.apk`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.log(`APK ${apkId} already downloaded`);
        this.callbacks.onDownloadComplete?.(apkId, true);
        return;
      }

      console.log(`Downloading APK ${apkId} from ${url}`);
      this.callbacks.onStatusChange?.(apkId, "downloading");

      const downloadResumable = FileSystem.createDownloadResumable(url, fileUri, {}, (progress) => {
        const progressPercent = Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100);
        console.log(`Download progress: ${progressPercent}%`);
        this.callbacks.onDownloadProgress?.(apkId, progressPercent);
      });

      this.downloadTasks.set(apkId, downloadResumable);
      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        console.log(`APK ${apkId} downloaded successfully`);
        this.callbacks.onStatusChange?.(apkId, "downloaded");
        this.callbacks.onDownloadComplete?.(apkId, true);
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      console.error(`Error downloading APK ${apkId}:`, error);
      this.callbacks.onStatusChange?.(apkId, "error");
      this.callbacks.onDownloadComplete?.(apkId, false);
    }
  }

  /**
   * Install APK
   */
  private async installAPK(apkId: string): Promise<void> {
    try {
      console.log(`Installing APK ${apkId}`);
      this.callbacks.onStatusChange?.(apkId, "installing");
      this.callbacks.onInstallStart?.(apkId);

      // On native Android, this would trigger the actual installation
      // For now, we just emit the event
      this.callbacks.onInstallComplete?.(apkId, true);
      this.callbacks.onStatusChange?.(apkId, "installed");
    } catch (error) {
      console.error(`Error installing APK ${apkId}:`, error);
      this.callbacks.onStatusChange?.(apkId, "error");
      this.callbacks.onInstallComplete?.(apkId, false);
    }
  }

  /**
   * Check APK status
   */
  private async checkStatus(apkId: string): Promise<void> {
    try {
      const fileName = `${apkId}.apk`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        this.callbacks.onStatusChange?.(apkId, "downloaded");
      } else {
        this.callbacks.onStatusChange?.(apkId, "pending");
      }
    } catch (error) {
      console.error(`Error checking status for ${apkId}:`, error);
      this.callbacks.onStatusChange?.(apkId, "error");
    }
  }

  /**
   * Delete APK file
   */
  private async deleteFile(apkId: string): Promise<void> {
    try {
      const fileName = `${apkId}.apk`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      console.log(`APK ${apkId} deleted`);
      this.callbacks.onStatusChange?.(apkId, "deleted");
    } catch (error) {
      console.error(`Error deleting APK ${apkId}:`, error);
    }
  }
}
