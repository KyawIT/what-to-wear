import React from "react";
import { Text as RNText } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/navigation/app-header";
import { Center } from "@/components/ui/center";
import SpinningMascot from "@/components/common/SpinningMascot";
import { styles } from "./RecommendationLoadingState.styles";

type RecommendationLoadingStateProps = {
  message: string;
};

export default function RecommendationLoadingState({ message }: RecommendationLoadingStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="For You" titleStyle={styles.headerTitle} />
      <Center className="flex-1">
        <SpinningMascot size={140} />
        <RNText style={styles.loadingText}>{message}</RNText>
      </Center>
    </SafeAreaView>
  );
}

