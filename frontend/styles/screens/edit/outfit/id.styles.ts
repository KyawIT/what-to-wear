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
  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  itemsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  itemChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D7C5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#F7E9D7",
  },
  itemText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#7A6A5A",
  },
  itemTextActive: {
    color: colors.primary,
  },
});
