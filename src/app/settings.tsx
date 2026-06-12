import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/screen";
import { useTheme } from "@/hooks/use-theme";

export default function SettingsScreen() {
  const { colors } = useTheme();
  return (
    <Screen centered>
      <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
        Reminder time, toggle, and theme settings land in Milestone 4.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: { fontSize: 15, textAlign: "center" },
});
