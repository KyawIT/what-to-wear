import React from "react";
import { Text as RNText } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { colors } from "@/lib/theme";
import { styles } from "./SuggestedTagsSection.styles";

export type SuggestedTagOption = {
  value: string;
  isAi: boolean;
};

type SuggestedTagsSectionProps = {
  availableSuggestions: SuggestedTagOption[];
  predictingTags: boolean;
  aiPredictionError: string | null;
  onAddTag: (tag: string) => void;
};

export default function SuggestedTagsSection({
  availableSuggestions,
  predictingTags,
  aiPredictionError,
  onAddTag,
}: SuggestedTagsSectionProps) {
  if (!(availableSuggestions.length > 0 || aiPredictionError || predictingTags)) return null;

  return (
    <Box className="mt-3">
      <HStack className="items-center mb-2">
        <RNText style={styles.suggestionsLabel}>Suggestions</RNText>
        {predictingTags && <RNText style={styles.aiPredicting}>AI predicting...</RNText>}
      </HStack>

      {aiPredictionError && (
        <Box
          className="rounded-xl px-3 py-3 mb-2"
          style={{
            backgroundColor: `${colors.warning}15`,
            borderWidth: 1,
            borderColor: `${colors.warning}50`,
          }}
        >
          <RNText style={styles.aiErrorText}>{aiPredictionError}</RNText>
        </Box>
      )}

      {availableSuggestions.length > 0 && (
        <HStack className="flex-wrap">
          {availableSuggestions.map((suggestion) => (
            <Pressable
              key={`${suggestion.isAi ? "ai" : "default"}-${suggestion.value.toLowerCase()}`}
              onPress={() => onAddTag(suggestion.value)}
              className="mr-2 mb-2 active:opacity-70"
            >
              <Box
                className="rounded-full px-3 py-2"
                style={{
                  backgroundColor: colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: suggestion.isAi ? `${colors.primary}80` : colors.border,
                }}
              >
                <RNText style={styles.suggestionText}>
                  + {suggestion.isAi ? `✨ ${suggestion.value}` : suggestion.value}
                </RNText>
              </Box>
            </Pressable>
          ))}
        </HStack>
      )}
    </Box>
  );
}
