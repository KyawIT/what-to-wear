import React, { useState } from "react";
import { Text, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import {
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    Mail,
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

const FAQAccordion = ({ item, isLast }: { item: FAQItem; isLast: boolean }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <View>
            <Pressable
                onPress={() => setExpanded(!expanded)}
                style={styles.faqRow}
            >
                <View style={styles.faqIcon}>{item.icon}</View>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {expanded ? (
                    <ChevronUp size={18} color={colors.textMuted} />
                ) : (
                    <ChevronDown size={18} color={colors.textMuted} />
                )}
            </Pressable>

            {expanded && (
                <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                </View>
            )}

            {!isLast && <View style={styles.faqDivider} />}
        </View>
    );
};

export default function HelpScreen() {
    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={["top"]}
        >
            <AppHeader
                title="Help & Support"
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
                {/* FAQ Card */}
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Frequently Asked</Text>
                    <View style={styles.cardBody}>
                        {FAQ_ITEMS.map((item, index) => (
                            <FAQAccordion
                                key={index}
                                item={item}
                                isLast={index === FAQ_ITEMS.length - 1}
                            />
                        ))}
                    </View>
                </View>

                {/* Contact Card */}
                <View style={[styles.card, { marginBottom: 40 }]}>
                    <Text style={styles.cardHeader}>Contact Us</Text>
                    <View style={styles.cardBody}>
                        <View style={styles.contactRow}>
                            <View style={styles.contactIcon}>
                                <Mail size={18} color={colors.secondary} />
                            </View>
                            <View style={styles.contactContent}>
                                <Text style={styles.contactTitle}>Email Support</Text>
                                <Text style={styles.contactSub}>support@what-to-wear.app</Text>
                            </View>
                        </View>
                    </View>
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
    },
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
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },
    contactIcon: {
        height: 36,
        width: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D4A57415",
        marginRight: 12,
    },
    contactContent: {
        flex: 1,
    },
    contactTitle: {
        fontFamily: "Inter_500Medium",
        fontSize: 14,
        color: "#3D2E22",
    },
    contactSub: {
        fontFamily: "Inter_400Regular",
        fontSize: 12,
        color: "#9B8B7F",
        marginTop: 2,
    },
});
