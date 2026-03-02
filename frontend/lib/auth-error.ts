import { Alert } from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";

const AUTH_ERROR_PATTERNS = [
  "keycloak access token",
  "not authenticated",
  "(401)",
  "unauthorized",
  "token expired",
  "token not found",
  "invalid_grant",
  "session expired",
];

/**
 * Returns true if the error looks like an authentication/token expiry issue.
 */
export function isAuthError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  const lowered = message.toLowerCase();
  return AUTH_ERROR_PATTERNS.some((pattern) => lowered.includes(pattern));
}

/**
 * Shows a "Session Expired" alert and signs the user out.
 * Call this from any catch block after `isAuthError` returns true.
 */
export function handleAuthError(): void {
  Alert.alert(
    "Session Expired",
    "Your session has expired. Please sign in again.",
    [
      {
        text: "Sign In",
        onPress: async () => {
          try {
            await authClient.signOut();
          } catch {
            // ignore sign-out failure
          }
          router.replace("/");
        },
      },
    ],
    { cancelable: false }
  );
}
