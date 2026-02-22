import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export const styles = StyleSheet.create({
  suggestionsLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.textSecondary,
  },
  aiPredicting: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  aiErrorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.warning,
  },
  suggestionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: colors.textPrimary,
  },
});
