import {ImageBackground, Text, View} from "react-native";
import {Image} from "expo-image";
import {BlurView} from "expo-blur";
import {Button, ButtonText} from "@/components/ui/button";
import {authClient} from "@/lib/auth-client";
import {router, useNavigationContainerRef} from "expo-router";
import {useEffect} from "react";
import {auth} from "@/lib/auth";

export default function Index() {
    const {data: isAuthenticated} = authClient.useSession();
    const navContainerRef = useNavigationContainerRef();

    useEffect(() => {
        if (isAuthenticated && navContainerRef.isReady()) {
            router.replace({pathname: "/(tabs)"});
        }
    }, [isAuthenticated, navContainerRef]);

    return (
        <ImageBackground
            source={require("../assets/background/wardrobe.jpg")}
            className="h-screen"
            resizeMode="cover"
        >
            {/* Dark overlay to make the card pop */}
            <View className="absolute inset-0 bg-black/45"/>

            <View className="justify-center items-center h-screen-safe px-5">
                <View className="w-full max-w-xl">
                    <BlurView
                        intensity={55}
                        tint="light"
                        className="rounded-[32px] overflow-hidden"
                    >
                        {/* Card surface */}
                        <View className="relative rounded-[32px] bg-white/15 border border-white/25 p-6">
                            {/* subtle highlight line */}
                            <View className="absolute top-0 left-0 right-0 h-[1px] bg-white/30"/>

                            {/* Logo badge */}
                            <View className="items-center">
                                <View className="rounded-full p-[2px] bg-white/25">
                                    <View className="rounded-full bg-white/10 border border-white/20">
                                        <Image
                                            source={require("../assets/logo/logo-lg.png")}
                                            style={{width: 120, height: 120}}
                                            contentFit="contain"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Title */}
                            <Text className="text-center text-3xl mt-5 tracking-tight">
                                <Text className="text-indigo-500 font-extrabold">What</Text>
                                <Text className="text-white font-extrabold"> </Text>
                                <Text className="text-red-500 font-extrabold">To</Text>
                                <Text className="text-white font-extrabold"> </Text>
                                <Text className="text-indigo-500 font-extrabold">Wear</Text>
                            </Text>

                            {/* Subtitle */}
                            <Text className="text-center mt-2 text-base text-white/85">
                                Scan it. Style it. Wear it.
                            </Text>

                            {/* Feature chips */}
                            <View className="flex-row flex-wrap justify-center gap-2 mt-4">
                                <View className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                                    <Text className="text-white/85 text-sm">Outfit ideas</Text>
                                </View>
                                <View className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                                    <Text className="text-white/85 text-sm">Color match</Text>
                                </View>
                                <View className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                                    <Text className="text-white/85 text-sm">Fast scan</Text>
                                </View>
                            </View>

                            {/* Button */}
                            <View className="mt-6 w-full">
                                <Button action="secondary" size="xl"
                                        className="w-full rounded-2xl"
                                        onPress={async () =>
                                            await authClient.signIn.oauth2({
                                                providerId: "keycloak",
                                                callbackURL: "/",
                                            })
                                        }
                                >
                                    <ButtonText className="w-full text-center text-white font-extrabold tracking-wide">
                                        Login
                                    </ButtonText>
                                </Button>

                                <Text className="text-center mt-3 text-white/70 text-xs">
                                    By continuing, you agree to our Terms & Privacy Policy
                                </Text>
                            </View>
                        </View>
                    </BlurView>
                </View>
            </View>
        </ImageBackground>
    );
}
