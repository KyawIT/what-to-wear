import React from "react";
import { Text as RNText, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Camera, Sparkles } from "lucide-react-native";
import { AppHeader } from "@/components/navigation/app-header";
import { Center } from "@/components/ui/center";
import { Pressable } from "@/components/ui/pressable";
import { colors } from "@/lib/theme";
import { styles } from "./RecommendationIntroState.styles";

const MIN_ITEMS_FOR_RECOMMENDATION = 5;

type RecommendationIntroStateProps = {
  wearablesCount: number;
  onScanPress: () => void;
};

export default function RecommendationIntroState({ wearablesCount, onScanPress }: RecommendationIntroStateProps) {
  const remaining = MIN_ITEMS_FOR_RECOMMENDATION - wearablesCount;

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="For You" titleStyle={styles.headerTitle} />
      <Center className="flex-1 px-8">
        <Image source={require("../../assets/mascot/mascot-dilemma-sideprofile.png")} style={styles.mascot} contentFit="contain" />
        <RNText style={styles.emptyTitle}>Almost there!</RNText>
        <RNText style={styles.emptySubtitle}>
          Add {remaining} more {remaining === 1 ? "item" : "items"} to unlock outfit recommendations.
        </RNText>
        <View style={styles.progressRow}>
          {Array.from({ length: MIN_ITEMS_FOR_RECOMMENDATION }).map((_, idx) => (
            <View
              key={`dot-${idx}`}
              style={[
                styles.progressDot,
                idx < wearablesCount ? styles.progressDotFilled : styles.progressDotEmpty,
              ]}
            />
          ))}
        </View>
        <RNText style={styles.progressText}>
          {wearablesCount}/{MIN_ITEMS_FOR_RECOMMENDATION} wardrobe pieces ready
        </RNText>
        <Pressable
          onPress={onScanPress}
          className="active:opacity-80"
          style={styles.primaryCta}
        >
          <Camera size={16} color="#FFFFFF" strokeWidth={2} />
          <RNText style={styles.primaryCtaText}>Scan New Item</RNText>
        </Pressable>
        <View style={styles.tipRow}>
          <Sparkles size={14} color={colors.primary} strokeWidth={2} />
          <RNText style={styles.tipText}>Best results need at least one top, one bottom, and footwear.</RNText>
        </View>
      </Center>
    </SafeAreaView>
  );
}
