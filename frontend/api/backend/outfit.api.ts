import { CreateOutfitInput, OutfitResponseDto } from "@/api/backend/outfit.model";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080").replace(
  /\/+$/,
  ""
);

const ENDPOINT = "/api/outfit";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DeleteOutfitResult = {
  success: boolean;
  message?: string;
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

  return (await res.json()) as OutfitResponseDto;
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

  return { success: true };
}
