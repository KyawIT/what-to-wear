import { Text, View, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { authClient } from "@/lib/auth-client";
import { router, useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MASCOT_WIDTH = Math.min(SCREEN_WIDTH * 0.65, 280);
const MASCOT_HEIGHT = MASCOT_WIDTH * 1.22;

export default function Index() {
  const { data: isAuthenticated } = authClient.useSession();
  const navContainerRef = useNavigationContainerRef();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isAuthenticated && navContainerRef.isReady()) {
      router.replace({ pathname: "/(tabs)" });
    }
  }, [isAuthenticated, navContainerRef]);

  return (
    <View className="flex-1 bg-background-50">
      <ScrollView
        contentContainerClassName="flex-grow"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mascot Hero */}
        <View className="items-center mb-6">
          <View
            style={{
              width: MASCOT_WIDTH + 60,
              height: MASCOT_WIDTH + 60,
              borderRadius: (MASCOT_WIDTH + 60) / 2,
              backgroundColor: "#F0E8DC",
              position: "absolute",
              top: (MASCOT_HEIGHT - MASCOT_WIDTH - 60) / 2 + 20,
              opacity: 0.4,
            }}
          />

          <Image
            source={require("../assets/logo/logo-5xl.png")}
            style={{
              width: MASCOT_WIDTH,
              height: MASCOT_HEIGHT,
            }}
            contentFit="contain"
          />
        </View>

        {/* Brand Name */}
        <View className="items-center mb-2">
          <Text
            style={{
              fontFamily: "PlayfairDisplay_600SemiBold",
              fontSize: 36,
              color: colors.textPrimary,
              letterSpacing: -0.5,
            }}
          >
            What to Wear
          </Text>
        </View>

        {/* Tagline */}
        <View className="items-center mb-10">
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: colors.textMuted,
              letterSpacing: 0.2,
            }}
          >
            Your personal wardrobe curator
          </Text>
        </View>

        {/* Feature Card */}
        <View className="px-6 mb-10">
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 20,
              padding: 20,
              shadowColor: "#C9BAAA",
              shadowOpacity: 0.1,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
              borderWidth: 1,
              borderColor: "#F0E8DC",
            }}
          >
            <View className="flex-row items-center mb-4">
              <Image
                source={require("../assets/logo/logo-3xl.png")}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                contentFit="cover"
              />
              <Text
                style={{
                  fontFamily: "PlayfairDisplay_500Medium",
                  fontSize: 15,
                  color: colors.textPrimary,
                  marginLeft: 12,
                }}
              >
                Let me help you get dressed
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: "#F0E8DC", marginBottom: 16 }} />

            <View className="flex-row justify-around">
              <View className="items-center">
                <Text style={{ fontSize: 20, marginBottom: 6 }}>👕</Text>
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.textSecondary }}>
                  Organize
                </Text>
              </View>
              <View className="items-center">
                <Text style={{ fontSize: 20, marginBottom: 6 }}>✨</Text>
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.textSecondary }}>
                  Style
                </Text>
              </View>
              <View className="items-center">
                <Text style={{ fontSize: 20, marginBottom: 6 }}>📸</Text>
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.textSecondary }}>
                  Scan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Spacer */}
        <View className="flex-1 min-h-4" />

        {/* CTA */}
        <View className="px-6">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () =>
              await authClient.signIn.oauth2({
                providerId: "keycloak",
                callbackURL: "/",
              })
            }
            style={{
              width: "100%",
              height: 52,
              borderRadius: 26,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.textPrimary,
              shadowColor: colors.textPrimary,
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 15,
                color: "#FAF7F2",
                letterSpacing: 0.5,
              }}
            >
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={async () =>
              await authClient.signIn.oauth2({
                providerId: "keycloak",
                callbackURL: "/",
              })
            }
            className="mt-4"
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                color: colors.textMuted,
                textAlign: "center",
              }}
            >
              Already have an account?{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.textPrimary }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 11,
              color: colors.textMuted,
              textAlign: "center",
              marginTop: 16,
              opacity: 0.6,
            }}
          >
            Terms & Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
