import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/screen";
import { useTheme } from "@/hooks/use-theme";

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  return (
    <Screen centered>
      <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
        Editing tools for entry {id} land in Milestone 5.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: { fontSize: 15, textAlign: "center" },
});
