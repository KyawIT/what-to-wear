import React from "react";
import { Text as RNText } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { styles } from "./CreateLoadingState.styles";

type CreateLoadingStateProps = { message: string };

export default function CreateLoadingState({ message }: CreateLoadingStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <Center className="flex-1">
        <Spinner size="large" className="text-primary-500" />
        <RNText style={styles.loadingText}>{message}</RNText>
      </Center>
    </SafeAreaView>
  );
}

