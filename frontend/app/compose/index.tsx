import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
    ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    runOnJS,
} from "react-native-reanimated";

import { authClient } from "@/lib/auth-client";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import { predictWearableTags } from "@/api/backend/predict.api";
import { WearableResponseDto } from "@/api/backend/wearable.model";
import { createOutfitMultipart } from "@/api/backend/outfit.api";
import { colors } from "@/lib/theme";
import { suggestOutfitMetadata } from "@/lib/ai/metadata-suggestions";
import ViewShot from "react-native-view-shot";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, Shirt, Tag, X, ArrowUp, ArrowDown, Maximize2, Sparkles } from "lucide-react-native";

const ITEM_SIZE = 100;
const MAX_NAME_LENGTH = 40;
const CANVAS_HEIGHT = Dimensions.get("window").height * 0.45;

interface DraggableItemProps {
    item: WearableResponseDto;
    isActive: boolean;
    zIndex: number;
    onActivate: (id: string) => void;
}

const DraggableItem = ({ item, isActive, zIndex, onActivate }: DraggableItemProps) => {
    // Give items random initial spread in the canvas
    const startX = useMemo(
        () => Math.random() * (Dimensions.get("window").width - ITEM_SIZE - 32),
        []
    );
    const startY = useMemo(
        () => Math.random() * (CANVAS_HEIGHT - ITEM_SIZE - 32),
        []
    );

    const translateX = useSharedValue(startX);
    const translateY = useSharedValue(startY);
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            runOnJS(onActivate)(item.id);
        })
        .onStart(() => {
            offsetX.value = translateX.value;
            offsetY.value = translateY.value;
        })
        .onUpdate((event) => {
            translateX.value = offsetX.value + event.translationX;
            translateY.value = offsetY.value + event.translationY;
        });

    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = savedScale.value * event.scale;
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    const resizePanGesture = Gesture.Pan()
        .onStart(() => {
            savedScale.value = scale.value;
        })
        .onUpdate((event) => {
            const scaleChange = (event.translationX + event.translationY) / (ITEM_SIZE * 2);
            scale.value = Math.max(0.3, savedScale.value + scaleChange);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
        });

    // Run pan and pinch simultaneously
    const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value }
            ],
            // Highlighting the active item slightly to know which one gets layered
            borderColor: isActive ? colors.primary : "transparent",
            borderWidth: isActive ? 2 : 0,
            borderRadius: 16,
            zIndex: zIndex,
        };
    });

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View
                style={[
                    { position: "absolute", width: ITEM_SIZE, height: ITEM_SIZE },
                    animatedStyle,
                ]}
            >
                {item.cutoutImageUrl ? (
                    <Image
                        source={{ uri: item.cutoutImageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="contain"
                    />
                ) : (
                    <Center className="flex-1 bg-backgroundSecondary rounded-xl border border-border">
                        <Shirt size={24} color={colors.textMuted} />
                    </Center>
                )}

                {/* Minimalist Resize Corner Handle */}
                {isActive && (
                    <GestureDetector gesture={resizePanGesture}>
                        <Box
                            className="absolute -right-3 -bottom-3 w-7 h-7 items-center justify-center z-50 rounded-full bg-background-50 shadow-md"
                            style={{ borderWidth: 1, borderColor: colors.primary }}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Maximize2 size={12} color={colors.primary} />
                        </Box>
                    </GestureDetector>
                )}
            </Animated.View>
        </GestureDetector>
    );
};

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
    const [hasAutoFilledMetadata, setHasAutoFilledMetadata] = useState(false);
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
                console.error("Failed to parse or load items:", err);
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

    useEffect(() => {
        if (hasAutoFilledMetadata) return;
        if (!wearables.length) return;
        if (outfitName.trim() || description.trim()) return;

        applyOutfitMetadata();
        setHasAutoFilledMetadata(true);
    }, [hasAutoFilledMetadata, wearables, outfitName, description, applyOutfitMetadata]);

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
            const result = await predictWearableTags({ file: { uri, type: "image/png" } }, accessToken);

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
    }, [data?.user?.id, captureCleanCanvas, mergeTags]);

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
            const result = await predictWearableTags({ file: { uri, type: "image/png" } }, accessToken);

            if (!result.ok) {
                applyOutfitMetadata({ force: true });
                return;
            }

            const predictedTags = result.data.tags ?? [];
            mergeTags(predictedTags);
            applyOutfitMetadata({ force: true, sourceTags: predictedTags.length > 0 ? predictedTags : tags });
        } catch {
            applyOutfitMetadata({ force: true });
        } finally {
            setIsAutoFilling(false);
        }
    }, [data?.user?.id, captureCleanCanvas, mergeTags, applyOutfitMetadata, tags]);

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
                                router.replace("/(tabs)/profile");
                            },
                        },
                    ]
                );
            } catch (error) {
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
        return (
            <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
                <Center className="flex-1">
                    <Spinner size="large" className="text-primary-500" />
                    <Text className="mt-4 text-typography-400">Loading editor...</Text>
                </Center>
            </SafeAreaView>
        );
    }

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
                    <Pressable
                        onPress={() => router.back()}
                        className="active:opacity-60"
                    >
                        <ChevronLeft size={24} color={colors.textPrimary} />
                    </Pressable>

                    <Heading size="lg" className="text-typography-800">
                        Compose Outfit
                    </Heading>

                    <Pressable
                        onPress={handleSave}
                        className="rounded-full px-4 py-2 active:opacity-80"
                        style={{
                            backgroundColor: isFormValid && !isSaving ? colors.primary : colors.border,
                        }}
                        disabled={!isFormValid || isSaving}
                    >
                        <Text
                            className="text-sm font-semibold"
                            style={{
                                color: isFormValid && !isSaving ? "#FFFFFF" : colors.textMuted,
                            }}
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </Text>
                    </Pressable>
                </HStack>

                <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                    {/* Layering Controls + Canvas Info */}
                    <Box className="px-4 pt-4 pb-2">
                        <HStack className="items-center justify-between mb-2">
                            <Box>
                                <Text
                                    className="text-sm font-semibold"
                                    style={{ color: colors.textPrimary }}
                                >
                                    Arrange your items
                                </Text>
                                <Text
                                    className="text-xs"
                                    style={{ color: colors.textMuted }}
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
                                className="text-sm font-semibold"
                                style={{ color: colors.textPrimary }}
                            >
                                Outfit Details
                            </Text>
                            <Pressable
                                onPress={handleAutoFill}
                                disabled={isAutoFilling}
                                className="active:opacity-70"
                            >
                                <HStack
                                    className="items-center rounded-full px-3 py-1.5"
                                    style={{
                                        backgroundColor: `${colors.primary}15`,
                                        borderWidth: 1,
                                        borderColor: `${colors.primary}30`,
                                        opacity: isAutoFilling ? 0.7 : 1,
                                    }}
                                >
                                    {isAutoFilling ? (
                                        <Spinner size="small" color={colors.primary} />
                                    ) : (
                                        <Sparkles size={12} color={colors.primary} />
                                    )}
                                    <Text
                                        className="text-xs font-semibold ml-1.5"
                                        style={{ color: colors.primary }}
                                    >
                                        {isAutoFilling ? "Filling..." : "Auto Fill"}
                                    </Text>
                                </HStack>
                            </Pressable>
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
                                <TextInput
                                    value={outfitName}
                                    onChangeText={setOutfitName}
                                    placeholder="Name your outfit..."
                                    placeholderTextColor={colors.textMuted}
                                    style={{
                                        color: colors.textPrimary,
                                        fontSize: 16,
                                        flex: 1,
                                        paddingVertical: 0,
                                        fontWeight: "500",
                                    }}
                                    maxLength={MAX_NAME_LENGTH}
                                    returnKeyType="done"
                                />
                                <Text
                                    className="text-xs ml-2"
                                    style={{ color: colors.textMuted }}
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
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Add a description (e.g. For summer casual Fridays...)"
                                placeholderTextColor={colors.textMuted}
                                multiline
                                style={{
                                    color: colors.textPrimary,
                                    fontSize: 15,
                                    minHeight: 80,
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    textAlignVertical: "top",
                                }}
                            />
                        </Box>

                        {/* Tags Input */}
                        <Box className="mb-6">
                            <HStack className="items-center justify-between mb-2">
                                <HStack className="items-center">
                                    <Tag size={16} color={colors.textPrimary} />
                                    <Text
                                        className="text-sm font-semibold ml-2"
                                        style={{ color: colors.textPrimary }}
                                    >
                                        Tags
                                    </Text>
                                    <Text
                                        className="text-xs ml-2"
                                        style={{ color: colors.textMuted }}
                                    >
                                        ({tags.length})
                                    </Text>
                                </HStack>
                                <HStack className="items-center gap-3">
                                    <Pressable
                                        onPress={handleAutoTag}
                                        disabled={isAutoTagging}
                                        className="active:opacity-60"
                                    >
                                        <HStack
                                            className="items-center rounded-full px-3 py-1.5"
                                            style={{
                                                backgroundColor: `${colors.primary}15`,
                                                borderWidth: 1,
                                                borderColor: `${colors.primary}30`,
                                                opacity: isAutoTagging ? 0.7 : 1,
                                            }}
                                        >
                                            {isAutoTagging ? (
                                                <Spinner size="small" color={colors.primary} />
                                            ) : (
                                                <Sparkles size={12} color={colors.primary} />
                                            )}
                                            <Text
                                                className="text-xs font-semibold ml-1.5"
                                                style={{ color: colors.primary }}
                                            >
                                                {isAutoTagging ? "Tagging..." : "Auto Tag"}
                                            </Text>
                                        </HStack>
                                    </Pressable>
                                    {tags.length > 0 && (
                                        <Pressable onPress={() => setTags([])}>
                                            <Text
                                                className="text-xs font-medium"
                                                style={{ color: colors.error }}
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
                                    <Text style={{ color: colors.textMuted, fontSize: 16 }}>
                                        #
                                    </Text>
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
                                            <Text className="text-white text-sm font-semibold">
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
                                                        className="text-sm font-medium"
                                                        style={{ color: colors.primary }}
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
