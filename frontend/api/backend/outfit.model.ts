import { WearableResponseDto } from "@/api/backend/wearable.model";

export type CreateOutfitInput = {
  title: string;
  description?: string;
  tags?: string[];
  wearableIds: string[];
  file?: {
    uri?: string;
    name?: string;
    type?: string;
  };
};

export type OutfitResponseDto = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  tags: string[];
  imageKey?: string | null;
  imageUrl?: string | null;
  wearables: WearableResponseDto[];
  createdAt: string;
  updatedAt: string;
};
