import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList, Pressable, Dimensions, Text } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, ChevronDown } from "lucide-react-native";

import ImagePermissionGate from "@/components/common/ImagePermissionGate";
import GridImageCell from "@/components/common/GridImageCell";
import ScanPreviewPane from "@/components/common/ScanPreviewPane";
import CameraGridTile from "@/components/common/CameraGridTile";
import { AppHeader } from "@/components/navigation/app-header";
import { colors } from "@/lib/theme";
import { styles } from "../../styles/screens/tabs/scan.styles";

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
          <ScanPreviewPane preview={preview} selectedId={selectedId} />

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
                return <CameraGridTile onPress={onPressCamera} />;
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
