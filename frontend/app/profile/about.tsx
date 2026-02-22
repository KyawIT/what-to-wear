import React from "react";
import { Text, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import {
    ChevronLeft,
    Camera,
    FolderOpen,
    Wand2,
    Layers,
    Heart,
} from "lucide-react-native";
import { colors } from "@/lib/theme";

const FeatureItem = ({
    icon,
    title,
    description,
    isLast,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    isLast?: boolean;
}) => (
    <View>
        <View style={styles.featureRow}>
            <View style={styles.featureIcon}>{icon}</View>
            <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDesc}>{description}</Text>
            </View>
        </View>
        {!isLast && <View style={styles.featureDivider} />}
    </View>
);

export default function AboutScreen() {
    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={["top"]}
        >
            <AppHeader
                title="About"
                titleStyle={styles.headerTitle}
                left={(
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <ChevronLeft size={22} color={colors.textSecondary} />
                    </Pressable>
                )}
            />

            <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
                {/* App Identity with Mascot */}
                <View style={styles.identitySection}>
                    <Image
                        source={require("../../assets/logo/logo-4xl.png")}
                        style={styles.mascot}
                        contentFit="contain"
                    />
                    <Text style={styles.appName}>What to Wear</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>

                {/* Description */}
                <View style={styles.descriptionWrap}>
                    <Text style={styles.description}>
                        Your AI-powered digital wardrobe assistant.{"\n"}
                        Capture, organize, and get outfit recommendations.
                    </Text>
                </View>

                {/* Features Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Features</Text>
                    <View style={styles.cardBody}>
                        <FeatureItem
                            icon={<Camera size={16} color={colors.secondary} />}
                            title="Smart Capture"
                            description="AI removes the background instantly"
                        />
                        <FeatureItem
                            icon={<FolderOpen size={16} color={colors.secondary} />}
                            title="Wardrobe Organization"
                            description="Categorize and tag for easy browsing"
                        />
                        <FeatureItem
                            icon={<Wand2 size={16} color={colors.secondary} />}
                            title="AI Tag Suggestions"
                            description="Intelligent recommendations for your clothing"
                        />
                        <FeatureItem
                            icon={<Layers size={16} color={colors.secondary} />}
                            title="Outfit Recommendations"
                            description="Get outfit ideas from your wardrobe"
                            isLast
                        />
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>Made with </Text>
                        <Heart size={12} color={colors.error} fill={colors.error} />
                        <Text style={styles.footerText}> for your wardrobe</Text>
                    </View>
                    <Text style={styles.copyright}>© 2026 What to Wear</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
    identitySection: {
        alignItems: "center",
        paddingTop: 32,
        paddingBottom: 8,
    },
    mascot: {
        width: 80,
        height: 80,
        borderRadius: 24,
        marginBottom: 16,
    },
    appName: {
        fontFamily: "PlayfairDisplay_600SemiBold",
        fontSize: 26,
        color: "#3D2E22",
        letterSpacing: -0.3,
    },
    version: {
        fontFamily: "Inter_400Regular",
        fontSize: 13,
        color: "#9B8B7F",
        marginTop: 4,
    },
    descriptionWrap: {
        paddingHorizontal: 32,
        paddingBottom: 8,
        paddingTop: 8,
    },
    description: {
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 21,
        color: "#6B5B4F",
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
        paddingBottom: 4,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 12,
    },
    featureIcon: {
        height: 32,
        width: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D4A57415",
        marginRight: 12,
        marginTop: 2,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 14,
        color: "#3D2E22",
    },
    featureDesc: {
        fontFamily: "Inter_400Regular",
        fontSize: 12.5,
        color: "#6B5B4F",
        marginTop: 2,
        lineHeight: 18,
    },
    featureDivider: {
        height: 1,
        backgroundColor: "#F0E8DC",
        marginLeft: 44,
    },
    techRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },
    techIcon: {
        height: 32,
        width: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D4A57415",
        marginRight: 12,
    },
    techContent: {
        flex: 1,
    },
    techTitle: {
        fontFamily: "Inter_500Medium",
        fontSize: 14,
        color: "#3D2E22",
    },
    techSub: {
        fontFamily: "Inter_400Regular",
        fontSize: 12,
        color: "#9B8B7F",
        marginTop: 2,
    },
    footer: {
        alignItems: "center",
        paddingVertical: 32,
        paddingBottom: 40,
    },
    footerRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    footerText: {
        fontFamily: "Inter_400Regular",
        fontSize: 12,
        color: "#9B8B7F",
    },
    copyright: {
        fontFamily: "PlayfairDisplay_400Regular",
        fontSize: 12,
        color: "#9B8B7F",
        marginTop: 8,
        opacity: 0.6,
        letterSpacing: 0.3,
    },
});
