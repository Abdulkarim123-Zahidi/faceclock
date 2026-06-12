import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { useTheme } from "@/hooks/use-theme";

type ScreenProps = PropsWithChildren<{
  /** Center children both ways — handy for placeholders and empty states. */
  centered?: boolean;
  style?: ViewStyle;
}>;

export function Screen({ children, centered = false, style }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.background },
        centered && styles.centered,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    padding: 16,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});
