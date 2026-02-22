import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList, Pressable, Dimensions, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, Check, Camera, ChevronDown } from "lucide-react-native";

import ImagePermissionGate from "@/components/common/ImagePermissionGate";
import GridImageCell from "@/components/common/GridImageCell";
import { AppHeader } from "@/components/navigation/app-header";
import { colors } from "@/lib/theme";

const W = Dimensions.get("window").width;
const SIZE = W / 3;

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
      <AppHeader
        title="Select Photo"
        titleStyle={styles.headerTitle}
        left={(
          <Pressable
            style={styles.closeButton}
            onPress={() => router.push("/")}
          >
            <X size={22} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
        )}
        right={(
          <Pressable
            style={[
              styles.nextButton,
              { backgroundColor: selectedId ? colors.primary : "#E8DED3" },
            ]}
            onPress={onNext}
            disabled={!selectedId}
          >
            <Text
              style={[
                styles.nextText,
                { color: selectedId ? "#FFFFFF" : colors.textMuted },
              ]}
            >
              Next
            </Text>
          </Pressable>
        )}
      />

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
                <Text style={styles.selectPhotoText}>Select a photo</Text>
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
          <View style={styles.galleryHeader}>
            <Pressable className="flex-row items-center active:opacity-60">
              <Text style={styles.galleryLabel}>Recent</Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </Pressable>

            <Text style={styles.photoCount}>{assets.length} photos</Text>
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

                      <Text style={styles.cameraLabel}>Camera</Text>
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

const styles = StyleSheet.create({
  closeButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#8B735512",
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  nextButton: {
    height: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  nextText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  selectPhotoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#9B8B7F",
    marginTop: 12,
  },
  galleryHeader: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FAF7F2",
    borderTopWidth: 1,
    borderTopColor: "#F0E8DC",
    borderBottomWidth: 1,
    borderBottomColor: "#F0E8DC",
  },
  galleryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#3D2E22",
    marginRight: 4,
  },
  photoCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#9B8B7F",
  },
  cameraLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#6B5B4F",
    marginTop: 8,
  },
});

export default Scan;
