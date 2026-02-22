import {View, Text} from 'react-native'
import React from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {Box} from "@/components/ui/box";
import {HStack} from "@/components/ui/hstack";
import {Image} from "expo-image";
import {Pressable} from "@/components/ui/pressable";
import {router} from "expo-router";
import {Plus, Settings} from "lucide-react-native";
import {authClient} from "@/lib/auth-client";

const Navbar = () => {
    const {data} = authClient.useSession();
    if (data != null) {
        return (
            <View className="flex-1 bg-secondary-50">
                <SafeAreaView edges={["top"]} className="bg-secondary-50">
                    <Box className="w-full border-b border-secondary-200/70 bg-secondary-50">
                        <HStack className="items-center justify-between px-4 py-3">
                            <HStack className="items-center gap-3">
                                <View
                                    className="h-12 w-12 overflow-hidden rounded-full bg-secondary-500/10
                                    items-center justify-center border border-secondary-200/60">
                                    {data.user.image ? (
                                        <Image
                                            source={{uri: data.user.image}}
                                            style={{width: 48, height: 48}}
                                            contentFit="cover"
                                        />
                                    ) : (
                                        <Image
                                            source={require("@/assets/logo/logo-md.png")}
                                            style={{width: 34, height: 34}}
                                            contentFit="contain"
                                        />
                                    )}
                                </View>

                                <View>
                                    <Text className="text-base font-semibold text-secondary-950">
                                        Hello, {data?.user?.name ?? "there"}
                                    </Text>
                                    <Text className="text-xs text-secondary-600">
                                        Ready to build a fit today?
                                    </Text>
                                </View>
                            </HStack>

                            <HStack className="items-center gap-2">
                                <Pressable
                                    className="h-10 w-10 items-center justify-center
                                    rounded-full bg-secondary-500/10 border border-secondary-200/60"
                                    onPress={() => router.push("/scan")}
                                >
                                    <Plus size={18}/>
                                </Pressable>
                                <Pressable
                                    className="h-10 w-10 items-center justify-center
                                    rounded-full bg-secondary-500/10 border border-secondary-200/60"
                                    onPress={() => router.push("/profile")}
                                >
                                    <Settings size={18}/>
                                </Pressable>
                            </HStack>
                        </HStack>
                    </Box>
                </SafeAreaView>
            </View>
        );
    }
    return null;
}
export default Navbar
