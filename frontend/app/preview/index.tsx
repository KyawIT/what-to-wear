import React, { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, Alert } from "react-native";

import { Center } from "@/components/ui/center";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";

import { useRemoveBackground } from "@/hooks/useRemoveBackground";
import { fetchWearableCategories } from "@/api/backend/category.api";
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
    SelectTrigger
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react-native";
import {authClient} from "@/lib/auth-client";
import {dataUriToFileUri} from "@/lib/image/image.utils";
import {toWearableCategory} from "@/api/backend/wearable.model";

type Params = {
    id?: string;
    uri?: string;
};

export default function PreviewScreen() {
    const {data} = authClient.useSession();
    const { id, uri } = useLocalSearchParams<Params>();
    const { loading, cutoutUri, error, retry } = useRemoveBackground({ id, uri });

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const cats = await fetchWearableCategories();
                setCategories(cats);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            } finally {
                setLoadingCategories(false);
            }
        })();
    }, []);

    const onBack = () => router.back();
    const retake = () => router.back();

    const addTag = (raw: string) => {
        const v = raw.trim().toLowerCase();
        if (!v) return;

        setTags((prev) =>
            prev.some((t) => t.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]
        );
        setTagInput("");
    };

    const removeTag = (tag: string) => {
        setTags((prev) => prev.filter((t) => t !== tag));
    };

    const onUse = async () => {
        if (!cutoutUri) return;

        setSubmitting(true);

        try {
            const userId = data!.user.id;

            const file = cutoutUri.startsWith("data:")
                ? await dataUriToFileUri(cutoutUri)
                : { uri: cutoutUri, mime: "image/png", name: `wearable_${Date.now()}.png` };

            const result = await createWearableMultipart(userId, {
                category: toWearableCategory(selectedCategory),
                title: title.trim(),
                description: description.trim(),
                tags,
                file: {
                    uri: file.uri,
                    name: file.name,
                    type: file.mime,
                },
            });

            console.log("Wearable created successfully:", result);

            Alert.alert(
                "Success!",
                "Your wearable has been created successfully.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            console.error("Error creating wearable:", error);

            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to create wearable. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setSubmitting(false);
        }
    };

    const badges = useMemo(
        () =>
            tags.map((t) => (
                <Pressable key={t} onPress={() => removeTag(t)}>
                    <HStack className="items-center rounded-full bg-blue-500/20 border border-blue-400/30 px-4 py-2 mr-2 mb-2">
                        <Text className="text-blue-100 text-sm font-medium">{t}</Text>
                        <Text className="text-blue-200/70 ml-2 text-base">×</Text>
                    </HStack>
                </Pressable>
            )),
        [tags]
    );

    if (!id && !uri) {
        return (
            <Center className="flex-1 bg-black px-6">
                <Text className="text-white text-lg font-semibold">No image selected</Text>
                <Button variant="outline" action="secondary" onPress={onBack} className="mt-4">
                    <ButtonText>Go back</ButtonText>
                </Button>
            </Center>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Box className="flex-1 bg-black">
                {/* Top bar */}
                <HStack className="pt-14 px-4 pb-3 items-center justify-between border-b border-white/5">
                    <Pressable onPress={onBack} className="active:opacity-60">
                        <Text className="text-blue-500 text-base font-semibold">Cancel</Text>
                    </Pressable>

                    <Text className="text-white text-base font-semibold">New Post</Text>

                    <Pressable
                        onPress={onUse}
                        className="active:opacity-60"
                        disabled={loading || !cutoutUri || tags.length === 0 || !selectedCategory || submitting}
                    >
                        <Text
                            className={`text-base font-semibold ${
                                loading || !cutoutUri || tags.length === 0 || !selectedCategory || submitting
                                    ? "text-gray-600"
                                    : "text-blue-500"
                            }`}
                        >
                            {submitting ? "Submitting..." : "Submit"}
                        </Text>
                    </Pressable>
                </HStack>

                {/* Image stays fixed */}
                <Box className="px-4 pt-4">
                    <Box className="rounded-3xl overflow-hidden bg-neutral-900">
                        <Image
                            source={{ uri: cutoutUri ?? uri ?? "" }}
                            contentFit="contain"
                            style={{ width: "100%", height: 400 }}
                        />

                        {loading && (
                            <Box className="absolute inset-0 items-center justify-center bg-black/70">
                                <Box className="bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10">
                                    <Text className="text-white font-medium text-center">
                                        ✨ Removing background...
                                    </Text>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* SCROLL ONLY TAGS + ACTIONS */}
                <ScrollView
                    className="flex-1 px-4"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Error */}
                    {error && (
                        <Box className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                            <HStack className="items-center mb-2">
                                <Text className="text-red-400 text-2xl mr-2">⚠️</Text>
                                <Text className="text-red-300 font-semibold text-base">
                                    Something went wrong
                                </Text>
                            </HStack>
                            <Text className="text-red-200/60 text-sm leading-5">{error}</Text>

                            <HStack className="mt-4 space-x-3">
                                <Button
                                    variant="outline"
                                    action="secondary"
                                    onPress={retry}
                                    className="flex-1 mr-3 rounded-xl border-red-400/30 bg-red-500/10"
                                    isDisabled={loading}
                                >
                                    <ButtonText className="text-red-300">Retry</ButtonText>
                                </Button>

                                <Button
                                    variant="solid"
                                    action="negative"
                                    onPress={retake}
                                    className="flex-1 rounded-xl"
                                    isDisabled={loading}
                                >
                                    <ButtonText>Retake Photo</ButtonText>
                                </Button>
                            </HStack>
                        </Box>
                    )}

                    {/* Title + Category + Description + Tags Section */}
                    <Box className="mt-6">
                        {/* Title */}
                        <Box className="mb-5">
                            <HStack className="items-center justify-between mb-3">
                                <Text className="text-white text-base font-semibold">Title</Text>
                                <Text className="text-white/40 text-sm">{title.trim().length}/60</Text>
                            </HStack>

                            <Box className="rounded-xl border border-white/10 bg-neutral-900 overflow-hidden">
                                <HStack className="items-center px-4 py-3">
                                    <TextInput
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder="e.g. vintage nike windbreaker"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        style={{
                                            color: "white",
                                            fontSize: 16,
                                            flex: 1,
                                            paddingVertical: 0,
                                        }}
                                        maxLength={60}
                                        returnKeyType="next"
                                    />
                                </HStack>
                            </Box>
                        </Box>

                        {/* Category Picker - Instagram Style */}
                        <Box className="mb-5">
                            <Text className="text-white text-base font-semibold mb-3">Category</Text>

                            <Select
                                selectedValue={selectedCategory}
                                onValueChange={(value) => setSelectedCategory(value)}
                                isDisabled={loadingCategories}
                            >
                                <SelectTrigger
                                    variant="outline"
                                    size="md"
                                    className="rounded-xl border-white/10 bg-neutral-900"
                                >
                                    <SelectInput
                                        placeholder={loadingCategories ? "Loading categories..." : "Select category"}
                                        className="text-white text-base flex-1"
                                        style={{ color: selectedCategory ? "white" : "rgba(255,255,255,0.3)" }}
                                    />
                                    <SelectIcon className="text-white/50" as={ChevronDownIcon} />
                                </SelectTrigger>
                                <SelectPortal>
                                    <SelectBackdrop className="bg-black/80" />
                                    <SelectContent className="bg-neutral-900 border-white/10">
                                        <SelectDragIndicatorWrapper>
                                            <SelectDragIndicator className="bg-white/20" />
                                        </SelectDragIndicatorWrapper>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category}
                                                label={category}
                                                value={category}
                                                className="text-white"
                                            />
                                        ))}
                                    </SelectContent>
                                </SelectPortal>
                            </Select>
                        </Box>

                        {/* Description */}
                        <Box className="mb-5">
                            <HStack className="items-center justify-between mb-3">
                                <Text className="text-white text-base font-semibold">Description</Text>
                                <Text className="text-white/40 text-sm">{description.trim().length}/200</Text>
                            </HStack>

                            <Box className="rounded-xl border border-white/10 bg-neutral-900 overflow-hidden">
                                <Box className="px-4 py-3">
                                    <TextInput
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="Add details about color, material, condition..."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        style={{
                                            color: "white",
                                            fontSize: 16,
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

                        {/* Tags header */}
                        <HStack className="items-center justify-between mb-3">
                            <HStack className="items-center">
                                <Text className="text-white text-base font-semibold">Add Tags</Text>
                                <Text className="text-white/40 text-sm ml-2">({tags.length})</Text>
                            </HStack>
                            {tags.length > 0 && (
                                <Pressable onPress={() => setTags([])}>
                                    <Text className="text-red-400 text-sm font-medium">Clear all</Text>
                                </Pressable>
                            )}
                        </HStack>

                        {/* Tag input */}
                        <Box className="rounded-xl border border-white/10 bg-neutral-900 overflow-hidden">
                            <HStack className="items-center px-4 py-3">
                                <Text className="text-white/50 text-lg mr-2">#</Text>
                                <TextInput
                                    value={tagInput}
                                    onChangeText={setTagInput}
                                    placeholder="casual, summer, outdoor..."
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    style={{
                                        color: "white",
                                        fontSize: 16,
                                        flex: 1,
                                        paddingVertical: 0,
                                    }}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => addTag(tagInput)}
                                />
                                {tagInput.length > 0 && (
                                    <Pressable
                                        onPress={() => addTag(tagInput)}
                                        className="ml-2 bg-blue-500 rounded-full px-4 py-1.5 active:opacity-80"
                                    >
                                        <Text className="text-white text-sm font-semibold">Add</Text>
                                    </Pressable>
                                )}
                            </HStack>
                        </Box>

                        {/* Suggested tags */}
                        {tags.length === 0 && (
                            <Box className="mt-3">
                                <Text className="text-white/40 text-xs font-medium mb-2 uppercase tracking-wide">
                                    Suggestions
                                </Text>
                                <HStack className="flex-wrap">
                                    {["Casual", "Formal", "Summer", "Winter", "Outdoor"].map(
                                        (suggestion) => (
                                            <Pressable
                                                key={suggestion}
                                                onPress={() => addTag(suggestion)}
                                                className="mr-2 mb-2"
                                            >
                                                <Box className="rounded-full border border-white/10 bg-white/5 px-4 py-2 active:bg-white/10">
                                                    <Text className="text-white/60 text-sm">
                                                        + {suggestion}
                                                    </Text>
                                                </Box>
                                            </Pressable>
                                        )
                                    )}
                                </HStack>
                            </Box>
                        )}

                        {/* Tags display */}
                        {tags.length > 0 && (
                            <Box className="mt-4">
                                <HStack className="flex-wrap">{badges}</HStack>
                            </Box>
                        )}
                    </Box>

                    {/* Actions */}
                    <VStack className="pt-8 pb-10 space-y-3">
                        {!error && (
                            <Button
                                variant="solid"
                                action="negative"
                                onPress={retake}
                                size="xl"
                                className="rounded-xl bg-neutral-900 border border-white/10"
                                isDisabled={loading}
                            >
                                <ButtonText className="text-white">Retake Photo</ButtonText>
                            </Button>
                        )}
                    </VStack>

                    {/* Bottom spacing for keyboard */}
                    <Box className="h-8" />
                </ScrollView>
            </Box>
        </KeyboardAvoidingView>
    );
}