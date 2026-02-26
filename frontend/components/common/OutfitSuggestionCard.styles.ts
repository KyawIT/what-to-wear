import { Dimensions, StyleSheet } from "react-native";

const screenWidth = Dimensions.get("window").width;
export const CARD_WIDTH = screenWidth - 48;
export const INNER = CARD_WIDTH - 48; // Give it 24 padding on each side

export const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    shadowColor: "#3D2E22",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
  },
  cardInner: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    zIndex: 10,
  },
  lookLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#B8A99D",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F4EF",
  },
  saveBtnActive: {
    backgroundColor: "#D4A574",
  },
  compositionArea: {
    width: "100%",
    height: 320,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignContent: "center",
    gap: 12,
    marginBottom: 28,
  },
  compositionItem: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    color: "#C9BAAA",
  },
  tagWrapContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: "#F8F4EF",
  },
  tagText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: "#887A6D",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
