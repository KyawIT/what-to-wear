import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  closeButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#8B735512",
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  nextButton: {
    height: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  nextText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  selectPhotoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#9B8B7F",
    marginTop: 12,
  },
  galleryHeader: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FAF7F2",
    borderTopWidth: 1,
    borderTopColor: "#F0E8DC",
    borderBottomWidth: 1,
    borderBottomColor: "#F0E8DC",
  },
  galleryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#3D2E22",
    marginRight: 4,
  },
  photoCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#9B8B7F",
  },
  cameraLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#6B5B4F",
    marginTop: 8,
  },
});
