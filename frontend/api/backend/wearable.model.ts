export type Wearable = {
    id: string;
    userId: string;
    categoryId: string;
    categoryName: string;
    title: string;
    description?: string | null;
    cutoutImageKey?: string | null;
    tags: string[];
    createdAt: string;
    updatedAt?: string | null;
};

export type CreateWearableInput = {
    categoryId: string;
    title: string;
    description?: string;
    tags: string[];
    file?: {
        uri: string;
        name?: string;
        type?: string;
    };
};

export type WearableResponseDto = {
    id: string;
    userId: string;
    categoryId: string;
    categoryName: string;
    title: string;
    description?: string | null;
    tags: string[];

    cutoutImageKey?: string | null;
    cutoutImageUrl?: string | null;

    createdAt: string; // Instant
    updatedAt?: string | null; // Instant
};
