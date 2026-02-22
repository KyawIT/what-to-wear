import { Text, ScrollView, View, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { Pressable } from "@/components/ui/pressable";
import { AppHeader } from "@/components/navigation/app-header";
import {
  User,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import { fetchAllOutfits } from "@/api/backend/outfit.api";
import { colors } from "@/lib/theme";
import { getKeycloakAccessToken } from "@/lib/keycloak";

const Profile = () => {
  const { data } = authClient.useSession();
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [outfitsCount, setOutfitsCount] = useState(0);

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMemberSince = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  useEffect(() => {
    if (!data?.user?.id) return;

    (async () => {
      try {
        const accessToken = await getKeycloakAccessToken(data.user.id);
        if (__DEV__) {
          console.log("[Profile] Access token:", accessToken);
        }
        const [allItems, allOutfits] = await Promise.all([
          fetchAllWearables(accessToken),
          fetchAllOutfits(accessToken),
        ]);
        setTotalItemsCount(allItems.length);
        setOutfitsCount(allOutfits.length);
      } catch (err) {
        console.error("Failed to fetch total wearables:", err);
      }
    })();
  }, [data?.user?.id]);

  const settingsItems = [
    { icon: <User size={18} color={colors.secondary} />, label: "Account", route: "/profile/account" as const },
    { icon: <Shield size={18} color={colors.secondary} />, label: "Privacy", route: "/profile/privacy" as const },
    { icon: <HelpCircle size={18} color={colors.secondary} />, label: "Help & Support", route: "/profile/help" as const },
    { icon: <Info size={18} color={colors.secondary} />, label: "About", route: "/profile/about" as const },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <AppHeader title="Profile" titleStyle={styles.headerTitle} />

      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>

        {/* Hero Profile Section */}
        <View style={styles.heroSection}>
          <Avatar size="xl" style={styles.avatar}>
            {data?.user?.image ? (
              <AvatarImage source={{ uri: data.user.image }} />
            ) : (
              <AvatarFallbackText
                style={[styles.avatarFallback, { color: colors.primary }]}
              >
                {data?.user?.name ? getInitials(data.user.name) : "U"}
              </AvatarFallbackText>
            )}
          </Avatar>

          <Text style={styles.name}>
            {data?.user?.name || "User"}
          </Text>
          <Text style={styles.email}>
            {data?.user?.email}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {outfitsCount}
            </Text>
            <Text style={styles.statLabel}>
              Outfits
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {totalItemsCount}
            </Text>
            <Text style={styles.statLabel}>
              Items
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatMemberSince(data?.user?.createdAt)}
            </Text>
            <Text style={styles.statLabel}>
              Member Since
            </Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            GENERAL
          </Text>
        </View>

        <View style={styles.settingsCard}>
          {settingsItems.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && (
                <View
                  style={[styles.settingsDivider, { backgroundColor: colors.border }]}
                />
              )}
              <Pressable
                style={styles.settingsItem}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.settingsItemLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${colors.primary}12` },
                    ]}
                  >
                    {item.icon}
                  </View>
                  <Text style={styles.settingsLabel}>
                    {item.label}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Pressable>
            </React.Fragment>
          ))}
        </View>

        {/* Sign Out */}
        <Pressable style={styles.signOut} onPress={handleFullLogout}>
          <LogOut size={16} color={colors.error} />
          <Text style={styles.signOutText}>
            Sign Out
          </Text>
        </Pressable>

        {/* Footer */}
        <Text style={styles.footer}>
          v1.0.0 · What to Wear
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: "#D4A574",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarFallback: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 32,
  },
  name: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 26,
    marginTop: 16,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 4,
    color: "#9B8B7F",
  },
  divider: {
    height: 1,
    width: 40,
    marginTop: 24,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: "#F0E8DC",
    shadowColor: "#C9BAAA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 20,
    color: "#3D2E22",
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    marginTop: 4,
    color: "#9B8B7F",
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 32,
    alignSelf: "center",
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
    color: "#9B8B7F",
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: "#F0E8DC",
    shadowColor: "#C9BAAA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingsLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#3D2E22",
  },
  settingsDivider: {
    height: 1,
    marginLeft: 64,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    paddingVertical: 8,
  },
  signOutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginLeft: 8,
    color: "#D25037",
  },
  footer: {
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 40,
    color: "#9B8B7F",
    opacity: 0.6,
    letterSpacing: 0.3,
  },
});

export default Profile;
