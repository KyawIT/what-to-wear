import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 40,
  },
  orbitHost: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: `${colors.primary}30`,
  },
  glowRingOuter: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: `${colors.primary}15`,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  particleSmall: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: `${colors.primary}90`,
  },
  statusText: {
    marginTop: 32,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  subtitleText: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
});
