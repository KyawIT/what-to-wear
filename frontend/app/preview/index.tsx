import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";

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

    const onBack = () => router.back();
    const retake = () => router.back();

    const onUse = () => {
        if (!cutoutUri) return;
        // TODO: later navigate to save/upload screen with cutoutUri (or save file first)
        router.back();
    };

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
        <Box className="flex-1 bg-black">
            {/* Top bar */}
            <HStack className="pt-14 px-4 pb-3 items-center justify-between">
                <Pressable onPress={onBack} className="active:opacity-70">
                    <Box className="px-3 py-2 rounded-xl bg-white/10">
                        <Text className="text-white font-semibold">Back</Text>
                    </Box>
                </Pressable>

                <Text className="text-white text-lg font-bold">Preview</Text>
                <Box className="w-16" />
            </HStack>

            {/* Content */}
            <VStack className="flex-1 px-4">
                <Box className="rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                    <Image
                        source={{ uri: cutoutUri ?? uri ?? "" }}
                        contentFit="contain"
                        style={{ width: "100%", height: 420 }}
                    />

                    {loading && (
                        <Box className="absolute inset-0 items-center justify-center bg-black/60">
                            <Text className="text-white font-semibold">Removing background…</Text>
                            <Text className="text-white/60 text-sm mt-2">This can take a few seconds.</Text>
                        </Box>
                    )}
                </Box>

                {/* Better-looking error card */}
                {error && (
                    <Box className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                        <Text className="text-red-200 font-semibold">Couldn’t remove background</Text>
                        <Text className="text-red-200/70 text-sm mt-1">{error}</Text>

                        <HStack className="mt-4 space-x-3">
                            <Button
                                variant="outline"
                                action="secondary"
                                onPress={retry}
                                className="flex-1 rounded-2xl mr-5"
                                isDisabled={loading}
                            >
                                <ButtonText>Retry</ButtonText>
                            </Button>

                            <Button
                                variant="solid"
                                action="negative"
                                onPress={retake}
                                className="flex-1 rounded-2xl"
                                isDisabled={loading}
                            >
                                <ButtonText>Retake</ButtonText>
                            </Button>
                        </HStack>
                    </Box>
                )}

                {/* Actions */}
                <VStack className="pb-8 pt-5 space-y-3">
                    <Button
                        variant="solid"
                        action="secondary"
                        onPress={onUse}
                        size="xl"
                        className="rounded-2xl"
                        isDisabled={loading || !cutoutUri}
                    >
                        <ButtonText>Submit</ButtonText>
                    </Button>

                    {!error && (
                        <Button
                            variant="solid"
                            action="negative"
                            onPress={retake}
                            size="xl"
                            className="rounded-2xl mt-5"
                            isDisabled={loading}
                        >
                            <ButtonText>Retake</ButtonText>
                        </Button>
                    )}
                </VStack>
            </VStack>
        </Box>
    );
}