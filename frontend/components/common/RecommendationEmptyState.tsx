import React from "react";
import { Text as RNText, View } from "react-native";
import { Image } from "expo-image";
import { Camera, Sparkles } from "lucide-react-native";
import { Center } from "@/components/ui/center";
import { Pressable } from "@/components/ui/pressable";
import { colors } from "@/lib/theme";
import SpinningMascot from "@/components/common/SpinningMascot";
import { styles } from "./RecommendationEmptyState.styles";

type RecommendationEmptyStateProps = {
  generating: boolean;
  error: string | null;
  wearablesCount: number;
  onRetry: () => void;
  onScanPress: () => void;
};

export default function RecommendationEmptyState({
  generating,
  error,
  wearablesCount,
  onRetry,
  onScanPress,
}: RecommendationEmptyStateProps) {
  if (generating) {
    return (
      <Center className="pt-12">
        <SpinningMascot size={120} />
        <RNText style={styles.loadingText}>Creating outfits...</RNText>
      </Center>
    );
  }

  if (error) {
    return (
      <Center className="pt-12 px-4">
        <Image source={require("../../assets/mascot/mascot-sad.png")} style={styles.errorMascot} contentFit="contain" />
        <RNText style={styles.emptyTitle}>No outfits generated</RNText>
        <RNText style={styles.emptySubtitle}>{error}</RNText>
        <Pressable onPress={onRetry} className="rounded-full px-6 py-3 active:opacity-80 mt-6" style={{ backgroundColor: colors.primary }}>
          <RNText style={styles.retryText}>Try Again</RNText>
        </Pressable>
      </Center>
    );
  }

  return (
    <Center className="pt-12 px-4">
      <Image source={require("../../assets/mascot/mascot-dilemma.png")} style={styles.defaultMascot} contentFit="contain" />
      <RNText style={styles.emptyTitle}>No outfits yet</RNText>
      <RNText style={styles.emptySubtitle}>
        We need a little more style variety. You currently have {wearablesCount} items in your wardrobe.
      </RNText>
      <View style={styles.hintRow}>
        <Sparkles size={14} color={colors.primary} strokeWidth={2} />
        <RNText style={styles.hintText}>Add tops, bottoms, and footwear for better combinations.</RNText>
      </View>
      <Pressable onPress={onScanPress} className="active:opacity-80 mt-5" style={styles.primaryCta}>
        <Camera size={16} color="#FFFFFF" strokeWidth={2} />
        <RNText style={styles.primaryCtaText}>Scan More Items</RNText>
      </Pressable>
    </Center>
  );
}
