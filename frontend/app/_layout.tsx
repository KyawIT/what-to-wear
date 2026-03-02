import { Stack, router } from "expo-router";
import { FocusInputProvider } from "@/components/focus-input";

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
import { useEffect, useRef } from "react";
import Constants from "expo-constants";
import { ShareIntent, useShareIntent } from "expo-share-intent";

const SHARE_SOURCE_RULES: { source: "zalando" | "pinterest"; patterns: RegExp[] }[] = [
    { source: "zalando", patterns: [/zalando\./i] },
    { source: "pinterest", patterns: [/pinterest\./i, /pin\.it/i] },
];

function inferShareSource(shareIntent: ShareIntent): "zalando" | "pinterest" | "unknown" {
    const fileStrings = (shareIntent.files ?? []).flatMap((file) => [
        file.fileName ?? "",
        file.path ?? "",
        file.mimeType ?? "",
    ]);
    const metaStrings = Object.values(shareIntent.meta ?? {}).filter(
        (value): value is string => typeof value === "string"
    );
    const haystack = [
        shareIntent.webUrl ?? "",
        shareIntent.text ?? "",
        ...metaStrings,
        ...fileStrings,
    ].join("\n");

    for (const rule of SHARE_SOURCE_RULES) {
        if (rule.patterns.some((pattern) => pattern.test(haystack))) {
            return rule.source;
        }
    }
    return "unknown";
}

export default function RootLayout() {
    const { data: isAuthenticated } = authClient.useSession();
    const isExpoGo = Constants.appOwnership === "expo";
    const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntent({
        debug: __DEV__,
        disabled: isExpoGo,
    });
    const lastSharePayloadRef = useRef<string | null>(null);
    const [fontsLoaded] = useFonts({
        PlayfairDisplay_400Regular,
        PlayfairDisplay_500Medium,
        PlayfairDisplay_600SemiBold,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
    });

    useEffect(() => {
        if (!__DEV__ || !error) return;
        console.warn("[ShareIntent] Error:", error);
    }, [error]);

    useEffect(() => {
        if (!hasShareIntent) return;
        if (isAuthenticated == null) return;

        const serialized = JSON.stringify(shareIntent);
        if (lastSharePayloadRef.current === serialized) return;
        lastSharePayloadRef.current = serialized;

        const source = inferShareSource(shareIntent);
        if (source !== "unknown") {
            const sharedUrl = shareIntent.webUrl || shareIntent.text || "";
            router.replace({
                pathname: "/import-link",
                params: { sharedUrl },
            });
        }
        resetShareIntent();
    }, [hasShareIntent, isAuthenticated, resetShareIntent, shareIntent]);

    if (!fontsLoaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <GluestackUIProvider>
                    <FocusInputProvider>
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
                                <Stack.Screen name={"import-link/index"} />
                            </Stack.Protected>
                            <Stack.Protected guard={isAuthenticated === null}>
                                <Stack.Screen name={"index"} />
                            </Stack.Protected>
                        </Stack>
                    </FocusInputProvider>
                </GluestackUIProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
