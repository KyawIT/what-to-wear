import React, { useEffect, useState } from "react";
import { View, FlatList, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import ImagePermissionGate from "@/components/common/ImagePermissionGate";

const W = Dimensions.get("window").width;
const SIZE = W / 3;

const Scan = () => {
    const [permission, requestPermission] = MediaLibrary.usePermissions();
    const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
    const [selected, setSelected] = useState<MediaLibrary.Asset | null>(null);

    useEffect(() => {
        (async () => {
            if (!permission?.granted) return;

            const page = await MediaLibrary.getAssetsAsync({
                mediaType: "photo",
                sortBy: [[MediaLibrary.SortBy.creationTime, false]],
                first: 120,
            });

            setAssets(page.assets);
            setSelected(page.assets[0] ?? null);
        })();
    }, [permission?.granted]);

    return (
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
            <View className="flex-1 bg-secondary-50">
                <View style={{ width: "100%", height: W }}>
                    {selected && (
                        <Image
                            source={{ uri: selected.uri }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                        />
                    )}
                </View>

                <FlatList
                    data={assets}
                    keyExtractor={(a) => a.id}
                    numColumns={3}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => setSelected(item)}>
                            <Image
                                source={{ uri: item.uri }}
                                style={{ width: SIZE, height: SIZE }}
                                contentFit="cover"
                            />
                        </Pressable>
                    )}
                />
            </View>
        </ImagePermissionGate>
    );
}
export default Scan
