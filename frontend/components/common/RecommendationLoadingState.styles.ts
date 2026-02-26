import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  threadHost: {
    height: 160,
    width: 40,
    alignItems: "center",
  },
  threadLine: {
    position: "absolute",
    width: 1.5,
    backgroundColor: "#E0D3C5",
    borderRadius: 1,
    top: 0,
    bottom: 0,
  },
  threadSweep: {
    position: "absolute",
    width: 8,
    height: 28,
    borderRadius: 99,
    backgroundColor: "#D4A57466",
  },
  dot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D4A574",
  },
  loadingText: {
    marginTop: 36,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#B8A99D",
    letterSpacing: 0.5,
  },
});
