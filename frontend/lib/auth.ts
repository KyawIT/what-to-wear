import {betterAuth} from "better-auth";
import {genericOAuth} from "better-auth/plugins";
import {expo} from "@better-auth/expo";
import {Pool} from "pg"

const betterAuthUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.EXPO_PUBLIC_BETTER_AUTH_URL;

// Internal Keycloak base reachable inside Docker (server-to-server).
// Falls back to the public issuer URL for local development.
const kcInternal = process.env.KC_INTERNAL_URL;
const kcIssuer = process.env.EXPO_PUBLIC_KC_ISSUER as string;
const kcBase = kcInternal ?? kcIssuer;

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
                    // User's browser redirects here (external URL).
                    authorizationUrl: `${kcIssuer}protocol/openid-connect/auth`,
                    // Server-to-server calls use internal Docker URL when available.
                    tokenUrl: `${kcBase}protocol/openid-connect/token`,
                    userInfoUrl: `${kcBase}protocol/openid-connect/userinfo`,
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
