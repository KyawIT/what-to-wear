import React from "react";
import { Text as RNText, View } from "react-native";
import { Center } from "@/components/ui/center";
import { styles } from "./WardrobeListEmptyState.styles";

type WardrobeListEmptyStateProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

export default function WardrobeListEmptyState({ title, subtitle, icon }: WardrobeListEmptyStateProps) {
  return (
    <Center className="pt-12 px-4">
      <View style={styles.emptyIcon}>{icon}</View>
      <RNText style={styles.emptyTitle}>{title}</RNText>
      <RNText style={styles.emptySubtitle}>{subtitle}</RNText>
    </Center>
  );
}

