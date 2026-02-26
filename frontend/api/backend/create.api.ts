import { CreateWearableInput, Wearable } from "@/api/backend/wearable.model";
import { uploadWearableToPython } from "@/api/backend/python-proxy.api";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeTags(tags: string[]): string {
    return (tags ?? [])
        .map(t => t.trim())
        .filter(Boolean)
        .join(",");
}

function normalizeProxyTags(tags: string[]): string {
    return (tags ?? [])
        .map(t => t.trim())
        .filter(Boolean)
        .join(",");
}

function assertCreateInput(input: CreateWearableInput) {
    if (!input?.categoryId || !UUID_REGEX.test(input.categoryId)) {
        throw new Error(`Invalid categoryId: "${String(input?.categoryId)}"`);
    }
    if (!input?.title?.trim()) {
        throw new Error("title is required");
    }
    if (input.file?.uri) {
        // IMPORTANT: RN multipart expects a local file uri in most cases
        // If you pass http(s):// or data:... you usually get broken upload parts.
        if (
            !input.file.uri.startsWith("file://") &&
            !input.file.uri.startsWith("content://")
        ) {
            throw new Error(
                `file.uri must be a local uri (file:// or content://). Got: "${input.file.uri}"`
            );
        }
    }
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

export async function createWearableMultipart(
    input: CreateWearableInput,
    accessToken?: string
): Promise<Wearable> {
    if (!accessToken) {
        throw new Error("accessToken is required");
    }

    assertCreateInput(input);

    const formData = new FormData();
    formData.append("categoryId", input.categoryId);
    formData.append("title", input.title.trim());
    formData.append("description", (input.description ?? "").trim());
    formData.append("tags", normalizeTags(input.tags));

    if (input.file?.uri) {
        const name = input.file.name ?? `wearable_${Date.now()}.png`;
        const type = input.file.type ?? "image/png";

        formData.append(
            "file",
            { uri: input.file.uri, name, type } as any
        );
    }

    const url = `${BASE_URL}${ENDPOINT}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            ...buildHeaders(accessToken),
            // DO NOT set Content-Type manually for FormData in RN
        },
        body: formData,
    });

    if (!res.ok) {
        const errBody = await readErrorBody(res);

        // useful debug
        console.log("Create wearable failed:");
        console.log("URL:", url);
        console.log("Status:", res.status);
        console.log("Content-Type:", res.headers.get("content-type"));
        console.log("Body:", errBody);

        throw new Error(`Failed to create wearable (${res.status}): ${errBody}`);
    }

    const created = await res.json() as Wearable;

    // Best-effort sync to AI proxy; do not block successful wearable creation.
    if (input.file?.uri && created?.id && created?.categoryName) {
        void (async () => {
            const proxyResult = await uploadWearableToPython(
                {
                    fileUri: input.file.uri,
                    fileName: input.file.name,
                    fileType: input.file.type,
                    category: created.categoryName,
                    tags: normalizeProxyTags(created.tags ?? input.tags ?? []),
                    itemId: created.id,
                },
                accessToken
            );
            if (!proxyResult.ok) {
                console.warn("Wearable AI proxy upload failed:", proxyResult.error);
            }
        })();
    }

    return created;
}
