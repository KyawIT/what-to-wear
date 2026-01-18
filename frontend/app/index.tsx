import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { authClient } from "@/lib/auth-client";
import { router, useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { WardrobeIllustration } from "@/components/illustrations/WardrobeIllustration";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
      <LinearGradient
        colors={["#FAF7F2", "#F5EFE6", "#FAF7F2"]}
        locations={[0, 0.5, 1]}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6"
          contentContainerStyle={{
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Illustration */}
          <View className="items-center mb-8">
            <View className="bg-background-0 rounded-3xl p-5 shadow-lg">
              <WardrobeIllustration
                width={260}
                height={200}
                primaryColor="#D4A574"
                secondaryColor="#8B7355"
                accentColor="#4A3728"
              />
            </View>
          </View>

          {/* Logo */}
          <View className="items-center mb-4">
            <View className="rounded-full bg-background-0 p-1 border-2 border-outline-200">
              <Image
                source={require("../assets/logo/logo-lg.png")}
                style={{
                  width: 100,
                  height: 100,
                }}
                contentFit="contain"
              />
            </View>
          </View>

          {/* Title */}
          <Text className="text-center text-4xl font-extrabold mb-2 tracking-tight text-typography-800">
            What To Wear
          </Text>

          {/* Subtitle */}
          <Text className="text-center text-base mb-8 leading-6 text-typography-600">
            Your personal wardrobe assistant.{"\n"}Scan it, Style it, Wear it.
          </Text>

          {/* Feature cards */}
          <View className="flex-row justify-center gap-4 mb-10">
            {/* Organize Card */}
            <View className="items-center bg-background-0 py-4 px-3 rounded-2xl w-24 border border-outline-200">
              <View className="h-12 w-12 rounded-full items-center justify-center mb-2 bg-primary-100">
                <Text className="text-2xl">👕</Text>
              </View>
              <Text className="text-xs font-semibold text-center text-typography-800">
                Organize
              </Text>
            </View>

            {/* Style Card */}
            <View className="items-center bg-background-0 py-4 px-3 rounded-2xl w-24 border border-outline-200">
              <View className="h-12 w-12 rounded-full items-center justify-center mb-2 bg-secondary-100">
                <Text className="text-2xl">✨</Text>
              </View>
              <Text className="text-xs font-semibold text-center text-typography-800">
                Style
              </Text>
            </View>

            {/* Scan Card */}
            <View className="items-center bg-background-0 py-4 px-3 rounded-2xl w-24 border border-outline-200">
              <View className="h-12 w-12 rounded-full items-center justify-center mb-2 bg-tertiary-100">
                <Text className="text-2xl">📷</Text>
              </View>
              <Text className="text-xs font-semibold text-center text-typography-800">
                Scan
              </Text>
            </View>
          </View>

          {/* Spacer */}
          <View className="flex-1 min-h-8" />

          {/* Login Button */}
          <View className="w-full max-w-md self-center">
            <TouchableOpacity
              activeOpacity={0.8}
              className="w-full h-14 rounded-2xl items-center justify-center shadow-lg bg-primary-500"
              onPress={async () =>
                await authClient.signIn.oauth2({
                  providerId: "keycloak",
                  callbackURL: "/",
                })
              }
            >
              <Text className="text-typography-0 font-bold text-lg">Get Started</Text>
            </TouchableOpacity>

            {/* Secondary action */}
            <Text className="text-center text-sm mt-4 px-5 leading-5 text-typography-400">
              By continuing, you agree to our{" "}
              <Text className="font-medium text-typography-600">
                Terms of Service
              </Text>
              {" "}and{" "}
              <Text className="font-medium text-typography-600">
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
