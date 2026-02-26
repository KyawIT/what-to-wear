import {UpdateWearableInput, WearableResponseDto} from "@/api/backend/wearable.model";
import { deleteWearableInPython, updateWearableInPython } from "@/api/backend/python-proxy.api";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable";
const ENDPOINT_BY_CATEGORY = "/api/wearable/by-category";

export type DeleteWearableResult = {
    success: boolean;
    message?: string;
};

function buildHeaders(accessToken?: string) {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
}

export async function fetchAllWearables(
    accessToken?: string
): Promise<WearableResponseDto[]> {
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
        const text = await res.text();
        throw new Error(
            `Failed to fetch wearables (${res.status}): ${text}`
        );
    }

    return res.json();
}

export async function fetWearableById(
    wearableId: string,
    accessToken?: string
): Promise<WearableResponseDto> {
    if (!accessToken) {
        throw new Error("accessToken is required");
    }

    const res = await fetch(`${BASE_URL}${ENDPOINT}/${wearableId}`, {
        method: "GET",
        headers: {
            ...buildHeaders(accessToken),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `Failed to fetch wearables (${res.status}): ${text}`
        );
    }

    return res.json();
}

export async function fetchWearablesByCategory(
    categoryId: string,
    accessToken?: string
): Promise<WearableResponseDto[]> {
    if (!accessToken) {
        throw new Error("accessToken is required");
    }

    if (!categoryId) {
        throw new Error("categoryId is required");
    }

    const url =
        `${BASE_URL}${ENDPOINT_BY_CATEGORY}?categoryId=${encodeURIComponent(categoryId)}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            ...buildHeaders(accessToken),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `Failed to fetch wearables (${res.status}): ${text}`
        );
    }

    return res.json();
}

export async function deleteWearableById(
    wearableId: string,
    accessToken?: string
): Promise<DeleteWearableResult> {
    if (!accessToken) {
        return { success: false, message: "You are not authenticated. Please sign in again." };
    }
    if (!wearableId?.trim()) {
        return { success: false, message: "Invalid clothing item." };
    }

    const res = await fetch(`${BASE_URL}${ENDPOINT}/${encodeURIComponent(wearableId)}`, {
        method: "DELETE",
        headers: {
            ...buildHeaders(accessToken),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        const details = text?.trim() ? ` ${text.trim()}` : "";
        return { success: false, message: `Could not delete clothing item.${details}` };
    }

    // Best-effort async sync: do not block UI delete completion on AI proxy latency.
    void (async () => {
        const proxyResult = await deleteWearableInPython({ itemId: wearableId }, accessToken);
        if (!proxyResult.ok) {
            console.warn("Wearable AI proxy delete failed:", proxyResult.error);
        }
    })();

    return { success: true };
}

export async function updateWearableById(
    wearableId: string,
    input: UpdateWearableInput,
    accessToken?: string
): Promise<WearableResponseDto> {
    if (!accessToken) {
        throw new Error("accessToken is required");
    }
    if (!wearableId?.trim()) {
        throw new Error("wearableId is required");
    }
    if (!input?.categoryId?.trim()) {
        throw new Error("categoryId is required");
    }
    if (!input?.title?.trim()) {
        throw new Error("title is required");
    }

    const payload = {
        categoryId: input.categoryId.trim(),
        title: input.title.trim(),
        description: (input.description ?? "").trim(),
        tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    };

    const res = await fetch(`${BASE_URL}${ENDPOINT}/${encodeURIComponent(wearableId)}`, {
        method: "PUT",
        headers: {
            ...buildHeaders(accessToken),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to update wearable (${res.status}): ${text}`);
    }

    const updated = await res.json() as WearableResponseDto;

    void (async () => {
        const proxyResult = await updateWearableInPython(
            {
                itemId: updated.id,
                category: updated.categoryName,
                tags: (updated.tags ?? []).map((tag) => tag.trim()).filter(Boolean).join(","),
            },
            accessToken
        );
        if (!proxyResult.ok) {
            console.warn("Wearable AI proxy update failed:", proxyResult.error);
        }
    })();

    return updated;
}
