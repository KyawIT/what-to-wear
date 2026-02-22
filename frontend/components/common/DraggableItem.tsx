import React, { useMemo } from "react";
import { Dimensions } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { Maximize2, Shirt } from "lucide-react-native";
import { WearableResponseDto } from "@/api/backend/wearable.model";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { colors } from "@/lib/theme";

const ITEM_SIZE = 100;
const CANVAS_HEIGHT = Dimensions.get("window").height * 0.45;

interface DraggableItemProps {
  item: WearableResponseDto;
  isActive: boolean;
  zIndex: number;
  onActivate: (id: string) => void;
}

export default function DraggableItem({ item, isActive, zIndex, onActivate }: DraggableItemProps) {
  const startX = useMemo(() => Math.random() * (Dimensions.get("window").width - ITEM_SIZE - 32), []);
  const startY = useMemo(() => Math.random() * (CANVAS_HEIGHT - ITEM_SIZE - 32), []);

  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onBegin(() => runOnJS(onActivate)(item.id))
    .onStart(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = offsetX.value + event.translationX;
      translateY.value = offsetY.value + event.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const resizePanGesture = Gesture.Pan()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const scaleChange = (event.translationX + event.translationY) / (ITEM_SIZE * 2);
      scale.value = Math.max(0.3, savedScale.value + scaleChange);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
    borderColor: isActive ? colors.primary : "transparent",
    borderWidth: isActive ? 2 : 0,
    borderRadius: 16,
    zIndex,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[{ position: "absolute", width: ITEM_SIZE, height: ITEM_SIZE }, animatedStyle]}>
        {item.cutoutImageUrl ? (
          <Image source={{ uri: item.cutoutImageUrl }} style={{ width: "100%", height: "100%" }} contentFit="contain" />
        ) : (
          <Center className="flex-1 bg-backgroundSecondary rounded-xl border border-border">
            <Shirt size={24} color={colors.textMuted} />
          </Center>
        )}

        {isActive && (
          <GestureDetector gesture={resizePanGesture}>
            <Box
              className="absolute -right-3 -bottom-3 w-7 h-7 items-center justify-center z-50 rounded-full bg-background-50 shadow-md"
              style={{ borderWidth: 1, borderColor: colors.primary }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Maximize2 size={12} color={colors.primary} />
            </Box>
          </GestureDetector>
        )}
      </Animated.View>
    </GestureDetector>
  );
}
