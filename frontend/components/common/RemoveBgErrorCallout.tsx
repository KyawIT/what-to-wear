import React from "react";
import { Text as RNText } from "react-native";
import { RotateCcw } from "lucide-react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/theme";
import { styles } from "./RemoveBgErrorCallout.styles";

type RemoveBgErrorCalloutProps = {
  error: string;
  loading: boolean;
  onRetry: () => void;
  onRetake: () => void;
};

export default function RemoveBgErrorCallout({
  error,
  loading,
  onRetry,
  onRetake,
}: RemoveBgErrorCalloutProps) {
  return (
    <Box
      className="mt-4 rounded-2xl p-4"
      style={{
        backgroundColor: `${colors.error}10`,
        borderWidth: 1,
        borderColor: `${colors.error}30`,
      }}
    >
      <HStack className="items-center mb-2">
        <Text className="text-2xl mr-2">⚠️</Text>
        <RNText style={styles.errorTitle}>Something went wrong</RNText>
      </HStack>
      <RNText style={styles.errorBody}>{error}</RNText>

      <HStack className="mt-4 space-x-3">
        <Pressable
          onPress={onRetry}
          className="flex-1 mr-3 rounded-xl py-3 items-center active:opacity-80"
          style={{
            backgroundColor: `${colors.error}15`,
            borderWidth: 1,
            borderColor: `${colors.error}30`,
          }}
          disabled={loading}
        >
          <HStack className="items-center">
            <RotateCcw size={16} color={colors.error} />
            <RNText style={styles.retryText}>Retry</RNText>
          </HStack>
        </Pressable>

        <Pressable
          onPress={onRetake}
          className="flex-1 rounded-xl py-3 items-center active:opacity-80"
          style={{ backgroundColor: colors.error }}
          disabled={loading}
        >
          <RNText style={styles.retakeText}>Retake Photo</RNText>
        </Pressable>
      </HStack>
    </Box>
  );
}

