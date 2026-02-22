import React from "react";
import { Text, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import FAQAccordion, { FAQItem } from "@/components/common/FAQAccordion";
import {
    ChevronLeft,
    Mail,
    Shirt,
    Sparkles,
    FolderOpen,
    Tag,
} from "lucide-react-native";
import { colors } from "@/lib/theme";
import { styles } from "../../styles/screens/profile/help.styles";

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
                                <Text style={styles.contactSub}>katharina.winkler.digital@gmail.com</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

