import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Routes a tapped reminder to its target screen. useLastNotificationResponse
 * also covers cold starts, where the tap happens before any listener
 * could have been registered.
 */
export function useReminderDeepLink() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const url = response?.notification.request.content.data?.url;
    if (url === "/camera") {
      router.push("/camera");
    }
  }, [response, router]);
}
