import React from "react";
import { Text, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import PrivacySection from "@/components/common/PrivacySection";
import {
    ChevronLeft,
    Database,
    Server,
    Globe,
    UserCheck,
} from "lucide-react-native";
import { colors } from "@/lib/theme";
import { styles } from "../../styles/screens/profile/privacy.styles";

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

