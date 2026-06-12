import { Alert, Platform } from "react-native";

/**
 * Cross-platform destructive-action confirmation. React Native's
 * Alert.alert is a silent no-op on web, which would make "Delete"
 * destroy the photo with no confirmation at all — hence window.confirm.
 */
export function confirmAsync(
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: confirmLabel,
          style: "destructive",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
