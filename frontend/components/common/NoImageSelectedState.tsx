import React from "react";
import { Text as RNText } from "react-native";
import { Center } from "@/components/ui/center";
import { Button, ButtonText } from "@/components/ui/button";
import { colors } from "@/lib/theme";
import { styles } from "./NoImageSelectedState.styles";

type NoImageSelectedStateProps = {
  onBack: () => void;
};

export default function NoImageSelectedState({ onBack }: NoImageSelectedStateProps) {
  return (
    <Center className="flex-1 px-6" style={{ backgroundColor: colors.background }}>
      <RNText style={styles.emptyTitle}>No image selected</RNText>
      <Button variant="outline" action="secondary" onPress={onBack} className="mt-4 rounded-xl">
        <ButtonText style={{ color: colors.textPrimary }}>Go back</ButtonText>
      </Button>
    </Center>
  );
}

