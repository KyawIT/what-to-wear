import React, { useEffect, useState } from "react";
import { Text, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
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
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View>
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        {icon}
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
    {!isLast && <View style={styles.rowDivider} />}
  </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  backButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#8B735512",
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 16,
  },
  avatar: {
    borderWidth: 2,
  },
  avatarFallback: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: "#D4A574",
  },
  userName: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
    color: "#3D2E22",
    marginTop: 16,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#9B8B7F",
    marginTop: 4,
  },
  card: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0E8DC",
    shadowColor: "#C9BAAA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    fontFamily: "PlayfairDisplay_500Medium",
    fontSize: 13,
    color: "#9B8B7F",
    letterSpacing: 0.3,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  cardBody: {
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4A57415",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    color: "#9B8B7F",
    letterSpacing: 0.2,
  },
  infoValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#3D2E22",
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F0E8DC",
    marginLeft: 48,
  },
});
