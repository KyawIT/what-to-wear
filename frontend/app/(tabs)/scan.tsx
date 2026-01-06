import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList, Pressable, Dimensions, Text } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, Check, Camera } from "lucide-react-native";

import ImagePermissionGate from "@/components/common/ImagePermissionGate";
import GridImageCell from "@/components/common/GridImageCell";

const W = Dimensions.get("window").width;
const SIZE = W / 3;

type GridItem =
    | { type: "camera"; id: "camera" }
    | ({ type: "image" } & MediaLibrary.Asset);

const Scan = () => {
    const [permission, requestPermission] = MediaLibrary.usePermissions();
    const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
    const [preview, setPreview] = useState<MediaLibrary.Asset | null>(null);

    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            if (!permission?.granted) return;

            const page = await MediaLibrary.getAssetsAsync({
                mediaType: "photo",
                sortBy: [[MediaLibrary.SortBy.creationTime, false]],
                first: 120,
            });

            setAssets(page.assets);

            const first = page.assets[0] ?? null;
            setPreview(first);
            setSelectedId(first?.id ?? null);
        })();
    }, [permission?.granted]);

    const gridData: GridItem[] = useMemo(
        () => [
            { type: "camera", id: "camera" },
            ...assets.map((a) => ({ ...a, type: "image" as const })),
        ],
        [assets]
    );

    const selectAsset = (asset: MediaLibrary.Asset) => {
        setPreview(asset);
        setSelectedId(asset.id);
    };

    const onPressCamera = () => {
        // TODO: add in-app camera later (photo only)
    };

    const onNext = () => {
        if (!preview) return;

        router.push({
            pathname: "/preview",
            params: {
                id: preview.id,
                uri: preview.uri,
            },
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
            <View className="h-14 border-b border-white/10 flex-row items-center justify-between px-4">
                <Pressable
                    className="h-9 w-9 items-center justify-center active:opacity-60"
                    onPress={() => router.push("/")}
                >
                    <X size={28} color="white" strokeWidth={2} />
                </Pressable>

                <Text className="text-white text-base font-semibold">
                    Select Photo
                </Text>

                <Pressable
                    className="h-9 px-4 items-center justify-center active:opacity-60"
                    onPress={onNext}
                    disabled={!selectedId}
                >
                    <Text
                        className={`text-base font-semibold ${
                            selectedId ? "text-blue-500" : "text-gray-600"
                        }`}
                    >
                        Next
                    </Text>
                </Pressable>
            </View>

            <ImagePermissionGate
                permission={permission}
                requestPermission={requestPermission}
                title="Allow access to your photos"
                description="We need access to your photo library so you can select photos and post them directly from the app."
                ctaAllowText="Allow Photo Access"
                ctaSettingsText="Open Settings"
                icon={
                    <Image
                        source={require("@/assets/logo/logo-md.png")}
                        style={{ width: 72, height: 72 }}
                        contentFit="contain"
                    />
                }
            >
                <View className="flex-1 bg-black">
                    {/* Preview */}
                    <View style={{ width: "100%", height: W }} className="bg-black">
                        {preview && (
                            <Image
                                source={{ uri: preview.uri }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                            />
                        )}

                        {/* Selection indicator */}
                        {selectedId && (
                            <View className="absolute top-3 right-3">
                                <View className="h-6 w-6 rounded-full bg-blue-500 items-center justify-center">
                                    <Check size={16} color="white" strokeWidth={3} />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Separator */}
                    <View className="h-0.5 bg-white/5" />

                    {/* Grid Gallery Header */}
                    <View className="h-11 flex-row items-center px-4 bg-black border-b border-white/5">
                        <Text className="text-white text-sm font-semibold">
                            Recent
                        </Text>
                    </View>

                    {/* Grid */}
                    <FlatList
                        data={gridData}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        extraData={selectedId}
                        style={{ backgroundColor: "#000" }}
                        columnWrapperStyle={{ gap: 1 }}
                        contentContainerStyle={{ gap: 1 }}
                        renderItem={({ item }) => {
                            if (item.type === "camera") {
                                return (
                                    <Pressable onPress={onPressCamera}>
                                        <View
                                            style={{
                                                width: SIZE - 0.67,
                                                height: SIZE - 0.67,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                backgroundColor: "#1a1a1a",
                                            }}
                                        >
                                            <View className="h-14 w-14 rounded-full items-center justify-center bg-white/10">
                                                <Camera size={24} color="white" />
                                            </View>

                                            <Text
                                                style={{
                                                    marginTop: 8,
                                                    fontSize: 11,
                                                    color: "#9CA3AF",
                                                    fontWeight: "500",
                                                }}
                                            >
                                                Camera
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            }

                            const isActive = selectedId === item.id;

                            return (
                                <GridImageCell
                                    item={item}
                                    size={SIZE - 0.67}
                                    isActive={isActive}
                                    onPress={() => selectAsset(item)}
                                    activeBorderColor="#3B82F6"
                                />
                            );
                        }}
                    />
                </View>
            </ImagePermissionGate>
        </SafeAreaView>
    );
};

export default Scan;