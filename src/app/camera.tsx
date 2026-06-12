import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/screen";
import { useTheme } from "@/hooks/use-theme";

export default function CameraScreen() {
  const { colors } = useTheme();
  return (
    <Screen centered>
      <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
        Camera capture lands in Milestone 2.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: { fontSize: 15, textAlign: "center" },
});
