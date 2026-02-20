import React, { useEffect, useState } from "react";
import { Text, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Divider } from "@/components/ui/divider";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  User,
  Mail,
  Calendar,
  Fingerprint,
  ShirtIcon,
} from "lucide-react-native";
import { colors } from "@/lib/theme";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import { getKeycloakAccessToken } from "@/lib/keycloak";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <HStack className="items-center py-4">
    <View
      className="h-9 w-9 rounded-full items-center justify-center mr-3"
      style={{ backgroundColor: `${colors.primary}15` }}
    >
      {icon}
    </View>
    <VStack className="flex-1">
      <Text className="text-xs" style={{ color: colors.textMuted }}>
        {label}
      </Text>
      <Text
        className="text-base font-medium mt-0.5"
        style={{ color: colors.textPrimary }}
      >
        {value}
      </Text>
    </VStack>
  </HStack>
);

export default function AccountScreen() {
  const { data } = authClient.useSession();
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (!data?.user?.id) return;
    (async () => {
      try {
        const token = await getKeycloakAccessToken(data.user.id);
        const items = await fetchAllWearables(token);
        setTotalItems(items.length);
      } catch (err) {
        console.error("Failed to fetch wearables:", err);
      }
    })();
  }, [data?.user?.id]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <HStack
        className="h-14 items-center px-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:opacity-60 mr-2"
          style={{ backgroundColor: `${colors.secondary}15` }}
        >
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <Text
          className="text-xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          Account Information
        </Text>
      </HStack>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <Box className="items-center pt-8 pb-4">
          <Avatar
            size="2xl"
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
          <Text
            className="text-lg font-bold mt-4"
            style={{ color: colors.textPrimary }}
          >
            {data?.user?.name || "Unknown"}
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textMuted }}>
            {data?.user?.email || "No email"}
          </Text>
        </Box>

        {/* Account Details Card */}
        <Box
          className="mx-4 mt-4 rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.cardBg }}
        >
          <Box className="px-4 pt-4 pb-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: colors.textMuted }}
            >
              Personal Details
            </Text>
          </Box>

          <Box className="px-4">
            <InfoRow
              icon={<User size={18} color={colors.secondary} />}
              label="Full Name"
              value={data?.user?.name || "Not set"}
            />
            <Divider style={{ backgroundColor: colors.border }} />

            <InfoRow
              icon={<Mail size={18} color={colors.secondary} />}
              label="Email Address"
              value={data?.user?.email || "Not set"}
            />
            <Divider style={{ backgroundColor: colors.border }} />

            <InfoRow
              icon={<Fingerprint size={18} color={colors.secondary} />}
              label="User ID"
              value={
                data?.user?.id
                  ? `${data.user.id.slice(0, 8)}...${data.user.id.slice(-4)}`
                  : "N/A"
              }
            />
            <Divider style={{ backgroundColor: colors.border }} />

            <InfoRow
              icon={<Calendar size={18} color={colors.secondary} />}
              label="Account Created"
              value={
                data?.user?.createdAt
                  ? new Date(data.user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"
              }
            />
          </Box>
        </Box>

        {/* Wardrobe Stats Card */}
        <Box
          className="mx-4 mt-4 mb-8 rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.cardBg }}
        >
          <Box className="px-4 pt-4 pb-2">
            <Text
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: colors.textMuted }}
            >
              Wardrobe Statistics
            </Text>
          </Box>

          <Box className="px-4">
            <InfoRow
              icon={<ShirtIcon size={18} color={colors.secondary} />}
              label="Total Clothing Items"
              value={`${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            />
          </Box>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
