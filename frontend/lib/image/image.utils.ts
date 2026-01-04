import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
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

export async function dataUriToFileUri(
    dataUri: string,
    filename = `wearable_${Date.now()}.png`
): Promise<{ uri: string; mime: string; name: string }> {
    const match = dataUri.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid data URI (expected data:<mime>;base64,...)");
    }

    const mime = match[1];
    const base64 = match[2];

    const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!dir) {
        throw new Error("No writable directory available (cacheDirectory/documentDirectory missing)");
    }

    const fileUri = `${dir}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });

    return { uri: fileUri, mime, name: filename };
}
