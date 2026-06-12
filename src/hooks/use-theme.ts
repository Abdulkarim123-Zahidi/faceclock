import { useColorScheme } from "react-native";

import { darkColors, lightColors, type ThemeColors } from "@/theme/colors";

export type Theme = {
  colors: ThemeColors;
  isDark: boolean;
};

/**
 * Follows the system color scheme for now. A user-facing theme override
 * (stored in settings) is planned for the polish milestone.
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { colors: isDark ? darkColors : lightColors, isDark };
}
