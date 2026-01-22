import { Text, ScrollView, View } from "react-native";
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
} from "lucide-react-native";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import { colors } from "@/lib/theme";

const Profile = () => {
  const { data } = authClient.useSession();
  const [totalItemsCount, setTotalItemsCount] = useState(0);

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
    if (!data?.user?.id) return;

    (async () => {
      try {
        const allItems = await fetchAllWearables(data.user.id);
        setTotalItemsCount(allItems.length);
      } catch (err) {
        console.error("Failed to fetch total wearables:", err);
      }
    })();
  }, [data?.user?.id]);

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
                  {totalItemsCount}
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

        </Box>

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
