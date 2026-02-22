import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export const styles = StyleSheet.create({
  outfitCard: {
    width: 170,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0E8DC",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
  },
  outfitCardContent: { padding: 10, paddingBottom: 48 },
  outfitHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  outfitLabel: { marginLeft: 6, fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#3D2E22" },
  outfitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  outfitItemThumb: { width: 74, height: 74, borderRadius: 10, backgroundColor: "#FAF7F2", overflow: "hidden" },
  thumbPlaceholder: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#8D7A68" },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  saveButtonSaved: { backgroundColor: "#6FAE77" },
  saveButtonText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
