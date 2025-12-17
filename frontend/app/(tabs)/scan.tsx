import React, {useEffect, useState} from "react";
import {View, FlatList, Pressable, Dimensions, StyleSheet, Text} from "react-native";
import {Image} from "expo-image";
import * as MediaLibrary from "expo-media-library";
import ImagePermissionGate from "@/components/common/ImagePermissionGate";
import {SafeAreaView} from "react-native-safe-area-context";
import {router} from "expo-router";
import {X, ArrowBigRight} from "lucide-react-native";

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
        <SafeAreaView className={"flex-1 bg-secondary-100"} edges={["top"]}>
            <View className="h-16 border-b border-secondary-200 flex-row items-center justify-between px-4">

                <Pressable
                    className="h-10 w-10 items-center justify-center rounded-full
                     bg-secondary-800/10 border border-secondary-200/60"
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
                    className="h-10 w-10 items-center justify-center rounded-full
                     bg-secondary-800/10 border border-secondary-200/60"
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
                        style={{width: 72, height: 72}}
                        contentFit="contain"
                    />
                }
            >
                <View className="flex-1 bg-secondary-200">
                    <View style={{width: "100%", height: W}}>
                        {selected && (
                            <Image
                                source={{uri: selected.uri}}
                                style={{width: "100%", height: "100%"}}
                                contentFit="cover"
                            />
                        )}
                    </View>
                    <View className={"h-[4%] bg-secondary-200"}></View>
                    <FlatList
                        data={assets}
                        keyExtractor={(a) => a.id}
                        numColumns={3}
                        extraData={selected?.id}
                        renderItem={({item}) => {
                            const active = selected?.id === item.id;

                            return (
                                <Pressable onPress={() => setSelected(item)}>
                                    <View
                                        style={{
                                            width: SIZE,
                                            height: SIZE,
                                            borderWidth: active ? 2 : 0,
                                            borderColor: active ? "#347cf1" : "transparent",
                                        }}
                                    >
                                        <Image
                                            source={{uri: item.uri}}
                                            style={{width: "100%", height: "100%"}}
                                            contentFit="cover"
                                        />

                                        {active && (
                                            <View
                                                style={[
                                                    StyleSheet.absoluteFillObject,
                                                    {backgroundColor: "rgba(59,130,246,0.12)"},
                                                ]}
                                            />
                                        )}
                                    </View>
                                </Pressable>
                            );
                        }}
                    />
                </View>
            </ImagePermissionGate>
        </SafeAreaView>
    );
};

export default Scan;
