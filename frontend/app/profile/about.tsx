import React from "react";
import { Text, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import FeatureItem from "@/components/common/FeatureItem";
import {
    ChevronLeft,
    Camera,
    FolderOpen,
    Wand2,
    Layers,
    Heart,
} from "lucide-react-native";
import { colors } from "@/lib/theme";
import { styles } from "../../styles/screens/profile/about.styles";

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

