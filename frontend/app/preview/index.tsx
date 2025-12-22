import React, { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from "react-native";

import { Center } from "@/components/ui/center";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";

import { useRemoveBackground } from "@/hooks/useRemoveBackground";

type Params = {
    id?: string;
    uri?: string;
};

export default function PreviewScreen() {
    const { id, uri } = useLocalSearchParams<Params>();
    const { loading, cutoutUri, error, retry } = useRemoveBackground({ id, uri });

    const [title, setTitle] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

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

    const onUse = () => {
        if (!cutoutUri) return;
        // title + tags[] available here
        router.back();
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
                        disabled={loading || !cutoutUri || tags.length === 0}
                    >
                        <Text
                            className={`text-base font-semibold ${
                                loading || !cutoutUri || tags.length === 0
                                    ? "text-gray-600"
                                    : "text-blue-500"
                            }`}
                        >
                            Submit
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

                    {/* Title + Tags Section */}
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
