import React from "react";
import { Text as RNText, View } from "react-native";
import { Image } from "expo-image";
import { Sparkles, Plus, Check } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Pressable } from "@/components/ui/pressable";
import { WearableResponseDto } from "@/api/backend/wearable.model";
import { styles } from "./OutfitSuggestionCard.styles";

export type ResolvedOutfit = {
  id: string;
  items: WearableResponseDto[];
};

type OutfitSuggestionCardProps = {
  outfit: ResolvedOutfit;
  isSaved: boolean;
  isSaving: boolean;
  onSave: (outfit: ResolvedOutfit) => void;
};

export default function OutfitSuggestionCard({ outfit, isSaved, isSaving, onSave }: OutfitSuggestionCardProps) {
  return (
    <View style={styles.outfitCard}>
      <View style={styles.outfitCardContent}>
        <View style={styles.outfitHeader}>
          <Sparkles size={14} color={colors.primary} />
          <RNText style={styles.outfitLabel}>{outfit.id.replace("outfit-", "Outfit ")}</RNText>
        </View>

        <View style={styles.outfitGrid}>
          {outfit.items.slice(0, 4).map((w) => (
            <View key={w.id} style={styles.outfitItemThumb}>
              {w.cutoutImageUrl ? (
                <Image source={{ uri: w.cutoutImageUrl }} style={{ width: "100%", height: "100%" }} contentFit="contain" />
              ) : (
                <Center className="flex-1">
                  <RNText style={styles.thumbPlaceholder}>{(w.categoryName ?? "?").charAt(0)}</RNText>
                </Center>
              )}
            </View>
          ))}
        </View>

        <HStack className="flex-wrap gap-1 mt-2">
          {[...new Set(outfit.items.map((w) => w.categoryName).filter(Boolean))].slice(0, 3).map((cat) => (
            <Badge key={cat} variant="solid" className="bg-primary-100" size="sm">
              <BadgeText className="text-primary-700" style={{ fontSize: 10 }}>{cat}</BadgeText>
            </Badge>
          ))}
        </HStack>
      </View>

      <Pressable onPress={() => onSave(outfit)} disabled={isSaved || isSaving} style={[styles.saveButton, isSaved && styles.saveButtonSaved]} className="active:opacity-80">
        {isSaving ? (
          <RNText style={styles.saveButtonText}>Saving...</RNText>
        ) : isSaved ? (
          <HStack className="items-center gap-1"><Check size={14} color="#FFFFFF" strokeWidth={2.5} /><RNText style={styles.saveButtonText}>Saved</RNText></HStack>
        ) : (
          <HStack className="items-center gap-1"><Plus size={14} color="#FFFFFF" strokeWidth={2.5} /><RNText style={styles.saveButtonText}>Add to Collection</RNText></HStack>
        )}
      </Pressable>
    </View>
  );
}

