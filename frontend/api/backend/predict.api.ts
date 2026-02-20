const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
  .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable/predict";

type PredictWearableTagsInput = {
  file: {
    uri?: string;
    blob?: Blob;
    name?: string;
    type?: string;
  };
};

export type PredictWearableTagsResponse = {
  category: string;
  tags: string[];
  confidence: number;
};

export type PredictWearableTagsResult =
  | { ok: true; data: PredictWearableTagsResponse }
  | { ok: false; status?: number; error: string };

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

export async function predictWearableTags(
  input: PredictWearableTagsInput,
  accessToken?: string
): Promise<PredictWearableTagsResult> {
  if (!accessToken) {
    return { ok: false, error: "accessToken is required" };
  }

  if (!input?.file?.uri && !input?.file?.blob) {
    return { ok: false, error: "file.uri or file.blob is required" };
  }

  const formData = new FormData();
  if (input.file.blob) {
    const blobName = input.file.name ?? `predict_${Date.now()}.png`;
    formData.append("file", input.file.blob as any, blobName);
  } else {
    formData.append("file", {
      uri: input.file.uri,
      name: input.file.name ?? `predict_${Date.now()}.png`,
      type: input.file.type ?? "image/png",
    } as any);
  }

  try {
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
      return {
        ok: false,
        status: res.status,
        error: `Failed to predict tags (${res.status}): ${errBody}`,
      };
    }

    const data = (await res.json()) as PredictWearableTagsResponse;
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e ?? "Network error");
    return { ok: false, error: message };
  }
}
