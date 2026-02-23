import {betterAuth} from "better-auth";
import {genericOAuth} from "better-auth/plugins";
import {expo} from "@better-auth/expo";
import {Pool} from "pg"

const betterAuthUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.EXPO_PUBLIC_BETTER_AUTH_URL;

export const auth = betterAuth({
    baseURL: betterAuthUrl,
    secret: process.env.BETTER_AUTH_SECRET as string,
    database: new Pool({
        connectionString: process.env.DATABASE_URL as string
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
    trustedOrigins: ["exp://", "frontend://", betterAuthUrl as string],
})
