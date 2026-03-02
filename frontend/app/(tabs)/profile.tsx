import { Text, ScrollView, View, RefreshControl } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { router, useFocusEffect } from "expo-router";
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
import { isAuthError, handleAuthError } from "@/lib/auth-error";
import { useToast, Toast, ToastTitle, ToastDescription } from "@/components/ui/toast";
import PullToRefreshBanner from "@/components/common/PullToRefreshBanner";
import { styles } from "../../styles/screens/tabs/profile.styles";

const Profile = () => {
  const { data } = authClient.useSession();
  const toast = useToast();
  const toastRef = useRef(toast);
  const hasShownStatsErrorRef = useRef(false);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [outfitsCount, setOutfitsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);


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

  const loadStats = useCallback(async () => {
    if (!data?.user?.id) return;
    try {
      const accessToken = await getKeycloakAccessToken(data.user.id);
      const [allItems, allOutfits] = await Promise.all([
        fetchAllWearables(accessToken),
        fetchAllOutfits(accessToken),
      ]);
      setTotalItemsCount(allItems.length);
      setOutfitsCount(allOutfits.length);
      hasShownStatsErrorRef.current = false;
    } catch (err) {
      if (isAuthError(err)) { handleAuthError(); return; }
      if (hasShownStatsErrorRef.current) return;
      hasShownStatsErrorRef.current = true;
      toastRef.current.show({
        render: ({ id: toastId }) => (
          <Toast nativeID={`toast-${toastId}`} action="error">
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Failed to load profile stats</ToastDescription>
          </Toast>
        ),
      });
    }
  }, [data?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadStats();
      await new Promise((resolve) => setTimeout(resolve, 350));
    } finally {
      setRefreshing(false);
    }
  }, [loadStats]);

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
      <PullToRefreshBanner refreshing={refreshing} label="Refreshing your profile stats..." />

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={16}
          />
        }
      >

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

export default Profile;
