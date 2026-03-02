import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, FlatList, Text as RNText, Alert, ActivityIndicator, RefreshControl, Animated } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { RefreshCw } from "lucide-react-native";
import ViewShot from "react-native-view-shot";

import { authClient } from "@/lib/auth-client";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { isAuthError, handleAuthError } from "@/lib/auth-error";
import { AppHeader } from "@/components/navigation/app-header";
import { Pressable } from "@/components/ui/pressable";
import { Center } from "@/components/ui/center";
import { VStack } from "@/components/ui/vstack";
import { colors } from "@/lib/theme";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import RecommendationIntroState from "@/components/common/RecommendationIntroState";
import RecommendationLoadingState from "@/components/common/RecommendationLoadingState";
import RecommendationEmptyState from "@/components/common/RecommendationEmptyState";
import OutfitSuggestionCard from "@/components/common/OutfitSuggestionCard";
import { CARD_WIDTH } from "@/components/common/OutfitSuggestionCard.styles";

import {
  WearableResponseDto,
} from "@/api/backend/wearable.model";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import { styles } from "../../styles/screens/tabs/index.styles";
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
const PAGER_GAP = 12;
const PAGER_INTERVAL = CARD_WIDTH + PAGER_GAP;

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

function toFriendlyRecommendationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lowered = message.toLowerCase();
  if (
    lowered.includes("failed to recommend outfits") &&
    (lowered.includes("download failed") ||
      lowered.includes("network request failed") ||
      lowered.includes("name not resolved") ||
      lowered.includes("could not resolve host"))
  ) {
    return "Outfit generation could not access your clothing images. Check backend MinIO/public image URL configuration.";
  }
  return message.trim() || "Something went wrong generating outfits.";
}

const Index = () => {
  const { data } = authClient.useSession();
  const router = useRouter();
  const toast = useToast();

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
  const scrollX = useRef(new Animated.Value(0)).current;

  const loadWearables = useCallback(async () => {
    if (!data?.user?.id) return;
    try {
      const token = await getKeycloakAccessToken(data.user.id);
      const items = await fetchAllWearables(token);
      setWearables(items);
      return { items, token };
    } catch (err) {
      if (isAuthError(err)) { handleAuthError(); return null; }
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
        const categorizedItems = itemsWithImage.filter(
          (w) => Boolean(w.categoryId?.trim()) && Boolean(w.categoryName?.trim())
        );

        if (categorizedItems.length < MIN_ITEMS_FOR_RECOMMENDATION) {
          setOutfits([]);
          setError(
            "At least 5 wardrobe items with processed images and categories are required."
          );
          return;
        }

        const bucketCounts: Record<CoreBucket, number> = {
          TOP: 0,
          BOTTOM: 0,
          FOOTWEAR: 0,
        };
        for (const item of categorizedItems) {
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

        const wearableInput = categorizedItems.map((w) => ({
          wearableId: w.id,
          imageUri: w.cutoutImageUrl!,
          tags: w.tags ?? [],
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
      } catch (genErr) {
        if (isAuthError(genErr)) { handleAuthError(); return; }
        setError(toFriendlyRecommendationError(genErr));
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
    scrollX.setValue(0);
    const result = await loadWearables();
    if (result) {
      await generateOutfits(result.items, result.token);
    }
    setLoading(false);
  }, [loadWearables, generateOutfits, scrollX]);

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
    scrollX.setValue(0);
    try {
      const token = await getKeycloakAccessToken(data.user.id);
      const items = await fetchAllWearables(token);
      setWearables(items);
      if (items.length >= MIN_ITEMS_FOR_RECOMMENDATION) {
        await generateOutfits(items, token);
      }
    } catch (err) {
      if (isAuthError(err)) { handleAuthError(); return; }
      setError("Something went wrong. Pull down to try again.");
    } finally {
      setGenerating(false);
    }
  }, [data?.user?.id, generateOutfits, scrollX]);

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
      } catch {
        toast.show({
          render: ({ id: toastId }) => (
            <Toast nativeID={`toast-${toastId}`} action="error">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>Failed to capture outfit preview</ToastDescription>
            </Toast>
          ),
        });
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
  }, [captureItems, toast]);

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
        if (isAuthError(err)) { handleAuthError(); return; }
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
      <RecommendationIntroState
        wearablesCount={wearables.length}
        onScanPress={() => router.push("/scan")}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <RecommendationLoadingState
        message={generating ? "Creating outfits..." : "Loading your wardrobe..."}
      />
    );
  }

  const renderOutfitCard = ({ item, index }: { item: ResolvedOutfit; index: number }) => {
    const isSaved = savedOutfitIds.has(item.id);
    const isSaving = savingOutfitId === item.id;

    return (
      <View style={[styles.pagerCardWrap, index === outfits.length - 1 && styles.lastPagerCardWrap]}>
        <OutfitSuggestionCard
          outfit={item}
          index={index}
          total={outfits.length}
          isSaved={isSaved}
          isSaving={isSaving}
          onSave={handleSaveOutfit}
        />
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

      <VStack className="gap-1 px-6 pt-4 pb-4">
        <RNText style={styles.sectionTitle}>Outfit Suggestions</RNText>
        <RNText style={styles.sectionSubtitle}>
          Based on your {wearables.length} wardrobe items
        </RNText>
      </VStack>

      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        horizontal={outfits.length > 0}
        directionalLockEnabled
        alwaysBounceVertical={false}
        overScrollMode="never"
        snapToInterval={outfits.length > 0 ? PAGER_INTERVAL : undefined}
        decelerationRate={outfits.length > 0 ? "fast" : "normal"}
        disableIntervalMomentum={outfits.length > 0}
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={outfits.length > 0 ? styles.pagerContent : styles.emptyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={
          outfits.length > 0
            ? Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )
            : undefined
        }
        scrollEventThrottle={16}
        ListFooterComponent={outfits.length > 0 ? <View style={styles.pagerFooterSpacer} /> : null}
        ListEmptyComponent={
          <RecommendationEmptyState
            generating={generating}
            error={error}
            wearablesCount={wearables.length}
            onRetry={handleRegenerate}
            onScanPress={() => router.push("/scan")}
          />
        }
        renderItem={renderOutfitCard}
      />

      {outfits.length > 1 ? (
        <View style={styles.pagerDotsRow}>
          {outfits.map((outfit, idx) => (
            <Animated.View
              key={`dot-${outfit.id}-${idx}`}
              style={[
                styles.pagerDot,
                {
                  width: scrollX.interpolate({
                    inputRange: [
                      (idx - 1) * PAGER_INTERVAL,
                      idx * PAGER_INTERVAL,
                      (idx + 1) * PAGER_INTERVAL,
                    ],
                    outputRange: [8, 26, 8],
                    extrapolate: "clamp",
                  }),
                  backgroundColor: scrollX.interpolate({
                    inputRange: [
                      (idx - 1) * PAGER_INTERVAL,
                      idx * PAGER_INTERVAL,
                      (idx + 1) * PAGER_INTERVAL,
                    ],
                    outputRange: ["#E9DED1", "#D4A574", "#E9DED1"],
                    extrapolate: "clamp",
                  }),
                },
              ]}
            />
          ))}
        </View>
      ) : null}

      {outfits.length === 0 ? null : (
        <View style={styles.pagerHintRow}>
          <RNText style={styles.pagerHintText}>Swipe for more looks</RNText>
        </View>
      )}

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
                    source={{ uri: resolveImageUrl(wearable.cutoutImageUrl) }}
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

export default Index;
