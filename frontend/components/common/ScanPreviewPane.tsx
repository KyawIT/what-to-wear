import React from "react";
import { Dimensions, Text, View } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { Camera, Check } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { styles } from "./ScanPreviewPane.styles";

const W = Dimensions.get("window").width;

type ScanPreviewPaneProps = {
  preview: MediaLibrary.Asset | null;
  selectedId: string | null;
};

export default function ScanPreviewPane({ preview, selectedId }: ScanPreviewPaneProps) {
  return (
    <View style={{ width: "100%", height: W }} className="overflow-hidden">
      {preview ? (
        <Image source={{ uri: preview.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
      ) : (
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.backgroundSecondary }}>
          <Camera size={48} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={styles.selectPhotoText}>Select a photo</Text>
        </View>
      )}

      {selectedId && (
        <View className="absolute top-3 right-3">
          <View className="h-7 w-7 rounded-full items-center justify-center shadow-sm" style={{ backgroundColor: colors.primary }}>
            <Check size={16} color="white" strokeWidth={3} />
          </View>
        </View>
      )}
    </View>
  );
}

