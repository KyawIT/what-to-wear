import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList, Pressable, Dimensions, Text } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, Check, Camera, ChevronDown } from "lucide-react-native";

import ImagePermissionGate from "@/components/common/ImagePermissionGate";
import GridImageCell from "@/components/common/GridImageCell";

const W = Dimensions.get("window").width;
const SIZE = W / 3;

// Beige theme colors
const colors = {
  background: "#FAF7F2",
  backgroundSecondary: "#F5EFE6",
  primary: "#D4A574",
  secondary: "#8B7355",
  accent: "#4A3728",
  textPrimary: "#3D2E22",
  textSecondary: "#6B5B4F",
  textMuted: "#9B8B7F",
  border: "#E8DED3",
};

type GridItem =
  | { type: "camera"; id: "camera" }
  | ({ type: "image" } & MediaLibrary.Asset);

const Scan = () => {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [preview, setPreview] = useState<MediaLibrary.Asset | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) return;

      const page = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        first: 120,
      });

      setAssets(page.assets);

      const first = page.assets[0] ?? null;
      setPreview(first);
      setSelectedId(first?.id ?? null);
    })();
  }, [permission?.granted]);

  const gridData: GridItem[] = useMemo(
    () => [
      { type: "camera", id: "camera" },
      ...assets.map((a) => ({ ...a, type: "image" as const })),
    ],
    [assets]
  );

  const selectAsset = (asset: MediaLibrary.Asset) => {
    setPreview(asset);
    setSelectedId(asset.id);
  };

  const onPressCamera = () => {
    // TODO: add in-app camera later (photo only)
  };

  const onNext = () => {
    if (!preview) return;

    router.push({
      pathname: "/preview",
      params: {
        id: preview.id,
        uri: preview.uri,
      },
    });
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        className="h-14 flex-row items-center justify-between px-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
          style={{ backgroundColor: `${colors.secondary}15` }}
          onPress={() => router.push("/")}
        >
          <X size={22} color={colors.textSecondary} strokeWidth={2} />
        </Pressable>

        <Text
          className="text-lg font-semibold"
          style={{ color: colors.textPrimary }}
        >
          Select Photo
        </Text>

        <Pressable
          className="h-10 px-4 items-center justify-center rounded-full active:opacity-60"
          style={{
            backgroundColor: selectedId ? colors.primary : colors.border,
          }}
          onPress={onNext}
          disabled={!selectedId}
        >
          <Text
            className="text-sm font-semibold"
            style={{
              color: selectedId ? "#FFFFFF" : colors.textMuted,
            }}
          >
            Next
          </Text>
        </Pressable>
      </View>

      <ImagePermissionGate
        permission={permission}
        requestPermission={requestPermission}
        title="Allow access to your photos"
        description="We need access to your photo library so you can select photos and post them directly from the app."
        ctaAllowText="Allow Photo Access"
        ctaSettingsText="Open Settings"
        icon={
          <Image
            source={require("@/assets/logo/logo-md.png")}
            style={{ width: 72, height: 72 }}
            contentFit="contain"
          />
        }
      >
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Preview */}
          <View
            style={{ width: "100%", height: W }}
            className="overflow-hidden"
          >
            {preview ? (
              <Image
                source={{ uri: preview.uri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <View
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <Camera size={48} color={colors.textMuted} strokeWidth={1.5} />
                <Text
                  className="mt-3 text-base"
                  style={{ color: colors.textMuted }}
                >
                  Select a photo
                </Text>
              </View>
            )}

            {/* Selection indicator */}
            {selectedId && (
              <View className="absolute top-3 right-3">
                <View
                  className="h-7 w-7 rounded-full items-center justify-center shadow-sm"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Check size={16} color="white" strokeWidth={3} />
                </View>
              </View>
            )}
          </View>

          {/* Grid Gallery Header */}
          <View
            className="h-12 flex-row items-center justify-between px-4"
            style={{
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable className="flex-row items-center active:opacity-60">
              <Text
                className="text-sm font-semibold mr-1"
                style={{ color: colors.textPrimary }}
              >
                Recent
              </Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </Pressable>

            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {assets.length} photos
            </Text>
          </View>

          {/* Grid */}
          <FlatList
            data={gridData}
            keyExtractor={(item) => item.id}
            numColumns={3}
            extraData={selectedId}
            style={{ backgroundColor: colors.backgroundSecondary }}
            columnWrapperStyle={{ gap: 2 }}
            contentContainerStyle={{ gap: 2, paddingBottom: 100 }}
            renderItem={({ item }) => {
              if (item.type === "camera") {
                return (
                  <Pressable onPress={onPressCamera} className="active:opacity-80">
                    <View
                      style={{
                        width: SIZE - 1.33,
                        height: SIZE - 1.33,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.background,
                      }}
                    >
                      <View
                        className="h-14 w-14 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}20` }}
                      >
                        <Camera size={24} color={colors.primary} />
                      </View>

                      <Text
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: colors.textSecondary,
                          fontWeight: "500",
                        }}
                      >
                        Camera
                      </Text>
                    </View>
                  </Pressable>
                );
              }

              const isActive = selectedId === item.id;

              return (
                <GridImageCell
                  item={item}
                  size={SIZE - 1.33}
                  isActive={isActive}
                  onPress={() => selectAsset(item)}
                  activeBorderColor={colors.primary}
                />
              );
            }}
          />
        </View>
      </ImagePermissionGate>
    </SafeAreaView>
  );
};

export default Scan;
