const BACKEND_ROOT = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

/**
 * Rewrites MinIO presigned URLs to use the backend image proxy.
 *
 * Presigned URLs from MinIO contain host-bound signatures that break
 * when accessed through a reverse proxy (Traefik). This rewrites them
 * to go through the backend's /api/image proxy endpoint instead.
 *
 * e.g. http://localhost:9000/wearables/userId/id/file.png?X-Amz-...
 *   -> https://what-to-wear.cms-building.at/api/image/wearables/userId/id/file.png
 */
export function resolveImageUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;

    try {
        const parsed = new URL(url);
        // Match MinIO bucket paths: /wearables/... or /outfits/...
        // Also handles /minio/wearables/... (Traefik-rewritten URLs)
        const match = parsed.pathname.match(/^(?:\/minio)?\/(wearables|outfits)\/(.+)/);
        if (match) {
            return `${BACKEND_ROOT}/api/image/${match[1]}/${match[2]}`;
        }

        // Already a proxy URL or unknown format — return as-is
        return url;
    } catch {
        return url;
    }
}
