import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export const s = StyleSheet.create({
    loadingText: {
        fontFamily: "Inter_400Regular",
        fontSize: 14,
    },
    headerTitle: {
        fontFamily: "PlayfairDisplay_600SemiBold",
        fontSize: 22,
        letterSpacing: -0.3,
        color: colors.textPrimary,
    },
    saveText: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 14,
        letterSpacing: 0.2,
    },
    sectionTitle: {
        fontFamily: "PlayfairDisplay_500Medium",
        fontSize: 17,
        color: colors.textPrimary,
        letterSpacing: -0.2,
    },
    sectionHint: {
        fontFamily: "Inter_400Regular",
        fontSize: 12.5,
        color: colors.textSecondary,
        letterSpacing: 0.15,
    },
    pillActionText: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 11.5,
        color: colors.primaryDark,
        letterSpacing: 0.3,
    },
    nameInput: {
        color: colors.textPrimary,
        fontSize: 16,
        fontFamily: "Inter_500Medium",
        letterSpacing: 0.1,
    },
    counterText: {
        fontFamily: "Inter_400Regular",
        fontSize: 11.5,
        color: colors.textMuted,
    },
    descriptionInput: {
        color: colors.textSecondary,
        fontSize: 14.5,
        fontFamily: "Inter_400Regular",
        lineHeight: 21,
    },
    clearText: {
        fontFamily: "Inter_500Medium",
        fontSize: 12,
        color: colors.error,
    },
    hashPrefix: {
        color: colors.textMuted,
        fontSize: 16,
        fontFamily: "Inter_500Medium",
    },
    tagInput: {
        color: colors.textPrimary,
        fontSize: 14.5,
        fontFamily: "Inter_400Regular",
    },
    addButtonText: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 13.5,
        color: colors.white,
        letterSpacing: 0.15,
    },
    tagChipText: {
        color: colors.primaryDark,
        fontFamily: "Inter_500Medium",
        fontSize: 13.5,
    },
});
