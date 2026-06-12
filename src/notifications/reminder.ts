import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Native implementation. reminder.web.ts is a stub: browsers have no
// background scheduler for a closed tab, so the reminder is native-only.

export const reminderSupported = true;

const REMINDER_ID = "daily-reminder";
const CHANNEL_ID = "daily-reminder";

// iOS drops foreground notifications unless a handler opts in.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Creates the Android channel (8+ silently drops notifications without
 * one) and requests permission (explicit opt-in on Android 13+ / iOS).
 * Returns whether notifications are allowed.
 */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Daily reminder",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
): Promise<void> {
  // Fixed identifier = rescheduling replaces rather than stacks.
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "FaceClock",
      body: "Time for today's selfie 📸",
      data: { url: "/camera" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}
