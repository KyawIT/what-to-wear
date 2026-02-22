import { Stack } from "expo-router";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import { authClient } from "@/lib/auth-client";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
} from "@expo-google-fonts/playfair-display";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
} from "@expo-google-fonts/inter";

export default function RootLayout() {
    const { data: isAuthenticated } = authClient.useSession();
    const [fontsLoaded] = useFonts({
        PlayfairDisplay_400Regular,
        PlayfairDisplay_500Medium,
        PlayfairDisplay_600SemiBold,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
    });

    if (!fontsLoaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <GluestackUIProvider>
                    <StatusBar hidden={true} />
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            animation: "slide_from_right",
                            gestureEnabled: true,
                            fullScreenGestureEnabled: true,
                        }}
                    >
                        <Stack.Protected guard={isAuthenticated !== null}>
                            <Stack.Screen name={"(tabs)"} />
                            <Stack.Screen name={"preview/index"} />
                            <Stack.Screen name={"profile/account"} />
                            <Stack.Screen name={"profile/privacy"} />
                            <Stack.Screen name={"profile/help"} />
                            <Stack.Screen name={"profile/about"} />
                            <Stack.Screen name={"compose/index"} />
                        </Stack.Protected>
                        <Stack.Protected guard={isAuthenticated === null}>
                            <Stack.Screen name={"index"} />
                        </Stack.Protected>
                    </Stack>
                </GluestackUIProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
