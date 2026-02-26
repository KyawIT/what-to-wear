import React, { useRef } from "react";
import { Text as RNText, View, Animated } from "react-native";
import { Image } from "expo-image";
import { Heart } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { Center } from "@/components/ui/center";
import { Pressable } from "@/components/ui/pressable";
import { WearableResponseDto } from "@/api/backend/wearable.model";
import { styles, INNER } from "./OutfitSuggestionCard.styles";

export type ResolvedOutfit = {
  id: string;
  items: WearableResponseDto[];
};

type Props = {
  outfit: ResolvedOutfit;
  index: number;
  total: number;
  isSaved: boolean;
  isSaving: boolean;
  onSave: (outfit: ResolvedOutfit) => void;
};

function classifyItem(
  categoryName?: string | null
): "top" | "bottom" | "footwear" | "accessory" {
  const v = (categoryName ?? "").toLowerCase();
  if (/shoe|sneaker|boot|trainer|loafer|heel|sandal|slipper|footwear/.test(v))
    return "footwear";
  if (/pant|jean|short|skirt|dress|bottom|trouser|chino|legging/.test(v))
    return "bottom";
  if (/shirt|top|hoodie|sweater|blouse|tee|upper|jacket|coat/.test(v))
    return "top";
  return "accessory";
}

function ItemImage({ item }: { item: WearableResponseDto }) {
  if (item.cutoutImageUrl) {
    return (
      <Image
        source={{ uri: resolveImageUrl(item.cutoutImageUrl) }}
        style={styles.image}
        contentFit="contain"
        transition={300}
      />
    );
  }
  return (
    <Center className="flex-1">
      <RNText style={styles.placeholder}>
        {(item.categoryName ?? "?").charAt(0)}
      </RNText>
    </Center>
  );
}

const GAP = 12;
const COMPOSITION_HEIGHT = 320;

function getSymmetricalStyle(count: number) {
  if (count === 0) return { width: INNER, height: COMPOSITION_HEIGHT };

  let columns = 1;
  if (count === 2) columns = 2;
  else if (count === 3 || count === 4) columns = 2;
  else if (count >= 5) columns = 3;

  const rows = Math.ceil(count / columns);

  const width = (INNER - (columns - 1) * GAP) / columns;
  const height = (COMPOSITION_HEIGHT - (rows - 1) * GAP) / rows;

  return { width, height };
}

export default function OutfitSuggestionCard({
  outfit,
  index,
  isSaved,
  isSaving,
  onSave,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const items = outfit.items;

  // Sort logically so top is first, then bottom, then footwear, then accessory
  const sorted = [...items].sort((a, b) => {
    const order = { top: 0, bottom: 1, footwear: 2, accessory: 3 };
    return (
      order[classifyItem(a.categoryName)] -
      order[classifyItem(b.categoryName)]
    );
  });

  const categories = [
    ...new Set(items.map((i) => i.categoryName).filter(Boolean)),
  ].slice(0, 4);

  const handleSave = () => {
    if (isSaved || isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.4,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 8,
      }),
    ]).start();
    onSave(outfit);
  };

  const itemStyle = getSymmetricalStyle(sorted.length);

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        {/* Header */}
        <View style={styles.header}>
          <RNText style={styles.lookLabel}>Look {index + 1}</RNText>
          <Pressable
            onPress={handleSave}
            disabled={isSaved || isSaving}
            style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Heart
                size={18}
                color={isSaved ? "#FFFFFF" : "#C9BAAA"}
                fill={isSaved ? "#FFFFFF" : "none"}
                strokeWidth={1.8}
              />
            </Animated.View>
          </Pressable>
        </View>

        {/* Unified Symmetrical Composition */}
        <View style={styles.compositionArea}>
          {sorted.map((item) => (
            <View key={item.id} style={[styles.compositionItem, itemStyle]}>
              <ItemImage item={item} />
            </View>
          ))}
        </View>

        {/* Centered Category Tags */}
        {categories.length > 0 && (
          <View style={styles.tagWrapContainer}>
            <View style={styles.tagRow}>
              {categories.map((cat) => (
                <View key={cat} style={styles.tag}>
                  <RNText style={styles.tagText}>{cat}</RNText>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
