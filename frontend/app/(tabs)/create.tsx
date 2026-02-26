import React, { useState, useMemo, useCallback } from "react";
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text as RNText,
  useWindowDimensions,
  RefreshControl,
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
import { resolveImageUrl } from "@/lib/resolve-image-url";

import { Pressable } from "@/components/ui/pressable";
import { Center } from "@/components/ui/center";
import { AppHeader } from "@/components/navigation/app-header";
import CreateLoadingState from "@/components/common/CreateLoadingState";
import CreateErrorState from "@/components/common/CreateErrorState";
import CreateEmptyWardrobeState from "@/components/common/CreateEmptyWardrobeState";
import PullToRefreshBanner from "@/components/common/PullToRefreshBanner";
import { s } from "../../styles/screens/tabs/create.styles";

import { ChevronLeft, Shirt, Check, X, Sparkles } from "lucide-react-native";

const GRID_GAP = 12;
const GRID_HORIZONTAL_PADDING = 20;

function getColumnCount(width: number): number {
  if (width >= 1120) return 6;
  if (width >= 900) return 5;
  if (width >= 700) return 4;
  if (width >= 520) return 3;
  return 2;
}

const Create = () => {
  const { data } = authClient.useSession();
  const { width } = useWindowDimensions();

  const [allWearables, setAllWearables] = useState<WearableResponseDto[]>([]);
  const [categories, setCategories] = useState<WearableCategoryDto[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const selectedWearables = useMemo(
    () => allWearables.filter((wearable) => selectedItemIds.has(wearable.id)),
    [allWearables, selectedItemIds]
  );

  const selectedCount = selectedWearables.length;
  const isFormValid = selectedCount >= 2;

  const displayWearables = useMemo(() => {
    if (!activeCategoryId) return allWearables;
    return allWearables.filter((wearable) => wearable.categoryId === activeCategoryId);
  }, [allWearables, activeCategoryId]);

  const categoryCountMap = useMemo(() => {
    const map = new Map<string, number>();

    for (const wearable of allWearables) {
      map.set(wearable.categoryId, (map.get(wearable.categoryId) ?? 0) + 1);
    }

    return map;
  }, [allWearables]);

  const columnCount = useMemo(() => getColumnCount(width), [width]);
  const contentWidth = useMemo(() => {
    if (width < 860) return width;
    return Math.min(width, 1040);
  }, [width]);

  const gridItemWidth = useMemo(() => {
    const totalGap = (columnCount - 1) * GRID_GAP;
    return (contentWidth - GRID_HORIZONTAL_PADDING * 2 - totalGap) / columnCount;
  }, [columnCount, contentWidth]);

  const fetchData = useCallback(async () => {
    if (!data?.user?.id) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setError(null);

    try {
      const accessToken = await getKeycloakAccessToken(data.user.id);
      const [wearables, fetchedCategories] = await Promise.all([
        fetchAllWearables(accessToken),
        fetchWearableCategories(accessToken),
      ]);

      setAllWearables(wearables);
      setCategories(fetchedCategories);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load wardrobe data");
    } finally {
      setLoadingData(false);
    }
  }, [data?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await new Promise((resolve) => setTimeout(resolve, 350));
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

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

  const clearSelectedItems = useCallback(() => {
    setSelectedItemIds(new Set());
  }, []);

  const removeSelectedItem = useCallback((itemId: string) => {
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

  const handleContinue = useCallback(() => {
    if (!isFormValid) return;

    const idsString = JSON.stringify(Array.from(selectedItemIds));

    router.push({
      pathname: "/compose",
      params: { itemIds: idsString },
    });
  }, [isFormValid, selectedItemIds]);

  const renderGridItem = useCallback(
    (item: WearableResponseDto) => {
      const selected = isSelected(item.id);

      return (
        <Pressable
          key={item.id}
          onPress={() => toggleItem(item.id)}
          className="active:opacity-80"
          style={{ width: gridItemWidth }}
        >
          <View
            style={[
              s.gridCard,
              {
                width: gridItemWidth,
                height: gridItemWidth * 1.34,
                borderColor: selected ? colors.secondary : colors.border,
              },
            ]}
          >
            {item.cutoutImageUrl ? (
              <Image
                source={{ uri: resolveImageUrl(item.cutoutImageUrl) }}
                style={s.gridImage}
                contentFit="contain"
              />
            ) : (
              <Center className="flex-1">
                <Shirt size={24} color={colors.textMuted} />
              </Center>
            )}

            <View style={s.gridMetaOverlay}>
              <RNText style={s.gridItemTitle} numberOfLines={1}>
                {item.title}
              </RNText>
            </View>

            {selected ? (
              <View style={s.gridSelectedChip}>
                <Check size={12} color={colors.white} strokeWidth={3} />
                <RNText style={s.gridSelectedText}>Selected</RNText>
              </View>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [gridItemWidth, isSelected, toggleItem]
  );

  if (loadingData) {
    return <CreateLoadingState message="Loading your wardrobe..." />;
  }

  if (error) {
    return <CreateErrorState error={error} onRetry={fetchData} />;
  }

  if (allWearables.length === 0) {
    return <CreateEmptyWardrobeState onAddItems={() => router.push("/scan")} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AppHeader
          title="Create"
          titleStyle={s.headerTitle}
          left={
            <Pressable onPress={() => router.back()} className="active:opacity-60">
              <ChevronLeft size={22} color={colors.textPrimary} />
            </Pressable>
          }
        />
        <PullToRefreshBanner
          refreshing={refreshing}
          label="Refreshing your outfit studio..."
        />

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressViewOffset={16}
            />
          }
          contentContainerStyle={[
            s.scrollContent,
            {
              alignSelf: "center",
              width: contentWidth,
              paddingBottom: 28,
            },
          ]}
        >
          <View style={s.heroCard}>
            <View style={s.heroTopRow}>
              <View style={s.sparkleBadge}>
                <Sparkles size={14} color={colors.secondaryDark} />
              </View>
              <RNText style={s.heroEyebrow}>Outfit Studio</RNText>
            </View>

            <RNText style={s.heroTitle}>Build a clean capsule look</RNText>
            <RNText style={s.heroDescription}>
              Select 2 or more pieces. Keep tapping to mix silhouettes and tones.
            </RNText>

            <View style={s.heroStatsRow}>
              <View style={s.statPill}>
                <RNText style={s.statLabel}>Selected</RNText>
                <RNText style={s.statValue}>{selectedCount}</RNText>
              </View>
              <View style={s.statDivider} />
              <View style={s.statPill}>
                <RNText style={s.statLabel}>Required</RNText>
                <RNText style={s.statValue}>2+</RNText>
              </View>
              <View style={s.statDivider} />
              <Pressable
                onPress={clearSelectedItems}
                className="active:opacity-70"
                disabled={selectedCount === 0}
                style={s.clearAction}
              >
                <RNText
                  style={[s.clearText, selectedCount === 0 ? s.clearTextDisabled : null]}
                >
                  Clear
                </RNText>
              </Pressable>
            </View>

            {selectedWearables.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.selectedListRow}
              >
                {selectedWearables.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => removeSelectedItem(item.id)}
                    className="active:opacity-70"
                  >
                    <View style={s.selectedThumbWrap}>
                      {item.cutoutImageUrl ? (
                        <Image
                          source={{ uri: resolveImageUrl(item.cutoutImageUrl) }}
                          style={s.selectedThumbImage}
                          contentFit="contain"
                        />
                      ) : (
                        <Center className="flex-1">
                          <Shirt size={16} color={colors.textMuted} />
                        </Center>
                      )}
                      <View style={s.selectedThumbClose}>
                        <X size={10} color={colors.white} strokeWidth={3} />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={s.emptySelectionRow}>
                <RNText style={s.emptySelectionText}>No pieces selected yet</RNText>
              </View>
            )}

            <Pressable
              onPress={handleContinue}
              className="active:opacity-80"
              style={[s.continueButton, !isFormValid ? s.continueButtonDisabled : null]}
              disabled={!isFormValid}
            >
              <RNText
                style={[
                  s.continueText,
                  { color: isFormValid ? colors.white : colors.textMuted },
                ]}
              >
                Continue to Compose
              </RNText>
              <RNText
                style={[
                  s.continueSubText,
                  { color: isFormValid ? "#F5EADC" : colors.textMuted },
                ]}
              >
                {isFormValid
                  ? `${selectedCount} piece${selectedCount > 1 ? "s" : ""} selected`
                  : "Select at least 2 pieces"}
              </RNText>
            </Pressable>
          </View>

          <View style={s.sectionRow}>
            <RNText style={s.sectionTitle}>Categories</RNText>
            <RNText style={s.sectionHint}>Filter your wardrobe</RNText>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
          >
            <Pressable
              onPress={() => setActiveCategoryId(null)}
              className="active:opacity-80"
              style={[s.filterPill, !activeCategoryId ? s.filterPillActive : s.filterPillIdle]}
            >
              <RNText
                style={[
                  s.filterPillText,
                  { color: !activeCategoryId ? colors.white : colors.textSecondary },
                ]}
              >
                All ({allWearables.length})
              </RNText>
            </Pressable>

            {categories.map((category) => {
              const active = activeCategoryId === category.id;
              const count = categoryCountMap.get(category.id) ?? 0;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setActiveCategoryId(category.id)}
                  className="active:opacity-80"
                  style={[s.filterPill, active ? s.filterPillActive : s.filterPillIdle]}
                >
                  <RNText
                    style={[
                      s.filterPillText,
                      { color: active ? colors.white : colors.textSecondary },
                    ]}
                  >
                    {category.name} ({count})
                  </RNText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={s.sectionRow}>
            <RNText style={s.sectionTitle}>Wardrobe Pieces</RNText>
            <RNText style={s.sectionHint}>Tap to select</RNText>
          </View>

          {displayWearables.length === 0 ? (
            <Center style={s.emptyCategoryState}>
              <Shirt size={36} color={colors.textMuted} strokeWidth={1.4} />
              <RNText style={s.emptyCategoryText}>No items in this category</RNText>
            </Center>
          ) : (
            <View style={s.gridWrap}>{displayWearables.map((item) => renderGridItem(item))}</View>
          )}
        </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Create;
