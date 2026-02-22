import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  faqIcon: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4A57415",
    marginRight: 12,
  },
  faqQuestion: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#3D2E22",
    flex: 1,
  },
  faqAnswer: {
    marginLeft: 44,
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FAF7F2",
  },
  faqAnswerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 20,
    color: "#6B5B4F",
  },
  faqDivider: {
    height: 1,
    backgroundColor: "#F0E8DC",
    marginLeft: 44,
  },
});
