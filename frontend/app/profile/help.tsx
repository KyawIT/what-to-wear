import React, { useState } from "react";
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
    ChevronDown,
    ChevronUp,
    Mail,
    MessageCircleQuestion,
    Shirt,
    Sparkles,
    FolderOpen,
    Tag,
} from "lucide-react-native";
import { colors } from "@/lib/theme";

type FAQItem = {
    question: string;
    answer: string;
    icon: React.ReactNode;
};

const FAQ_ITEMS: FAQItem[] = [
    {
        question: "How do I add clothing to my wardrobe?",
        answer:
            'Go to the Scan tab to take a photo of your clothing, or use the Create tab to pick an image from your gallery. The app will automatically remove the background and let you add details like title, category, and tags before saving.',
        icon: <Shirt size={16} color={colors.secondary} />,
    },
    {
        question: "How does the background removal work?",
        answer:
            "We use an AI-powered service (rembg) that automatically detects the clothing item in your photo and removes the background. This creates clean, consistent images for your digital wardrobe.",
        icon: <Sparkles size={16} color={colors.secondary} />,
    },
    {
        question: "How can I organize my wardrobe?",
        answer:
            "You can create custom categories (e.g., Tops, Bottoms, Shoes) and assign tags to each item. Use the Wardrobe tab to browse by category and quickly find what you're looking for.",
        icon: <FolderOpen size={16} color={colors.secondary} />,
    },
    {
        question: "What are tags and how should I use them?",
        answer:
            'Tags are keywords that describe your clothing items (e.g., "Casual", "Summer", "Formal"). They help you filter and find items quickly. The AI can also suggest tags based on the clothing image.',
        icon: <Tag size={16} color={colors.secondary} />,
    },
];

const FAQAccordion = ({ item }: { item: FAQItem }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Pressable
            onPress={() => setExpanded(!expanded)}
            className="active:opacity-80"
        >
            <HStack className="items-center py-4">
                <View
                    className="h-8 w-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: `${colors.primary}15` }}
                >
                    {item.icon}
                </View>
                <Text
                    className="flex-1 text-sm font-medium"
                    style={{ color: colors.textPrimary }}
                >
                    {item.question}
                </Text>
                {expanded ? (
                    <ChevronUp size={18} color={colors.textMuted} />
                ) : (
                    <ChevronDown size={18} color={colors.textMuted} />
                )}
            </HStack>

            {expanded && (
                <Box
                    className="ml-11 mb-4 p-3 rounded-xl"
                    style={{ backgroundColor: `${colors.primary}08` }}
                >
                    <Text
                        className="text-sm leading-5"
                        style={{ color: colors.textSecondary }}
                    >
                        {item.answer}
                    </Text>
                </Box>
            )}
        </Pressable>
    );
};

export default function HelpScreen() {
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
                    Help & Support
                </Text>
            </HStack>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* FAQ Section */}
                <Box
                    className="mx-4 mt-6 rounded-2xl overflow-hidden"
                    style={{ backgroundColor: colors.cardBg }}
                >
                    <HStack className="items-center px-4 pt-4 pb-2">
                        <MessageCircleQuestion size={18} color={colors.secondary} />
                        <Text
                            className="text-xs font-semibold uppercase tracking-wide ml-2"
                            style={{ color: colors.textMuted }}
                        >
                            Frequently Asked Questions
                        </Text>
                    </HStack>

                    <Box className="px-4">
                        {FAQ_ITEMS.map((item, index) => (
                            <React.Fragment key={index}>
                                <FAQAccordion item={item} />
                                {index < FAQ_ITEMS.length - 1 && (
                                    <Divider style={{ backgroundColor: colors.border }} />
                                )}
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>

                {/* Contact Section */}
                <Box
                    className="mx-4 mt-4 mb-8 rounded-2xl overflow-hidden"
                    style={{ backgroundColor: colors.cardBg }}
                >
                    <Box className="px-4 pt-4 pb-2">
                        <Text
                            className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: colors.textMuted }}
                        >
                            Contact Us
                        </Text>
                    </Box>

                    <Box className="px-4 pb-4">
                        <HStack className="items-center py-3">
                            <View
                                className="h-9 w-9 rounded-full items-center justify-center mr-3"
                                style={{ backgroundColor: `${colors.primary}15` }}
                            >
                                <Mail size={18} color={colors.secondary} />
                            </View>
                            <VStack>
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: colors.textPrimary }}
                                >
                                    Email Support
                                </Text>
                                <Text
                                    className="text-xs mt-0.5"
                                    style={{ color: colors.textMuted }}
                                >
                                    support@what-to-wear.app
                                </Text>
                            </VStack>
                        </HStack>
                    </Box>
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
}
