import React from "react";
import { Text as RNText } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { AppHeader } from "@/components/navigation/app-header";
import { Center } from "@/components/ui/center";
import { styles } from "./RecommendationIntroState.styles";

const MIN_ITEMS_FOR_RECOMMENDATION = 5;

type RecommendationIntroStateProps = {
  wearablesCount: number;
};

export default function RecommendationIntroState({ wearablesCount }: RecommendationIntroStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="For You" titleStyle={styles.headerTitle} />
      <Center className="flex-1 px-8">
        <Image source={require("../../assets/mascot/mascot-glasses.png")} style={styles.mascot} contentFit="contain" />
        <RNText style={styles.emptyTitle}>Almost there!</RNText>
        <RNText style={styles.emptySubtitle}>
          Add at least {MIN_ITEMS_FOR_RECOMMENDATION - wearablesCount} more {MIN_ITEMS_FOR_RECOMMENDATION - wearablesCount === 1 ? "item" : "items"} to your wardrobe.
        </RNText>
      </Center>
    </SafeAreaView>
  );
}
