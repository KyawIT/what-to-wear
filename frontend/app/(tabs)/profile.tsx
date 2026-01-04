import {Text, ScrollView, FlatList, Dimensions} from 'react-native'
import {Image} from "expo-image"
import React, {useEffect, useState} from 'react'
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ButtonText, Button } from "@/components/ui/button";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Divider } from "@/components/ui/divider";
import { Pressable } from "@/components/ui/pressable";
import {WearableCategory, WearableResponseDto} from "@/api/backend/wearable.model";
import {fetchWearableCategories} from "@/api/backend/category.api";
import {fetchWearablesByCategory} from "@/api/backend/wearable.api";

const Profile = () => {
    const { data } = authClient.useSession();
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [wearables, setWearables] = useState<WearableResponseDto[]>([]);
    const [loadingWearables, setLoadingWearables] = useState(false);

    const ITEM_SIZE = Dimensions.get("window").width / 3;

    const handleFullLogout = async () => {
        const clientId = process.env.EXPO_PUBLIC_KC_CLIENT_ID as string;
        const logoutUrlBase = process.env.EXPO_PUBLIC_KC_LOGOUT_URL as string;
        const redirectUrl = process.env
            .EXPO_PUBLIC_KC_POST_LOGOUT_REDIRECT_URL as string;

        try {
            await authClient.signOut();

            const url =
                logoutUrlBase +
                `?client_id=${encodeURIComponent(clientId)}` +
                `&post_logout_redirect_uri=${encodeURIComponent(redirectUrl)}`;
            try {
                await WebBrowser.openAuthSessionAsync(url, redirectUrl);
            } catch (err) {
                console.warn("Keycloak logout auth session error:", err);
            }
        } finally {
            router.replace("/");
        }
    };

    // Get initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    useEffect(() => {
        (async () => {
            try {
                const cats = await fetchWearableCategories();
                setCategories(cats);
                // Set first category as active by default
                if (cats.length > 0) {
                    setActiveCategory(cats[0]);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        })();
    }, []);

    // Fetch wearables when active category changes
    useEffect(() => {
        if (!activeCategory || !data?.user?.id) return;

        (async () => {
            setLoadingWearables(true);
            try {
                const items = await fetchWearablesByCategory(
                    data.user.id,
                    activeCategory as WearableCategory
                );
                setWearables(items);
            } catch (err) {
                console.error("Failed to fetch wearables:", err);
                setWearables([]);
            } finally {
                setLoadingWearables(false);
            }
        })();
    }, [activeCategory, data?.user?.id]);

    return (
        <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
            {/* Header */}
            <HStack className="h-14 items-center justify-between px-4 border-b border-white/5">
                <Text className="text-white text-xl font-semibold">
                    {data?.user?.name || "Profile"}
                </Text>
            </HStack>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Profile Info Section */}
                <Box className="px-4 pt-6 pb-4">
                    <HStack className="items-center justify-between mb-6">
                        {/* Avatar */}
                        <Avatar size="xl" className="border-2 border-white/10">
                            {data?.user?.image ? (
                                <AvatarImage source={{ uri: data.user.image }} />
                            ) : (
                                <AvatarFallbackText className="text-white font-semibold">
                                    {data?.user?.name ? getInitials(data.user.name) : "U"}
                                </AvatarFallbackText>
                            )}
                        </Avatar>

                        {/* Stats - Placeholder for future features */}
                        <HStack className="flex-1 justify-around ml-8">
                            <VStack className="items-center">
                                <Text className="text-white text-lg font-semibold">0</Text>
                                <Text className="text-white/60 text-sm">Posts</Text>
                            </VStack>
                            <VStack className="items-center">
                                <Text className="text-white text-lg font-semibold">0</Text>
                                <Text className="text-white/60 text-sm">Outfits</Text>
                            </VStack>
                            <VStack className="items-center">
                                <Text className="text-white text-lg font-semibold">0</Text>
                                <Text className="text-white/60 text-sm">Items</Text>
                            </VStack>
                        </HStack>
                    </HStack>

                    {/* Name and Email */}
                    <VStack className="mb-4">
                        <Text className="text-white text-base font-semibold mb-1">
                            {data?.user?.name}
                        </Text>
                        <Text className="text-white/60 text-sm">
                            {data?.user?.email}
                        </Text>
                    </VStack>

                    {/* Edit Profile Button */}
                    <Button
                        variant="outline"
                        size="md"
                        className="rounded-lg bg-transparent border-white/10"
                    >
                        <ButtonText className="text-white font-semibold">
                            Edit Profile
                        </ButtonText>
                    </Button>
                </Box>

                <Divider className="bg-white/5 my-2" />

                {/* Category Tabs - Instagram Style */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="border-b border-white/5"
                >
                    <HStack className="px-4">
                        {categories.map((category) => (
                            <Pressable
                                key={category}
                                onPress={() => setActiveCategory(category)}
                                className="mr-6 pb-3 pt-2"
                            >
                                <VStack className="items-center">
                                    <Text
                                        className={`text-sm font-semibold ${
                                            activeCategory === category
                                                ? "text-white"
                                                : "text-white/40"
                                        }`}
                                    >
                                        {category}
                                    </Text>
                                    {activeCategory === category && (
                                        <Box className="absolute -bottom-0 left-0 right-0 h-0.5 bg-white" />
                                    )}
                                </VStack>
                            </Pressable>
                        ))}
                    </HStack>
                </ScrollView>

                {/* Content for active category */}
                {loadingWearables ? (
                    <Box className="flex-1 items-center justify-center py-20">
                        <Text className="text-white/60 text-base">Loading...</Text>
                    </Box>
                ) : wearables.length === 0 ? (
                    <Box className="flex-1 items-center justify-center py-20">
                        <Text className="text-white/40 text-base">
                            No {activeCategory?.toLowerCase()} items yet
                        </Text>
                        <Text className="text-white/30 text-sm mt-2">
                            Add items to see them here
                        </Text>
                    </Box>
                ) : (
                    <FlatList
                        data={wearables}
                        keyExtractor={(item) => item.id}
                        numColumns={3}
                        scrollEnabled={false}
                        contentContainerStyle={{ gap: 1 }}
                        columnWrapperStyle={{ gap: 1 }}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => {
                                    // TODO: Navigate to detail view
                                    console.log("Clicked wearable:", item.id);
                                }}
                                className="active:opacity-80"
                            >
                                <Box
                                    style={{
                                        width: ITEM_SIZE - 0.67,
                                        height: ITEM_SIZE - 0.67,
                                    }}
                                    className="bg-neutral-900 relative"
                                >
                                    {item.cutoutImageUrl ? (
                                        <>
                                            <Image
                                                source={{ uri: item.cutoutImageUrl }}
                                                style={{ width: "100%", height: "100%" }}
                                                contentFit="cover"
                                            />
                                            {/* Title overlay */}
                                            <Box className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                                <Text
                                                    className="text-white text-xs font-medium"
                                                    numberOfLines={1}
                                                >
                                                    {item.title}
                                                </Text>
                                            </Box>
                                        </>
                                    ) : (
                                        <Box className="flex-1 items-center justify-center">
                                            <Text className="text-white/30 text-xs text-center px-2">
                                                {item.title}
                                            </Text>
                                        </Box>
                                    )}
                                </Box>
                            </Pressable>
                        )}
                    />
                )}

                {/* Settings Section */}
                <Box className="px-4 py-2">
                    <Text className="text-white/40 text-xs font-semibold uppercase tracking-wide mb-3">
                        Settings
                    </Text>

                    {/* Account Info */}
                    <Pressable className="py-4 active:opacity-60">
                        <HStack className="items-center justify-between">
                            <Text className="text-white text-base">Account Information</Text>
                            <Text className="text-white/40 text-lg">›</Text>
                        </HStack>
                    </Pressable>

                    <Divider className="bg-white/5" />

                    {/* Privacy */}
                    <Pressable className="py-4 active:opacity-60">
                        <HStack className="items-center justify-between">
                            <Text className="text-white text-base">Privacy</Text>
                            <Text className="text-white/40 text-lg">›</Text>
                        </HStack>
                    </Pressable>

                    <Divider className="bg-white/5" />

                    {/* Help */}
                    <Pressable className="py-4 active:opacity-60">
                        <HStack className="items-center justify-between">
                            <Text className="text-white text-base">Help & Support</Text>
                            <Text className="text-white/40 text-lg">›</Text>
                        </HStack>
                    </Pressable>

                    <Divider className="bg-white/5" />

                    {/* About */}
                    <Pressable className="py-4 active:opacity-60">
                        <HStack className="items-center justify-between">
                            <Text className="text-white text-base">About</Text>
                            <Text className="text-white/40 text-lg">›</Text>
                        </HStack>
                    </Pressable>
                </Box>

                <Divider className="bg-white/5 my-2" />

                {/* Logout Button */}
                <Box className="px-4 py-6">
                    <Button
                        size="lg"
                        onPress={handleFullLogout}
                        className="rounded-xl bg-transparent border border-red-500/30"
                    >
                        <ButtonText className="text-red-400 font-semibold">
                            Log Out
                        </ButtonText>
                    </Button>
                </Box>

                {/* Account Details Footer */}
                <Box className="px-4 pb-8">
                    <Text className="text-white/30 text-xs text-center mb-2">
                        Account created on {data?.user?.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : "N/A"}
                    </Text>
                    <Text className="text-white/20 text-xs text-center">
                        User ID: {data?.user?.id?.slice(0, 8)}...
                    </Text>
                </Box>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Profile