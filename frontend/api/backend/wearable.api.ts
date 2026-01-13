import {WearableCategory, WearableResponseDto} from "@/api/backend/wearable.model";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable";
const ENDPOINT_BY_CATEGORY = "/api/wearable/by-category";

export async function fetchAllWearables(
    userId: string
): Promise<WearableResponseDto[]> {
    if (!userId || !userId.trim()) {
        throw new Error("X-User-Id is required");
    }

    const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "X-User-Id": userId.trim(),
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

export async function fetWearableById(userId: string, wearableId: string): Promise<WearableResponseDto> {
    if (!userId || !userId.trim()) {
        throw new Error("X-User-Id is required");
    }

    const res = await fetch(`${BASE_URL}${ENDPOINT}/${wearableId}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "X-User-Id": userId.trim(),
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
    userId: string,
    category: WearableCategory
): Promise<WearableResponseDto[]> {
    if (!userId || !userId.trim()) {
        throw new Error("X-User-Id is required");
    }

    if (!category) {
        throw new Error("category is required");
    }

    const url =
        `${BASE_URL}${ENDPOINT_BY_CATEGORY}?category=${encodeURIComponent(category)}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "X-User-Id": userId.trim(),
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
