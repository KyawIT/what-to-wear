import React, { useState, useMemo, useCallback } from "react";
import {
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
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
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";

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
const MAX_NAME_LENGTH = 40;

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
  // Now simply tracking an array/set of selected wearable IDs globally
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Filter state
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // --- Derived state ---

  const selectedWearables = useMemo(() => {
    return allWearables.filter((w) => selectedItemIds.has(w.id));
  }, [allWearables, selectedItemIds]);

  const displayWearables = useMemo(() => {
    if (!activeCategoryId) return allWearables; // "All" selected
    return allWearables.filter((w) => w.categoryId === activeCategoryId);
  }, [allWearables, activeCategoryId]);

  const isFormValid = selectedWearables.length >= 2;

  // --- Data fetching ---

  const fetchData = useCallback(async () => {
    if (!data?.user?.id) return;
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

  const isSelected = useCallback(
    (itemId: string) => selectedItemIds.has(itemId),
    [selectedItemIds]
  );

  // --- Navigation action ---

  const handleContinue = useCallback(() => {
    if (!isFormValid) return;

    const idsString = JSON.stringify(Array.from(selectedItemIds));

    // Navigate to compose screen with selected items
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
          <Box
            className="rounded-2xl overflow-hidden"
            style={{
              width: GRID_ITEM_SIZE,
              height: GRID_ITEM_SIZE * 1.2,
              backgroundColor: colors.cardBg,
              borderWidth: selected ? 2.5 : 1,
              borderColor: selected ? colors.primary : colors.border,
            }}
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
              <Box
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              </Box>
            )}
          </Box>
          <Text
            size="2xs"
            className="text-center mt-1 text-typography-500"
            numberOfLines={1}
            style={{ width: GRID_ITEM_SIZE }}
          >
            {item.title}
          </Text>
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
          <Text className="text-typography-400 mt-4">
            Loading your wardrobe...
          </Text>
        </Center>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <Center className="flex-1 px-8">
          <Box className="h-20 w-20 rounded-full items-center justify-center mb-4 bg-error-50">
            <X size={32} color={colors.error} />
          </Box>
          <Heading
            size="md"
            className="mb-2 text-center text-typography-600"
          >
            Something went wrong
          </Heading>
          <Text size="sm" className="text-center text-typography-400 mb-6">
            {error}
          </Text>
          <Pressable
            onPress={fetchData}
            className="rounded-full px-6 py-3 active:opacity-80"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-sm font-semibold text-white">
              Try Again
            </Text>
          </Pressable>
        </Center>
      </SafeAreaView>
    );
  }

  if (allWearables.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <HStack
          className="h-14 items-center justify-center px-4"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Heading size="lg" className="text-typography-800">
            Create Outfit
          </Heading>
        </HStack>

        <Center className="flex-1 px-8">
          <Box className="h-24 w-24 rounded-full items-center justify-center mb-4 bg-primary-50">
            <Shirt size={40} color={colors.primary} strokeWidth={1.5} />
          </Box>
          <Heading
            size="md"
            className="mb-2 text-center text-typography-600"
          >
            Your wardrobe is empty
          </Heading>
          <Text size="sm" className="text-center text-typography-400 mb-6">
            Start by adding items from the Scan tab
          </Text>
          <Pressable
            onPress={() => router.push("/scan")}
            className="rounded-full px-6 py-3 active:opacity-80"
            style={{ backgroundColor: colors.primary }}
          >
            <HStack className="items-center">
              <Plus size={18} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white ml-2">
                Add Items
              </Text>
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
        {/* Header */}
        <HStack
          className="h-14 items-center justify-between px-4 z-10 bg-background-50"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Pressable onPress={() => router.back()} className="active:opacity-60">
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>

          <Heading size="lg" className="text-typography-800">
            Create Outfit
          </Heading>

          <Pressable
            onPress={handleContinue}
            className="rounded-full px-4 py-2 active:opacity-80"
            style={{
              backgroundColor: isFormValid ? colors.primary : colors.border,
            }}
            disabled={!isFormValid}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: isFormValid ? "#FFFFFF" : colors.textMuted,
              }}
            >
              Continue
            </Text>
          </Pressable>
        </HStack>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]} // Category pills sticky
        >
          {/* 1) Selected Items Preview */}
          <Box className="px-4 pt-4 pb-4">
            <Box
              className="rounded-2xl p-4"
              style={{
                backgroundColor: colors.cardBg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <HStack className="items-center justify-between mb-3">
                <HStack className="items-center">
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    Your Outfit
                  </Text>
                  <Text
                    className="text-xs ml-2"
                    style={{ color: colors.textMuted }}
                  >
                    {"\u00B7"} {selectedWearables.length} item
                    {selectedWearables.length !== 1 ? "s" : ""}
                  </Text>
                </HStack>

                {/* Clear Selection Button */}
                {selectedWearables.length > 0 && (
                  <Pressable
                    onPress={() => setSelectedItemIds(new Set())}
                    className="active:opacity-60"
                  >
                    <Text className="text-xs font-medium text-error-500">
                      Clear
                    </Text>
                  </Pressable>
                )}
              </HStack>

              {selectedWearables.length === 0 ? (
                <Box
                  className="rounded-xl py-6 items-center justify-center"
                  style={{
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundSecondary,
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{ color: colors.textMuted }}
                  >
                    Tap items below to add them
                  </Text>
                </Box>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  <HStack className="gap-2">
                    {selectedWearables.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => deselectItem(item.id)}
                        className="active:opacity-70"
                      >
                        <Box
                          className="rounded-xl overflow-hidden"
                          style={{
                            width: PREVIEW_THUMB_SIZE,
                            height: PREVIEW_THUMB_SIZE,
                            backgroundColor: colors.backgroundSecondary,
                            borderWidth: 1,
                            borderColor: colors.primary + "60",
                          }}
                        >
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
                          <Box
                            className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full items-center justify-center"
                            style={{
                              backgroundColor: colors.textMuted + "CC",
                            }}
                          >
                            <X
                              size={10}
                              color="#FFFFFF"
                              strokeWidth={3}
                            />
                          </Box>
                        </Box>
                      </Pressable>
                    ))}
                  </HStack>
                </ScrollView>
              )}
            </Box>
          </Box>

          {/* 2) Spacer before sticky header */}
          <View />

          {/* 3) Category Pills (Sticky Header) */}
          <Box
            className="pb-3 pt-2 bg-background-50"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                paddingHorizontal: 16,
              }}
            >
              {/* "All" Pill */}
              <Pressable
                onPress={() => setActiveCategoryId(null)}
                className="rounded-full px-4 py-2 active:opacity-80"
                style={{
                  backgroundColor:
                    activeCategoryId === null
                      ? colors.primary
                      : colors.cardBg,
                  borderWidth: 1,
                  borderColor:
                    activeCategoryId === null
                      ? colors.primary
                      : colors.border,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color:
                      activeCategoryId === null
                        ? "#FFFFFF"
                        : colors.textPrimary,
                  }}
                >
                  All Items
                </Text>
              </Pressable>

              {/* Database Category Pills */}
              {(showAllCategories ? categories : categories.slice(0, 3)).map(
                (category) => {
                  const isActive = activeCategoryId === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setActiveCategoryId(category.id)}
                      className="rounded-full px-4 py-2 active:opacity-80"
                      style={{
                        backgroundColor: isActive
                          ? colors.primary
                          : colors.cardBg,
                        borderWidth: 1,
                        borderColor: isActive ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color: isActive ? "#FFFFFF" : colors.textPrimary,
                        }}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                }
              )}

              {/* More / Less Toggle Button */}
              {categories.length > 3 && (
                <Pressable
                  onPress={() => setShowAllCategories(!showAllCategories)}
                  className="rounded-full px-4 py-2 active:opacity-80 flex-row items-center"
                  style={{
                    backgroundColor: colors.backgroundSecondary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    className="text-sm font-semibold mr-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {showAllCategories ? "Less" : "More"}
                  </Text>
                  {showAllCategories ? (
                    <ChevronUp size={14} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={14} color={colors.textSecondary} />
                  )}
                </Pressable>
              )}
            </View>
          </Box>

          {/* 4) Grid Items */}
          <Box className="flex-1 px-4 pt-4 pb-20">
            {displayWearables.length === 0 ? (
              <Center className="py-12">
                <Shirt size={48} color={colors.textMuted} strokeWidth={1} />
                <Text
                  className="mt-4 text-base font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  No items in this category
                </Text>
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

export default Create;
