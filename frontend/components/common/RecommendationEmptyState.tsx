import React from "react";
import { Text as RNText, View } from "react-native";
import { Image } from "expo-image";
import { Sparkles } from "lucide-react-native";
import { Center } from "@/components/ui/center";
import { Pressable } from "@/components/ui/pressable";
import { colors } from "@/lib/theme";
import SpinningMascot from "@/components/common/SpinningMascot";
import { styles } from "./RecommendationEmptyState.styles";

type RecommendationEmptyStateProps = {
  generating: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function RecommendationEmptyState({ generating, error, onRetry }: RecommendationEmptyStateProps) {
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
      <View style={styles.emptyIcon}>
        <Sparkles size={40} color={colors.primary} strokeWidth={1.5} />
      </View>
      <RNText style={styles.emptyTitle}>No outfits yet</RNText>
      <RNText style={styles.emptySubtitle}>Upload more items to get outfit recommendations.</RNText>
    </Center>
  );
}

