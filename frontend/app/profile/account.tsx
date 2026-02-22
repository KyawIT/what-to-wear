import React, { useEffect, useState } from "react";
import { Text, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import InfoRow from "@/components/common/InfoRow";
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
import { styles } from "../../styles/screens/profile/account.styles";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <AppHeader
        title="Account"
        titleStyle={styles.headerTitle}
        left={(
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={22} color={colors.textSecondary} />
          </Pressable>
        )}
      />

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Avatar
            size="2xl"
            style={[styles.avatar, { borderColor: colors.border }]}
          >
            {data?.user?.image ? (
              <AvatarImage source={{ uri: data.user.image }} />
            ) : (
              <AvatarFallbackText style={styles.avatarFallback}>
                {data?.user?.name ? getInitials(data.user.name) : "U"}
              </AvatarFallbackText>
            )}
          </Avatar>
          <Text style={styles.userName}>
            {data?.user?.name || "Unknown"}
          </Text>
          <Text style={styles.userEmail}>
            {data?.user?.email || "No email"}
          </Text>
        </View>

        {/* Personal Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Personal Details</Text>
          <View style={styles.cardBody}>
            <InfoRow
              icon={<User size={18} color={colors.secondary} />}
              label="Full Name"
              value={data?.user?.name || "Not set"}
            />
            <InfoRow
              icon={<Mail size={18} color={colors.secondary} />}
              label="Email Address"
              value={data?.user?.email || "Not set"}
            />
            <InfoRow
              icon={<Fingerprint size={18} color={colors.secondary} />}
              label="User ID"
              value={
                data?.user?.id
                  ? `${data.user.id.slice(0, 8)}...${data.user.id.slice(-4)}`
                  : "N/A"
              }
            />
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
              isLast
            />
          </View>
        </View>

        {/* Wardrobe Stats Card */}
        <View style={[styles.card, { marginBottom: 40 }]}>
          <Text style={styles.cardHeader}>Wardrobe</Text>
          <View style={styles.cardBody}>
            <InfoRow
              icon={<ShirtIcon size={18} color={colors.secondary} />}
              label="Total Clothing Items"
              value={`${totalItems} item${totalItems !== 1 ? "s" : ""}`}
              isLast
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

