import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export const styles = StyleSheet.create({
  headerTitle: { fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 22, color: "#3D2E22", letterSpacing: -0.3 },
  errorMascot: { width: 132, height: 132 },
  emptyTitle: { marginTop: 14, fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 22, color: "#3D2E22" },
  emptySubtitle: { marginTop: 8, textAlign: "center", color: colors.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14 },
  errorHint: { marginTop: 6, color: colors.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 },
  retryText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
