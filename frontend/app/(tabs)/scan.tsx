import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList, Pressable, Dimensions, Text } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, ArrowBigRight, Camera } from "lucide-react-native";

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

    // Multi-select (photos only)
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

            if (first) setSelectedIds([first.id]);
        })();
    }, [permission?.granted]);

    const gridData: GridItem[] = useMemo(
        () => [
            { type: "camera", id: "camera" },
            ...assets.map((a) => ({ ...a, type: "image" as const })),
        ],
        [assets]
    );

    const selectedIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        selectedIds.forEach((id, idx) => map.set(id, idx + 1));
        return map;
    }, [selectedIds]);

    const toggleSelect = (asset: MediaLibrary.Asset) => {
        setPreview(asset);

        setSelectedIds((prev) => {
            const exists = prev.includes(asset.id);

            if (exists) {
                const next = prev.filter((id) => id !== asset.id);

                if (preview?.id === asset.id) {
                    const newPreviewId = next[next.length - 1];
                    const newPreview =
                        assets.find((a) => a.id === newPreviewId) ?? assets[0] ?? null;
                    setPreview(newPreview);
                }

                return next;
            }

            return [...prev, asset.id];
        });
    };

    const onPressCamera = () => {
        // TODO: add in-app camera later (photo only)
    };

    const onNext = () => {
        // TODO: navigate with selectedIds
        // router.push({ pathname: "/post", params: { ids: selectedIds.join(",") } as any });
    };

    return (
        <SafeAreaView className="flex-1 bg-secondary-100" edges={["top"]}>
            {/* Header */}
            <View className="h-16 border-b border-secondary-200 flex-row items-center justify-between px-4">
                <Pressable
                    className="h-10 w-10 items-center justify-center rounded-full bg-secondary-800/10 border border-secondary-200/60"
                    onPress={() => router.push("/")}
                >
                    <X size={18} />
                </Pressable>

                <View className="absolute left-0 right-0 items-center pointer-events-none">
                    <Text className="text-2xl tracking-tight">
                        <Text className="text-indigo-500 font-extrabold">What</Text>
                        <Text className="text-white font-extrabold"> </Text>
                        <Text className="text-red-500 font-extrabold">To</Text>
                        <Text className="text-white font-extrabold"> </Text>
                        <Text className="text-indigo-500 font-extrabold">Wear</Text>
                    </Text>
                </View>

                <Pressable
                    className={`h-10 w-10 items-center justify-center rounded-full border ${
                        selectedIds.length > 0
                            ? "bg-indigo-600/15 border-indigo-400/40"
                            : "bg-secondary-800/10 border-secondary-200/60 opacity-40"
                    }`}
                    onPress={onNext}
                    disabled={selectedIds.length === 0}
                >
                    <ArrowBigRight size={18} />
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
                <View className="flex-1 bg-secondary-200">
                    {/* Preview */}
                    <View style={{ width: "100%", height: W }}>
                        {preview && (
                            <Image
                                source={{ uri: preview.uri }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                            />
                        )}

                        {/* Camera badge overlay */}
                        <View className="absolute top-3 left-3 flex-row items-center gap-2 rounded-full bg-black/35 px-3 py-2 border border-white/10">
                            <Camera size={16} color="white" />
                            <Text className="text-white text-xs font-semibold">Select</Text>
                        </View>

                        {/* Multi-select count */}
                        <View className="absolute top-3 right-3 rounded-full bg-black/35 px-3 py-2 border border-white/10">
                            <Text className="text-white text-xs font-semibold">
                                {selectedIds.length} selected
                            </Text>
                        </View>
                    </View>

                    <View className="h-3 bg-secondary-200" />

                    {/* Grid */}
                    <FlatList
                        data={gridData}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        extraData={selectedIds}
                        renderItem={({ item }) => {
                            if (item.type === "camera") {
                                return (
                                    <Pressable onPress={onPressCamera}>
                                        <View
                                            style={{
                                                width: SIZE,
                                                height: SIZE,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderWidth: 1,
                                                borderColor: "rgba(120,120,140,0.35)",
                                                backgroundColor: "rgba(255,255,255,0.35)",
                                            }}
                                        >
                                            <View className="h-12 w-12 rounded-full items-center justify-center bg-indigo-600/15 border border-indigo-400/25">
                                                <Camera size={20} color="#5853DB" />
                                            </View>

                                            <Text
                                                style={{
                                                    marginTop: 8,
                                                    fontSize: 12,
                                                    color: "#6B7280",
                                                }}
                                            >
                                                Camera
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            }

                            const isActive = selectedIds.includes(item.id);
                            const idx = selectedIndexMap.get(item.id) ?? 0;

                            return (
                                <GridImageCell
                                    item={item}
                                    size={SIZE}
                                    isActive={isActive}
                                    selectIndex={idx}
                                    onPress={() => toggleSelect(item)}
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
