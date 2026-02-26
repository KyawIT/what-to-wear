import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabBar: {
    position: "relative",
    flexDirection: "row",
    backgroundColor: "#F5EFE7",
    borderRadius: 999,
    padding: 4,
    overflow: "hidden",
  },
  tabIndicator: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 10,
    zIndex: 1,
  },
  tabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#8D7A68",
  },
  tabTextActive: {
    color: "#3D2E22",
  },
});
