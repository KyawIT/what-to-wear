type WearableSuggestionInput = {
  categoryName?: string | null;
  tags?: string[];
};

type OutfitSuggestionInput = {
  tags?: string[];
  itemTitles?: string[];
  itemCount: number;
};

export type MetadataSuggestion = {
  name: string;
  description: string;
};

const DEFAULT_WEARABLE_NAME = "Wardrobe Item";
const DEFAULT_OUTFIT_NAME = "My Outfit";

function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeTags(tags: string[] = []): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of tags) {
    const tag = toTitleCase(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(tag);
  }

  return normalized;
}

function trimToLength(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}.`;
}

function buildTagPhrase(tags: string[]): string {
  if (tags.length === 0) return "";
  if (tags.length === 1) return tags[0];
  if (tags.length === 2) return `${tags[0]} and ${tags[1]}`;
  return `${tags[0]}, ${tags[1]} and ${tags[2]}`;
}

export function suggestWearableMetadata(
  input: WearableSuggestionInput
): MetadataSuggestion {
  const tags = normalizeTags(input.tags);
  const category = toTitleCase(input.categoryName ?? "");

  const coreNamePart = tags[0] ?? category ?? DEFAULT_WEARABLE_NAME;
  const fallbackNamePart = category && tags[0] ? `${tags[0]} ${category}` : coreNamePart;
  const name = trimToLength(fallbackNamePart, 60);

  const tagPhrase = buildTagPhrase(tags);
  let description = "A versatile piece for your wardrobe.";

  if (category && tagPhrase) {
    description = `${category} item with a ${tagPhrase.toLowerCase()} vibe.`;
  } else if (category) {
    description = `${category} item for everyday styling.`;
  } else if (tagPhrase) {
    description = `A ${tagPhrase.toLowerCase()} piece for everyday styling.`;
  }

  return {
    name: name || DEFAULT_WEARABLE_NAME,
    description: trimToLength(description, 200),
  };
}

export function suggestOutfitMetadata(input: OutfitSuggestionInput): MetadataSuggestion {
  const tags = normalizeTags(input.tags);
  const itemTitles = (input.itemTitles ?? [])
    .map((title) => title.trim())
    .filter(Boolean);
  const itemCount = Math.max(0, input.itemCount);

  const baseNameFromTag = tags[0] ? `${tags[0]} Outfit` : "";
  const fallbackName =
    itemTitles.length > 0 ? `${toTitleCase(itemTitles[0])} Look` : DEFAULT_OUTFIT_NAME;
  const name = trimToLength(baseNameFromTag || fallbackName, 40);

  const tagPhrase = buildTagPhrase(tags);
  let description = `Outfit built from ${itemCount} selected item${itemCount === 1 ? "" : "s"}.`;

  if (tagPhrase) {
    description = `${tagPhrase} look built from ${itemCount} selected item${
      itemCount === 1 ? "" : "s"
    }.`;
  }

  return {
    name: name || DEFAULT_OUTFIT_NAME,
    description: trimToLength(description, 200),
  };
}
