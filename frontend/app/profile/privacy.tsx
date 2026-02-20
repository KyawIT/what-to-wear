import React from "react";
import { Text, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
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
    <Box
        className="mx-4 mt-4 rounded-2xl overflow-hidden"
        style={{ backgroundColor: colors.cardBg }}
    >
        <HStack className="items-center px-4 pt-4 pb-2">
            <View
                className="h-9 w-9 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}15` }}
            >
                {icon}
            </View>
            <Text
                className="text-base font-semibold"
                style={{ color: colors.textPrimary }}
            >
                {title}
            </Text>
        </HStack>

        <VStack className="px-4 pb-4">
            {items.map((item, index) => (
                <HStack key={index} className="items-start mt-3">
                    <View
                        className="h-1.5 w-1.5 rounded-full mt-2 mr-3"
                        style={{ backgroundColor: colors.primary }}
                    />
                    <Text
                        className="text-sm leading-5 flex-1"
                        style={{ color: colors.textSecondary }}
                    >
                        {item}
                    </Text>
                </HStack>
            ))}
        </VStack>
    </Box>
);

export default function PrivacyScreen() {
    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: colors.background }}
            edges={["top"]}
        >
            {/* Header */}
            <HStack
                className="h-14 items-center px-4"
                style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
                <Pressable
                    onPress={() => router.back()}
                    className="h-10 w-10 items-center justify-center rounded-full active:opacity-60 mr-2"
                    style={{ backgroundColor: `${colors.secondary}15` }}
                >
                    <ChevronLeft size={22} color={colors.textSecondary} />
                </Pressable>
                <Text
                    className="text-xl font-bold"
                    style={{ color: colors.textPrimary }}
                >
                    Privacy
                </Text>
            </HStack>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Intro */}
                <Box className="px-4 pt-6 pb-2">
                    <Text
                        className="text-sm leading-5"
                        style={{ color: colors.textSecondary }}
                    >
                        Your privacy matters to us. Here&apos;s how we handle your data in What to Wear.
                    </Text>
                </Box>

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

                <Box className="px-4 pt-6 pb-10">
                    <Text
                        className="text-xs text-center"
                        style={{ color: colors.textMuted }}
                    >
                        Last updated: February 2026
                    </Text>
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
}
