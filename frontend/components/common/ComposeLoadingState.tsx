import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { styles } from "./ComposeLoadingState.styles";

type ComposeLoadingStateProps = {
  message: string;
};

export default function ComposeLoadingState({ message }: ComposeLoadingStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <Center className="flex-1">
        <Spinner size="large" className="text-primary-500" />
        <Text className="mt-4 text-typography-400" style={styles.loadingText}>{message}</Text>
      </Center>
    </SafeAreaView>
  );
}
