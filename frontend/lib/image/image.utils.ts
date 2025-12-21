import * as MediaLibrary from "expo-media-library";

export async function resolveUploadUri(params: {
    id?: string;
    uri?: string;
}): Promise<string> {
    const { id, uri } = params;

    if (uri && uri.startsWith("file://")) return uri;

    if (id) {
        const info = await MediaLibrary.getAssetInfoAsync(id);

        if (info.localUri) return info.localUri;
        if (info.uri && info.uri.startsWith("file://")) return info.uri;

        throw new Error("Could not resolve a local file path for this photo.");
    }

    if (uri && (uri.startsWith("ph://") || uri.startsWith("ph-upload://"))) {
        throw new Error("Photo URI is ph://. Pass the asset id to resolve localUri.");
    }

    if (!uri) throw new Error("Missing image uri.");
    return uri;
}

export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("Invalid base64 result"));
                return;
            }

            const commaIndex = result.indexOf(",");
            resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
        };

        reader.readAsDataURL(blob);
    });
}
