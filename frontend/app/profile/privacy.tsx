import React from "react";
import { Text, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import {
    ChevronLeft,
    Database,
    Server,
    Globe,
    UserCheck,
} from "lucide-react-native";
import { colors } from "@/lib/theme";

const PrivacySection = ({
    icon,
    title,
    items,
}: {
    icon: React.ReactNode;
    title: string;
    items: string[];
}) => (
    <View style={styles.card}>
        <View style={styles.cardTitleRow}>
            <View style={styles.iconCircle}>
                {icon}
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
        </View>

        <View style={styles.cardBody}>
            {items.map((item, index) => (
                <View key={index} style={styles.bulletRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{item}</Text>
                </View>
            ))}
        </View>
    </View>
);

export default function PrivacyScreen() {
    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={["top"]}
        >
            <AppHeader
                title="Privacy"
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
                {/* Intro */}
                <View style={styles.intro}>
                    <Text style={styles.introText}>
                        Your privacy matters. Here&apos;s how we handle your data.
                    </Text>
                </View>

                <PrivacySection
                    icon={<Database size={18} color={colors.secondary} />}
                    title="Data We Collect"
                    items={[
                        "Your name and email address for account identification",
                        "Photos of clothing items you upload",
                        "Categories and tags you assign to your wardrobe items",
                        "Basic usage data to improve the app experience",
                    ]}
                />

                <PrivacySection
                    icon={<Server size={18} color={colors.secondary} />}
                    title="Data Storage"
                    items={[
                        "Your account credentials are securely managed via Keycloak authentication",
                        "Clothing images are stored in a private S3-compatible object storage (MinIO)",
                        "All images are accessible only with time-limited secure URLs",
                        "Your wardrobe metadata is stored in a secured PostgreSQL database",
                    ]}
                />

                <PrivacySection
                    icon={<Globe size={18} color={colors.secondary} />}
                    title="Third-Party Services"
                    items={[
                        "Keycloak — secure identity and access management",
                        "AI background removal service — processes images to remove backgrounds; images are not stored permanently by this service",
                    ]}
                />

                <PrivacySection
                    icon={<UserCheck size={18} color={colors.secondary} />}
                    title="Your Rights"
                    items={[
                        "You can view all your personal data from your Account Information screen",
                        "You can delete individual wardrobe items at any time",
                        "You can request full account deletion by contacting support",
                        "Your data is never sold or shared with advertisers",
                    ]}
                />

                <Text style={styles.footer}>
                    Last updated: February 2026
                </Text>
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
    intro: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 4,
    },
    introText: {
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        lineHeight: 21,
        color: "#6B5B4F",
    },
    card: {
        marginHorizontal: 20,
        marginTop: 16,
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
    cardTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    iconCircle: {
        height: 36,
        width: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D4A57415",
        marginRight: 12,
    },
    cardTitle: {
        fontFamily: "PlayfairDisplay_600SemiBold",
        fontSize: 16,
        color: "#3D2E22",
        letterSpacing: -0.2,
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    bulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 10,
    },
    bullet: {
        height: 5,
        width: 5,
        borderRadius: 2.5,
        backgroundColor: "#D4A574",
        marginTop: 7,
        marginRight: 12,
    },
    bulletText: {
        fontFamily: "Inter_400Regular",
        fontSize: 13.5,
        lineHeight: 20,
        color: "#6B5B4F",
        flex: 1,
    },
    footer: {
        fontFamily: "PlayfairDisplay_400Regular",
        fontSize: 12,
        textAlign: "center",
        color: "#9B8B7F",
        paddingTop: 28,
        paddingBottom: 40,
        opacity: 0.7,
        letterSpacing: 0.3,
    },
});
