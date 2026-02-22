import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  backButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#8B735512",
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 16,
  },
  avatar: {
    borderWidth: 2,
  },
  avatarFallback: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#D4A574",
  },
  userName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
    color: "#3D2E22",
    marginTop: 16,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9B8B7F",
    marginTop: 4,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0E8DC",
    shadowColor: "#C9BAAA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    fontFamily: "PlayfairDisplay_500Medium",
    fontSize: 13,
    color: "#9B8B7F",
    letterSpacing: 0.3,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  cardBody: {
    paddingHorizontal: 16,
  },
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
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    color: "#9B8B7F",
    letterSpacing: 0.2,
  },
  infoValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#3D2E22",
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F0E8DC",
    marginLeft: 48,
  },
});
