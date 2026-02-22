import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  Dimensions,
  Text as RNText,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Sparkles, RefreshCw, Plus, Check } from "lucide-react-native";
import ViewShot from "react-native-view-shot";

import { authClient } from "@/lib/auth-client";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { AppHeader } from "@/components/navigation/app-header";
import { Pressable } from "@/components/ui/pressable";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Badge, BadgeText } from "@/components/ui/badge";
import { colors } from "@/lib/theme";

import {
  WearableResponseDto,
} from "@/api/backend/wearable.model";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import {
  recommendOutfitsFromUploads,
  createOutfitMultipart,
} from "@/api/backend/outfit.api";
import {
  getOutfitPreviewItems,
  buildOutfitPreviewFile,
  MAX_OUTFIT_PREVIEW_ITEMS,
} from "@/lib/image/outfit-preview";

const MIN_ITEMS_FOR_RECOMMENDATION = 5;
const screenWidth = Dimensions.get("window").width;
const CARD_WIDTH = (screenWidth - 48) / 2;

type ResolvedOutfit = {
  id: string;
  items: WearableResponseDto[];
};

type CoreBucket = "TOP" | "BOTTOM" | "FOOTWEAR";

function inferBucket(categoryName?: string | null): CoreBucket | null {
  const value = (categoryName ?? "").toLowerCase();
  if (
    value.includes("shoe") ||
    value.includes("sneaker") ||
    value.includes("boot") ||
    value.includes("footwear") ||
    value.includes("trainer") ||
    value.includes("loafer") ||
    value.includes("heel") ||
    value.includes("sandal") ||
    value.includes("slipper")
  ) {
    return "FOOTWEAR";
  }
  if (
    value.includes("pant") ||
    value.includes("jean") ||
    value.includes("short") ||
    value.includes("skirt") ||
    value.includes("dress") ||
    value.includes("bottom") ||
    value.includes("trouser") ||
    value.includes("chino") ||
    value.includes("legging")
  ) {
    return "BOTTOM";
  }
  if (
    value.includes("shirt") ||
    value.includes("top") ||
    value.includes("hoodie") ||
    value.includes("sweater") ||
    value.includes("blouse") ||
    value.includes("tee") ||
    value.includes("upper")
  ) {
    return "TOP";
  }
  return null;
}

function prettyBucket(bucket: CoreBucket): string {
  if (bucket === "TOP") return "top";
  if (bucket === "BOTTOM") return "bottom";
  return "footwear";
}

const SpinningMascot = ({ size = 120 }: { size?: number }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Image
        source={require("../../assets/mascot/mascot-tail-chase.png")}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
};

const Index = () => {
  const { data } = authClient.useSession();

  const [wearables, setWearables] = useState<WearableResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [outfits, setOutfits] = useState<ResolvedOutfit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savedOutfitIds, setSavedOutfitIds] = useState<Set<string>>(new Set());
  const [savingOutfitId, setSavingOutfitId] = useState<string | null>(null);
  const [captureItems, setCaptureItems] = useState<WearableResponseDto[] | null>(null);
  const [captureExtraCount, setCaptureExtraCount] = useState(0);
  const captureRef = useRef<ViewShot>(null);
  const captureResolverRef = useRef<((uri: string | null) => void) | null>(null);

  const loadWearables = useCallback(async () => {
    if (!data?.user?.id) return;
    try {
      const token = await getKeycloakAccessToken(data.user.id);
      const items = await fetchAllWearables(token);
      setWearables(items);
      return { items, token };
    } catch (err) {
      console.error("Failed to fetch wearables:", err);
      setError("Failed to load your wardrobe");
      return null;
    }
  }, [data?.user?.id]);

  const generateOutfits = useCallback(
    async (items: WearableResponseDto[], token: string) => {
      if (items.length < MIN_ITEMS_FOR_RECOMMENDATION) return;

      setGenerating(true);
      setError(null);
      try {
        const itemsWithImage = items.filter((w) => w.cutoutImageUrl);
        if (itemsWithImage.length < MIN_ITEMS_FOR_RECOMMENDATION) {
          setOutfits([]);
          setError("At least 5 wardrobe items with processed images are required.");
          return;
        }

        const bucketCounts: Record<CoreBucket, number> = {
          TOP: 0,
          BOTTOM: 0,
          FOOTWEAR: 0,
        };
        for (const item of itemsWithImage) {
          const bucket = inferBucket(item.categoryName);
          if (bucket) {
            bucketCounts[bucket] += 1;
          }
        }
        const missingBuckets = (Object.keys(bucketCounts) as CoreBucket[]).filter(
          (bucket) => bucketCounts[bucket] < 1
        );
        if (missingBuckets.length > 0) {
          setOutfits([]);
          setError(
            `Add at least one ${missingBuckets.map(prettyBucket).join(", ")} item to generate outfits.`
          );
          return;
        }

        const wearableInput = itemsWithImage.map((w) => ({
          wearableId: w.id,
          imageUri: w.cutoutImageUrl!,
        }));

        const result = await recommendOutfitsFromUploads(
          { items: wearableInput, limitOutfits: 6 },
          token
        );

        const rawOutfits = Array.isArray(result?.outfits) ? result.outfits : [];

        if (rawOutfits.length > 0) {
          const resolved: ResolvedOutfit[] = rawOutfits
            .map((outfit, index) => {
              const resolvedItems = (outfit.wearables ?? [])
                .map((w) => w?.id)
                .filter((id): id is string => Boolean(id))
                .map((id) => items.find((item) => item.id === id))
                .filter(Boolean) as WearableResponseDto[];

              return {
                id: outfit.id ?? `outfit-${index + 1}`,
                items: resolvedItems,
              };
            })
            .filter((o) => o.items.length > 0);

          if (resolved.length === 0) {
            setError("Outfits were generated, but matching wardrobe items could not be resolved.");
          }

          setOutfits(resolved);
        } else {
          setOutfits([]);
          setError("No outfit recommendations were returned.");
        }
      } catch (err) {
        console.error("Outfit generation error:", err);
        setError(
          err instanceof Error && err.message.trim()
            ? err.message
            : "Something went wrong generating outfits."
        );
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  const loadAndGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSavedOutfitIds(new Set());
    const result = await loadWearables();
    if (result) {
      await generateOutfits(result.items, result.token);
    }
    setLoading(false);
  }, [loadWearables, generateOutfits]);

  useFocusEffect(
    useCallback(() => {
      loadAndGenerate();
    }, [loadAndGenerate])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAndGenerate();
    setRefreshing(false);
  }, [loadAndGenerate]);

  const handleRegenerate = useCallback(async () => {
    if (!data?.user?.id) return;
    setGenerating(true);
    setError(null);
    setSavedOutfitIds(new Set());
    try {
      const token = await getKeycloakAccessToken(data.user.id);
      const items = await fetchAllWearables(token);
      setWearables(items);
      if (items.length >= MIN_ITEMS_FOR_RECOMMENDATION) {
        await generateOutfits(items, token);
      }
    } catch (err) {
      console.error("Regenerate error:", err);
      setError("Something went wrong. Pull down to try again.");
    } finally {
      setGenerating(false);
    }
  }, [data?.user?.id, generateOutfits]);

  const captureOutfitPreviewImage = useCallback(async (items: WearableResponseDto[]) => {
    const previewItems = getOutfitPreviewItems(items);
    if (previewItems.length === 0) return null;

    return new Promise<string | null>((resolve) => {
      captureResolverRef.current = resolve;
      setCaptureItems(previewItems);
      setCaptureExtraCount(Math.max(0, items.length - previewItems.length));
    });
  }, []);

  useEffect(() => {
    if (!captureItems || captureItems.length === 0) return;

    let cancelled = false;

    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));

      let uri: string | null = null;
      try {
        uri = (await captureRef.current?.capture?.()) ?? null;
      } catch (err) {
        console.error("Outfit preview capture failed:", err);
      }

      if (!cancelled) {
        captureResolverRef.current?.(uri);
        captureResolverRef.current = null;
        setCaptureItems(null);
        setCaptureExtraCount(0);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [captureItems]);

  useEffect(() => {
    return () => {
      if (captureResolverRef.current) {
        captureResolverRef.current(null);
        captureResolverRef.current = null;
      }
    };
  }, []);

  const handleSaveOutfit = useCallback(
    async (outfit: ResolvedOutfit) => {
      if (!data?.user?.id || savedOutfitIds.has(outfit.id)) return;
      setSavingOutfitId(outfit.id);
      try {
        const token = await getKeycloakAccessToken(data.user.id);
        const wearableIds = outfit.items.map((w) => w.id);
        const previewUri = await captureOutfitPreviewImage(outfit.items);
        await createOutfitMultipart(
          {
            title: outfit.id.replace("outfit-", "Outfit "),
            wearableIds,
            file: buildOutfitPreviewFile(previewUri),
          },
          token
        );
        setSavedOutfitIds((prev) => new Set(prev).add(outfit.id));
      } catch (err) {
        console.error("Save outfit error:", err);
        Alert.alert(
          "Save Failed",
          err instanceof Error ? err.message : "Could not save outfit."
        );
      } finally {
        setSavingOutfitId(null);
      }
    },
    [captureOutfitPreviewImage, data?.user?.id, savedOutfitIds]
  );

  // Not enough items state
  if (!loading && wearables.length < MIN_ITEMS_FOR_RECOMMENDATION) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <AppHeader title="For You" titleStyle={styles.headerTitle} />
        <Center className="flex-1 px-8">
          <Image
            source={require("../../assets/mascot/mascot-glasses.png")}
            style={styles.mascot}
            contentFit="contain"
          />
          <RNText style={styles.emptyTitle}>
            Almost there!
          </RNText>
          <RNText style={styles.emptySubtitle}>
            Add at least {MIN_ITEMS_FOR_RECOMMENDATION - wearables.length} more{" "}
            {MIN_ITEMS_FOR_RECOMMENDATION - wearables.length === 1 ? "item" : "items"} to your
            wardrobe to unlock personalized outfit recommendations.
          </RNText>
          <RNText style={styles.categoryHint}>
            Make sure to include at least one top, one bottom, and one pair of footwear.
          </RNText>
          <View style={styles.progressRow}>
            {Array.from({ length: MIN_ITEMS_FOR_RECOMMENDATION }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < wearables.length
                    ? styles.progressDotFilled
                    : styles.progressDotEmpty,
                ]}
              />
            ))}
          </View>
          <RNText style={styles.progressText}>
            {wearables.length} / {MIN_ITEMS_FOR_RECOMMENDATION} items
          </RNText>
        </Center>
      </SafeAreaView>
    );
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <AppHeader title="For You" titleStyle={styles.headerTitle} />
        <Center className="flex-1">
          <SpinningMascot size={140} />
          <RNText style={[styles.loadingText, { marginTop: 20 }]}>
            {generating ? "Creating outfits..." : "Loading your wardrobe..."}
          </RNText>
        </Center>
      </SafeAreaView>
    );
  }

  const renderOutfitCard = ({ item }: { item: ResolvedOutfit }) => {
    const isSaved = savedOutfitIds.has(item.id);
    const isSaving = savingOutfitId === item.id;

    return (
      <View style={styles.outfitCard}>
        <View style={styles.outfitHeader}>
          <Sparkles size={14} color={colors.primary} />
          <RNText style={styles.outfitLabel}>
            {item.id.replace("outfit-", "Outfit ")}
          </RNText>
        </View>

        <View style={styles.outfitGrid}>
          {item.items.slice(0, 4).map((w) => (
            <View key={w.id} style={styles.outfitItemThumb}>
              {w.cutoutImageUrl ? (
                <Image
                  source={{ uri: w.cutoutImageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="contain"
                />
              ) : (
                <Center className="flex-1">
                  <RNText style={styles.thumbPlaceholder}>
                    {(w.categoryName ?? "?").charAt(0)}
                  </RNText>
                </Center>
              )}
            </View>
          ))}
        </View>

        {item.items.length > 4 && (
          <RNText style={styles.moreItems}>
            +{item.items.length - 4} more
          </RNText>
        )}

        <HStack className="flex-wrap gap-1 mt-2">
          {[...new Set(item.items.map((w) => w.categoryName).filter(Boolean))]
            .slice(0, 3)
            .map((cat) => (
              <Badge key={cat} variant="solid" className="bg-primary-100" size="sm">
                <BadgeText className="text-primary-700" style={{ fontSize: 10 }}>
                  {cat}
                </BadgeText>
              </Badge>
            ))}
        </HStack>

        <Pressable
          onPress={() => handleSaveOutfit(item)}
          disabled={isSaved || isSaving}
          style={[
            styles.saveButton,
            isSaved && styles.saveButtonSaved,
          ]}
          className="active:opacity-80"
        >
          {isSaving ? (
            <RNText style={styles.saveButtonText}>Saving...</RNText>
          ) : isSaved ? (
            <HStack className="items-center gap-1">
              <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
              <RNText style={styles.saveButtonText}>Saved</RNText>
            </HStack>
          ) : (
            <HStack className="items-center gap-1">
              <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
              <RNText style={styles.saveButtonText}>Add to Collection</RNText>
            </HStack>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader
        title="For You"
        titleStyle={styles.headerTitle}
        right={
          <Pressable
            onPress={handleRegenerate}
            disabled={generating}
            style={styles.refreshButton}
            className="active:opacity-70"
          >
            {generating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshCw size={20} color={colors.primary} strokeWidth={2} />
            )}
          </Pressable>
        }
      />

      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        columnWrapperStyle={
          outfits.length > 0 ? { justifyContent: "space-between" } : undefined
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <VStack className="gap-1 pt-4 pb-4">
            <RNText style={styles.sectionTitle}>Outfit Suggestions</RNText>
            <RNText style={styles.sectionSubtitle}>
              Based on your {wearables.length} wardrobe items
            </RNText>
          </VStack>
        }
        ListEmptyComponent={
          generating ? (
            <Center className="pt-12">
              <SpinningMascot size={120} />
              <RNText style={[styles.loadingText, { marginTop: 20 }]}>Creating outfits...</RNText>
            </Center>
          ) : error ? (
            <Center className="pt-12 px-4">
              <Image
                source={require("../../assets/mascot/mascot-sad.png")}
                style={styles.errorMascot}
                contentFit="contain"
              />
              <RNText style={styles.emptyTitle}>No outfits generated</RNText>
              <RNText style={styles.emptySubtitle}>{error}</RNText>
              <Pressable
                onPress={handleRegenerate}
                className="rounded-full px-6 py-3 active:opacity-80 mt-6"
                style={{ backgroundColor: colors.primary }}
              >
                <RNText style={styles.retryText}>Try Again</RNText>
              </Pressable>
            </Center>
          ) : (
            <Center className="pt-12 px-4">
              <View style={styles.emptyIcon}>
                <Sparkles size={40} color={colors.primary} strokeWidth={1.5} />
              </View>
              <RNText style={styles.emptyTitle}>No outfits yet</RNText>
              <RNText style={styles.emptySubtitle}>
                Upload clothing items that include at least one top, one bottom, and one pair of footwear to get outfit recommendations.
              </RNText>
            </Center>
          )
        }
        renderItem={renderOutfitCard}
      />

      <View pointerEvents="none" style={styles.captureHost}>
        <ViewShot
          ref={captureRef}
          options={{
            format: "png",
            quality: 1,
            result: "tmpfile",
          }}
        >
          <View style={styles.captureCanvas}>
            {(captureItems ?? []).slice(0, MAX_OUTFIT_PREVIEW_ITEMS).map((wearable, idx) => (
              <View key={`${wearable.id}-${idx}`} style={styles.captureCell}>
                {wearable.cutoutImageUrl ? (
                  <Image
                    source={{ uri: wearable.cutoutImageUrl }}
                    style={styles.captureImage}
                    contentFit="contain"
                  />
                ) : (
                  <Center className="flex-1">
                    <RNText style={styles.thumbPlaceholder}>
                      {(wearable.categoryName ?? "?").charAt(0)}
                    </RNText>
                  </Center>
                )}
              </View>
            ))}
            {captureExtraCount > 0 ? (
              <View style={styles.captureCountBadge}>
                <RNText style={styles.captureCountBadgeText}>+{captureExtraCount}</RNText>
              </View>
            ) : null}
          </View>
        </ViewShot>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  refreshButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#D4A57415",
  },
  sectionTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#3D2E22",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9B8B7F",
  },
  outfitCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0E8DC",
    shadowColor: "#C9BAAA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  outfitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  outfitLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#3D2E22",
  },
  outfitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  outfitItemThumb: {
    width: (CARD_WIDTH - 30) / 2,
    height: (CARD_WIDTH - 30) / 2,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: "#F0E8DC",
  },
  captureHost: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
    width: 220,
    height: 220,
  },
  captureCanvas: {
    width: 220,
    height: 220,
    backgroundColor: "#FAF7F2",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  captureCell: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0E8DC",
  },
  captureImage: {
    width: "100%",
    height: "100%",
  },
  captureCountBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(61, 46, 34, 0.85)",
  },
  captureCountBadgeText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 14,
  },
  thumbPlaceholder: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 16,
    color: "#9B8B7F",
  },
  moreItems: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#9B8B7F",
    textAlign: "center",
    marginTop: 4,
  },
  mascot: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: "#3D2E22",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9B8B7F",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  categoryHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#B89E8E",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
    maxWidth: 260,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
    marginBottom: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotFilled: {
    backgroundColor: "#D4A574",
  },
  progressDotEmpty: {
    backgroundColor: "#F0E8DC",
  },
  progressText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#9B8B7F",
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9B8B7F",
    marginTop: 16,
  },
  emptyIcon: {
    height: 96,
    width: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#F7E9D7",
  },
  errorMascot: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.6,
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: "#D4A574",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonSaved: {
    backgroundColor: "#8BAF7A",
  },
  saveButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
  },
});

export default Index;
