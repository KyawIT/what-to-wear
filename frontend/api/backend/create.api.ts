import {CreateWearableInput, Wearable, WearableCategory} from "@/api/backend/wearable.model";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable";




const CATEGORY_SET = new Set<WearableCategory>([
    "SHIRT",
    "PANTS",
    "JACKET",
    "SHOES",
    "WATCH",
    "HAT",
    "ACCESSORY",
]);

function normalizeTags(tags: string[]): string {
    return (tags ?? [])
        .map(t => t.trim())
        .filter(Boolean)
        .join(",");
}

function assertCreateInput(userId: string, input: CreateWearableInput) {

    if (!input?.category || !CATEGORY_SET.has(input.category)) {
        throw new Error(`Invalid category: "${String(input?.category)}"`);
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
    userId: string,
    input: CreateWearableInput
): Promise<Wearable> {
    assertCreateInput(userId, input);

    const formData = new FormData();
    formData.append("category", input.category);
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
            Accept: "application/json",
            "X-User-Id": userId,
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

    return res.json();
}
