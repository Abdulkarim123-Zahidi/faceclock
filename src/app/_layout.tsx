import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useTheme } from "@/hooks/use-theme";

export default function RootLayout() {
  const { colors, isDark } = useTheme();

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
        <Stack.Screen name="index" options={{ title: "FaceClock" }} />
        <Stack.Screen name="camera" options={{ title: "Camera" }} />
        <Stack.Screen name="preview" options={{ title: "Preview" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="detail/[id]" options={{ title: "Selfie" }} />
        <Stack.Screen name="edit/[id]" options={{ title: "Edit" }} />
      </Stack>
    </>
  );
}
