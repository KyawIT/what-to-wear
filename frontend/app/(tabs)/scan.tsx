import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, FlatList, Pressable, Dimensions, Text, ActivityIndicator, ScrollView } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, ChevronDown, ChevronRight, Image as ImageIcon, Link } from "lucide-react-native";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@/components/ui/modal";

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
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedAlbumLabel, setSelectedAlbumLabel] = useState("All Photos");
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [preview, setPreview] = useState<MediaLibrary.Asset | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const initialLoaded = useRef(false);

  const PAGE_SIZE = 40;

  const loadAssets = useCallback(async (afterCursor?: string, albumId?: string | null) => {
    if (loadingMore) return;
    setLoadingMore(true);

    const page = await MediaLibrary.getAssetsAsync({
      mediaType: "photo",
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      first: PAGE_SIZE,
      ...(albumId ? { album: albumId } : {}),
      ...(afterCursor ? { after: afterCursor } : {}),
    });

    setAssets((prev) => afterCursor ? [...prev, ...page.assets] : page.assets);
    setEndCursor(page.endCursor);
    setHasNextPage(page.hasNextPage);
    setLoadingMore(false);

    return page;
  }, [loadingMore]);

  const loadAlbums = useCallback(async () => {
    const allAlbums = await MediaLibrary.getAlbumsAsync({
      includeSmartAlbums: true,
    });
    const sortedAlbums = [...allAlbums].sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setAlbums(sortedAlbums);
  }, []);

  useEffect(() => {
    if (!permission?.granted || initialLoaded.current) return;
    initialLoaded.current = true;

    (async () => {
      await loadAlbums();
      const page = await loadAssets(undefined, selectedAlbumId);
      if (page && page.assets.length > 0) {
        setPreview(page.assets[0]);
        setSelectedId(page.assets[0].id);
      }
    })();
  }, [permission?.granted, loadAlbums, loadAssets, selectedAlbumId]);

  const handleSelectAlbum = useCallback(async (album: MediaLibrary.Album | null) => {
    const albumId = album?.id ?? null;
    setSelectedAlbumId(albumId);
    setSelectedAlbumLabel(album?.title ?? "All Photos");
    setShowAlbumPicker(false);
    setSelectedId(null);
    setPreview(null);
    const page = await loadAssets(undefined, albumId);
    if (page?.assets?.length) {
      setPreview(page.assets[0]);
      setSelectedId(page.assets[0].id);
    }
  }, [loadAssets]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !loadingMore) {
      loadAssets(endCursor, selectedAlbumId);
    }
  }, [hasNextPage, loadingMore, endCursor, loadAssets, selectedAlbumId]);

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
    router.push("/camera");
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

      {/* Import from Link button */}
      <Pressable
        onPress={() => router.push("/import-link")}
        style={{
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
        }}
        className="active:opacity-60"
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: `${colors.primary}20`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Link size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: colors.textPrimary,
            }}
          >
            Import from Link
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: colors.textMuted,
              marginTop: 1,
            }}
          >
            H&M, Zalando, Pinterest
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </Pressable>

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
            <Pressable
              className="flex-row items-center active:opacity-60"
              onPress={() => setShowAlbumPicker(true)}
            >
              <Text style={styles.galleryLabel}>{selectedAlbumLabel}</Text>
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
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
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

      <Modal isOpen={showAlbumPicker} onClose={() => setShowAlbumPicker(false)} size="md">
        <ModalBackdrop />
        <ModalContent style={styles.albumSheet}>
          <View style={styles.sheetHandle} />
          <ModalHeader style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Photo Sources</Text>
              <Text style={styles.sheetSubtitle}>Pick where to browse images from</Text>
            </View>
            <Pressable onPress={() => setShowAlbumPicker(false)} className="active:opacity-60" style={styles.sheetCloseButton}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </ModalHeader>
          <ModalBody>
            <ScrollView style={{ maxHeight: 360 }}>
              <Pressable
                onPress={() => handleSelectAlbum(null)}
                style={[
                  styles.albumRow,
                  selectedAlbumId === null && styles.albumRowActive,
                ]}
                className="active:opacity-60"
              >
                <View style={styles.albumRowLeft}>
                  <View style={styles.albumRowIcon}>
                    <ImageIcon size={14} color={colors.primary} />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.albumTitle,
                        selectedAlbumId === null && styles.albumTitleActive,
                      ]}
                    >
                      All Photos
                    </Text>
                    <Text style={styles.albumSubtitle}>Entire library</Text>
                  </View>
                </View>
                <ChevronRight
                  size={16}
                  color={selectedAlbumId === null ? colors.primary : colors.textMuted}
                />
              </Pressable>
              {albums.map((album) => (
                <Pressable
                  key={album.id}
                  onPress={() => handleSelectAlbum(album)}
                  style={[
                    styles.albumRow,
                    selectedAlbumId === album.id && styles.albumRowActive,
                  ]}
                  className="active:opacity-60"
                >
                  <View style={styles.albumRowLeft}>
                    <View style={styles.albumRowIcon}>
                      <ImageIcon size={14} color={colors.primary} />
                    </View>
                    <Text
                      style={[
                        styles.albumTitle,
                        selectedAlbumId === album.id && styles.albumTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {album.title} {typeof album.assetCount === "number" ? `(${album.assetCount})` : ""}
                    </Text>
                  </View>
                  <ChevronRight
                    size={16}
                    color={selectedAlbumId === album.id ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </ModalBody>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
};

export default Scan;
