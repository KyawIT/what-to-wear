import { CreateOutfitInput, OutfitResponseDto, UpdateOutfitInput } from "@/api/backend/outfit.model";
import * as FileSystem from "expo-file-system/legacy";
import { uploadOutfitToPython } from "@/api/backend/python-proxy.api";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);

const ENDPOINT = "/api/outfit";
const OUTFIT_RECOMMEND_ENDPOINT = "/api/outfit/recommend-from-uploads";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DeleteOutfitResult = {
  success: boolean;
  message?: string;
};

export type RecommendFromUploadsInput = {
  items: Array<{
    wearableId: string;
    imageUri: string;
    tags?: string[];
    fileName?: string;
    fileType?: string;
  }>;
  limitOutfits?: number;
};

export type RecommendedOutfitResponse = {
  outfits: Array<{
    id: string;
    wearables: Array<{
      id: string;
      category?: string;
      tags?: string[];
      cutoutImageUrl?: string | null;
    }>;
    image?: string | null;
  }>;
  warnings?: string[];
};

function normalizeTags(tags: string[] = []): string {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(",");
}

function normalizeWearableIds(wearableIds: string[] = []): string {
  return wearableIds
    .map((id) => id.trim())
    .filter(Boolean)
    .join(",");
}

function buildHeaders(accessToken?: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function ensureLocalUri(uri: string, itemId: string): Promise<string> {
  if (uri.startsWith("file://") || uri.startsWith("content://")) {
    return uri;
  }

  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) throw new Error("No cache directory available");

  const localPath = `${dir}outfit_reco_${itemId}.png`;
  const result = await FileSystem.downloadAsync(uri, localPath);
  if (result.status !== 200) {
    throw new Error(`Download failed (${result.status}) for ${itemId}`);
  }
  return result.uri;
}

async function readErrorBody(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const json = await res.json();
      if (typeof json === "string") {
        return json.trim();
      }
      if (json && typeof json === "object") {
        const candidate =
          (json as any).message ??
          (json as any).detail ??
          (json as any).title ??
          (json as any).error ??
          (json as any).code;
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim();
        }
      }
      const asText = JSON.stringify(json);
      return asText === "{}" ? "" : asText;
    }
    const text = await res.text();
    return text.trim();
  } catch {
    return "";
  }
}

function extractBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary="?([^";]+)"?/i);
  return match?.[1]?.trim() || null;
}

function extractJsonPart(body: string, boundary: string, preferredName?: string): any | null {
  const delimiter = `--${boundary}`;
  const parts = body.split(delimiter);
  for (const part of parts) {
    const lowered = part.toLowerCase();
    if (!lowered.includes("content-type: application/json")) {
      continue;
    }
    if (preferredName && !part.includes(`name="${preferredName}"`)) {
      continue;
    }
    const splitIndex = part.search(/\r?\n\r?\n/);
    if (splitIndex < 0) {
      continue;
    }
    const payload = part.slice(splitIndex).replace(/^\r?\n\r?\n/, "").trim();
    if (!payload) {
      continue;
    }
    try {
      return JSON.parse(payload);
    } catch {
      // Continue scanning additional parts.
    }
  }
  return null;
}

async function readRecommendationResponse(res: Response): Promise<RecommendedOutfitResponse> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return (await res.json()) as RecommendedOutfitResponse;
  }

  const boundary = extractBoundary(contentType);
  const rawBody = await res.text();
  if (!boundary) {
    throw new Error("Recommendation response boundary is missing");
  }

  const preferred = extractJsonPart(rawBody, boundary, "outfits");
  const fallback = preferred ?? extractJsonPart(rawBody, boundary);
  if (!fallback || !Array.isArray(fallback.outfits)) {
    throw new Error("Recommendation response missing JSON outfits part");
  }

  return fallback as RecommendedOutfitResponse;
}

function assertCreateInput(input: CreateOutfitInput) {
  if (!input?.title?.trim()) {
    throw new Error("title is required");
  }
  if (!input?.wearableIds?.length) {
    throw new Error("wearableIds is required");
  }
  for (const id of input.wearableIds) {
    if (!UUID_REGEX.test(id)) {
      throw new Error(`Invalid wearable id: "${id}"`);
    }
  }
}

async function syncOutfitToAiProxy(outfit: OutfitResponseDto, accessToken: string): Promise<void> {
  const wearableInputs = (outfit.wearables ?? [])
    .filter((w) => Boolean(w.id?.trim()) && Boolean(w.categoryName?.trim()) && Boolean(w.cutoutImageUrl?.trim()))
    .map((w) => ({
      id: w.id,
      category: w.categoryName,
      tags: w.tags ?? [],
      imageUri: w.cutoutImageUrl!,
    }));

  if (wearableInputs.length === 0) {
    return;
  }

  const proxyResult = await uploadOutfitToPython(
    {
      wearables: wearableInputs,
    },
    accessToken
  );
  if (!proxyResult.ok) {
    console.warn("Outfit AI proxy upload failed:", proxyResult.error);
  }
}

export async function createOutfitMultipart(
  input: CreateOutfitInput,
  accessToken?: string
): Promise<OutfitResponseDto> {
  if (!accessToken) {
    throw new Error("accessToken is required");
  }

  assertCreateInput(input);

  const formData = new FormData();
  formData.append("title", input.title.trim());
  formData.append("description", (input.description ?? "").trim());
  formData.append("tags", normalizeTags(input.tags ?? []));
  formData.append("wearableIds", normalizeWearableIds(input.wearableIds));

  if (input.file?.uri) {
    formData.append(
      "file",
      {
        uri: input.file.uri,
        name: input.file.name ?? `outfit_${Date.now()}.png`,
        type: input.file.type ?? "image/png",
      } as any
    );
  }

  const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
    method: "POST",
    headers: {
      ...buildHeaders(accessToken),
      // DO NOT set Content-Type manually for FormData in RN
    },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new Error(`Failed to create outfit (${res.status}): ${errBody}`);
  }

  const created = (await res.json()) as OutfitResponseDto;
  void syncOutfitToAiProxy(created, accessToken);
  return created;
}

export async function fetchAllOutfits(accessToken?: string): Promise<OutfitResponseDto[]> {
  if (!accessToken) {
    throw new Error("accessToken is required");
  }

  const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
    method: "GET",
    headers: {
      ...buildHeaders(accessToken),
    },
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new Error(`Failed to fetch outfits (${res.status}): ${errBody}`);
  }

  return (await res.json()) as OutfitResponseDto[];
}

export async function fetchOutfitById(
  outfitId: string,
  accessToken?: string
): Promise<OutfitResponseDto> {
  if (!accessToken) {
    throw new Error("accessToken is required");
  }

  if (!outfitId?.trim()) {
    throw new Error("outfitId is required");
  }

  const res = await fetch(`${BASE_URL}${ENDPOINT}/${encodeURIComponent(outfitId)}`, {
    method: "GET",
    headers: {
      ...buildHeaders(accessToken),
    },
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new Error(`Failed to fetch outfit (${res.status}): ${errBody}`);
  }

  return (await res.json()) as OutfitResponseDto;
}

export async function deleteOutfitById(
  outfitId: string,
  accessToken?: string
): Promise<DeleteOutfitResult> {
  if (!accessToken) {
    return { success: false, message: "You are not authenticated. Please sign in again." };
  }

  if (!outfitId?.trim()) {
    return { success: false, message: "Invalid outfit." };
  }

  const res = await fetch(`${BASE_URL}${ENDPOINT}/${encodeURIComponent(outfitId)}`, {
    method: "DELETE",
    headers: {
      ...buildHeaders(accessToken),
    },
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    const details = errBody?.trim() ? ` ${errBody.trim()}` : "";
    return { success: false, message: `Could not delete outfit.${details}` };
  }

  // No proxy delete endpoint exists for outfits on /api/wearableai.
  return { success: true };
}

export async function updateOutfitById(
  outfitId: string,
  input: UpdateOutfitInput,
  accessToken?: string
): Promise<OutfitResponseDto> {
  if (!accessToken) {
    throw new Error("accessToken is required");
  }
  if (!outfitId?.trim()) {
    throw new Error("outfitId is required");
  }
  if (!input?.title?.trim()) {
    throw new Error("title is required");
  }

  const wearableIds = (input.wearableIds ?? []).map((id) => id.trim()).filter(Boolean);
  for (const id of wearableIds) {
    if (!UUID_REGEX.test(id)) {
      throw new Error(`Invalid wearable id: "${id}"`);
    }
  }

  const payload = {
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    wearableIds,
  };

  const res = await fetch(`${BASE_URL}${ENDPOINT}/${encodeURIComponent(outfitId)}`, {
    method: "PUT",
    headers: {
      ...buildHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new Error(`Failed to update outfit (${res.status}): ${errBody}`);
  }

  const updated = (await res.json()) as OutfitResponseDto;
  void syncOutfitToAiProxy(updated, accessToken);
  return updated;
}

export async function recommendOutfitsFromUploads(
  input: RecommendFromUploadsInput,
  accessToken?: string
): Promise<RecommendedOutfitResponse> {
  if (!accessToken) {
    throw new Error("accessToken is required");
  }
  if (!input?.items?.length || input.items.length < 5) {
    throw new Error("At least 5 items are required");
  }

  const formData = new FormData();
  const requestItems: Array<{
    wearableId: string;
    fileKey: string;
  }> = [];

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!UUID_REGEX.test(item.wearableId)) {
      throw new Error(`Invalid wearable id: "${item.wearableId}"`);
    }
    if (!item.imageUri?.trim()) {
      throw new Error(`imageUri is required for wearable ${item.wearableId}`);
    }

    const fileKey = `file_${i}_${item.wearableId}`;
    const localUri = await ensureLocalUri(item.imageUri, item.wearableId);

    formData.append(fileKey, {
      uri: localUri,
      name: item.fileName ?? `wearable_${item.wearableId}.png`,
      type: item.fileType ?? "image/png",
    } as any);

    requestItems.push({
      wearableId: item.wearableId,
      fileKey,
    });
  }

  formData.append("items", JSON.stringify(requestItems));
  formData.append("limitOutfits", String(input.limitOutfits ?? 6));

  const res = await fetch(`${BASE_URL}${OUTFIT_RECOMMEND_ENDPOINT}`, {
    method: "POST",
    headers: {
      ...buildHeaders(accessToken),
    },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    const detail = errBody || res.statusText || "Request failed";
    throw new Error(`Failed to recommend outfits (${res.status}): ${detail}`);
  }

  return await readRecommendationResponse(res);
}
