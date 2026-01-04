const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
    .replace(/\/+$/, "");

const ENDPOINT = "/api/wearable/category";

export async function fetchWearableCategories(): Promise<string[]> {
    const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch categories (${res.status}): ${text}`);
    }

    const data = await res.json();

    if (!Array.isArray(data) || !data.every(c => typeof c === "string")) {
        throw new Error("Invalid category response format");
    }

    return data;
}
