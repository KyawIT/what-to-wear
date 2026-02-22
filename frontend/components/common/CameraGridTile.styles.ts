import { Dimensions, StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

const W = Dimensions.get("window").width;
const SIZE = W / 3;

export const styles = StyleSheet.create({
  pressable: {
    opacity: 1,
  },
  tile: {
    width: SIZE - 1.33,
    height: SIZE - 1.33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  iconCircle: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}20`,
  },
  cameraLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#6B5B4F",
    marginTop: 8,
  },
});
