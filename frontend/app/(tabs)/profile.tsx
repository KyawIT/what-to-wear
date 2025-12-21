import {View, Text} from 'react-native'
import React from 'react'
import {SafeAreaView} from "react-native-safe-area-context";
import {authClient} from "@/lib/auth-client";
import {router} from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {ButtonText, Button} from "@/components/ui/button";

const Profile = () => {
    const handleFullLogout = async () => {
        const clientId = process.env.EXPO_PUBLIC_KC_CLIENT_ID as string;
        const logoutUrlBase = process.env.EXPO_PUBLIC_KC_LOGOUT_URL as string;
        const redirectUrl = process.env
            .EXPO_PUBLIC_KC_POST_LOGOUT_REDIRECT_URL as string;

        try {
            await authClient.signOut();

            const url =
                logoutUrlBase +
                `?client_id=${encodeURIComponent(clientId)}` +
                `&post_logout_redirect_uri=${encodeURIComponent(redirectUrl)}`;

            // Catch errors from the auth session itself so they don't show as
            // "Uncaught (in promise, id: X)"
            try {
                await WebBrowser.openAuthSessionAsync(url, redirectUrl);
            } catch (err) {
                console.warn("Keycloak logout auth session error:", err);
            }
        } finally {
            router.replace("/");
        }
    };
    return (
        <SafeAreaView>
            <View className={"mt-5 p-5 flex justify-center items-center"}>
                <Button className={"mt-5 w-[90%] h-20 rounded-3xl"} size={"xl"} onPress={handleFullLogout}>
                    <ButtonText>Log out</ButtonText>
                </Button>
            </View>
        </SafeAreaView>
    )
}
export default Profile
