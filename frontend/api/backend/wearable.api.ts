import {WearableCategory, WearableResponseDto} from "@/api/backend/wearable.model";

const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable/by-category";

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
        `${BASE_URL}${ENDPOINT}?category=${encodeURIComponent(category)}`;

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