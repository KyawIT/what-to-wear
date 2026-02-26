import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  errorMascot: { width: 132, height: 132 },
  defaultMascot: { width: 172, height: 172 },
  loadingText: { marginTop: 20, fontFamily: "Inter_500Medium", fontSize: 14, color: "#7A6A5A" },
  emptyTitle: { marginTop: 12, fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 22, color: "#3D2E22" },
  emptySubtitle: { marginTop: 8, fontFamily: "Inter_400Regular", fontSize: 14, color: "#7A6A5A", textAlign: "center", maxWidth: 310, lineHeight: 20 },
  hintRow: {
    marginTop: 14,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F4EADF",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    maxWidth: 320,
  },
  hintText: { flex: 1, color: "#8F7D6B", fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  primaryCta: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: "#D4A574",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryCtaText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  retryText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
