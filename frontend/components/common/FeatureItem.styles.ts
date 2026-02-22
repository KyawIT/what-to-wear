import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  featureIcon: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4A57415",
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#3D2E22",
  },
  featureDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    color: "#6B5B4F",
    marginTop: 2,
    lineHeight: 18,
  },
  featureDivider: {
    height: 1,
    backgroundColor: "#F0E8DC",
    marginLeft: 44,
  },
});
