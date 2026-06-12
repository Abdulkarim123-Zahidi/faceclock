import { Link, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { useReminderDeepLink } from "@/notifications/use-reminder-deeplink";

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  useReminderDeepLink();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "FaceClock",
            headerRight: () => (
              <Link href="/settings" asChild>
                <Pressable hitSlop={8}>
                  <Text style={{ fontSize: 20 }}>⚙️</Text>
                </Pressable>
              </Link>
            ),
          }}
        />
        <Stack.Screen name="camera" options={{ title: "Camera" }} />
        <Stack.Screen name="preview" options={{ title: "Preview" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="detail/[id]" options={{ title: "Selfie" }} />
        <Stack.Screen name="edit/[id]" options={{ title: "Edit" }} />
      </Stack>
    </>
  );
}
