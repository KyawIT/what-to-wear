import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";

import { Center } from "@/components/ui/center";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";

import { removeBackground } from "@/app/api/rembg/image.api"; // (recommended move to /lib)

type Params = {
    id?: string;
    uri?: string;
};

export default function PreviewScreen() {
    const { id, uri } = useLocalSearchParams<Params>();

    const [loading, setLoading] = useState(false);
    const [cutoutUri, setCutoutUri] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onBack = () => router.back();
    const retake = () => router.back();

    const onUse = () => {
        if (!cutoutUri) return;
        router.back();
    };

    useEffect(() => {
        let alive = true;

        const run = async () => {
            if (!id && !uri) return;

            setLoading(true);
            setError(null);
            setCutoutUri(null);

            try {
                const uploadUri = await resolveUploadUri({ id, uri });

                const blob = await removeBackground(uploadUri);
                const base64 = await blobToBase64(blob);

                if (!alive) return;
                setCutoutUri(`data:image/png;base64,${base64}`);
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? "Failed to remove background.");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        };

        run();

        return () => {
            alive = false;
        };
    }, [id, uri]);

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

                {error && <Text className="text-red-400 mt-3 text-sm">{error}</Text>}

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
                        <ButtonText>Use Image</ButtonText>
                    </Button>

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
                </VStack>
            </VStack>
        </Box>
    );
}

/**
 * iOS Photos returns ph:// or ph-upload:// which cannot be uploaded.
 * We must resolve it to a real file:// URI via MediaLibrary.
 */
async function resolveUploadUri(params: { id?: string; uri?: string }): Promise<string> {
    const { id, uri } = params;

    // If uri is already a real file, good.
    if (uri && uri.startsWith("file://")) return uri;

    // Use asset id (best path)
    if (id) {
        const info = await MediaLibrary.getAssetInfoAsync(id);

        // iOS: localUri is usually file://...
        if (info.localUri) return info.localUri;

        // Sometimes only uri exists; if it's still ph://, we can't upload it.
        if (info.uri && info.uri.startsWith("file://")) return info.uri;

        throw new Error(
            "Could not resolve a local file path for this photo. (MediaLibrary localUri is null)"
        );
    }

    // No id provided -> can't resolve ph://
    if (uri && (uri.startsWith("ph://") || uri.startsWith("ph-upload://"))) {
        throw new Error("Photo URI is ph://. Pass the asset id to Preview so we can resolve localUri.");
    }

    if (!uri) throw new Error("Missing image uri.");
    return uri;
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.onloadend = () => {
            const res = reader.result;
            if (typeof res !== "string") return reject(new Error("Invalid base64 result"));
            const comma = res.indexOf(",");
            resolve(comma >= 0 ? res.slice(comma + 1) : res);
        };
        reader.readAsDataURL(blob);
    });
}
