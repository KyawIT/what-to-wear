import { ImageBackground, Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Button, ButtonText } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { router, useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";

// TODO: Add Screen transition animation
export default function Index() {
    const { data: isAuthenticated } = authClient.useSession();
    const navContainerRef = useNavigationContainerRef();

    useEffect(() => {
        if (isAuthenticated && navContainerRef.isReady()) {
            router.replace({ pathname: "/(tabs)" });
        }
    }, [isAuthenticated, navContainerRef]);

    return (
        <ImageBackground
            source={require("../assets/background/wardrobe.jpg")}
            className="h-screen"
            resizeMode="cover"
        >
            <LinearGradient
                colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']}
                locations={[0, 0.5, 1]}
                style={{
                    ...StyleSheet.absoluteFillObject,
                }}
            />

            <View className="justify-end items-center h-screen-safe px-6 pb-12">
                <View className="w-full max-w-xl">
                    {/* Logo */}
                    <View className="items-center mb-8">
                        <View className="rounded-full bg-white/5 p-1 border border-white/10">
                            <Image
                                source={require("../assets/logo/logo-lg.png")}
                                style={{ width: 100, height: 100 }}
                                contentFit="contain"
                            />
                        </View>
                    </View>

                    {/* Title */}
                    <Text className="text-center text-4xl mb-3 tracking-tight">
                        <Text className="text-white font-extrabold">What</Text>
                        <Text className="text-white font-extrabold"> </Text>
                        <Text className="text-white font-extrabold">To</Text>
                        <Text className="text-white font-extrabold"> </Text>
                        <Text className="text-white font-extrabold">Wear</Text>
                    </Text>

                    {/* Subtitle */}
                    <Text className="text-center text-lg text-white/70 font-normal mb-6">
                        Scan it. Style it. Wear it.
                    </Text>

                    {/* Feature chips */}
                    <View className="flex-row justify-center gap-4 mb-10">
                        <View className="items-center">
                            <View className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-white/20 items-center justify-center mb-2">
                                <Text className="text-2xl">👕</Text>
                            </View>
                            <Text className="text-white/70 text-xs font-medium">Outfit ideas</Text>
                        </View>

                        <View className="items-center">
                            <View className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-white/20 items-center justify-center mb-2">
                                <Text className="text-2xl">🎨</Text>
                            </View>
                            <Text className="text-white/70 text-xs font-medium">Color match</Text>
                        </View>

                        <View className="items-center">
                            <View className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-white/20 items-center justify-center mb-2">
                                <Text className="text-2xl">⚡</Text>
                            </View>
                            <Text className="text-white/70 text-xs font-medium">Fast scan</Text>
                        </View>
                    </View>

                    {/* Login Button */}
                    <View className="w-full space-y-3">
                        <Button
                            action="secondary"
                            size="xl"
                            className="w-full rounded-xl bg-blue-500 border-0 active:opacity-80"
                            onPress={async () =>
                                await authClient.signIn.oauth2({
                                    providerId: "keycloak",
                                    callbackURL: "/",
                                })
                            }
                        >
                            <ButtonText className="w-full text-center text-white font-semibold text-base">
                                Log in
                            </ButtonText>
                        </Button>

                        {/* Terms text */}
                        <Text className="text-center text-white/50 text-xs px-8 leading-5">
                            By continuing, you agree to our{" "}
                            <Text className="text-white/70">Terms of Service</Text>
                            {" "}and{" "}
                            <Text className="text-white/70">Privacy Policy</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
}