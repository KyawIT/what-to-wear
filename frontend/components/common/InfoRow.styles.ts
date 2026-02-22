import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4A57415",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#9B8B7F",
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#3D2E22",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F0E8DC",
    marginLeft: 48,
  },
});
