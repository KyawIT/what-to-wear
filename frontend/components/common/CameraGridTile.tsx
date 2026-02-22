import React from "react";
import { Pressable, Text, View } from "react-native";
import { Camera } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { styles } from "./CameraGridTile.styles";

type CameraGridTileProps = {
  onPress: () => void;
};

export default function CameraGridTile({ onPress }: CameraGridTileProps) {
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <View style={styles.tile}>
        <View style={styles.iconCircle}>
          <Camera size={24} color={colors.primary} />
        </View>
        <Text style={styles.cameraLabel}>Camera</Text>
      </View>
    </Pressable>
  );
}
