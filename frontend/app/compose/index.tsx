import React, { useState, useCallback, useEffect } from "react";
import { KeyboardAvoidingView, Platform, Alert, Dimensions, ScrollView } from "react-native";
import { FocusTextInput } from "@/components/focus-input";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { isAuthError, handleAuthError } from "@/lib/auth-error";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import { predictWearableTags } from "@/api/backend/predict.api";
import { WearableResponseDto } from "@/api/backend/wearable.model";
import { createOutfitMultipart } from "@/api/backend/outfit.api";
import { colors } from "@/lib/theme";
import { suggestOutfitMetadata } from "@/lib/ai/metadata-suggestions";
import ViewShot from "react-native-view-shot";
import ComposeLoadingState from "@/components/common/ComposeLoadingState";
import PillActionButton from "@/components/common/PillActionButton";
import DraggableItem from "@/components/common/DraggableItem";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { AppHeader } from "@/components/navigation/app-header";
import { ChevronLeft, Tag, X, ArrowUp, ArrowDown } from "lucide-react-native";
import { s } from "../../styles/screens/compose/index.styles";

const MAX_NAME_LENGTH = 40;
const CANVAS_HEIGHT = Dimensions.get("window").height * 0.45;

export default function ComposeOutfitScreen() {
    const { data } = authClient.useSession();
    const { itemIds } = useLocalSearchParams<{ itemIds: string }>();

    // Data
    const [wearables, setWearables] = useState<WearableResponseDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [outfitName, setOutfitName] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [isAutoTagging, setIsAutoTagging] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const canvasRef = React.useRef<ViewShot>(null);

    // Active Selection for Layering
    const [activeItemId, setActiveItemId] = useState<string | null>(null);

    // Track the Z-Order explicitly as its own array of IDs so we can bind it to zIndex
    // Index 0 = Bottom, Index N = Top
    const [zOrder, setZOrder] = useState<string[]>([]);

    const isFormValid = outfitName.trim().length > 0 && wearables.length >= 2;

    // --- Data Fetching ---
    useEffect(() => {
        const loadItems = async () => {
            if (!data?.user?.id || !itemIds) return;
            try {
                const idsArray = JSON.parse(itemIds) as string[];
                const accessToken = await getKeycloakAccessToken(data.user.id);
                const allItems = await fetchAllWearables(accessToken);
                const selected = allItems.filter((w) => idsArray.includes(w.id));
                // Set initial wearables (index implies z-order naturally)
                setWearables(selected);
                setZOrder(selected.map((w) => w.id));
                if (selected.length > 0) {
                    setActiveItemId(selected[selected.length - 1].id); // last item on top is active default
                }
            } catch (err) {
                if (isAuthError(err)) { handleAuthError(); return; }
                Alert.alert(
                    "Load Failed",
                    err instanceof Error ? err.message : "Failed to load outfit items."
                );
            } finally {
                setLoading(false);
            }
        };
        loadItems();
    }, [data?.user?.id, itemIds]);

    // --- Layering Logic ---
    const moveActiveItemUp = useCallback(() => {
        if (!activeItemId) return;
        setZOrder((prev) => {
            const idx = prev.indexOf(activeItemId);
            if (idx === -1 || idx === prev.length - 1) return prev; // already at top

            const next = [...prev];
            const temp = next[idx];
            next[idx] = next[idx + 1];
            next[idx + 1] = temp;
            return next;
        });
    }, [activeItemId]);

    const moveActiveItemDown = useCallback(() => {
        if (!activeItemId) return;
        setZOrder((prev) => {
            const idx = prev.indexOf(activeItemId);
            if (idx <= 0) return prev; // already at bottom

            const next = [...prev];
            const temp = next[idx];
            next[idx] = next[idx - 1];
            next[idx - 1] = temp;
            return next;
        });
    }, [activeItemId]);

    // --- Handlers ---
    const addTag = useCallback(
        (tag: string) => {
            const trimmed = tag.trim().toLowerCase();
            if (trimmed && !tags.includes(trimmed)) {
                setTags((prev) => [...prev, trimmed]);
            }
            setTagInput("");
        },
        [tags]
    );

    const removeTag = useCallback((tagToRemove: string) => {
        setTags((prev) => prev.filter((t) => t !== tagToRemove));
    }, []);

    const mergeTags = useCallback((incoming: string[] = []) => {
        setTags((prev) => {
            const existingLower = new Set(prev.map((tag) => tag.toLowerCase()));
            const additions = incoming.filter(
                (tag) => !!tag.trim() && !existingLower.has(tag.toLowerCase())
            );
            return additions.length > 0 ? [...prev, ...additions] : prev;
        });
    }, []);

    const applyOutfitMetadata = useCallback((options: { force?: boolean; sourceTags?: string[] } = {}) => {
        const sourceTags = options.sourceTags && options.sourceTags.length > 0 ? options.sourceTags : tags;
        const suggestion = suggestOutfitMetadata({
            tags: sourceTags,
            itemTitles: wearables.map((item) => item.title),
            itemCount: wearables.length,
        });

        if (options.force || !outfitName.trim()) {
            setOutfitName(suggestion.name);
        }
        if (options.force || !description.trim()) {
            setDescription(suggestion.description);
        }
    }, [tags, wearables, outfitName, description]);

    const predictTagsFromUri = useCallback(async (uri: string, accessToken: string) => {
        const firstTry = await predictWearableTags(
            {
                file: {
                    uri,
                    name: `predict_${Date.now()}.png`,
                    type: "image/png",
                },
            },
            accessToken
        );

        if (firstTry.ok) {
            return firstTry;
        }

        // Some RN multipart uploads fail server-side parsing for file fields.
        // Retry with a Blob payload which is accepted by the same endpoint.
        if (firstTry.error.includes('loc":["body","file"]')) {
            const blob = await (await fetch(uri)).blob();
            return predictWearableTags(
                {
                    file: {
                        blob,
                        name: `predict_${Date.now()}.png`,
                        type: "image/png",
                    },
                },
                accessToken
            );
        }

        return firstTry;
    }, []);

    // --- Clean Canvas Capture ---
    // Temporarily hides the active selection border and resize handle
    // so they don't appear in the captured snapshot image.
    const captureCleanCanvas = useCallback(async (): Promise<string | undefined> => {
        if (!canvasRef.current?.capture) return undefined;

        const prevId = activeItemId;
        setActiveItemId(null);
        // Wait for React re-render + Reanimated style update
        await new Promise((resolve) => setTimeout(resolve, 150));

        const uri = await canvasRef.current.capture();

        if (prevId) setActiveItemId(prevId);
        return uri;
    }, [activeItemId]);

    // --- Auto Tag Logic ---
    const handleAutoTag = useCallback(async () => {
        if (!data?.user?.id || !canvasRef.current?.capture) return;

        setIsAutoTagging(true);
        try {
            // 1. Capture the current canvas composition (without selection UI)
            const uri = await captureCleanCanvas();
            if (!uri) return;

            // 2. Send to prediction API
            const accessToken = await getKeycloakAccessToken(data.user.id);
            const result = await predictTagsFromUri(uri, accessToken);

            if (!result.ok) {
                Alert.alert("Auto Tag Failed", "Could not generate tags. Please try again later.");
                return;
            }

            // 3. Merge new tags, avoiding duplicates
            if (result.data.tags && result.data.tags.length > 0) {
                mergeTags(result.data.tags);
            } else {
                Alert.alert("Auto Tag", "No tags could be confidently identified for this outfit.");
            }

        } catch {
            Alert.alert("Auto Tag Error", "An unexpected error occurred while processing the image.");
        } finally {
            setIsAutoTagging(false);
        }
    }, [data?.user?.id, captureCleanCanvas, mergeTags, predictTagsFromUri]);

    const handleAutoFill = useCallback(async () => {
        if (!data?.user?.id || !canvasRef.current?.capture) return;

        setIsAutoFilling(true);
        try {
            const uri = await captureCleanCanvas();
            if (!uri) {
                applyOutfitMetadata({ force: true });
                return;
            }
            const accessToken = await getKeycloakAccessToken(data.user.id);
            const result = await predictTagsFromUri(uri, accessToken);

            if (!result.ok) {
                applyOutfitMetadata({ force: true });
                return;
            }

            const predictedTags = result.data.tags ?? [];
            applyOutfitMetadata({ force: true, sourceTags: predictedTags.length > 0 ? predictedTags : tags });
        } catch {
            applyOutfitMetadata({ force: true });
        } finally {
            setIsAutoFilling(false);
        }
    }, [data?.user?.id, captureCleanCanvas, applyOutfitMetadata, tags, predictTagsFromUri]);

    const handleSave = useCallback(() => {
        if (!isFormValid || !data?.user?.id) return;

        (async () => {
            setIsSaving(true);
            try {
                const accessToken = await getKeycloakAccessToken(data.user.id);

                const capturedUri = await captureCleanCanvas();

                const result = await createOutfitMultipart(
                    {
                        title: outfitName.trim(),
                        description: description.trim(),
                        tags,
                        wearableIds: zOrder,
                        file: capturedUri
                            ? {
                                uri: capturedUri,
                                name: `outfit_${Date.now()}.png`,
                                type: "image/png",
                            }
                            : undefined,
                    },
                    accessToken
                );

                Alert.alert(
                    "Outfit Saved!",
                    `"${result.title}" has been created successfully.`,
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.back();
                            },
                        },
                    ]
                );
            } catch (error) {
                if (isAuthError(error)) { handleAuthError(); return; }
                const message =
                    error instanceof Error
                        ? error.message
                        : "Failed to save outfit. Please try again.";
                Alert.alert("Save Failed", message);
            } finally {
                setIsSaving(false);
            }
        })();
    }, [isFormValid, data?.user?.id, outfitName, description, tags, zOrder, captureCleanCanvas]);

    // --- Render ---
    if (loading) {
        return <ComposeLoadingState message="Loading editor..." />;
    }

    return (
        <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <AppHeader
                    title="Compose Outfit"
                    titleStyle={s.headerTitle}
                    left={(
                        <Pressable
                            onPress={() => router.back()}
                            className="active:opacity-60"
                        >
                            <ChevronLeft size={24} color={colors.textPrimary} />
                        </Pressable>
                    )}
                    right={(
                        <Pressable
                            onPress={handleSave}
                            className="rounded-full px-4 py-2 active:opacity-80"
                            style={{
                                backgroundColor: isFormValid && !isSaving ? colors.primary : colors.border,
                            }}
                            disabled={!isFormValid || isSaving}
                        >
                            <Text
                                style={[
                                    s.saveText,
                                    { color: isFormValid && !isSaving ? colors.white : colors.textMuted },
                                ]}
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </Text>
                        </Pressable>
                    )}
                />

                <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                    {/* Layering Controls + Canvas Info */}
                    <Box className="px-4 pt-4 pb-2">
                        <HStack className="items-center justify-between mb-2">
                            <Box>
                                <Text
                                    style={s.sectionTitle}
                                >
                                    Arrange your items
                                </Text>
                                <Text
                                    style={s.sectionHint}
                                >
                                    Pinch to resize. Drag to move.
                                </Text>
                            </Box>

                            {/* Layer controls */}
                            <HStack className="items-center" space="md">
                                <Pressable
                                    onPress={moveActiveItemDown}
                                    className="p-1.5 rounded-full active:opacity-60"
                                    style={{ backgroundColor: `${colors.primary}15` }}
                                >
                                    <ArrowDown size={18} color={colors.primary} />
                                </Pressable>
                                <Pressable
                                    onPress={moveActiveItemUp}
                                    className="p-1.5 rounded-full active:opacity-60"
                                    style={{ backgroundColor: `${colors.primary}15` }}
                                >
                                    <ArrowUp size={18} color={colors.primary} />
                                </Pressable>
                            </HStack>
                        </HStack>

                        {/* Canvas */}
                        <Box
                            className="rounded-2xl overflow-hidden relative"
                            style={{
                                height: CANVAS_HEIGHT,
                                backgroundColor: colors.cardBg,
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderStyle: "dashed",
                            }}
                        >
                            <ViewShot
                                ref={canvasRef}
                                options={{ format: "png", quality: 0.9 }}
                                style={{ flex: 1 }}
                            >
                                {wearables.map((item) => (
                                    <DraggableItem
                                        key={item.id}
                                        item={item}
                                        isActive={activeItemId === item.id}
                                        zIndex={zOrder.indexOf(item.id)}
                                        onActivate={setActiveItemId}
                                    />
                                ))}
                            </ViewShot>
                        </Box>
                    </Box>

                    {/* Metadata Form */}
                    <Box className="px-4 py-4">
                        <HStack className="items-center justify-between mb-2">
                            <Text
                                style={s.sectionTitle}
                            >
                                Outfit Details
                            </Text>
                            <PillActionButton
                                loading={isAutoFilling}
                                loadingLabel="Filling..."
                                label="Auto Fill"
                                onPress={handleAutoFill}
                            />
                        </HStack>

                        <Box
                            className="rounded-xl overflow-hidden mb-4"
                            style={{
                                backgroundColor: colors.cardBg,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <HStack className="items-center px-4 py-3">
                                <FocusTextInput
                                    value={outfitName}
                                    onChangeText={setOutfitName}
                                    placeholder="Name your outfit..."
                                    placeholderTextColor={colors.textMuted}
                                    style={{
                                        ...s.nameInput,
                                        flex: 1,
                                        paddingVertical: 0,
                                    }}
                                    maxLength={MAX_NAME_LENGTH}
                                    returnKeyType="done"
                                    label="Outfit Name"
                                />
                                <Text
                                    className="ml-2"
                                    style={s.counterText}
                                >
                                    {outfitName.length}/{MAX_NAME_LENGTH}
                                </Text>
                            </HStack>
                        </Box>

                        <Box
                            className="rounded-xl overflow-hidden mb-4"
                            style={{
                                backgroundColor: colors.cardBg,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <FocusTextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Add a description (e.g. For summer casual Fridays...)"
                                placeholderTextColor={colors.textMuted}
                                multiline
                                style={{
                                    ...s.descriptionInput,
                                    minHeight: 80,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    textAlignVertical: "top",
                                }}
                                label="Description"
                            />
                        </Box>

                        {/* Tags Input */}
                        <Box className="mb-6">
                            <HStack className="items-center justify-between mb-2">
                                <HStack className="items-center">
                                    <Tag size={16} color={colors.textPrimary} />
                                    <Text
                                        className="ml-2"
                                        style={s.sectionTitle}
                                    >
                                        Tags
                                    </Text>
                                    <Text
                                        className="ml-2"
                                        style={s.counterText}
                                    >
                                        ({tags.length})
                                    </Text>
                                </HStack>
                                <HStack className="items-center gap-3">
                                    <PillActionButton
                                        loading={isAutoTagging}
                                        loadingLabel="Tagging..."
                                        label="Auto Tag"
                                        onPress={handleAutoTag}
                                    />
                                    {tags.length > 0 && (
                                        <Pressable onPress={() => setTags([])}>
                                            <Text
                                                style={s.clearText}
                                            >
                                                Clear all
                                            </Text>
                                        </Pressable>
                                    )}
                                </HStack>
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
                                    <Text style={s.hashPrefix}>
                                        #
                                    </Text>
                                    <FocusTextInput
                                        value={tagInput}
                                        onChangeText={setTagInput}
                                        placeholder="Type a tag..."
                                        placeholderTextColor={colors.textMuted}
                                        style={{
                                            ...s.tagInput,
                                            flex: 1,
                                            paddingVertical: 0,
                                            marginLeft: 8,
                                        }}
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
                                            <Text style={s.addButtonText}>
                                                Add
                                            </Text>
                                        </Pressable>
                                    )}
                                </HStack>
                            </Box>

                            {/* Added tags display */}
                            {tags.length > 0 && (
                                <Box className="mt-3">
                                    <HStack className="flex-wrap gap-2">
                                        {tags.map((t) => (
                                            <Pressable
                                                key={t}
                                                onPress={() => removeTag(t)}
                                                className="mr-1 mb-1"
                                            >
                                                <HStack
                                                    className="items-center rounded-full px-3 py-2"
                                                    style={{
                                                        backgroundColor: `${colors.primary}20`,
                                                        borderWidth: 1,
                                                        borderColor: `${colors.primary}40`,
                                                    }}
                                                >
                                                    <Text
                                                        style={s.tagChipText}
                                                    >
                                                        {t}
                                                    </Text>
                                                    <X
                                                        size={14}
                                                        color={colors.primary}
                                                        style={{ marginLeft: 6 }}
                                                    />
                                                </HStack>
                                            </Pressable>
                                        ))}
                                    </HStack>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
