import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  refreshButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#D4A57415",
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#3D2E22",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9B8B7F",
  },
  pagerContent: {
    paddingLeft: 24,
    paddingBottom: 16,
    flexGrow: 1,
  },
  pagerCardWrap: {
    marginRight: 12,
  },
  lastPagerCardWrap: {
    marginRight: 0,
  },
  pagerFooterSpacer: {
    width: 24,
  },
  pagerDotsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  pagerDot: {
    height: 8,
    borderRadius: 999,
  },
  pagerHintRow: {
    marginTop: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  pagerHintText: {
    color: "#A59486",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  captureHost: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
    width: 220,
    height: 220,
  },
  captureCanvas: {
    width: 220,
    height: 220,
    backgroundColor: "#FAF7F2",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  captureCell: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0E8DC",
  },
  captureImage: {
    width: "100%",
    height: "100%",
  },
  captureCountBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(61, 46, 34, 0.85)",
  },
  captureCountBadgeText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 14,
  },
  thumbPlaceholder: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
    color: "#9B8B7F",
  },
  moreItems: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#9B8B7F",
    textAlign: "center",
    marginTop: 4,
  },
});
