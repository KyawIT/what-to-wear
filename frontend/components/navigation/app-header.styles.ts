import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sideRail: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  rightRail: {
    alignItems: "flex-end",
  },
  titleRail: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  backButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#8B735512",
  },
});
