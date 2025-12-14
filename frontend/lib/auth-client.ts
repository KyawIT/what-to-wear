import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import {genericOAuthClient} from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.EXPO_PUBLIC_BETTER_AUTH_URL,
    disableDefaultFetchPlugins: true,
    plugins:[
        expoClient({
            scheme: "frontend",
            storage: SecureStore
        }),
        genericOAuthClient()
    ]
})