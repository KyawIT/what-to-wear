const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable-category";

export type WearableCategoryDto = {
    id: string;
    name: string;
};

export async function fetchWearableCategories(accessToken?: string): Promise<WearableCategoryDto[]> {
    const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch categories (${res.status}): ${text}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
        throw new Error("Invalid category response format");
    }

    return data as WearableCategoryDto[];
}

export async function createWearableCategory(
    name: string,
    accessToken?: string
): Promise<WearableCategoryDto> {
    const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create category (${res.status}): ${text}`);
    }

    return res.json() as Promise<WearableCategoryDto>;
}
