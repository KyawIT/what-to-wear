import React from "react";
import { Text as RNText } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/navigation/app-header";
import { Center } from "@/components/ui/center";
import { Pressable } from "@/components/ui/pressable";
import { colors } from "@/lib/theme";
import { styles } from "./WardrobeErrorState.styles";

type WardrobeErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export default function WardrobeErrorState({ message, onRetry }: WardrobeErrorStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="My Wardrobe" titleStyle={styles.headerTitle} />
      <Center className="flex-1 px-8">
        <Image source={require("../../assets/mascot/mascot-sad.png")} style={styles.errorMascot} contentFit="contain" />
        <RNText style={styles.emptyTitle}>Something went wrong</RNText>
        <RNText style={styles.emptySubtitle}>{message}</RNText>
        <RNText style={styles.errorHint}>Try logging out and back in.</RNText>
        <Pressable onPress={onRetry} className="rounded-full px-6 py-3 active:opacity-80 mt-6" style={{ backgroundColor: colors.primary }}>
          <RNText style={styles.retryText}>Try Again</RNText>
        </Pressable>
      </Center>
    </SafeAreaView>
  );
}

