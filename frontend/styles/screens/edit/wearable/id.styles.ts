import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D7C5",
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#F7E9D7",
  },
  categoryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#7A6A5A",
  },
  categoryTextActive: {
    color: colors.primary,
  },
});
