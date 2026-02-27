import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { X, Link, Clipboard, ExternalLink } from "lucide-react-native";
import Svg, { Path, Circle, G } from "react-native-svg";
import * as ExpoClipboard from "expo-clipboard";

import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { AppHeader } from "@/components/navigation/app-header";
import { authClient } from "@/lib/auth-client";
import { colors } from "@/lib/theme";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import {
  detectVendor,
  scrapeLink,
  mapToPreviewData,
  VendorSource,
  ScrapedPreviewData,
} from "@/api/backend/scraper.api";
import { s } from "../../styles/screens/import-link/index.styles";

const W = Dimensions.get("window").width;
const IMAGE_SIZE = (W - 48 - 16) / 3; // 3 columns with padding and gaps

const VENDOR_LABELS: Record<VendorSource, string> = {
  hm: "H&M",
  zalando: "Zalando",
  pinterest: "Pinterest",
};

const VENDOR_COLORS: Record<VendorSource, string> = {
  hm: "#E50010",
  zalando: "#FF6900",
  pinterest: "#E60023",
};

// ── Vendor SVG Logos ───────────────────────────────────────────────

function HmLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G fill="#E50010">
        <Path d="M10 20 L10 80 L25 80 L25 55 L40 55 L40 80 L55 80 L55 20 L40 20 L40 45 L25 45 L25 20 Z" />
        <Path d="M58 55 L58 80 L70 80 L70 40 L78 55 L70 40 L82 20 L70 20 L64 35 L58 20 L46 20 L58 42 Z" opacity={0} />
        <Path d="M62 20 L62 80 L74 80 L74 55 L78 55 L82 80 L94 80 L88 52 C92 48 94 42 94 36 C94 26 88 20 78 20 Z M74 32 L78 32 C82 32 83 34 83 37 C83 40 82 43 78 43 L74 43 Z" transform="translate(-2,0)" />
      </G>
    </Svg>
  );
}

function ZalandoLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M50 10 C28 10 10 28 10 50 C10 72 28 90 50 90 C72 90 90 72 90 50 C90 28 72 10 50 10 Z M65 68 L35 68 L35 62 L55 38 L35 38 L35 32 L65 32 L65 38 L45 62 L65 62 Z"
        fill="#FF6900"
      />
    </Svg>
  );
}

function PinterestLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="40" fill="#E60023" />
      <Path
        d="M50 25 C38 25 30 33 30 43 C30 49 33 54 38 56 C38.5 54 38 52 38 51 C38 51 35 43 35 43 C35 35 41 30 50 30 C57 30 63 34 63 42 C63 52 58 60 52 60 C49 60 47 58 48 55 C49 51 51 47 51 44 C51 42 50 40 48 40 C45 40 43 43 43 47 C43 49 44 51 44 51 L40 68 C39 72 40 78 40 78 C40 78 40 78 41 78 C41 78 44 71 45 67 L48 56 C50 59 53 61 57 61 C66 61 72 53 72 42 C72 32 63 25 50 25 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

const VENDOR_LOGOS: Record<VendorSource, (props: { size?: number }) => React.ReactElement> = {
  hm: HmLogo,
  zalando: ZalandoLogo,
  pinterest: PinterestLogo,
};

const SQUIRCLE_SIZE = 72;

function VendorSquircle({ vendor }: { vendor: VendorSource }) {
  const Logo = VENDOR_LOGOS[vendor];
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
        <Logo size={36} />
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

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedPreviewData | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const detectedVendor = url.trim() ? detectVendor(url.trim()) : null;

  const handlePaste = async () => {
    const text = await ExpoClipboard.getStringAsync();
    if (text) {
      setUrl(text);
      setError(null);
      setScrapedData(null);
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
      setError("Unsupported vendor. We support H&M, Zalando, and Pinterest links.");
      return;
    }

    if (!data?.user?.id) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError(null);
    setScrapedData(null);

    try {
      const accessToken = await getKeycloakAccessToken(data.user.id);
      const response = await scrapeLink(vendor, trimmedUrl, accessToken);
      const preview = mapToPreviewData(vendor, response);

      if (!preview.imageUrl && (!preview.images || preview.images.length === 0)) {
        setError("No images found for this product. Try a different link.");
        return;
      }

      setScrapedData(preview);
      setSelectedImageIndex(0);

      // If not H&M with multiple images, navigate directly
      if (vendor !== "hm" || !preview.images || preview.images.length <= 1) {
        navigateToPreview(preview, preview.imageUrl);
      }
    } catch (e) {
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

  const handleContinueWithImage = () => {
    if (!scrapedData) return;
    const imageUrl = scrapedData.images?.[selectedImageIndex] ?? scrapedData.imageUrl;
    navigateToPreview(scrapedData, imageUrl);
  };

  const showImagePicker =
    scrapedData?.vendor === "hm" &&
    scrapedData.images &&
    scrapedData.images.length > 1;

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
              Import clothing from H&M, Zalando, or Pinterest
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
              <TextInput
                value={url}
                onChangeText={(t) => {
                  setUrl(t);
                  setError(null);
                  setScrapedData(null);
                }}
                placeholder="https://www.zalando.at/..."
                placeholderTextColor={colors.textMuted}
                style={[s.urlInput, { marginLeft: 10 }]}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleImport}
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
          {loading && (
            <VStack className="items-center py-10">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={s.loadingText}>
                Fetching product details...
              </Text>
            </VStack>
          )}

          {/* H&M Image Picker */}
          {showImagePicker && (
            <VStack className="mt-2">
              <Text style={s.imagePickerTitle}>Select an Image</Text>
              <Text style={s.imagePickerSubtitle}>
                {scrapedData!.images!.length} images available - tap to select
              </Text>

              <FlatList
                data={scrapedData!.images!}
                keyExtractor={(_, i) => String(i)}
                numColumns={3}
                style={{ marginTop: 12 }}
                columnWrapperStyle={{ gap: 8 }}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item, index }) => {
                  const isSelected = index === selectedImageIndex;
                  return (
                    <Pressable onPress={() => setSelectedImageIndex(index)}>
                      <View
                        style={{
                          width: IMAGE_SIZE,
                          height: IMAGE_SIZE,
                          borderRadius: 12,
                          overflow: "hidden",
                          borderWidth: isSelected ? 3 : 1,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        }}
                      >
                        <Image
                          source={{ uri: item }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      </View>
                    </Pressable>
                  );
                }}
              />

              <Pressable
                onPress={handleContinueWithImage}
                className="rounded-xl py-4 items-center active:opacity-80 mt-4"
                style={{ backgroundColor: colors.primary }}
              >
                <Text style={s.continueText}>Continue</Text>
              </Pressable>
            </VStack>
          )}

          {/* Import button - only show when no image picker is visible */}
          {!showImagePicker && !loading && (
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
          {!loading && !showImagePicker && (
            <VStack className="items-center mt-6">
              <Text style={s.supportedLabel}>Supported stores</Text>
              <HStack className="mt-3" style={{ gap: 16 }}>
                {(["hm", "zalando", "pinterest"] as VendorSource[]).map((v) => (
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
