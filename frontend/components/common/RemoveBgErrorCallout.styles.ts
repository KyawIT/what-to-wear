import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export const styles = StyleSheet.create({
  errorTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.error,
  },
  errorBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.textSecondary,
  },
  retryText: {
    marginLeft: 6,
    color: colors.error,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  retakeText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
