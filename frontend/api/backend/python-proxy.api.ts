import * as FileSystem from "expo-file-system/legacy";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
  .replace(/\/+$/, "");

const PYTHON_ENDPOINT = "/api/wearableai";

function buildHeaders(accessToken?: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function readErrorBody(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const json = await res.json();
      return JSON.stringify(json);
    }
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * Ensures a URI is a local file:// path.
 * If the URI is a remote URL, downloads it to cache first.
 */
async function ensureLocalUri(uri: string, itemId: string): Promise<string> {
  if (uri.startsWith("file://") || uri.startsWith("content://")) {
    return uri;
  }

  // Remote URL — download to cache
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) throw new Error("No cache directory available");

  const localPath = `${dir}python_sync_${itemId}.png`;
  const result = await FileSystem.downloadAsync(uri, localPath);
  if (result.status !== 200) {
    throw new Error(`Download failed (${result.status}) for ${itemId}`);
  }
  return result.uri;
}

/**
 * Upload a wearable to the Python vector DB for AI recommendations.
 * Accepts both local file URIs and remote presigned URLs.
 */
export async function uploadWearableToPython(
  input: {
    fileUri: string;
    fileName?: string;
    fileType?: string;
    category: string;
    tags: string;
    itemId: string;
  },
  accessToken?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!accessToken) {
    return { ok: false, error: "accessToken is required" };
  }

  try {
    const localUri = await ensureLocalUri(input.fileUri, input.itemId);

    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: input.fileName ?? `wearable_${Date.now()}.png`,
      type: input.fileType ?? "image/png",
    } as any);
    formData.append("category", input.category);
    formData.append("tags", input.tags);
    formData.append("item_id", input.itemId);

    const res = await fetch(`${BASE_URL}${PYTHON_ENDPOINT}/wearables/upload`, {
      method: "POST",
      headers: buildHeaders(accessToken),
      body: formData,
    });

    if (!res.ok) {
      const errBody = await readErrorBody(res);
      return { ok: false, error: `Upload failed (${res.status}): ${errBody}` };
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e ?? "Network error");
    return { ok: false, error: message };
  }
}

export type AiOutfitResponse = {
  user_id: string;
  item_ids: string[];
};

/**
 * Get AI-powered outfit suggestions based on an image.
 */
export async function getAiOutfitSuggestion(
  input: {
    fileUri: string;
    fileName?: string;
    fileType?: string;
  },
  accessToken?: string
): Promise<{ ok: true; data: AiOutfitResponse } | { ok: false; error: string }> {
  if (!accessToken) {
    return { ok: false, error: "accessToken is required" };
  }

  const formData = new FormData();
  formData.append("image", {
    uri: input.fileUri,
    name: input.fileName ?? `outfit_ai_${Date.now()}.png`,
    type: input.fileType ?? "image/png",
  } as any);

  try {
    const res = await fetch(`${BASE_URL}${PYTHON_ENDPOINT}/outfit/ai`, {
      method: "POST",
      headers: buildHeaders(accessToken),
      body: formData,
    });

    if (!res.ok) {
      const errBody = await readErrorBody(res);
      return { ok: false, error: `AI outfit failed (${res.status}): ${errBody}` };
    }

    const data = (await res.json()) as AiOutfitResponse;
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e ?? "Network error");
    return { ok: false, error: message };
  }
}

/**
 * Generate outfit combinations from user's wardrobe (JSON-only, no images).
 */
export async function generateOutfitsSimple(
  input: {
    wearables: Array<{
      id: string;
      category: string;
      tags: string[];
    }>;
    filterTags?: string[];
    limitOutfits?: number;
  },
  accessToken?: string
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  if (!accessToken) {
    return { ok: false, error: "accessToken is required" };
  }

  try {
    const res = await fetch(`${BASE_URL}${PYTHON_ENDPOINT}/outfit/generate_outfits_simple`, {
      method: "POST",
      headers: {
        ...buildHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const errBody = await readErrorBody(res);
      return { ok: false, error: `Generate outfits failed (${res.status}): ${errBody}` };
    }

    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e ?? "Network error");
    return { ok: false, error: message };
  }
}
