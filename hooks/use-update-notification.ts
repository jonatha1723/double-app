import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UpdateNotification {
  visible: boolean;
  version: string;
  timestamp: number;
}

const STORAGE_KEY = "double_update_notification";
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export function useUpdateNotification() {
  const [notification, setNotification] = useState<UpdateNotification>({
    visible: false,
    version: "",
    timestamp: 0,
  });

  // Load notification from storage on mount
  useEffect(() => {
    const loadNotification = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored) as UpdateNotification;
          // Show notification if it's less than 24 hours old
          if (Date.now() - data.timestamp < UPDATE_CHECK_INTERVAL) {
            setNotification({
              ...data,
              visible: true,
            });
          } else {
            // Clear old notification
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("Error loading update notification:", error);
      }
    };

    loadNotification();
  }, []);

  const showNotification = async (version: string) => {
    const newNotification: UpdateNotification = {
      visible: true,
      version,
      timestamp: Date.now(),
    };

    setNotification(newNotification);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotification));
    } catch (error) {
      console.error("Error saving update notification:", error);
    }
  };

  const dismissNotification = async () => {
    setNotification((prev) => ({
      ...prev,
      visible: false,
    }));

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  return {
    notification,
    showNotification,
    dismissNotification,
  };
}
