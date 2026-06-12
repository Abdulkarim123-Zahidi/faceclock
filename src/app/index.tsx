import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { useTheme } from "@/hooks/use-theme";

export default function GalleryScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      {/* Empty state — replaced by the gallery grid in Milestone 2. */}
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No selfies yet
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          Take your first selfie to start your timeline.
        </Text>
        <Link href="/camera" asChild>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.primaryButtonLabel}>Open camera</Text>
          </Pressable>
        </Link>
        <Link href="/settings" asChild>
          <Pressable>
            <Text style={[styles.secondaryLink, { color: colors.accent }]}>
              Settings
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 15,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryLink: {
    fontSize: 15,
    padding: 8,
  },
});
