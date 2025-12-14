import {betterAuth} from "better-auth";
import {genericOAuth} from "better-auth/plugins";
import {expo} from "@better-auth/expo";
import {Pool} from "pg"

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.EXPO_PUBLIC_DATABASE_URL as string
    }),
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["keycloak"]
        }
    },
    plugins: [
        expo(),
        genericOAuth({
            config:[
                {
                    providerId: "keycloak",
                    clientId: process.env.EXPO_PUBLIC_KC_CLIENT_ID as string,
                    clientSecret: process.env.EXPO_PUBLIC_KC_SECRET as string,
                    discoveryUrl: process.env.EXPO_PUBLIC_KC_DISCOVERY_URL as string,
                    scopes: ["openid","profile","email"],
                    pkce: true,

                    overrideUserInfo: true,
                    mapProfileToUser: async (profile) => {
                        return {
                            image: profile.picture ?? null,
                        };
                    }
                }
            ]
        })
    ],
    trustedOrigins: ["exp://", "frontend://", process.env.EXPO_PUBLIC_BETTER_AUTH_URL as string],
})

