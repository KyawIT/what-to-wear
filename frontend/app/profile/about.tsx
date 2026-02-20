import React from "react";
import { Text, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Divider } from "@/components/ui/divider";
import {
    ChevronLeft,
    Sparkles,
    Camera,
    FolderOpen,
    Wand2,
    Layers,
    Code2,
    Heart,
} from "lucide-react-native";
import { colors } from "@/lib/theme";

const FeatureItem = ({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) => (
    <HStack className="items-start py-3">
        <View
            className="h-8 w-8 rounded-full items-center justify-center mr-3 mt-0.5"
            style={{ backgroundColor: `${colors.primary}15` }}
        >
            {icon}
        </View>
        <VStack className="flex-1">
            <Text
                className="text-sm font-semibold"
                style={{ color: colors.textPrimary }}
            >
                {title}
            </Text>
            <Text
                className="text-xs mt-0.5 leading-4"
                style={{ color: colors.textSecondary }}
            >
                {description}
            </Text>
        </VStack>
    </HStack>
);

export default function AboutScreen() {
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
                    About
                </Text>
            </HStack>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* App Identity */}
                <VStack className="items-center pt-10 pb-6">
                    <View
                        className="h-20 w-20 rounded-3xl items-center justify-center mb-4"
                        style={{
                            backgroundColor: colors.primary,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 12,
                            elevation: 8,
                        }}
                    >
                        <Sparkles size={36} color={colors.white} />
                    </View>
                    <Text
                        className="text-2xl font-bold"
                        style={{ color: colors.textPrimary }}
                    >
                        What to Wear
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: colors.textMuted }}>
                        Version 1.0.0
                    </Text>
                </VStack>

                {/* Description */}
                <Box className="px-6 pb-4">
                    <Text
                        className="text-sm text-center leading-5"
                        style={{ color: colors.textSecondary }}
                    >
                        Your AI-powered digital wardrobe assistant. Capture, organize, and
                        get outfit recommendations — all in one place.
                    </Text>
                </Box>

                {/* Features Card */}
                <Box
                    className="mx-4 mt-4 rounded-2xl overflow-hidden"
                    style={{ backgroundColor: colors.cardBg }}
                >
                    <Box className="px-4 pt-4 pb-2">
                        <Text
                            className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: colors.textMuted }}
                        >
                            Features
                        </Text>
                    </Box>

                    <Box className="px-4 pb-2">
                        <FeatureItem
                            icon={<Camera size={16} color={colors.secondary} />}
                            title="Smart Capture"
                            description="Take a photo and our AI removes the background instantly"
                        />
                        <Divider style={{ backgroundColor: colors.border }} />
                        <FeatureItem
                            icon={<FolderOpen size={16} color={colors.secondary} />}
                            title="Wardrobe Organization"
                            description="Categorize and tag your clothing for easy browsing"
                        />
                        <Divider style={{ backgroundColor: colors.border }} />
                        <FeatureItem
                            icon={<Wand2 size={16} color={colors.secondary} />}
                            title="AI Tag Suggestions"
                            description="Get intelligent tag recommendations based on your clothing"
                        />
                        <Divider style={{ backgroundColor: colors.border }} />
                        <FeatureItem
                            icon={<Layers size={16} color={colors.secondary} />}
                            title="Outfit Recommendations"
                            description="Get outfit ideas from your existing wardrobe"
                        />
                    </Box>
                </Box>

                {/* Tech Stack Card */}
                <Box
                    className="mx-4 mt-4 rounded-2xl overflow-hidden"
                    style={{ backgroundColor: colors.cardBg }}
                >
                    <Box className="px-4 pt-4 pb-2">
                        <Text
                            className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: colors.textMuted }}
                        >
                            Built With
                        </Text>
                    </Box>

                    <Box className="px-4 pb-4">
                        <HStack className="items-center py-3">
                            <View
                                className="h-8 w-8 rounded-full items-center justify-center mr-3"
                                style={{ backgroundColor: `${colors.primary}15` }}
                            >
                                <Code2 size={16} color={colors.secondary} />
                            </View>
                            <VStack>
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: colors.textPrimary }}
                                >
                                    React Native & Expo
                                </Text>
                                <Text
                                    className="text-xs mt-0.5"
                                    style={{ color: colors.textMuted }}
                                >
                                    Cross-platform mobile framework
                                </Text>
                            </VStack>
                        </HStack>
                    </Box>
                </Box>

                {/* Footer */}
                <VStack className="items-center py-8">
                    <HStack className="items-center">
                        <Text className="text-xs" style={{ color: colors.textMuted }}>
                            Made with{" "}
                        </Text>
                        <Heart size={12} color={colors.error} fill={colors.error} />
                        <Text className="text-xs" style={{ color: colors.textMuted }}>
                            {" "}for your wardrobe
                        </Text>
                    </HStack>
                    <Text
                        className="text-xs mt-2"
                        style={{ color: `${colors.textMuted}80` }}
                    >
                        © 2026 What to Wear
                    </Text>
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
}
