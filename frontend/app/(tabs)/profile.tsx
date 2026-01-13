import { Text, ScrollView, FlatList, Dimensions, View } from "react-native";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
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
import {
  Settings,
  User,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Shirt,
} from "lucide-react-native";
import { WearableCategory, WearableResponseDto } from "@/api/backend/wearable.model";
import { fetchWearableCategories } from "@/api/backend/category.api";
import { fetchWearablesByCategory } from "@/api/backend/wearable.api";

// Beige theme colors
const colors = {
  background: "#FAF7F2",
  backgroundSecondary: "#F5EFE6",
  primary: "#D4A574",
  secondary: "#8B7355",
  accent: "#4A3728",
  textPrimary: "#3D2E22",
  textSecondary: "#6B5B4F",
  textMuted: "#9B8B7F",
  border: "#E8DED3",
  cardBg: "#FFFFFF",
  error: "#C75050",
};

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
      .split(" ")
      .map((n) => n[0])
      .join("")
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

  const SettingsItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress?: () => void;
  }) => (
    <Pressable
      className="py-4 active:opacity-60"
      onPress={onPress}
    >
      <HStack className="items-center justify-between">
        <HStack className="items-center">
          <View
            className="h-9 w-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            {icon}
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{label}</Text>
        </HStack>
        <ChevronRight size={20} color={colors.textMuted} />
      </HStack>
    </Pressable>
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <HStack
        className="h-14 items-center justify-between px-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <Text
          className="text-xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          {data?.user?.name || "Profile"}
        </Text>
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
          style={{ backgroundColor: `${colors.secondary}15` }}
        >
          <Settings size={20} color={colors.textSecondary} />
        </Pressable>
      </HStack>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Info Section */}
        <Box className="px-4 pt-6 pb-4">
          <HStack className="items-center justify-between mb-6">
            {/* Avatar */}
            <Avatar
              size="xl"
              className="border-3"
              style={{ borderColor: colors.primary, borderWidth: 3 }}
            >
              {data?.user?.image ? (
                <AvatarImage source={{ uri: data.user.image }} />
              ) : (
                <AvatarFallbackText
                  className="font-semibold"
                  style={{ color: colors.primary }}
                >
                  {data?.user?.name ? getInitials(data.user.name) : "U"}
                </AvatarFallbackText>
              )}
            </Avatar>

            {/* Stats */}
            <HStack className="flex-1 justify-around ml-6">
              <VStack className="items-center">
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  0
                </Text>
                <Text className="text-sm" style={{ color: colors.textMuted }}>
                  Posts
                </Text>
              </VStack>
              <VStack className="items-center">
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  0
                </Text>
                <Text className="text-sm" style={{ color: colors.textMuted }}>
                  Outfits
                </Text>
              </VStack>
              <VStack className="items-center">
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {wearables.length}
                </Text>
                <Text className="text-sm" style={{ color: colors.textMuted }}>
                  Items
                </Text>
              </VStack>
            </HStack>
          </HStack>

          {/* Name and Email */}
          <VStack className="mb-4">
            <Text
              className="text-base font-semibold mb-1"
              style={{ color: colors.textPrimary }}
            >
              {data?.user?.name}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {data?.user?.email}
            </Text>
          </VStack>

          {/* Edit Profile Button */}
          <Pressable
            className="h-11 rounded-xl items-center justify-center active:opacity-80"
            style={{
              backgroundColor: colors.cardBg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className="font-semibold"
              style={{ color: colors.textPrimary }}
            >
              Edit Profile
            </Text>
          </Pressable>
        </Box>

        {/* Category Tabs */}
        <View style={{ backgroundColor: colors.cardBg }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <HStack className="px-4">
              {categories.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  className="mr-6 pb-3 pt-3"
                >
                  <VStack className="items-center relative">
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color:
                          activeCategory === category
                            ? colors.primary
                            : colors.textMuted,
                      }}
                    >
                      {category}
                    </Text>
                    {activeCategory === category && (
                      <View
                        className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                    )}
                  </VStack>
                </Pressable>
              ))}
            </HStack>
          </ScrollView>
        </View>

        {/* Content for active category */}
        {loadingWearables ? (
          <Box
            className="items-center justify-center py-20"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Text className="text-base" style={{ color: colors.textMuted }}>
              Loading...
            </Text>
          </Box>
        ) : wearables.length === 0 ? (
          <Box
            className="items-center justify-center py-16"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <View
              className="h-20 w-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Shirt size={36} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text className="text-base mb-1" style={{ color: colors.textSecondary }}>
              No {activeCategory?.toLowerCase()} items yet
            </Text>
            <Text className="text-sm" style={{ color: colors.textMuted }}>
              Add items to see them here
            </Text>
          </Box>
        ) : (
          <FlatList
            data={wearables}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            style={{ backgroundColor: colors.backgroundSecondary }}
            contentContainerStyle={{ gap: 2 }}
            columnWrapperStyle={{ gap: 2 }}
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
                    width: ITEM_SIZE - 1.33,
                    height: ITEM_SIZE - 1.33,
                    backgroundColor: colors.cardBg,
                  }}
                  className="relative overflow-hidden"
                >
                  {item.cutoutImageUrl ? (
                    <>
                      <Image
                        source={{ uri: item.cutoutImageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      {/* Title overlay */}
                      <Box
                        className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                        style={{ backgroundColor: `${colors.accent}CC` }}
                      >
                        <Text
                          className="text-xs font-medium text-white"
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                      </Box>
                    </>
                  ) : (
                    <Box className="flex-1 items-center justify-center">
                      <Shirt size={24} color={colors.textMuted} />
                      <Text
                        className="text-xs text-center px-2 mt-2"
                        style={{ color: colors.textMuted }}
                        numberOfLines={2}
                      >
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
        <Box
          className="mx-4 mt-6 rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.cardBg }}
        >
          <Box className="px-4 pt-4 pb-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: colors.textMuted }}
            >
              Settings
            </Text>
          </Box>

          <Box className="px-4">
            <SettingsItem
              icon={<User size={18} color={colors.secondary} />}
              label="Account Information"
            />
            <Divider style={{ backgroundColor: colors.border }} />

            <SettingsItem
              icon={<Shield size={18} color={colors.secondary} />}
              label="Privacy"
            />
            <Divider style={{ backgroundColor: colors.border }} />

            <SettingsItem
              icon={<HelpCircle size={18} color={colors.secondary} />}
              label="Help & Support"
            />
            <Divider style={{ backgroundColor: colors.border }} />

            <SettingsItem
              icon={<Info size={18} color={colors.secondary} />}
              label="About"
            />
          </Box>
        </Box>

        {/* Logout Button */}
        <Box className="px-4 py-6">
          <Pressable
            className="h-12 rounded-xl items-center justify-center flex-row active:opacity-80"
            style={{
              backgroundColor: `${colors.error}10`,
              borderWidth: 1,
              borderColor: `${colors.error}30`,
            }}
            onPress={handleFullLogout}
          >
            <LogOut size={18} color={colors.error} />
            <Text
              className="font-semibold ml-2"
              style={{ color: colors.error }}
            >
              Log Out
            </Text>
          </Pressable>
        </Box>

        {/* Account Details Footer */}
        <Box className="px-4 pb-8">
          <Text
            className="text-xs text-center mb-2"
            style={{ color: colors.textMuted }}
          >
            Account created on{" "}
            {data?.user?.createdAt
              ? new Date(data.user.createdAt).toLocaleDateString()
              : "N/A"}
          </Text>
          <Text
            className="text-xs text-center"
            style={{ color: `${colors.textMuted}80` }}
          >
            User ID: {data?.user?.id?.slice(0, 8)}...
          </Text>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
