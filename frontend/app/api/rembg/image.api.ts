// /app/api/rembg/image.api.ts
// (Recommended to move to /lib/api/rembg/image.api.ts, but this works)

const BASE_URL = (process.env.EXPO_PUBLIC_REMBG_URL ?? "http://localhost:8083").replace(/\/+$/, "");
const ENDPOINT = "/remove-bg";
const FIELD = "file";

export async function removeBackground(imageUri: string): Promise<Blob> {
    const form = new FormData();

    form.append(FIELD, {
        uri: imageUri,
        name: "image.jpg",
        type: "image/jpeg",
    } as any);

    const res = await fetch(`${BASE_URL}${ENDPOINT}`, {
        method: "POST",
        body: form,
    });

    if (!res.ok) throw new Error(await res.text());
    return await res.blob();
}
