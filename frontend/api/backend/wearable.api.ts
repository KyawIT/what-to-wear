import {WearableResponseDto} from "@/api/backend/wearable.model";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable";
const ENDPOINT_BY_CATEGORY = "/api/wearable/by-category";

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
