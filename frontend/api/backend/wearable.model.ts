export type Wearable = {
    id: string;
    userId: string;
    category: WearableCategory;
    title: string;
    description?: string | null;
    cutoutImageKey?: string | null;
    tags: string[];
    createdAt: string;
    updatedAt?: string | null;
};

export type CreateWearableInput = {
    category: WearableCategory;
    title: string;
    description?: string;
    tags: string[];
    file?: {
        uri: string;
        name?: string;
        type?: string;
    };
};

export type WearableCategory =
    | "SHIRT"
    | "PANTS"
    | "JACKET"
    | "SHOES"
    | "WATCH"
    | "HAT"
    | "ACCESSORY";

const WEARABLE_CATEGORY_VALUES: readonly WearableCategory[] = [
    "SHIRT",
    "PANTS",
    "JACKET",
    "SHOES",
    "WATCH",
    "HAT",
    "ACCESSORY",
];

export function toWearableCategory(value: string): WearableCategory {
    if (WEARABLE_CATEGORY_VALUES.includes(value as WearableCategory)) {
        return value as WearableCategory;
    }
    throw new Error(`Invalid WearableCategory: ${value}`);
}