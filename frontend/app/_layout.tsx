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
                    <Stack>
                        <Stack.Protected guard={isAuthenticated !== null}>
                            <Stack.Screen name={"(tabs)"} options={{ headerShown: false }} />
                            <Stack.Screen name={"preview/index"} options={{ headerShown: false }} />
                            <Stack.Screen name={"profile/account"} options={{ headerShown: false }} />
                            <Stack.Screen name={"profile/privacy"} options={{ headerShown: false }} />
                            <Stack.Screen name={"profile/help"} options={{ headerShown: false }} />
                            <Stack.Screen name={"profile/about"} options={{ headerShown: false }} />
                            <Stack.Screen name={"compose/index"} options={{ headerShown: false }} />
                        </Stack.Protected>
                        <Stack.Protected guard={isAuthenticated === null}>
                            <Stack.Screen name={"index"} options={{ headerShown: false }} />
                        </Stack.Protected>
                    </Stack>
                </GluestackUIProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
