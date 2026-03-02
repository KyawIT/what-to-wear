import React, { useCallback, useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import {
  KeyboardAvoidingView, Platform, ScrollView, Alert, View, Text as RNText
} from "react-native";
import { FocusTextInput } from "@/components/focus-input";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import NoImageSelectedState from "@/components/common/NoImageSelectedState";
import RemoveBgErrorCallout from "@/components/common/RemoveBgErrorCallout";
import SuggestedTagsSection, { SuggestedTagOption } from "@/components/common/SuggestedTagsSection";

import { useRemoveBackground } from "@/hooks/useRemoveBackground";
import {
  fetchWearableCategories,
  createWearableCategory,
  WearableCategoryDto,
} from "@/api/backend/category.api";
import { createWearableMultipart } from "@/api/backend/create.api";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/components/ui/select";
import {
  ChevronDownIcon,
  X,
  Tag,
  Sparkles,
  RotateCcw,
  Check,
  Plus,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system/legacy";
import { authClient } from "@/lib/auth-client";
import { dataUriToFileUri } from "@/lib/image/image.utils";
import { colors } from "@/lib/theme";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { isAuthError, handleAuthError } from "@/lib/auth-error";
import { predictWearableTags } from "@/api/backend/predict.api";
import { suggestWearableMetadata } from "@/lib/ai/metadata-suggestions";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import { s } from "../../styles/screens/preview/index.styles";

const VENDOR_LABELS: Record<string, string> = {
  zalando: "Zalando",
  pinterest: "Pinterest",
};

const SUGGESTED_TAGS = [
  "Casual",
  "Summer",
  "Spring",
  "Outdoor",
];

const CREATE_NEW_VALUE = "__create_new__";

type Params = {
  id?: string;
  uri?: string;
  prefillName?: string;
  prefillDescription?: string;
  prefillTags?: string;
  prefillSource?: string;
};

export default function PreviewScreen() {
  const { data } = authClient.useSession();
  const { id, uri, prefillName, prefillDescription, prefillTags, prefillSource } =
    useLocalSearchParams<Params>();

  const toast = useToast();
  const isLinkImport = !!prefillSource;
  const { loading, cutoutUri, error, retry } = useRemoveBackground({ id, uri });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [categories, setCategories] = useState<WearableCategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [predictingTags, setPredictingTags] = useState(false);
  const [aiSuggestedTags, setAiSuggestedTags] = useState<string[]>([]);
  const [aiPredictionError, setAiPredictionError] = useState<string | null>(null);
  const [hasAutoFilledMetadata, setHasAutoFilledMetadata] = useState(false);
  const [hasAutoAppliedAiTags, setHasAutoAppliedAiTags] = useState(false);

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [createCategoryError, setCreateCategoryError] = useState<string>("");

  // Apply prefill data from link import
  useEffect(() => {
    if (!prefillSource) return;
    if (prefillName) setTitle(prefillName);
    if (prefillDescription) setDescription(prefillDescription);
    if (prefillTags) {
      try {
        const parsed = JSON.parse(prefillTags);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTags(parsed);
          setHasAutoAppliedAiTags(true);
        }
      } catch { }
    }
  }, [prefillSource, prefillName, prefillDescription, prefillTags]);

  useEffect(() => {
    (async () => {
      try {
        if (!data?.user?.id) return;
        const accessToken = await getKeycloakAccessToken(data.user.id);
        const cats = await fetchWearableCategories(accessToken);
        setCategories(cats);
      } catch (err) {
        if (isAuthError(err)) { handleAuthError(); return; }
        toast.show({
          render: ({ id: toastId }) => (
            <Toast nativeID={`toast-${toastId}`} action="error">
              <ToastTitle>Error</ToastTitle>
              <ToastDescription>Failed to load categories</ToastDescription>
            </Toast>
          ),
        });
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, [data?.user?.id, toast]);

  useEffect(() => {
    if (!cutoutUri || loading || error || !data?.user?.id) {
      if (!cutoutUri) {
        setAiSuggestedTags([]);
        setPredictingTags(false);
        setAiPredictionError(null);
      }
      return;
    }

    let cancelled = false;

    const applyPredictionResult = (predictedTags: string[]) => {
      const normalized = predictedTags
        .map(normalizeTagForDisplay)
        .filter(Boolean)
        .filter((tag, index, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index);

      setAiSuggestedTags(normalized);
      setAiPredictionError(
        normalized.length === 0
          ? "No confident tags were detected for this image. Add tags manually."
          : null
      );

      if (normalized.length === 0 || hasAutoAppliedAiTags) return;

      setTags((prev) => {
        if (prev.length > 0) return prev;
        setHasAutoAppliedAiTags(true);
        return normalized;
      });
    };

    (async () => {
      try {
        setPredictingTags(true);
        setAiPredictionError(null);
        const accessToken = await getKeycloakAccessToken(data.user.id);
        const file = cutoutUri.startsWith("data:")
          ? await dataUriToFileUri(cutoutUri, `predict_${Date.now()}.png`)
          : {
            uri: cutoutUri,
            mime: "image/png",
            name: `predict_${Date.now()}.png`,
          };

        const predictionResult = await predictWearableTags(
          {
            file: {
              uri: file.uri,
              name: file.name,
              type: file.mime,
            },
          },
          accessToken
        );

        if (cancelled) return;

        if (predictionResult.ok) {
          applyPredictionResult(predictionResult.data.tags ?? []);
          return;
        }

        if (predictionResult.error.includes('loc":["body","file"]')) {
          const blob = await (await fetch(cutoutUri)).blob();
          const retryResult = await predictWearableTags(
            {
              file: {
                blob,
                name: `predict_${Date.now()}.png`,
                type: "image/png",
              },
            },
            accessToken
          );

          if (cancelled) return;

          if (retryResult.ok) {
            applyPredictionResult(retryResult.data.tags ?? []);
            return;
          }

          setAiSuggestedTags([]);
          setAiPredictionError(buildAiPredictionMessage(retryResult.error));
          return;
        }

        setAiSuggestedTags([]);
        setAiPredictionError(buildAiPredictionMessage(predictionResult.error));
      } catch (predictError) {
        if (cancelled) return;
        setAiSuggestedTags([]);
        setAiPredictionError(buildAiPredictionMessage(predictError));
      } finally {
        if (!cancelled) {
          setPredictingTags(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cutoutUri, loading, error, data?.user?.id, hasAutoAppliedAiTags]);

  const onBack = () => router.back();
  const retake = () => router.back();

  const addTag = (raw: string) => {
    const v = normalizeTagForDisplay(raw);
    if (!v) return;

    setTags((prev) =>
      prev.some((t) => t.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]
    );
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const availableSuggestions = useMemo(() => {
    const byValue = new Map<string, SuggestedTagOption>();

    for (const suggestion of SUGGESTED_TAGS) {
      const key = suggestion.toLowerCase();
      byValue.set(key, { value: suggestion, isAi: false });
    }

    for (const suggestion of aiSuggestedTags) {
      const key = suggestion.toLowerCase();
      byValue.set(key, { value: suggestion, isAi: true });
    }

    return [...byValue.values()].filter(
      (suggestion) =>
        !tags.some((t) => t.toLowerCase() === suggestion.value.toLowerCase())
    );
  }, [tags, aiSuggestedTags]);

  const handleCategoryChange = (value: string) => {
    if (value === CREATE_NEW_VALUE) {
      setShowCreateCategory(true);
      setSelectedCategoryId("");
      setCreateCategoryError("");
    } else {
      setSelectedCategoryId(value);
      setShowCreateCategory(false);
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setCreateCategoryError("Category name is required");
      return;
    }

    setCreatingCategory(true);
    setCreateCategoryError("");

    try {
      const accessToken = await getKeycloakAccessToken(data!.user.id);
      const created = await createWearableCategory(name, accessToken);
      setCategories((prev) => [...prev, created]);
      setSelectedCategoryId(created.id);
      setShowCreateCategory(false);
      setNewCategoryName("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      setCreateCategoryError(msg);
    } finally {
      setCreatingCategory(false);
    }
  };

  const cancelCreateCategory = () => {
    setShowCreateCategory(false);
    setNewCategoryName("");
    setCreateCategoryError("");
  };

  const selectedCategoryName = categories.find(
    (c) => c.id === selectedCategoryId
  )?.name;

  const applyMetadataSuggestion = useCallback((
    options: { force?: boolean } = {}
  ) => {
    const suggestion = suggestWearableMetadata({
      categoryName: selectedCategoryName,
      tags: aiSuggestedTags.length > 0 ? aiSuggestedTags : tags,
    });

    const shouldSetTitle = options.force || !title.trim();
    const shouldSetDescription = options.force || !description.trim();

    if (shouldSetTitle) {
      setTitle(suggestion.name);
    }
    if (shouldSetDescription) {
      setDescription(suggestion.description);
    }
  }, [selectedCategoryName, aiSuggestedTags, tags, title, description]);

  useEffect(() => {
    if (hasAutoFilledMetadata) return;
    if (title.trim() || description.trim()) return;
    if (!selectedCategoryName && aiSuggestedTags.length === 0) return;

    applyMetadataSuggestion();
    setHasAutoFilledMetadata(true);
  }, [
    hasAutoFilledMetadata,
    title,
    description,
    selectedCategoryName,
    aiSuggestedTags,
    applyMetadataSuggestion,
  ]);

  const onUse = async () => {
    if (!cutoutUri) return;

    setSubmitting(true);

    try {
      const userId = data!.user.id;
      const accessToken = await getKeycloakAccessToken(userId);

      let file: { uri: string; mime: string; name: string };

      if (cutoutUri.startsWith("data:")) {
        file = await dataUriToFileUri(cutoutUri);
      } else if (cutoutUri.startsWith("http://") || cutoutUri.startsWith("https://")) {
        // Remote URL from link import — download to local cache first
        const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
        if (!dir) throw new Error("No cache directory available");
        const localPath = `${dir}import_${Date.now()}.png`;
        const result = await FileSystem.downloadAsync(cutoutUri, localPath);
        if (result.status !== 200) {
          throw new Error(`Failed to download image (${result.status})`);
        }
        file = { uri: result.uri, mime: "image/png", name: `wearable_${Date.now()}.png` };
      } else {
        file = { uri: cutoutUri, mime: "image/png", name: `wearable_${Date.now()}.png` };
      }

      await createWearableMultipart(
        {
          categoryId: selectedCategoryId,
          title: title.trim(),
          description: description.trim(),
          tags,
          file: {
            uri: file.uri,
            name: file.name,
            type: file.mime,
          },
        },
        accessToken
      );

      Alert.alert("Success!", "Your wearable has been created successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      if (isAuthError(error)) { handleAuthError(); return; }
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to create wearable. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    !loading && cutoutUri && tags.length > 0 && selectedCategoryId && title.trim();

  if (!id && !uri) {
    return <NoImageSelectedState onBack={onBack} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Box className="flex-1" style={{ backgroundColor: colors.background }}>
          <AppHeader
            title="New Item"
            titleStyle={s.headerTitle}
            left={(
              <Pressable onPress={onBack} className="active:opacity-60">
                <HStack className="items-center">
                  <X size={20} color={colors.textSecondary} />
                  <RNText style={s.cancelText}>Cancel</RNText>
                </HStack>
              </Pressable>
            )}
            right={(
              <Pressable
                onPress={onUse}
                className="active:opacity-60 rounded-full px-4 py-2"
                style={{
                  backgroundColor: isFormValid ? colors.primary : "#E8DED3",
                }}
                disabled={!isFormValid || submitting}
              >
                <RNText
                  style={[
                    s.saveText,
                    { color: isFormValid ? "#FFFFFF" : colors.textMuted },
                  ]}
                >
                  {submitting ? "Saving..." : "Save"}
                </RNText>
              </Pressable>
            )}
          />

          {/* Image preview */}
          <Box className="px-4 pt-4">
            <Box
              className="rounded-3xl overflow-hidden"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <Image
                source={{ uri: cutoutUri ?? uri ?? "" }}
                contentFit="contain"
                style={{ width: "100%", height: 320 }}
              />

              {loading && (
                <Box
                  className="absolute inset-0 items-center justify-center"
                  style={{ backgroundColor: "rgba(250, 247, 242, 0.9)" }}
                >
                  <View
                    className="rounded-2xl px-6 py-4 items-center"
                    style={{ backgroundColor: colors.cardBg }}
                  >
                    <Sparkles size={28} color={colors.primary} />
                    <RNText style={s.loadingLabel}>Removing background...</RNText>
                  </View>
                </Box>
              )}

              {/* Vendor badge for link imports */}
              {prefillSource && VENDOR_LABELS[prefillSource] && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    backgroundColor: "rgba(255,255,255,0.92)",
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <RNText style={{ fontFamily: "Inter_500Medium", fontSize: 11, color: colors.textSecondary }}>
                    Imported from {VENDOR_LABELS[prefillSource]}
                  </RNText>
                </View>
              )}
            </Box>
          </Box>

          {/* Scrollable form */}
          <ScrollView
            className="flex-1 px-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Error */}
            {error && (
              <RemoveBgErrorCallout
                error={error}
                loading={loading}
                onRetry={retry}
                onRetake={retake}
              />
            )}

            {/* Form Section */}
            <Box className="mt-6">
              {/* Title */}
              <Box className="mb-5">
                <HStack className="items-center justify-between mb-2">
                  <HStack className="items-center">
                    <RNText style={s.fieldLabel}>Title</RNText>
                    <Pressable
                      onPress={() => applyMetadataSuggestion({ force: true })}
                      className="ml-2 active:opacity-70"
                    >
                      <HStack
                        className="items-center rounded-full px-2.5 py-1"
                        style={{
                          backgroundColor: `${colors.primary}15`,
                          borderWidth: 1,
                          borderColor: `${colors.primary}30`,
                        }}
                      >
                        <Sparkles size={12} color={colors.primary} />
                        <RNText style={s.autoFillText}>Auto Fill</RNText>
                      </HStack>
                    </Pressable>
                  </HStack>
                  <RNText style={s.charCount}>{title.trim().length}/60</RNText>
                </HStack>

                <Box
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <HStack className="items-center px-4 py-3">
                    <FocusTextInput
                      value={title}
                      onChangeText={setTitle}
                      placeholder="e.g. Vintage Nike Windbreaker"
                      placeholderTextColor={colors.textMuted}
                      style={s.textInput}
                      maxLength={60}
                      returnKeyType="next"
                      label="Title"
                    />
                  </HStack>
                </Box>
              </Box>

              {/* Category Picker */}
              <Box className="mb-5">
                <RNText style={[s.fieldLabel, { marginBottom: 8 }]}>Category</RNText>

                <Select
                  selectedValue={selectedCategoryId || (showCreateCategory ? CREATE_NEW_VALUE : "")}
                  onValueChange={handleCategoryChange}
                  isDisabled={loadingCategories}
                >
                  <SelectTrigger
                    variant="outline"
                    size="md"
                    className="rounded-xl"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                    }}
                  >
                    <SelectInput
                      placeholder={
                        loadingCategories ? "Loading categories..." : "Select category"
                      }
                      className="text-base flex-1"
                      style={{
                        color: (selectedCategoryId || showCreateCategory)
                          ? colors.textPrimary
                          : colors.textMuted,
                        fontFamily: "Inter_400Regular",
                      }}
                    />
                    <SelectIcon
                      style={{ color: colors.textMuted }}
                      as={ChevronDownIcon}
                    />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop style={{ backgroundColor: "rgba(0,0,0,0.5)" }} />
                    <SelectContent
                      style={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      }}
                    >
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator style={{ backgroundColor: colors.border }} />
                      </SelectDragIndicatorWrapper>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          label={category.name}
                          value={category.id}
                        />
                      ))}
                      <SelectItem
                        label="+ New category"
                        value={CREATE_NEW_VALUE}
                      />
                    </SelectContent>
                  </SelectPortal>
                </Select>

                {/* Inline create category form */}
                {showCreateCategory && (
                  <Box
                    className="mt-3 rounded-xl p-3"
                    style={{
                      backgroundColor: colors.cardBg,
                      borderWidth: 1,
                      borderColor: colors.primary + "60",
                    }}
                  >
                    <HStack className="items-center mb-2">
                      <Plus size={14} color={colors.primary} />
                      <RNText style={s.newCatLabel}>New category</RNText>
                    </HStack>

                    <HStack className="items-center">
                      <Box
                        className="flex-1 rounded-lg overflow-hidden mr-2"
                        style={{
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: createCategoryError ? colors.error : colors.border,
                        }}
                      >
                        <FocusTextInput
                          value={newCategoryName}
                          onChangeText={(t: string) => {
                            setNewCategoryName(t);
                            if (createCategoryError) setCreateCategoryError("");
                          }}
                          placeholder="Category name..."
                          placeholderTextColor={colors.textMuted}
                          style={[s.textInput, { fontSize: 14, paddingHorizontal: 12, paddingVertical: 8 }]}
                          maxLength={100}
                          returnKeyType="done"
                          label="New Category"
                        />
                      </Box>

                      <Pressable
                        onPress={handleCreateCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
                        className="rounded-lg px-3 py-2 active:opacity-80"
                        style={{
                          backgroundColor:
                            newCategoryName.trim() && !creatingCategory
                              ? colors.primary
                              : "#E8DED3",
                        }}
                      >
                        <RNText
                          style={[
                            s.createBtnText,
                            {
                              color:
                                newCategoryName.trim() && !creatingCategory
                                  ? "#FFFFFF"
                                  : colors.textMuted,
                            },
                          ]}
                        >
                          {creatingCategory ? "..." : "Create"}
                        </RNText>
                      </Pressable>

                      <Pressable
                        onPress={cancelCreateCategory}
                        className="ml-2 active:opacity-60"
                      >
                        <X size={18} color={colors.textMuted} />
                      </Pressable>
                    </HStack>

                    {createCategoryError ? (
                      <RNText style={s.catError}>{createCategoryError}</RNText>
                    ) : null}
                  </Box>
                )}

                {/* Show selected category name as confirmation */}
                {selectedCategoryName && !showCreateCategory && (
                  <RNText style={s.selectedCatHint}>
                    Selected: {selectedCategoryName}
                  </RNText>
                )}
              </Box>

              {/* Tags Section */}
              <Box className="mb-5">
                <HStack className="items-center justify-between mb-2">
                  <HStack className="items-center">
                    <Tag size={16} color={colors.textPrimary} />
                    <RNText style={[s.fieldLabel, { marginLeft: 8 }]}>Tags</RNText>
                    <RNText style={s.tagCount}>({tags.length})</RNText>
                  </HStack>
                  {tags.length > 0 && (
                    <Pressable onPress={() => setTags([])}>
                      <RNText style={s.clearAll}>Clear all</RNText>
                    </Pressable>
                  )}
                </HStack>

                {/* Tag input */}
                <Box
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <HStack className="items-center px-4 py-3">
                    <RNText style={{ color: colors.textMuted, fontSize: 16, fontFamily: "Inter_400Regular" }}>#</RNText>
                    <FocusTextInput
                      value={tagInput}
                      onChangeText={setTagInput}
                      placeholder="Type a tag..."
                      placeholderTextColor={colors.textMuted}
                      style={[s.textInput, { marginLeft: 8 }]}
                      autoCapitalize="none"
                      returnKeyType="done"
                      label="Add Tag"
                    />
                    {tagInput.length > 0 && (
                      <Pressable
                        onPress={() => addTag(tagInput)}
                        className="ml-2 rounded-full px-4 py-1.5 active:opacity-80"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <RNText style={s.addBtnText}>Add</RNText>
                      </Pressable>
                    )}
                  </HStack>
                </Box>

                {/* Added tags display */}
                {tags.length > 0 && (
                  <Box className="mt-3">
                    <HStack className="flex-wrap">
                      {tags.map((t) => (
                        <Pressable
                          key={t}
                          onPress={() => removeTag(t)}
                          className="mr-2 mb-2"
                        >
                          <HStack
                            className="items-center rounded-full px-3 py-2"
                            style={{
                              backgroundColor: `${colors.primary}20`,
                              borderWidth: 1,
                              borderColor: `${colors.primary}40`,
                            }}
                          >
                            <Check size={14} color={colors.primary} />
                            <RNText style={s.tagText}>{t}</RNText>
                            <X size={14} color={colors.primary} style={{ marginLeft: 6 }} />
                          </HStack>
                        </Pressable>
                      ))}
                    </HStack>
                  </Box>
                )}

                <SuggestedTagsSection
                  availableSuggestions={availableSuggestions}
                  predictingTags={predictingTags}
                  aiPredictionError={aiPredictionError}
                  onAddTag={addTag}
                />
              </Box>
            </Box>

            {/* Description */}
            <Box className="mb-5">
              <HStack className="items-center justify-between mb-2">
                <RNText style={s.fieldLabel}>Description</RNText>
                <RNText style={s.charCount}>{description.trim().length}/200</RNText>
              </HStack>

              <Box
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: colors.cardBg,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Box className="px-4 py-3">
                  <FocusTextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add details about color, material, condition..."
                    placeholderTextColor={colors.textMuted}
                    style={[s.textInput, { minHeight: 80, textAlignVertical: "top" }]}
                    maxLength={200}
                    multiline
                    returnKeyType="default"
                    label="Description"
                  />
                </Box>
              </Box>
            </Box>

            {/* Retake button */}
            <VStack className="pt-4 pb-10">
              {!error && (
                <Pressable
                  onPress={retake}
                  className="rounded-xl py-4 items-center active:opacity-80"
                  style={{
                    backgroundColor: colors.cardBg,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  disabled={loading}
                >
                  <HStack className="items-center">
                    <RotateCcw size={18} color={colors.textSecondary} />
                    <RNText style={s.retakeButtonText}>
                      {isLinkImport ? "Import Another" : "Retake Photo"}
                    </RNText>
                  </HStack>
                </Pressable>
              )}
            </VStack>

            {/* Bottom spacing */}
            <Box className="h-8" />
          </ScrollView>
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function buildAiPredictionMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const normalized = raw.toLowerCase();

  if (normalized.includes("timed out") || normalized.includes("abort")) {
    return "AI suggestion timed out. Please try again.";
  }

  if (normalized.includes("prediction service unavailable")) {
    return "AI service is currently unavailable. Please try again shortly.";
  }

  if (normalized.includes("network request failed")) {
    return "Network error while generating AI suggestions.";
  }

  if (normalized.includes("low confidence")) {
    return "I couldn't confidently suggest tags for this image. Try another photo.";
  }

  if (normalized.includes('loc":["body","file"]')) {
    return "Couldn't read image. Please retake.";
  }

  return "AI suggestions unavailable.";
}

function normalizeTagForDisplay(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
