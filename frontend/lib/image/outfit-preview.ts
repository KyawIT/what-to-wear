import { WearableResponseDto } from "@/api/backend/wearable.model";

export const MAX_OUTFIT_PREVIEW_ITEMS = 4;

export type OutfitPreviewFile = {
  uri: string;
  name: string;
  type: string;
};

export function getOutfitPreviewItems(items: WearableResponseDto[]): WearableResponseDto[] {
  return items
    .filter((item) => !!item.cutoutImageUrl?.trim())
    .slice(0, MAX_OUTFIT_PREVIEW_ITEMS);
}

export function buildOutfitPreviewFile(uri?: string | null): OutfitPreviewFile | undefined {
  if (!uri?.trim()) return undefined;
  return {
    uri,
    name: `outfit_reco_${Date.now()}.png`,
    type: "image/png",
  };
}
