import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  View,
  Text as RNText,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  Easing,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import {
  fetchWearableCategories,
  WearableCategoryDto,
} from "@/api/backend/category.api";
import { WearableResponseDto } from "@/api/backend/wearable.model";
import { colors } from "@/lib/theme";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { AppHeader } from "@/components/navigation/app-header";

import {
  ChevronLeft,
  Shirt,
  Check,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

// --- Constants ---
const PREVIEW_THUMB_SIZE = 56;

const screenWidth = Dimensions.get("window").width;
const GRID_GAP = 12;
const GRID_PADDING = 16;
// 3 columns
const GRID_ITEM_SIZE = (screenWidth - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

// --- Component ---

const Create = () => {
  const { data } = authClient.useSession();

  // Data state
  const [allWearables, setAllWearables] = useState<WearableResponseDto[]>([]);
  const [categories, setCategories] = useState<WearableCategoryDto[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Filter state
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // --- Derived state ---

  const selectedWearables = useMemo(() => {
    return allWearables.filter((w) => selectedItemIds.has(w.id));
  }, [allWearables, selectedItemIds]);

  const displayWearables = useMemo(() => {
    if (!activeCategoryId) return allWearables;
    return allWearables.filter((w) => w.categoryId === activeCategoryId);
  }, [allWearables, activeCategoryId]);

  const isFormValid = selectedWearables.length >= 2;
  const isListMode = selectedWearables.length > 0;
  const previewProgress = useSharedValue(0);

  useEffect(() => {
    previewProgress.value = withTiming(isListMode ? 1 : 0, {
      duration: 150,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [isListMode, previewProgress]);

  const emptyPreviewAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(previewProgress.value, [0, 1], [170, 0]),
    opacity: interpolate(previewProgress.value, [0, 1], [1, 0]),
    transform: [
      {
        translateY: interpolate(previewProgress.value, [0, 1], [0, 6]),
      },
    ],
  }));

  const listPreviewAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(previewProgress.value, [0, 1], [0, PREVIEW_THUMB_SIZE + 8]),
    opacity: interpolate(previewProgress.value, [0, 1], [0, 1]),
    transform: [
      {
        translateY: interpolate(previewProgress.value, [0, 1], [6, 0]),
      },
    ],
  }));

  // --- Data fetching ---

  const fetchData = useCallback(async () => {
    if (!data?.user?.id) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    setError(null);
    try {
      const accessToken = await getKeycloakAccessToken(data.user.id);
      const [wearables, cats] = await Promise.all([
        fetchAllWearables(accessToken),
        fetchWearableCategories(accessToken),
      ]);
      setAllWearables(wearables);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load wardrobe data"
      );
    } finally {
      setLoadingData(false);
    }
  }, [data?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // --- Selection logic ---

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const deselectItem = useCallback((itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  const clearSelectedItems = useCallback(() => {
    setSelectedItemIds(new Set());
  }, []);

  const isSelected = useCallback(
    (itemId: string) => selectedItemIds.has(itemId),
    [selectedItemIds]
  );

  // --- Navigation action ---

  const handleContinue = useCallback(() => {
    if (!isFormValid) return;

    const idsString = JSON.stringify(Array.from(selectedItemIds));

    router.push({
      pathname: "/compose",
      params: { itemIds: idsString }
    });
  }, [isFormValid, selectedItemIds]);

  // --- Render helpers ---

  const renderGridItem = useCallback(
    (item: WearableResponseDto) => {
      const selected = isSelected(item.id);
      return (
        <Pressable
          key={item.id}
          onPress={() => toggleItem(item.id)}
          className="active:opacity-80 mb-3"
          style={{ width: GRID_ITEM_SIZE }}
        >
          <View
            style={[
              s.gridCard,
              {
                width: GRID_ITEM_SIZE,
                height: GRID_ITEM_SIZE * 1.2,
                borderWidth: selected ? 2.5 : 1,
                borderColor: selected ? colors.primary : "#F0E8DC",
              },
            ]}
          >
            {item.cutoutImageUrl ? (
              <Image
                source={{ uri: item.cutoutImageUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
              />
            ) : (
              <Center className="flex-1">
                <Shirt size={24} color={colors.textMuted} />
              </Center>
            )}

            {selected && (
              <View style={s.checkBadge}>
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              </View>
            )}
          </View>
          <RNText style={[s.gridLabel, { width: GRID_ITEM_SIZE }]} numberOfLines={1}>
            {item.title}
          </RNText>
        </Pressable>
      );
    },
    [isSelected, toggleItem]
  );

  // --- Early returns ---

  if (loadingData) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <Center className="flex-1">
          <Spinner size="large" className="text-primary-500" />
          <RNText style={s.loadingText}>Loading your wardrobe...</RNText>
        </Center>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <Center className="flex-1 px-8">
          <Image
            source={require("../../assets/mascot/mascot-sad.png")}
            style={s.errorMascot}
            contentFit="contain"
          />
          <RNText style={s.emptyTitle}>Something went wrong</RNText>
          <RNText style={s.emptySubtitle}>{error}</RNText>
          <RNText style={s.errorHint}>Try logging out and back in.</RNText>
          <Pressable
            onPress={fetchData}
            className="rounded-full px-6 py-3 active:opacity-80 mt-6"
            style={{ backgroundColor: colors.primary }}
          >
            <RNText style={s.buttonText}>Try Again</RNText>
          </Pressable>
        </Center>
      </SafeAreaView>
    );
  }

  if (allWearables.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <AppHeader title="Create Outfit" titleStyle={s.headerTitle} />

        <Center className="flex-1 px-8">
          <View style={s.emptyIcon}>
            <Shirt size={40} color={colors.primary} strokeWidth={1.5} />
          </View>
          <RNText style={s.emptyTitle}>Your wardrobe is empty</RNText>
          <RNText style={s.emptySubtitle}>
            Start by adding items from the Scan tab
          </RNText>
          <Pressable
            onPress={() => router.push("/scan")}
            className="rounded-full px-6 py-3 active:opacity-80 mt-6"
            style={{ backgroundColor: colors.primary }}
          >
            <HStack className="items-center">
              <Plus size={18} color="#FFFFFF" />
              <RNText style={[s.buttonText, { marginLeft: 8 }]}>Add Items</RNText>
            </HStack>
          </Pressable>
        </Center>
      </SafeAreaView>
    );
  }

  // --- Main render ---

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AppHeader
          title="Create Outfit"
          titleStyle={s.headerTitle}
          left={(
            <Pressable onPress={() => router.back()} className="active:opacity-60">
              <ChevronLeft size={24} color={colors.textPrimary} />
            </Pressable>
          )}
          right={(
            <Pressable
              onPress={handleContinue}
              className="rounded-full px-4 py-2 active:opacity-80"
              style={{
                backgroundColor: isFormValid ? colors.primary : "#E8DED3",
              }}
              disabled={!isFormValid}
            >
              <RNText
                style={[
                  s.continueText,
                  { color: isFormValid ? "#FFFFFF" : colors.textMuted },
                ]}
              >
                Continue
              </RNText>
            </Pressable>
          )}
        />

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        >
          {/* 1) Selected Items Preview */}
          <Box className="px-4 pt-4 pb-4">
            <View style={s.previewCard}>
              <View style={s.previewHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <RNText style={s.previewTitle}>Your Outfit</RNText>
                  <RNText style={s.previewCount}>
                    {"\u00B7"} {selectedWearables.length} item
                    {selectedWearables.length !== 1 ? "s" : ""}
                  </RNText>
                </View>

                {selectedWearables.length > 0 && (
                  <Pressable
                    onPress={clearSelectedItems}
                    className="active:opacity-60"
                  >
                    <RNText style={s.clearText}>Clear</RNText>
                  </Pressable>
                )}
              </View>

              <Animated.View
                layout={LinearTransition.duration(140)}
                style={s.previewTransitionContainer}
              >
                <Animated.View
                  style={[s.previewAnimatedSlot, emptyPreviewAnimatedStyle]}
                  pointerEvents={isListMode ? "none" : "auto"}
                >
                  <View style={s.emptyPreview}>
                    <View style={s.emptyPreviewContent}>
                      <Image
                        source={require("../../assets/mascot/mascot-bowtie.png")}
                        style={s.createMascot}
                        contentFit="contain"
                      />
                      <RNText style={s.emptyPreviewText}>
                        Tap items below to add them
                      </RNText>
                    </View>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[s.previewAnimatedSlot, listPreviewAnimatedStyle]}
                  pointerEvents={isListMode ? "auto" : "none"}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack className="gap-2">
                      {selectedWearables.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => deselectItem(item.id)}
                          className="active:opacity-70"
                        >
                          <View style={s.thumbWrap}>
                            {item.cutoutImageUrl ? (
                              <Image
                                source={{ uri: item.cutoutImageUrl }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="contain"
                              />
                            ) : (
                              <Center className="flex-1">
                                <Shirt size={16} color={colors.textMuted} />
                              </Center>
                            )}
                            <View style={s.thumbClose}>
                              <X size={10} color="#FFFFFF" strokeWidth={3} />
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </HStack>
                  </ScrollView>
                </Animated.View>
              </Animated.View>
            </View>
          </Box>

          {/* 2) Spacer before sticky header */}
          <View />

          {/* 3) Category Pills (Sticky Header) */}
          <View style={s.categoryBar}>
            <View style={s.categoryWrap}>
              {/* "All" Pill */}
              <Pressable
                onPress={() => setActiveCategoryId(null)}
                className="active:opacity-80"
                style={[
                  s.pill,
                  activeCategoryId === null ? s.pillActive : s.pillInactive,
                ]}
              >
                <RNText
                  style={[
                    s.pillText,
                    {
                      color:
                        activeCategoryId === null ? "#FFFFFF" : colors.textPrimary,
                    },
                  ]}
                >
                  All Items
                </RNText>
              </Pressable>

              {/* Database Category Pills */}
              {(showAllCategories ? categories : categories.slice(0, 3)).map(
                (category) => {
                  const isActive = activeCategoryId === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setActiveCategoryId(category.id)}
                      className="active:opacity-80"
                      style={[
                        s.pill,
                        isActive ? s.pillActive : s.pillInactive,
                      ]}
                    >
                      <RNText
                        style={[
                          s.pillText,
                          {
                            color: isActive ? "#FFFFFF" : colors.textPrimary,
                          },
                        ]}
                      >
                        {category.name}
                      </RNText>
                    </Pressable>
                  );
                }
              )}

              {/* More / Less Toggle Button */}
              {categories.length > 3 && (
                <Pressable
                  onPress={() => setShowAllCategories(!showAllCategories)}
                  className="active:opacity-80"
                  style={[s.pill, s.pillToggle]}
                >
                  <RNText style={s.pillToggleText}>
                    {showAllCategories ? "Less" : "More"}
                  </RNText>
                  {showAllCategories ? (
                    <ChevronUp size={14} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={14} color={colors.textSecondary} />
                  )}
                </Pressable>
              )}
            </View>
          </View>

          {/* 4) Grid Items */}
          <Box className="flex-1 px-4 pt-4 pb-20">
            {displayWearables.length === 0 ? (
              <Center className="py-12">
                <Shirt size={48} color={colors.textMuted} strokeWidth={1} />
                <RNText style={[s.emptySubtitle, { marginTop: 16 }]}>
                  No items in this category
                </RNText>
              </Center>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: GRID_GAP,
                }}
              >
                {displayWearables.map((item) => renderGridItem(item))}
              </View>
            )}
          </Box>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  continueText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0E8DC",
    shadowColor: "#C9BAAA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  previewTransitionContainer: {
    overflow: "hidden",
  },
  previewAnimatedSlot: {
    overflow: "hidden",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  previewTitle: {
    fontFamily: "PlayfairDisplay_500Medium",
    fontSize: 15,
    color: "#3D2E22",
  },
  previewCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#9B8B7F",
    marginLeft: 8,
  },
  clearText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#D25037",
  },
  emptyPreview: {
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#E8DED3",
    backgroundColor: "#F5EFE6",
  },
  emptyPreviewContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createMascot: {
    width: 132,
    height: 132,
    opacity: 0.95,
  },
  emptyPreviewText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9B8B7F",
    textAlign: "center",
  },
  thumbWrap: {
    width: PREVIEW_THUMB_SIZE,
    height: PREVIEW_THUMB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5EFE6",
    borderWidth: 1,
    borderColor: "#D4A57460",
  },
  thumbClose: {
    position: "absolute",
    top: 2,
    right: 2,
    height: 16,
    width: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9B8B7FCC",
  },
  categoryBar: {
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: "#FAF7F2",
    borderBottomWidth: 1,
    borderBottomColor: "#F0E8DC",
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: "#D4A574",
    borderColor: "#D4A574",
  },
  pillInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F0E8DC",
  },
  pillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  pillToggle: {
    backgroundColor: "#F5EFE6",
    borderColor: "#E8DED3",
    flexDirection: "row",
    alignItems: "center",
  },
  pillToggleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#6B5B4F",
    marginRight: 4,
  },
  gridCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    height: 24,
    width: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4A574",
  },
  gridLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#6B5B4F",
    textAlign: "center",
    marginTop: 4,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9B8B7F",
    marginTop: 16,
  },
  errorMascot: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.6,
  },
  errorHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#9B8B7F",
    textAlign: "center",
    marginTop: 4,
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
  emptyTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 18,
    color: "#6B5B4F",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#9B8B7F",
    textAlign: "center",
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});

export default Create;
