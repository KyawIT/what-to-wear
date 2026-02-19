import { authClient } from "@/lib/auth-client";

const PROVIDER_ID = "keycloak";

export async function getKeycloakAccessToken(userId: string): Promise<string> {
  if (!userId || !userId.trim()) {
    throw new Error("userId is required");
  }

  const token = await authClient.getAccessToken({
    providerId: PROVIDER_ID,
    userId: userId.trim(),
  });

  if (token.error) {
    throw new Error(token.error.message ?? "Keycloak access token error");
  }

  if (!token.data?.accessToken) {
    throw new Error("Keycloak access token not found");
  }

  return token.data.accessToken;
}
