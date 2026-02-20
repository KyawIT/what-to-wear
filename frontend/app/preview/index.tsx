import React, { useCallback, useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  View,
} from "react-native";

import { Center } from "@/components/ui/center";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";

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
import { authClient } from "@/lib/auth-client";
import { dataUriToFileUri } from "@/lib/image/image.utils";
import { colors } from "@/lib/theme";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { predictWearableTags } from "@/api/backend/predict.api";
import { suggestWearableMetadata } from "@/lib/ai/metadata-suggestions";

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
};

type SuggestedTagOption = {
  value: string;
  isAi: boolean;
};

export default function PreviewScreen() {
  const { data } = authClient.useSession();
  const { id, uri } = useLocalSearchParams<Params>();
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

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [createCategoryError, setCreateCategoryError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        if (!data?.user?.id) return;
        const accessToken = await getKeycloakAccessToken(data.user.id);
        const cats = await fetchWearableCategories(accessToken);
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, [data?.user?.id]);

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
          const normalized = (predictionResult.data.tags ?? [])
            .map(normalizeTagForDisplay)
            .filter(Boolean);
          setAiSuggestedTags(normalized);
          setAiPredictionError(null);
          return;
        }

        // Fallback: some runtimes/proxies reject URI multipart parts;
        // retry as Blob while keeping backend endpoint unchanged.
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
            const normalized = (retryResult.data.tags ?? [])
              .map(normalizeTagForDisplay)
              .filter(Boolean);
            setAiSuggestedTags(normalized);
            setAiPredictionError(null);
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
  }, [cutoutUri, loading, error, data?.user?.id]);

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

  // Filter suggestions to exclude already added tags
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

      const file = cutoutUri.startsWith("data:")
        ? await dataUriToFileUri(cutoutUri)
        : { uri: cutoutUri, mime: "image/png", name: `wearable_${Date.now()}.png` };

      const result = await createWearableMultipart(
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

      console.log("Wearable created successfully:", result);

      Alert.alert("Success!", "Your wearable has been created successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error creating wearable:", error);

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
    return (
      <Center className="flex-1 px-6" style={{ backgroundColor: colors.background }}>
        <Text className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
          No image selected
        </Text>
        <Button
          variant="outline"
          action="secondary"
          onPress={onBack}
          className="mt-4 rounded-xl"
        >
          <ButtonText style={{ color: colors.textPrimary }}>Go back</ButtonText>
        </Button>
      </Center>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Box className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Top bar */}
        <HStack
          className="pt-14 px-4 pb-3 items-center justify-between"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Pressable onPress={onBack} className="active:opacity-60">
            <HStack className="items-center">
              <X size={20} color={colors.textSecondary} />
              <Text
                className="text-base font-medium ml-1"
                style={{ color: colors.textSecondary }}
              >
                Cancel
              </Text>
            </HStack>
          </Pressable>

          <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
            New Item
          </Text>

          <Pressable
            onPress={onUse}
            className="active:opacity-60 rounded-full px-4 py-2"
            style={{
              backgroundColor: isFormValid ? colors.primary : colors.border,
            }}
            disabled={!isFormValid || submitting}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: isFormValid ? "#FFFFFF" : colors.textMuted,
              }}
            >
              {submitting ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </HStack>

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
                  <Text
                    className="font-medium text-center mt-2"
                    style={{ color: colors.textPrimary }}
                  >
                    Removing background...
                  </Text>
                </View>
              </Box>
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
            <Box
              className="mt-4 rounded-2xl p-4"
              style={{
                backgroundColor: `${colors.error}10`,
                borderWidth: 1,
                borderColor: `${colors.error}30`,
              }}
            >
              <HStack className="items-center mb-2">
                <Text className="text-2xl mr-2">⚠️</Text>
                <Text className="font-semibold text-base" style={{ color: colors.error }}>
                  Something went wrong
                </Text>
              </HStack>
              <Text className="text-sm leading-5" style={{ color: colors.error }}>
                {error}
              </Text>

              <HStack className="mt-4 space-x-3">
                <Pressable
                  onPress={retry}
                  className="flex-1 mr-3 rounded-xl py-3 items-center active:opacity-80"
                  style={{
                    backgroundColor: `${colors.error}15`,
                    borderWidth: 1,
                    borderColor: `${colors.error}30`,
                  }}
                  disabled={loading}
                >
                  <HStack className="items-center">
                    <RotateCcw size={16} color={colors.error} />
                    <Text className="ml-2 font-medium" style={{ color: colors.error }}>
                      Retry
                    </Text>
                  </HStack>
                </Pressable>

                <Pressable
                  onPress={retake}
                  className="flex-1 rounded-xl py-3 items-center active:opacity-80"
                  style={{ backgroundColor: colors.error }}
                  disabled={loading}
                >
                  <Text className="font-medium text-white">Retake Photo</Text>
                </Pressable>
              </HStack>
            </Box>
          )}

          {/* Form Section */}
          <Box className="mt-6">
            {/* Title */}
            <Box className="mb-5">
              <HStack className="items-center justify-between mb-2">
                <HStack className="items-center">
                  <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    Title
                  </Text>
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
                      <Text
                        className="text-xs font-semibold ml-1"
                        style={{ color: colors.primary }}
                      >
                        Auto Fill
                      </Text>
                    </HStack>
                  </Pressable>
                </HStack>
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  {title.trim().length}/60
                </Text>
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
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Vintage Nike Windbreaker"
                    placeholderTextColor={colors.textMuted}
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      flex: 1,
                      paddingVertical: 0,
                    }}
                    maxLength={60}
                    returnKeyType="next"
                  />
                </HStack>
              </Box>
            </Box>

            {/* Category Picker */}
            <Box className="mb-5">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.textPrimary }}
              >
                Category
              </Text>

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
                    <Text
                      className="text-xs font-semibold ml-1"
                      style={{ color: colors.primary }}
                    >
                      New category
                    </Text>
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
                      <TextInput
                        value={newCategoryName}
                        onChangeText={(t) => {
                          setNewCategoryName(t);
                          if (createCategoryError) setCreateCategoryError("");
                        }}
                        placeholder="Category name..."
                        placeholderTextColor={colors.textMuted}
                        style={{
                          color: colors.textPrimary,
                          fontSize: 14,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                        autoFocus
                        maxLength={100}
                        returnKeyType="done"
                        onSubmitEditing={handleCreateCategory}
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
                            : colors.border,
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color:
                            newCategoryName.trim() && !creatingCategory
                              ? "#FFFFFF"
                              : colors.textMuted,
                        }}
                      >
                        {creatingCategory ? "..." : "Create"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={cancelCreateCategory}
                      className="ml-2 active:opacity-60"
                    >
                      <X size={18} color={colors.textMuted} />
                    </Pressable>
                  </HStack>

                  {createCategoryError ? (
                    <Text
                      className="text-xs mt-2"
                      style={{ color: colors.error }}
                    >
                      {createCategoryError}
                    </Text>
                  ) : null}
                </Box>
              )}

              {/* Show selected category name as confirmation */}
              {selectedCategoryName && !showCreateCategory && (
                <Text
                  className="text-xs mt-1.5 ml-1"
                  style={{ color: colors.textMuted }}
                >
                  Selected: {selectedCategoryName}
                </Text>
              )}
            </Box>

            {/* Tags Section */}
            <Box className="mb-5">
              <HStack className="items-center justify-between mb-2">
                <HStack className="items-center">
                  <Tag size={16} color={colors.textPrimary} />
                  <Text
                    className="text-sm font-semibold ml-2"
                    style={{ color: colors.textPrimary }}
                  >
                    Tags
                  </Text>
                  <Text className="text-xs ml-2" style={{ color: colors.textMuted }}>
                    ({tags.length})
                  </Text>
                </HStack>
                {tags.length > 0 && (
                  <Pressable onPress={() => setTags([])}>
                    <Text className="text-xs font-medium" style={{ color: colors.error }}>
                      Clear all
                    </Text>
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
                  <Text style={{ color: colors.textMuted, fontSize: 16 }}>#</Text>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Type a tag..."
                    placeholderTextColor={colors.textMuted}
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      flex: 1,
                      paddingVertical: 0,
                      marginLeft: 8,
                    }}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={() => addTag(tagInput)}
                  />
                  {tagInput.length > 0 && (
                    <Pressable
                      onPress={() => addTag(tagInput)}
                      className="ml-2 rounded-full px-4 py-1.5 active:opacity-80"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-white text-sm font-semibold">Add</Text>
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
                          <Text
                            className="text-sm font-medium ml-1.5"
                            style={{ color: colors.primary }}
                          >
                            {t}
                          </Text>
                          <X size={14} color={colors.primary} style={{ marginLeft: 6 }} />
                        </HStack>
                      </Pressable>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Suggested tags - always visible, filtered */}
              {(availableSuggestions.length > 0 || aiPredictionError) && (
                <Box className="mt-3">
                  <HStack className="items-center mb-2">
                    <Text
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: colors.textMuted }}
                    >
                      Suggestions
                    </Text>
                    {predictingTags && (
                      <Text
                        className="text-xs ml-2"
                        style={{ color: colors.primary }}
                      >
                        ✨ AI predicting...
                      </Text>
                    )}
                  </HStack>
                  {aiPredictionError && (
                    <Box
                      className="rounded-xl px-3 py-3 mb-2"
                      style={{
                        backgroundColor: `${colors.warning}15`,
                        borderWidth: 1,
                        borderColor: `${colors.warning}50`,
                      }}
                    >
                      <Text className="text-sm" style={{ color: colors.textPrimary }}>
                        {aiPredictionError}
                      </Text>
                    </Box>
                  )}
                  {availableSuggestions.length > 0 && (
                    <HStack className="flex-wrap">
                      {availableSuggestions.map((suggestion) => (
                        <Pressable
                          key={`${suggestion.isAi ? "ai" : "default"}-${suggestion.value.toLowerCase()}`}
                          onPress={() => addTag(suggestion.value)}
                          className="mr-2 mb-2 active:opacity-70"
                        >
                          <Box
                            className="rounded-full px-3 py-2"
                            style={{
                              backgroundColor: colors.backgroundSecondary,
                              borderWidth: 1,
                              borderColor: suggestion.isAi ? `${colors.primary}80` : colors.border,
                            }}
                          >
                            <Text className="text-sm" style={{ color: colors.textSecondary }}>
                              + {suggestion.isAi ? `✨ ${suggestion.value}` : suggestion.value}
                            </Text>
                          </Box>
                        </Pressable>
                      ))}
                    </HStack>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* Description */}
          <Box className="mb-5">
            <HStack className="items-center justify-between mb-2">
              <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                Description
              </Text>
              <Text className="text-xs" style={{ color: colors.textMuted }}>
                {description.trim().length}/200
              </Text>
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
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add details about color, material, condition..."
                    placeholderTextColor={colors.textMuted}
                    style={{
                      color: colors.textPrimary,
                      fontSize: 15,
                      paddingVertical: 0,
                      minHeight: 80,
                      textAlignVertical: "top",
                    }}
                    maxLength={200}
                    multiline
                    numberOfLines={4}
                    returnKeyType="default"
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
                  <Text
                    className="font-medium ml-2"
                    style={{ color: colors.textSecondary }}
                  >
                    Retake Photo
                  </Text>
                </HStack>
              </Pressable>
            )}
          </VStack>

          {/* Bottom spacing */}
          <Box className="h-8" />
        </ScrollView>
      </Box>
    </KeyboardAvoidingView>
  );
}

function buildAiPredictionMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const normalized = raw.toLowerCase();

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
