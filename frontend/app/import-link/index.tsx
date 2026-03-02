import React, { useState, useEffect } from "react";
import {
  View,
  Pressable,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FocusTextInput } from "@/components/focus-input";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { X, Link, Clipboard, ExternalLink } from "lucide-react-native";
import * as ExpoClipboard from "expo-clipboard";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { AppHeader } from "@/components/navigation/app-header";
import ImportLoadingState from "@/components/common/ImportLoadingState";
import { authClient } from "@/lib/auth-client";
import { colors } from "@/lib/theme";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { isAuthError, handleAuthError } from "@/lib/auth-error";
import {
  detectVendor,
  scrapeLink,
  mapToPreviewData,
  VendorSource,
  ScrapedPreviewData,
} from "@/api/backend/scraper.api";
import { s } from "../../styles/screens/import-link/index.styles";

const VENDOR_LABELS: Record<VendorSource, string> = {
  zalando: "Zalando",
  pinterest: "Pinterest",
};

const VENDOR_COLORS: Record<VendorSource, string> = {
  zalando: "#FF6900",
  pinterest: "#E60023",
};

// ── Vendor Logos ──────────────────────────────────────────────────

const VENDOR_LOGOS: Record<VendorSource, number> = {
  zalando: require("@/assets/vendors/zalando-logo.png"),
  pinterest: require("@/assets/vendors/pinterest-logo.png"),
};

const SQUIRCLE_SIZE = 72;

function VendorSquircle({ vendor }: { vendor: VendorSource }) {
  return (
    <VStack className="items-center" style={{ width: SQUIRCLE_SIZE + 16 }}>
      <View
        style={{
          width: SQUIRCLE_SIZE,
          height: SQUIRCLE_SIZE,
          borderRadius: 18,
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image source={VENDOR_LOGOS[vendor]} style={{ width: 36, height: 36 }} contentFit="contain" />
      </View>
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 6,
        }}
      >
        {VENDOR_LABELS[vendor]}
      </Text>
    </VStack>
  );
}

export default function ImportLinkScreen() {
  const { data } = authClient.useSession();
  const { sharedUrl } = useLocalSearchParams<{ sharedUrl?: string }>();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sharedUrl) setUrl(sharedUrl);
  }, [sharedUrl]);

  const detectedVendor = url.trim() ? detectVendor(url.trim()) : null;

  const handlePaste = async () => {
    const text = await ExpoClipboard.getStringAsync();
    if (text) {
      setUrl(text);
      setError(null);
    }
  };

  const handleImport = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter a URL");
      return;
    }

    const vendor = detectVendor(trimmedUrl);
    if (!vendor) {
      setError("Unsupported vendor. We support Zalando and Pinterest links.");
      return;
    }

    if (!data?.user?.id) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accessToken = await getKeycloakAccessToken(data.user.id);
      const response = await scrapeLink(vendor, trimmedUrl, accessToken);
      const preview = mapToPreviewData(vendor, response);

      if (!preview.imageUrl && (!preview.images || preview.images.length === 0)) {
        setError("No images found for this product. Try a different link.");
        return;
      }

      navigateToPreview(preview, preview.imageUrl);
    } catch (e) {
      if (isAuthError(e)) { handleAuthError(); return; }
      const msg = e instanceof Error ? e.message : "Failed to scrape link. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPreview = (data: ScrapedPreviewData, imageUrl: string) => {
    router.push({
      pathname: "/preview",
      params: {
        uri: imageUrl,
        prefillName: data.name,
        prefillDescription: data.description,
        prefillTags: JSON.stringify(data.tags),
        prefillSource: data.vendor,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AppHeader
          title="Import from Link"
          titleStyle={s.headerTitle}
          left={
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-60"
            >
              <HStack className="items-center">
                <X size={20} color={colors.textSecondary} />
                <Text style={s.cancelText}>Cancel</Text>
              </HStack>
            </Pressable>
          }
        />

        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Header section */}
          <VStack className="items-center pt-6 pb-6">
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: `${colors.primary}20`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Link size={28} color={colors.primary} />
            </View>
            <Text style={s.sectionTitle}>Paste a Product Link</Text>
            <Text style={s.sectionSubtitle}>
              Import clothing from Zalando or Pinterest
            </Text>
          </VStack>

          {/* URL Input */}
          <Box
            className="rounded-xl overflow-hidden mb-3"
            style={{
              backgroundColor: colors.cardBg,
              borderWidth: 1,
              borderColor: detectedVendor
                ? VENDOR_COLORS[detectedVendor] + "60"
                : colors.border,
            }}
          >
            <HStack className="items-center px-4 py-3">
              <ExternalLink size={18} color={colors.textMuted} />
              <FocusTextInput
                value={url}
                onChangeText={(t: string) => {
                  setUrl(t);
                  setError(null);
                }}
                placeholder="https://www.zalando.at/..."
                placeholderTextColor={colors.textMuted}
                style={[s.urlInput, { marginLeft: 10 }]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                label="Product URL"
              />
              <Pressable onPress={handlePaste} className="ml-2 active:opacity-60">
                <HStack className="items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: `${colors.primary}15` }}>
                  <Clipboard size={14} color={colors.primary} />
                  <Text style={[s.pasteText, { marginLeft: 4 }]}>Paste</Text>
                </HStack>
              </Pressable>
            </HStack>
          </Box>

          {/* Vendor badge */}
          {detectedVendor && !loading && (
            <HStack className="items-center mb-4 ml-1">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: VENDOR_COLORS[detectedVendor],
                }}
              />
              <Text
                style={[
                  s.vendorBadgeText,
                  { color: VENDOR_COLORS[detectedVendor] },
                ]}
              >
                {VENDOR_LABELS[detectedVendor]} detected
              </Text>
            </HStack>
          )}

          {/* Error */}
          {error && (
            <Box
              className="rounded-xl px-4 py-3 mb-4"
              style={{
                backgroundColor: colors.errorLight,
                borderWidth: 1,
                borderColor: `${colors.error}30`,
              }}
            >
              <Text style={s.errorText}>{error}</Text>
            </Box>
          )}

          {/* Loading */}
          {loading && <ImportLoadingState />}

          {/* Import button */}
          {!loading && (
            <Pressable
              onPress={handleImport}
              disabled={!url.trim() || loading}
              className="rounded-xl py-4 items-center active:opacity-80"
              style={{
                backgroundColor:
                  url.trim() && detectedVendor ? colors.primary : "#E8DED3",
              }}
            >
              <Text
                style={
                  url.trim() && detectedVendor
                    ? s.importButtonText
                    : s.importButtonDisabledText
                }
              >
                Import
              </Text>
            </Pressable>
          )}

          {/* Supported vendors */}
          {!loading && (
            <VStack className="items-center mt-6">
              <Text style={s.supportedLabel}>Supported stores</Text>
              <HStack className="mt-3" style={{ gap: 16 }}>
                {(["zalando", "pinterest"] as VendorSource[]).map((v) => (
                  <VendorSquircle key={v} vendor={v} />
                ))}
              </HStack>
            </VStack>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
